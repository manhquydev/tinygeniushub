import { getRedisClient } from "@/lib/redis-client";

const BLOG_CACHE_PREFIX = "blog:cache";

function buildCacheKey(key: string) {
  return `${BLOG_CACHE_PREFIX}:${key}`;
}

export async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const redis = getRedisClient();
    await redis.connect().catch(() => {});

    const cached = await redis.get(buildCacheKey(key));
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const fresh = await fetcher();
    await redis.set(buildCacheKey(key), JSON.stringify(fresh), "PX", ttlMs);
    return fresh;
  } catch {
    return fetcher();
  }
}

export async function invalidateBlogCache(pattern = "*"): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.connect().catch(() => {});

    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", buildCacheKey(pattern), "COUNT", "100");
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Ignore cache invalidation failures to keep write path resilient.
  }
}
