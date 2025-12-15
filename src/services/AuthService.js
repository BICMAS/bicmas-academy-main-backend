import bcrypt from 'bcryptjs';
import { generateTokens, verifyToken } from '../utils/jwtUtils.js';
import { UserModel } from '../models/UserModel.js';

export class AuthService {
    static async login(email, password) {
        if (!email || !password) throw new Error('Email and password required');

        const user = await UserModel.findByEmail(email);
        if (!user || user.authProvider !== 'LOCAL' || user.status !== 'ACTIVE') {
            throw new Error('Invalid credentials');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) throw new Error('Invalid credentials');

        const { accessToken, refreshToken } = generateTokens(user.id, user.userRole);
        return { accessToken, refreshToken, user: { id: user.id, email: user.email, userRole: user.userRole } };
    }

    static async refresh(refreshToken) {
        if (!refreshToken) throw new Error('Refresh token required');

        const decoded = verifyToken(refreshToken, true);
        const user = await UserModel.findById(decoded.id);
        if (!user || user.status !== 'ACTIVE') throw new Error('Invalid refresh token');

        const { accessToken } = generateTokens(user.id, user.userRole);
        return { accessToken };
    }

    static async logout(refreshToken) {

        return { message: 'Logged out' };
    }

    static async registerDevice(userId, deviceType, deviceToken) {
        if (!deviceType || !deviceToken) throw new Error('Device type and token required');

        const device = await prisma.device.create({
            data: { userId, deviceType, deviceToken, registeredAt: new Date() }
        });
        return { deviceId: device.id };
    }

    static async verifyMFA(userId, mfaToken, setup = false) {
        const user = await UserModel.findById(userId);
        if (setup) {
            // Stub: Generate secret (use speakeasy)
            return { secret: 'JBSWY3DPEHPK3PXP', message: 'Scan QR' };
        }

        if (!mfaToken) throw new Error('MFA token required');
        // Stub: Verify (use speakeasy.totp.verify)
        if (mfaToken !== '123456') throw new Error('Invalid MFA token');
        return { message: 'MFA verified' };
    }

    static async ssoCallback(code) {
        if (!code) throw new Error('Authorization code required');
        // Stub: Exchange code for user (integrate OAuth lib)
        const user = { id: 'sso-user-id', email: 'sso@example.com', userRole: 'TRAINEE' };
        const { accessToken, refreshToken } = generateTokens(user.id, user.userRole);
        return { accessToken, refreshToken, user };
    }
}