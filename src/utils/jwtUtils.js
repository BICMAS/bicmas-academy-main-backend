import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateTokens = (userId, userRole) => {
    const payload = { id: userId, role: userRole };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const verifyToken = (token, isRefresh = false) => {
    const secret = isRefresh ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
};