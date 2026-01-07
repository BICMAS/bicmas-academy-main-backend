import { Router } from 'express';
import { uploadTemplate } from '../controllers/CertificateTemplateController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const certificateRouter = Router();

certificateRouter.post('/', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), uploadTemplate);

export default certificateRouter;