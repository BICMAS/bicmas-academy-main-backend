import fs from 'fs';
import path from 'path';
import { ScormPackageModel } from '../models/ScormPackageModel.js';

export class ScormService {
    static async uploadPackage(tempPath, filename, uploadedBy) {
        console.log('[SERVICE UPLOAD START] Temp path:', tempPath, 'Filename:', filename);
        if (!filename.endsWith('.zip')) throw new Error('File must be ZIP');

        try {
            const result = await ScormPackageModel.uploadAndExtract(tempPath, filename, uploadedBy);
            return result;
        } finally {
            // FIXED: Single cleanup here (no controller unlink)
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
                console.log('[SERVICE CLEANUP OK]');
            }
        }
    }

    static async getManifest(id) {
        console.log('[SCORM SERVICE] getManifest for ID:', id);  // FIXED: Log ID
        const pkg = await ScormPackageModel.findById(id);
        console.log('[SCORM SERVICE] Package found:', pkg ? 'YES' : 'NO');  // FIXED: Log if found
        if (!pkg) throw new Error('Package not found');
        console.log('[SCORM SERVICE] Manifest JSON keys:', pkg.manifestJson ? Object.keys(pkg.manifestJson) : 'NULL');  // FIXED: Log manifest content
        if (!pkg.manifestJson || Object.keys(pkg.manifestJson).length === 0) {
            throw new Error('Manifest not parsed during upload—re-upload package');
        }
        return pkg.manifestJson;
    }
}