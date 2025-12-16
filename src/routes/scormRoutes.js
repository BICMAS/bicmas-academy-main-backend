import { Router } from 'express';
import { uploadPackage, getManifest } from '../controllers/ScormController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const scormRouter = Router();

scormRouter.post('/', authenticateToken, requireRole('SUPER_ADMIN'), uploadPackage);
scormRouter.get('/:id/manifest', authenticateToken, getManifest);

export default scormRouter;