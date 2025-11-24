const ACCESS_TOKEN_KEY = 'nbk_access_token';
const LAST_PING_KEY = 'nbk_last_ping';

const decodePayload = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const getStoredAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const storeAccessToken = (token) => {
  if (!token) return clearStoredAccessToken();
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearStoredAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getTokenAgeHours = (token) => {
  const payload = token ? decodePayload(token) : null;
  if (!payload?.iat) return Infinity;
  const issuedAt = payload.iat * 1000;
  return (Date.now() - issuedAt) / (1000 * 60 * 60);
};

export const isTokenExpired = (token) => {
  const payload = token ? decodePayload(token) : null;
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const shouldPingSession = () => {
  const lastPing = Number(localStorage.getItem(LAST_PING_KEY) || 0);
  const twentyFourHours = 1000 * 60 * 60 * 24;
  return Date.now() - lastPing >= twentyFourHours;
};

export const markSessionPing = () => {
  localStorage.setItem(LAST_PING_KEY, String(Date.now()));
};

export const resetSessionPing = () => {
  localStorage.removeItem(LAST_PING_KEY);
};
