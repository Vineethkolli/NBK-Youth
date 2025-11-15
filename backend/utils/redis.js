import Redis from "ioredis";

let redis = null;

// Create a safe dummy redis object to avoid crashes
const dummyRedis = {
  get: async () => null,
  set: async () => {},
  del: async () => {},
};

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      tls: {},
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  } catch (err) {
    console.error("Redis connection failed, falling back to dummyRedis");
    redis = dummyRedis;
  }
} else {
  // No environment variable → use dummy redis
  redis = dummyRedis;
}

export { redis };
