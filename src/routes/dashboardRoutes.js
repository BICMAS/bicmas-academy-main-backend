import { Router } from 'express';
import { getHRDashboard, getSuperAdminDashboard } from '../controllers/DashboardController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { log } from 'console';

const dashboardRouter = Router();
dashboardRouter.get('/hr', authenticateToken, requireRole('HR_MANAGER'), getHRDashboard);

dashboardRouter.get('/super', authenticateToken, requireRole('SUPER_ADMIN'), getSuperAdminDashboard);
export default dashboardRouter;