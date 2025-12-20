import { ScormService } from '../service/ScormService.js';

export const uploadPackage = async (req, res) => {
    console.log('[UPLOAD CTRL START] Method: POST URL: /api/v1/scorm-packages');

    if (!req.file) {
        console.log('[UPLOAD CTRL NO FILE] Body:', req.body);
        return res.status(400).json({ error: 'No file uploaded—use "package" field' });
    }

    try {
        console.log('[UPLOAD CTRL FILE OK]', req.file.originalname, 'Path:', req.file.path, 'Size:', req.file.size);
        const uploadedBy = req.user.id;
        const result = await ScormService.uploadPackage(req.file.path, req.file.originalname, uploadedBy);  // FIXED: Pass path
        console.log('[UPLOAD CTRL SUCCESS]', result.id);
        res.status(201).json(result);
    } catch (error) {
        console.error('[UPLOAD CTRL SERVICE ERROR]', error.message);
        res.status(400).json({ error: error.message });
    }
};

export const getManifest = async (req, res) => {
    try {
        const { id } = req.params;
        const manifest = await ScormService.getManifest(id);
        res.json(manifest);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};