import { redis } from "@/lib/redis";

const ACTIVE_USERS_KEY = "analytics:active_users";
const ACTIVE_SESSIONS_KEY = "analytics:active_sessions";
const TTL_SECONDS = 300; // 5 minutes

function isRedisUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("enableofflinequeue") ||
    message.includes("stream isn't writeable") ||
    message.includes("connection is closed") ||
    message.includes("connect")
  );
}

export async function trackUserActivity(userId: string, sessionId: string): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    pipeline.sadd(ACTIVE_USERS_KEY, userId);
    pipeline.sadd(ACTIVE_SESSIONS_KEY, sessionId);
    pipeline.expire(ACTIVE_USERS_KEY, TTL_SECONDS);
    pipeline.expire(ACTIVE_SESSIONS_KEY, TTL_SECONDS);
    await pipeline.exec();
  } catch (error) {
    // Realtime counters are best-effort; never block user flow on redis outage.
    if (!isRedisUnavailableError(error)) {
      throw error;
    }
  }
}

async function safeScard(key: string): Promise<number> {
  try {
    return await redis.scard(key);
  } catch (error) {
    if (isRedisUnavailableError(error)) {
      return 0;
    }
    throw error;
  }
}

export async function getActiveUserCount(): Promise<number> {
  return safeScard(ACTIVE_USERS_KEY);
}

export async function getActiveSessionCount(): Promise<number> {
  return safeScard(ACTIVE_SESSIONS_KEY);
}
