import { prisma } from '../utils/db.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { parseStringPromise } from 'xml2js';

export class ScormPackageModel {
    static async uploadAndExtract(filePath, filename) {
        // Extract ZIP
        const zip = new AdmZip(filePath);
        const extractDir = path.join(process.cwd(), 'uploads/temp', filename.replace('.zip', ''));
        zip.extractAllTo(extractDir, true);

        // Parse imsmanifest.xml
        const manifestPath = path.join(extractDir, 'imsmanifest.xml');
        const manifestXml = fs.readFileSync(manifestPath, 'utf8');
        const manifestJson = await parseStringPromise(manifestXml);

        // Upload files to Vercel Blob
        const folderHandle = `scorm/${Date.now()}-${filename.replace('.zip', '')}/`;
        const uploadPromises = [];
        const files = fs.readdirSync(extractDir, { recursive: true });
        files.forEach(file => {
            if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.xml') || file.endsWith('.css')) {
                const fullPath = path.join(extractDir, file);
                const blobPath = `${folderHandle}${file}`;
                uploadPromises.push(put(blobPath, fs.createReadStream(fullPath), {
                    access: 'public',
                    handle: folderHandle,
                    token: process.env.BLOB_READ_WRITE_TOKEN
                }));
            }
        });

        const blobs = await Promise.all(uploadPromises);

        // Clean temp
        fs.rmSync(extractDir, { recursive: true, force: true });

        // Save to DB
        const packageData = await prisma.scormPackage.create({
            data: {
                filename,
                storagePath: folderHandle,
                manifestJson,
                scormVersion: manifestJson['imsmanifest']['@'].version || '1.2',
                uploadedBy: 'current-user-id'
            }
        });

        return { ...packageData, blobs: blobs.map(b => b.url) };
    }

    static async findById(id) {
        return prisma.scormPackage.findUnique({ where: { id } });
    }

    static async getManifest(id) {
        const pkg = await this.findById(id);
        if (!pkg) throw new Error('Package not found');
        return pkg.manifestJson;
    }
}