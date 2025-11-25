import Session from '../models/Session.js';
import { REFRESH_TOKEN_MAX_AGE_MS } from '../utils/tokenUtils.js';

const cleanString = (value, fallback = 'unknown') => {
  if (!value || typeof value !== 'string') return fallback;
  return value.trim().replace(/\s+/g, ' ').slice(0, 60) || fallback;
};

const normalizeDeviceInfo = (info = {}) => ({
  deviceType: cleanString(info.deviceType || info.type, 'unknown').toLowerCase(),
  deviceModel: cleanString(info.deviceModel || info.model, 'unknown'),
  os: cleanString(info.os || info.platform || info.osName, 'unknown').toLowerCase(),
  osName: cleanString(info.osName || info.platformName || info.os || 'unknown'),
  osVersion: cleanString(info.osVersion || info.platformVersion || 'unknown'),
  browserName: cleanString(info.browserName || info.browser?.name || 'unknown').toLowerCase(),
  browserVersion: cleanString(info.browserVersion || info.browser?.version || 'unknown'),
  accessMode: cleanString(info.accessMode, 'website').toLowerCase(),
});

export const createSession = async ({
  userId,
  tokenHash,
  deviceInfo,
  location,
  ipAddress,
  action,
}) => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  return Session.create({
    userId,
    tokenHash,
    deviceInfo: normalizeDeviceInfo(deviceInfo),
    location,
    ipAddress,
    action,
    expiresAt,
  });
};

export const extendSessionExpiry = (session) => {
  session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
  return session.save();
};
