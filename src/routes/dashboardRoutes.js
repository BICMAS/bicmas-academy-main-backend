import { Router } from 'express';
import { getHRDashboard } from '../controllers/DashboardController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { log } from 'console';

const dashboardRouter = Router();

dashboardRouter.get('/hr', authenticateToken, requireRole('HR_MANAGER'),
    getHRDashboard);

export default dashboardRouter;