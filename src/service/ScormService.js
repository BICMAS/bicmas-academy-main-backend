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

    // ... other methods (getPackage, getManifest) unchanged
}