import { prisma } from '../utils/db.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config()

export class ScormPackageModel {
    static async uploadAndExtract(filePath, filename, uploadedBy, forceNew = false) {
        console.log('[MODEL EXTRACT START] File path:', filePath, 'Filename:', filename);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeFilename = filename.replace(/[^a-zA-Z0-9-_.]/g, '_').replace('.zip', '');
        const folderHandle = `scorm/${timestamp}-${safeFilename}/`;

        const tempDir = path.join(process.cwd(), 'uploads/temp');
        const extractDir = path.join(tempDir, folderHandle);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        fs.mkdirSync(extractDir, { recursive: true });
        console.log('[MODEL MKDIR OK] Extract dir:', extractDir);

        try {
            console.log('[MODEL ZIP EXTRACT START]');
            const zip = new AdmZip(filePath);
            zip.extractAllTo(extractDir, true);
            console.log('[MODEL ZIP EXTRACT OK] Files extracted');

            // Verify extraction
            const extractedFiles = fs.readdirSync(extractDir, { recursive: true });
            console.log('[MODEL] Actually extracted files:', extractedFiles.length);
            if (extractedFiles.length === 0) {
                throw new Error('ZIP extraction resulted in 0 files');
            }

            const manifestPath = path.join(extractDir, 'imsmanifest.xml');
            if (!fs.existsSync(manifestPath)) {
                throw new Error('Invalid SCORM package—missing imsmanifest.xml');
            }
            console.log('[MODEL MANIFEST READ START]');
            const manifestXml = fs.readFileSync(manifestPath, 'utf8');
            const manifestJson = await parseStringPromise(manifestXml);
            console.log('[MODEL MANIFEST PARSE OK] Keys:', Object.keys(manifestJson));

            console.log('[MODEL CHECKSUM START]');
            const checksum = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
            console.log('[MODEL CHECKSUM OK]', checksum.substring(0, 8) + '...');

            // Duplicate check
            if (!forceNew) {
                const existing = await prisma.scormPackage.findFirst({
                    where: { checksum }
                });
                if (existing) {
                    console.log('[MODEL DUP FOUND] Returning existing package:', existing.id);
                    return existing;
                }
            }

            console.log('[MODEL BLOB TOKEN CHECK]', process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Missing');
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                throw new Error('BLOB_READ_WRITE_TOKEN not set in .env—cannot upload to Vercel Blob');
            }

            console.log('[MODEL FILES SCAN START]');
            const files = fs.readdirSync(extractDir, { recursive: true });
            console.log('[MODEL FILES FOUND]', files.length, 'files');

            // Debug: Show some file paths to see separator issues
            console.log('[MODEL] Sample file paths (first 5):');
            files.slice(0, 5).forEach((file, i) => {
                console.log(`  ${i + 1}. "${file}" (contains \\: ${file.includes('\\')})`);
            });

            const uploadPromises = [];
            const failedUploads = [];

            files.forEach(relativePath => {
                if (relativePath && !relativePath.startsWith('.')) {
                    const fullPath = path.join(extractDir, relativePath);
                    if (fs.statSync(fullPath).isFile()) {
                        // ⚠️ FIX: Normalize Windows paths
                        const normalizedPath = relativePath.replace(/\\/g, '/');
                        const blobPath = `${folderHandle}${normalizedPath}`;

                        console.log(`[UPLOAD] Preparing: ${normalizedPath}`);

                        uploadPromises.push(
                            put(blobPath, fs.createReadStream(fullPath), {
                                access: 'public',
                                token: process.env.BLOB_READ_WRITE_TOKEN
                            }).then(response => ({
                                url: response.url,
                                path: normalizedPath,
                                size: fs.statSync(fullPath).size
                            })).catch(err => {
                                console.error(`[UPLOAD FAIL] ${normalizedPath}:`, err.message);
                                failedUploads.push({
                                    path: normalizedPath,
                                    error: err.message
                                });
                                return null;
                            })
                        );
                    }
                }
            });

            console.log('[MODEL BLOB UPLOAD START]', uploadPromises.length, 'promises');
            const blobResults = (await Promise.all(uploadPromises)).filter(b => b !== null);
            console.log('[MODEL BLOB UPLOAD OK]', blobResults.length, 'blobs uploaded successfully');

            if (failedUploads.length > 0) {
                console.warn('[MODEL] Failed uploads:', failedUploads.length);
                failedUploads.slice(0, 5).forEach(fail => {
                    console.warn(`  ❌ ${fail.path}: ${fail.error}`);
                });
            }

            // Check for critical files
            const criticalFiles = [
                'res/index.html',
                'imsmanifest.xml',
                'res/lms.js'
            ];

            const uploadedPaths = blobResults.map(b => b.path);
            console.log('[MODEL] Checking critical files:');
            criticalFiles.forEach(critical => {
                const found = uploadedPaths.some(path => path.includes(critical));
                console.log(`  ${found ? '✅' : '❌'} ${critical}`);
            });

            if (blobResults.length === 0) {
                throw new Error('No files were successfully uploaded to blob storage');
            }

            console.log('[MODEL DB SAVE START]');
            const packageData = await prisma.scormPackage.create({
                data: {
                    filename,
                    storagePath: folderHandle,
                    manifestJson,
                    scormVersion: (manifestJson.manifest?.manifest?.['@']?.version ||
                        manifestJson.manifest?.['@']?.version ||
                        'V1_2'),
                    encrypted: false,
                    checksum,
                    uploadedBy,
                    blobs: blobResults.map(b => b.url) // Save URLs directly in create
                },
                include: { uploader: true }
            });
            console.log('[MODEL DB SAVE OK] Package ID:', packageData.id);

            // Verify the saved package
            const saved = await prisma.scormPackage.findUnique({
                where: { id: packageData.id },
                select: { blobs: true, storagePath: true }
            });
            console.log('[MODEL VERIFICATION]');
            console.log('  Storage path in DB:', saved?.storagePath);
            console.log('  Blobs count in DB:', saved?.blobs?.length || 0);

            // Return with detailed info
            return {
                ...packageData,
                blobs: blobResults.map(b => b.url),
                stats: {
                    totalFiles: files.length,
                    uploadedFiles: blobResults.length,
                    failedUploads: failedUploads.length,
                    totalSize: blobResults.reduce((sum, b) => sum + (b.size || 0), 0)
                }
            };
        } catch (error) {
            console.error('[MODEL UPLOAD ERROR]', error.message, error.stack);
            throw error;
        } finally {
            if (fs.existsSync(extractDir)) {
                fs.rmSync(extractDir, { recursive: true, force: true });
            }
            console.log('[MODEL CLEANUP OK]');
        }
    }

