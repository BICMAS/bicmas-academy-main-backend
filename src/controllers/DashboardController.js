import { DashboardService, LearnerDashboardService } from '../service/DashboardService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

export const getHRDashboard = async (req, res) => {
    try {
        const { orgId } = req.user;
        if (!orgId) throw new Error('HR must be in an organization');
        const dashboard = await DashboardService.getHRDashboard(orgId);
        res.json(dashboard);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

export const getSuperAdminDashboard = async (req, res) => {
    try {
        console.log('[DASHBOARD CTRL SUPER] User:', req.user.userRole);
        const dashboard = await DashboardService.getSuperAdminDashboard();
        console.log('[DASHBOARD CTRL SUPER] Data keys:', Object.keys(dashboard));
        res.json(dashboard);
    } catch (error) {
        console.error('[DASHBOARD CTRL SUPER ERROR]', error.message);
        res.status(403).json({ error: error.message });
    }
};

export const getLearnerDashboard = async (req, res) => {
    try {
        const result = await LearnerDashboardService.getLearnerDashboard(req.user);
        res.json(result);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};