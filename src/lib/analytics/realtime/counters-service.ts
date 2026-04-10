import { redis } from "@/lib/redis";

const ACTIVE_USERS_KEY = "analytics:active_users";
const ACTIVE_SESSIONS_KEY = "analytics:active_sessions";
const TTL_SECONDS = 300; // 5 minutes

export async function trackUserActivity(userId: string, sessionId: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.sadd(ACTIVE_USERS_KEY, userId);
  pipeline.sadd(ACTIVE_SESSIONS_KEY, sessionId);
  pipeline.expire(ACTIVE_USERS_KEY, TTL_SECONDS);
  pipeline.expire(ACTIVE_SESSIONS_KEY, TTL_SECONDS);
  await pipeline.exec();
}

export async function getActiveUserCount(): Promise<number> {
  return redis.scard(ACTIVE_USERS_KEY);
}

export async function getActiveSessionCount(): Promise<number> {
  return redis.scard(ACTIVE_SESSIONS_KEY);
}
