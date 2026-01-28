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
        const { file } = req.query;  // Optional override
        console.log('[SCORM CTRL] getLaunch ID:', id, 'override file:', file);  // FIXED: Log

        const pkg = await ScormPackageModel.findById(id);
        if (!pkg) return res.status(404).json({ error: 'Package not found' });

        let launchUrl;
        if (file) {
            // FIXED: Override with query param
            const launchPath = `${pkg.storagePath}${file}.html`;
            const firstBlobUrl = pkg.blobs?.[0];
            const subdomainMatch = firstBlobUrl?.match(/^(https:\/\/[^.]+(?:\.public)?\.blob\.vercel-storage\.com)/);
            const subdomain = subdomainMatch ? subdomainMatch[1] : 'https://blob.vercel-storage.com';
            launchUrl = `${subdomain}/${launchPath}`;
        } else {
            launchUrl = await ScormPackageModel.getLaunchUrl(id);  // FIXED: Dynamic from manifest
        }

        console.log('[SCORM CTRL] Final launch URL:', launchUrl);  // FIXED: Log full URL
        res.json({ launchUrl });  // FIXED: Return for frontend iframe
    } catch (error) {
        console.error('[SCORM LAUNCH ERROR]', error.message);
        res.status(404).json({ error: 'Failed to compute launch URL' });
    }
};