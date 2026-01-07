import { CertificateTemplateModel } from '../models/CertificateTemplateModel.js';

export class CertificateTemplateService {
    static async uploadTemplate(filePath, filename, description, uploadedBy) {
        if (!uploadedBy) throw new Error('Uploader ID required');
        if (!filename) throw new Error('Filename required');
        if (!filename.endsWith('.pdf')) {  // FIXED: PDF only
            throw new Error('Only PDF templates allowed');
        }

        const mimeType = 'application/pdf';

        const result = await CertificateTemplateModel.uploadAndSave(filePath, filename, mimeType, description, uploadedBy);
        return result;
    }
}