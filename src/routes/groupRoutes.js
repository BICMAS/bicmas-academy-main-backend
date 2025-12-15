import { Router } from 'express';
import { getGroups, createGroup, addGroupMember } from '../controllers/GroupController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const groupRouter = Router();

// Public
groupRouter.get('/', getGroups);

// Protected
groupRouter.post('/', authenticateToken, requireRole('SUPER_ADMIN', 'HR_MANAGER'), createGroup);
groupRouter.post('/:id/members', authenticateToken, requireRole('SUPER_ADMIN', 'HR_MANAGER'), addGroupMember);
export default groupRouter;