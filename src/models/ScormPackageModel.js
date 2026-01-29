import { prisma } from '../utils/db.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { parseStringPromise } from 'xml2js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config()
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';



// Initialize S3 client once
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AMAZON_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AMAZON_S3_ACCESS_SECRET,
    },
});

export class ScormPackageModel {
    static async uploadAndExtract(filePath, filename, uploadedBy) {
        console.log('[MODEL EXTRACT START] File path:', filePath, 'Filename:', filename);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const safeFilename = filename.replace(/[^a-zA-Z0-9-_.]/g, '_').replace('.zip', '');
        const folderHandle = `${timestamp}-${safeFilename}/`; // no 'scorm/' prefix if you want

        const tempDir = path.join(process.cwd(), 'uploads/temp');
        const extractDir = path.join(tempDir, folderHandle);
        fs.mkdirSync(tempDir, { recursive: true });
        fs.mkdirSync(extractDir, { recursive: true });
        console.log('[MODEL MKDIR OK] Extract dir:', extractDir);

        try {
            // Extract ZIP
            const zip = new AdmZip(filePath);
            zip.extractAllTo(extractDir, true);
            console.log('[MODEL ZIP EXTRACT OK] Files extracted');

            // Read manifest
            const manifestPath = path.join(extractDir, 'imsmanifest.xml');
            if (!fs.existsSync(manifestPath)) {
                throw new Error('Missing imsmanifest.xml');
            }
            const manifestXml = fs.readFileSync(manifestPath, 'utf8');
            const manifestJson = await parseStringPromise(manifestXml);

            // Checksum
            const checksum = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

            // (optional) skip duplicate
            const existing = await prisma.scormPackage.findFirst({ where: { checksum } });
            if (existing) {
                console.log('[MODEL] Duplicate found - returning existing');
                return existing;
            }

            // Scan all files
            const files = fs.readdirSync(extractDir, { recursive: true });
            console.log('[MODEL] Found', files.length, 'entries');

            const uploadPromises = [];
            for (const relativePath of files) {
                if (!relativePath || relativePath.startsWith('.')) continue;

                const fullPath = path.join(extractDir, relativePath);
                if (!fs.statSync(fullPath).isFile()) continue;

                const key = `${folderHandle}${relativePath.replace(/\\/g, '/')}`; // use / always

                uploadPromises.push(
                    new Upload({
                        client: s3Client,
                        params: {
                            Bucket: process.env.AMAZON_S3_BUCKET,
                            Key: key,
                            Body: fs.createReadStream(fullPath),
                            ContentType: 'application/octet-stream', // let S3 detect better types if needed
                        },
                    })
                        .done()
                        .then(() => {
                            const url = `https://${process.env.AMAZON_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
                            console.log('[S3 UPLOAD OK]', key);
                            return { url };
                        })
                        .catch(err => {
                            console.error('[S3 UPLOAD FAIL]', key, err.message);
                            return null;
                        })
                );
            }

            const blobs = (await Promise.all(uploadPromises)).filter(Boolean);
            console.log('[MODEL] Uploaded', blobs.length, 'files to S3');

            // Save to DB
            const packageData = await prisma.scormPackage.create({
                data: {
                    filename,
                    storagePath: folderHandle,
                    manifestJson,
                    scormVersion: manifestJson.manifest?.['@']?.version || 'V1_2',
                    encrypted: false,
                    checksum,
                    uploadedBy,
                    blobs: blobs.map(b => b.url),
                },
                include: { uploader: true },
            });

            console.log('[MODEL] Saved package with blobs:', packageData.id);

            return { ...packageData, blobs: blobs.map(b => b.url) };
        } finally {
            if (fs.existsSync(extractDir)) {
                fs.rmSync(extractDir, { recursive: true, force: true });
            }
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

        let launchHref = 'res/index.html';

        // Parse manifest (same as before)
        const innerManifest = pkg.manifestJson?.manifest?.manifest || pkg.manifestJson?.manifest;
        if (innerManifest?.resources?.[0]?.resource?.[0]?.$?.href) {
            launchHref = innerManifest.resources[0].resource[0].$.href;
        }

        launchHref = launchHref.replace(/\\/g, '/'); // normalize

        // Use first blob's base or construct
        let baseUrl = 'https://blob.vercel-storage.com';
        if (pkg.blobs?.length > 0) {
            const first = new URL(pkg.blobs[0]);
            baseUrl = `${first.protocol}//${first.host}`;
        }

        const fullUrl = `${baseUrl}/${pkg.storagePath}${launchHref}`;
        return fullUrl;
    }

}