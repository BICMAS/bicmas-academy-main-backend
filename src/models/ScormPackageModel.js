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
    static async uploadAndExtract(filePath, filename, uploadedBy) {
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

            const existing = await prisma.scormPackage.findUnique({ where: { checksum } });
            if (existing) {
                console.log('[MODEL DUP FOUND]', existing.id);
                return existing;
            }

            console.log('[MODEL BLOB TOKEN CHECK]', process.env.BLOB_READ_WRITE_TOKEN ? 'Set' : 'Missing');
            if (!process.env.BLOB_READ_WRITE_TOKEN) {
                throw new Error('BLOB_READ_WRITE_TOKEN not set in .env—cannot upload to Vercel Blob');
            }

            console.log('[MODEL FILES SCAN START]');
            const files = fs.readdirSync(extractDir, { recursive: true });
            console.log('[MODEL FILES FOUND]', files.length, 'files');

            const uploadPromises = [];
            files.forEach(file => {
                if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.xml')) {
                    const fullPath = path.join(extractDir, file);
                    const blobPath = `${folderHandle}${file}`;
                    uploadPromises.push(put(blobPath, fs.createReadStream(fullPath), {
                        access: 'public',
                        token: process.env.BLOB_READ_WRITE_TOKEN
                    }).then(response => ({  // FIXED: Clone response to avoid locked body
                        url: response.url,
                        blob: response.blob  // Optional, if needed
                    })));
                }
            });

            console.log('[MODEL BLOB UPLOAD START]', uploadPromises.length, 'promises');
            const blobs = await Promise.all(uploadPromises);
            console.log('[MODEL BLOB UPLOAD OK]', blobs.length, 'blobs uploaded');

            console.log('[MODEL DB SAVE START]');
            const packageData = await prisma.scormPackage.create({
                data: {
                    filename,
                    storagePath: folderHandle,
                    manifestJson,
                    scormVersion: (manifestJson.manifest && manifestJson.manifest['@'] && manifestJson.manifest['@'].version) || 'V1_2',
                    encrypted: false,
                    checksum,
                    uploadedBy
                },
                include: { uploader: true }
            });
            console.log('[MODEL DB SAVE OK] Package ID:', packageData.id);

            return { ...packageData, blobs: blobs.map(b => b.url) };
        } finally {
            if (fs.existsSync(extractDir)) {
                fs.rmSync(extractDir, { recursive: true, force: true });
            }
            console.log('[MODEL CLEANUP OK]');
        }
    }

    static async findById(id) {
        return prisma.scormPackage.findUnique({
            where: { id },
            include: { lessons: true, uploader: true }
        });
    }

    static async getManifest(id) {
        const pkg = await this.findById(id);
        if (!pkg) throw new Error('Package not found');
        return pkg.manifestJson;
    }
}