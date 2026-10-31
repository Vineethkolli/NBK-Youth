import Redis from 'ioredis';
import { logActivity } from '../middleware/activityLogger.js';

const TIMEOUT = 20000;
const LIMITS = {
  commands: 500_000,
  bandwidthBytes: 10 * 1024 ** 3,
  storageBytes: 256 * 1024 ** 2,
};

const formatBytes = (bytes) => {
  const value = Number(bytes) || 0;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let amount = value;

  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }

  return `${amount.toFixed(2)} ${units[index]}`;
};

const requireRedis = () => {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured');
  }

  return new Redis(process.env.REDIS_URL, {
    tls: {},
    connectTimeout: TIMEOUT,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  });
};

const scanKeys = async (redis) => {
  const keys = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'COUNT', 500);
    keys.push(...batch);
    cursor = nextCursor;
  } while (cursor !== '0');

  return keys;
};

const getUsageStats = async () => {
  const { UPSTASH_EMAIL: email, UPSTASH_API_KEY: apiKey, UPSTASH_REDIS_DATABASE_ID: databaseId } = process.env;
  if (!email || !apiKey || !databaseId) {
    throw new Error('Upstash usage credentials are not configured');
  }

  const auth = Buffer.from(`${email}:${apiKey}`).toString('base64');
  const response = await fetch(
    `https://api.upstash.com/v2/redis/stats/${encodeURIComponent(databaseId)}`,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT),
    },
  );
  const stats = await response.json();

  if (!response.ok) {
    throw new Error(stats.error || `Upstash Stats API HTTP ${response.status}`);
  }

  return stats;
};

const getRedisData = async () => {
  const redis = requireRedis();
  try {
    await redis.connect();
    const keys = await scanKeys(redis);
    const sizes = await Promise.all(
      keys.map(async (key) => ({
        key,
        size: Number(await redis.memory('USAGE', key)) || 0,
      })),
    );
    const [stats, totalKeys] = await Promise.all([getUsageStats(), redis.dbsize()]);

    return {
      metrics: {
        commands: Number(stats.total_monthly_requests) || 0,
        commandLimit: LIMITS.commands,
        bandwidth: Number(stats.total_monthly_bandwidth) || 0,
        bandwidthLimit: LIMITS.bandwidthBytes,
        storage: Number(stats.current_storage) || 0,
        storageLimit: LIMITS.storageBytes,
        totalKeys: Number(totalKeys) || 0,
      },
      keys: sizes.sort((left, right) => left.key.localeCompare(right.key)),
    };
  } finally {
    redis.disconnect();
  }
};

export const redisController = {
  getOverview: async (req, res) => {
    try {
      const data = await getRedisData();
      res.json(data);
    } catch (error) {
      console.error('Failed to fetch Redis monitor data:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch Redis data' });
    }
  },

  deleteKey: async (req, res) => {
    const { key } = req.body;
    if (typeof key !== 'string' || !key) {
      return res.status(400).json({ message: 'A Redis key is required' });
    }

    const redis = requireRedis();
    try {
      await redis.connect();
      const deleted = await redis.unlink(key);
      await logActivity(
        req,
        'DELETE',
        'Monitor',
        'Upstash Redis',
        { before: { key, deleted: deleted === 1 }, after: null },
        `Upstash Redis key "${key}" deleted`
      );
      res.json({ deleted: deleted === 1, key });
    } catch (error) {
      console.error(`Failed to delete Redis key "${key}":`, error);
      res.status(500).json({ message: error.message || 'Failed to delete Redis key' });
    } finally {
      redis.disconnect();
    }
  },

  deleteAll: async (req, res) => {
    if (req.body?.confirm !== true) {
      return res.status(400).json({ message: 'Confirmation is required to delete all Redis data' });
    }

    const redis = requireRedis();
    try {
      await redis.connect();
      const keys = await scanKeys(redis);
      let deleted = 0;
      for (let index = 0; index < keys.length; index += 500) {
        deleted += Number(await redis.unlink(...keys.slice(index, index + 500))) || 0;
      }
      await logActivity(
        req,
        'DELETE',
        'Monitor',
        'Upstash Redis',
        { before: { keyCount: keys.length }, after: { deletedKeyCount: deleted } },
        `All Upstash Redis keys deleted (${deleted})`
      );
      res.json({ deleted });
    } catch (error) {
      console.error('Failed to delete all Redis data:', error);
      res.status(500).json({ message: error.message || 'Failed to delete Redis data' });
    } finally {
      redis.disconnect();
    }
  },
};

export { formatBytes };
