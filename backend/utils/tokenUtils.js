import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const REFRESH_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30 * 15; // ~15 months

const isProduction = process.env.NODE_ENV === 'production';
const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

export const generateAccessToken = (userId, role, sessionId) =>
  jwt.sign(
    {
      id: userId,
      role,
      sid: sessionId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

export const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');

export const hashToken = (token) =>
  crypto
    .createHmac('sha256', process.env.JWT_REFRESH_SECRET)
    .update(token)
    .digest('hex');

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    ...cookieBaseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    ...cookieBaseOptions,
    maxAge: 0,
  });
};
