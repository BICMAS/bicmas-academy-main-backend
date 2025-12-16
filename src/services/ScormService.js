import { ScormPackageModel } from '../models/ScormPackageModel.js';

export class ScormService {
    static async uploadPackage(filePath, filename) {
        return await ScormPackageModel.uploadAndExtract(filePath, filename);
    }

    static async getPackageManifest(id) {
        return await ScormPackageModel.getManifest(id);
    }
}