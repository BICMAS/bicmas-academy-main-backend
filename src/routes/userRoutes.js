import { Router } from 'express';
import { getUser, createUser, updateUser, bulkUpload, getAllUsers, getCurrentOrgUsers } from '../controllers/UserController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const userRouter = Router();

// Public
userRouter.post('/', authenticateToken, requireRole(['SUPER_ADMIN', "HR_MANAGER"]), createUser);

// Protected
userRouter.get('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'HR_MANAGER']), getUser);
userRouter.put('/:id', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), updateUser);
userRouter.post('/bulk-upload', authenticateToken, requireRole(['SUPER_ADMIN', 'HR_MANAGER']), bulkUpload);
userRouter.get('/', authenticateToken, requireRole(['SUPER_ADMIN']), getAllUsers);
userRouter.get('/organization/users', authenticateToken, getCurrentOrgUsers);
export default userRouter;