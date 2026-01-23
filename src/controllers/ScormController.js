import { ScormService } from '../service/ScormService.js';
import { ScormPackageModel } from '../models/ScormPackageModel.js';

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

export const getLaunch = async (req, res) => {
    try {
        const { id } = req.params;
        const { file } = req.query;
        console.log('[SCORM CTRL] getLaunch ID:', id, 'file:', file);  // FIXED: Log request

        if (!file) return res.status(400).json({ error: 'File param required (e.g., ?file=index)' });

        const pkg = await ScormPackageModel.findById(id);
        if (!pkg) return res.status(404).json({ error: 'Package not found' });

        // FIXED: Compute direct Blob URL (no SDK fetch—public, iframe-safe)
        const launchPath = `${pkg.storagePath}${file}.html`;  // e.g., scorm/2025-12-20T/ res/index.html
        const launchUrl = `https://blob.vercel-storage.com/${launchPath}`;  // FIXED: Full public URL

        console.log('[SCORM CTRL] Direct launch URL:', launchUrl);  // FIXED: Log for debug
        res.json({ launchUrl });  // FIXED: Return URL (frontend iframes it)
    } catch (error) {
        console.error('[SCORM LAUNCH ERROR]', error.message);
        res.status(404).json({ error: 'Failed to compute launch URL' });
    }
};