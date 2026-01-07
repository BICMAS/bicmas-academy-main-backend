import { Router } from 'express';
import { createPath } from '../controllers/LearningPathController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const learningPathRouter = Router();

learningPathRouter.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), createPath);

export default learningPathRouter;