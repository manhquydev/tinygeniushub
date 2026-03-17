import Redis from "ioredis";
import { env } from "@/lib/env";
import { createRedisConnectionOptions } from "@/lib/redis-connection";

let redisClient: Redis | null = null;

export function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis({
    ...createRedisConnectionOptions(env.REDIS_URL),
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  redisClient.on("error", () => {});

  return redisClient;
}
