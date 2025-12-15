import { verifyToken } from '../utils/jwtUtils.js';
import { UserModel } from '../models/UserModel.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Access token required' });

        const decoded = verifyToken(token);
        const user = await UserModel.findById(decoded.id);
        if (!user || user.status !== 'ACTIVE') return res.status(403).json({ error: 'Invalid or inactive user' });

        req.user = { id: user.id, email: user.email, userRole: user.userRole };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireRole = (requiredRole) => (req, res, next) => {
    if (!req.user || req.user.userRole !== requiredRole) {
        return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
};