    static async findById(id) {
        console.log('[SCORM MODEL] findById:', id);
        return prisma.scormPackage.findUnique({
            where: { id },
            include: { uploader: true }
        });
    }

    static async getManifest(id) {
        const pkg = await this.findById(id);
        if (!pkg) throw new Error('Package not found');
        return pkg.manifestJson;
    }

    static async getLaunchUrl(id) {
        const pkg = await this.findById(id);
        if (!pkg) throw new Error('Package not found');

        // 1. Find index.html in blobs
        if (pkg.blobs && pkg.blobs.length > 0) {
            const indexBlob = pkg.blobs.find(blob => {
                try {
                    const url = new URL(blob);
                    return url.pathname.toLowerCase().includes('/res/index.html');
                } catch {
                    return false;
                }
            });

            if (indexBlob) {
                console.log('✅ Launch URL from blobs:', indexBlob);
                return indexBlob;
            }
        }

        // 2. Construct with correct subdomain
        let baseUrl = 'https://blob.vercel-storage.com';

        if (pkg.blobs && pkg.blobs.length > 0) {
            try {
                const sampleBlob = pkg.blobs[0];
                const url = new URL(sampleBlob);
                baseUrl = `${url.protocol}//${url.hostname}`;
            } catch (error) {
                console.warn('Could not parse blob URL, using default');
            }
        }

        const storagePath = pkg.storagePath.endsWith('/')
            ? pkg.storagePath
            : pkg.storagePath + '/';

        const launchUrl = `${baseUrl}/${storagePath}res/index.html`;
        console.log('🔨 Constructed launch URL:', launchUrl);

        return launchUrl;
    }

}

async function testUrlAccess(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}