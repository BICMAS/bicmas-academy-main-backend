import { Router } from 'express';
import { getHRDashboard, getLearnerDashboard, getSuperAdminDashboard } from '../controllers/DashboardController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { log } from 'console';

const dashboardRouter = Router();
dashboardRouter.get('/hr', authenticateToken, requireRole('HR_MANAGER'), getHRDashboard);

dashboardRouter.get('/super', authenticateToken, requireRole('SUPER_ADMIN'), getSuperAdminDashboard);
dashboardRouter.get('/learner', authenticateToken, requireRole('LEARNER'), getLearnerDashboard);

export default dashboardRouter;