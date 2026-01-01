import { DashboardService } from '../service/DashboardService.js';
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