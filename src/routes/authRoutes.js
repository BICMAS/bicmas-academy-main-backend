import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { login, ssoCallback, refresh, logout, registerDevice, verifyMFA, phoneLogin } from '../controllers/AuthControllers.js';

const authRouter = Router();

// Public
authRouter.post('/login', login);
authRouter.post('/phone-login', phoneLogin);
authRouter.post('/sso/callback', ssoCallback);
authRouter.post('/refresh', refresh);

// Protected
authRouter.post('/logout', authenticateToken, logout);
authRouter.post('/device/register', authenticateToken, registerDevice);
authRouter.post('/verify-mfa', authenticateToken, verifyMFA);

export default authRouter;