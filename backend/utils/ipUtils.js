import axios from 'axios';

const sanitize = (value) =>
  (value || 'unknown')
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 60) || 'unknown';

const isLocal = (ip) => !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.');

export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }

  if (req.connection?.remoteAddress) return req.connection.remoteAddress;
  if (req.socket?.remoteAddress) return req.socket.remoteAddress;
  if (req.connection?.socket?.remoteAddress) return req.connection.socket.remoteAddress;

  return req.ip || 'unknown';
};

const fetchFromIpApi = async (ip) => {
  const { data } = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
  if (data?.status === 'success') {
    return {
      city: sanitize(data.city),
      state: sanitize(data.regionName),
      country: sanitize(data.country),
    };
  }
  throw new Error('ip-api lookup failed');
};

const fetchFromIpWho = async (ip) => {
  const { data } = await axios.get(`https://ipwho.is/${ip}`);
  if (data && data.success !== false) {
    return {
      city: sanitize(data.city),
      state: sanitize(data.region),
      country: sanitize(data.country),
    };
  }
  throw new Error('ipwho lookup failed');
};

export const lookupLocation = async (ip) => {
  if (isLocal(ip)) {
    return { city: 'local', state: 'local', country: 'local' };
  }

  const providers = [fetchFromIpApi, fetchFromIpWho];

  for (const provider of providers) {
    try {
      const result = await provider(ip);
      if (result) return result;
    } catch (error) {
      // Continue to next provider
    }
  }

  return { city: 'unknown', state: 'unknown', country: 'unknown' };
};
