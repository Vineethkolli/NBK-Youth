import redis from "../utils/redisClient.js";

// Caches GET responses based on a key prefix
export const cache =
  (keyPrefix) =>
  async (req, res, next) => {
    try {
      const key = keyPrefix;
      const cached = await redis.get(key);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        try {
          // Store response without TTL until invalidated
          await redis.set(key, JSON.stringify(body));
        } catch (err) {
          console.error("Redis cache set error:", err.message);
        }
        originalJson(body);
      };

      next();
    } catch (err) {
      console.error("Redis cache middleware error:", err.message);
      next();
    }
  };

  
// Invalidate cached data matching a pattern
export const invalidate = async (pattern) => {
  try {
    let cursor = "0";
    do {
      // Scan in small batches
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    } while (cursor !== "0");
  } catch (err) {
    console.error("Redis invalidate error:", err.message);
  }
};
