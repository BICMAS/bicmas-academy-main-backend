import { ScormService } from '../service/ScormService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

export const uploadPackage = (req, res) => {
    upload.single('package')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: 'Upload failed' });
        try {
            const result = await ScormService.uploadPackage(req.file.path, req.file.originalname);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
};

export const getManifest = async (req, res) => {
    try {
        const { id } = req.params;
        const manifest = await ScormService.getPackageManifest(id);
        res.json(manifest);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};