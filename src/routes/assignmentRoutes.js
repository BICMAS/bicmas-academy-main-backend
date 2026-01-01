import { Router } from 'express';
import { createAssignments } from '../controllers/AssignmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const assignmentRouter = Router();

assignmentRouter.post('/', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), createAssignments);

export default assignmentRouter;