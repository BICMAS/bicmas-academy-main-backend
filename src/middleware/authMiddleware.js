import { verifyToken } from '../utils/jwtUtils.js';
import { UserModel } from '../models/UserModel.js';

export const authenticateToken = async (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH MW START] ${timestamp} - Method: ${req.method}, URL: ${req.url}, Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(`[AUTH MW FAIL] ${timestamp} - No Bearer token, 401`);
            return res.status(401).json({ error: 'Access token required (Bearer format)' });
        }

        const token = authHeader.split(' ')[1];
        console.log(`[AUTH MW DECODE] ${timestamp} - Token length: ${token.length}`);
        const decoded = verifyToken(token);
        console.log(`[AUTH MW DECODED] ${timestamp} - ID: ${decoded.id}, Role: ${decoded.role}`);

        const user = await UserModel.findById(decoded.id);
        console.log(`[AUTH MW FETCH] ${timestamp} - User found: ${user ? 'YES' : 'NO'}`);

        if (!user) {
            console.log(`[AUTH MW FAIL] ${timestamp} - User not found, 401`);
            return res.status(401).json({ error: 'User not found from token ID' });
        }

        if (user.status !== 'ACTIVE') {
            console.log(`[AUTH MW FAIL] ${timestamp} - User inactive, 403`);
            return res.status(403).json({ error: 'Inactive user' });
        }

        req.user = { id: user.id, email: user.email, userRole: user.userRole, orgId: user.orgId };
        console.log(`[AUTH MW SET] ${timestamp} - req.user: Role ${req.user.userRole}, Org ${req.user.orgId || 'Global'}`);
        console.log(`[AUTH MW END] ${timestamp} - Proceeding to next`);

        next();
    } catch (error) {
        console.error(`[AUTH MW ERROR] ${timestamp} - ${error.message}`);
        return res.status(401).json({ error: 'Invalid token: ' + error.message });
    }
};



export const requireRole = (requiredRoles) => (req, res, next) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];  // FIXED: Handle array/single
    if (!req.user || !roles.includes(req.user.userRole)) {
        return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
};