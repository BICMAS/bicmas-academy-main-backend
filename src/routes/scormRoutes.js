import { Router } from 'express';
import { uploadPackage, getManifest } from '../controllers/ScormController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { uploadMiddleware } from '../middleware/fileUploadMiddleware.js';

const scormRouter = Router();

scormRouter.post(
    '/',
    authenticateToken,
    requireRole(['SUPER_ADMIN', 'HR_MANAGER']),
    uploadMiddleware,
    uploadPackage
);


export default scormRouter;