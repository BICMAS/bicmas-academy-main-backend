import { Router } from 'express';
import { updateProgress } from '../controllers/AttemptController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const attemptRouter = Router();

attemptRouter.patch('/:courseId', authenticateToken, updateProgress);

export default attemptRouter;