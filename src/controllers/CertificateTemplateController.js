import multer from 'multer';
import fs from 'fs';
import { CertificateTemplateService } from '../service/CertificateTemplateService.js';

const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/temp/',
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
    }),
    limits: { fileSize: 10 * 1024 * 1024 },  // 10MB for PDFs
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files allowed'), false);
        }
    }
});

export const uploadTemplate = (req, res) => {
    upload.single('template')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: 'Upload failed' });

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        try {
            const uploadedBy = req.user.id;
            const { description } = req.body;  // Optional
            const result = await CertificateTemplateService.uploadTemplate(req.file.path, req.file.originalname, description, uploadedBy);
            fs.unlinkSync(req.file.path);  // Clean temp
            res.status(201).json({
                url: result.blobUrl,
                id: result.id,
                filename: result.filename
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
};