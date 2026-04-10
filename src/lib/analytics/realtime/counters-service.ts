import { redis } from "@/lib/redis";
import { logWarn } from "@/lib/observability/logger";

const ACTIVE_USERS_KEY = "analytics:active_users";
const ACTIVE_SESSIONS_KEY = "analytics:active_sessions";
const TTL_SECONDS = 300; // 5 minutes
const REDIS_COMMAND_TIMEOUT_MS = 1500;

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

async function runWithTimeout<T>(operation: Promise<T>, fallbackValue: T): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise: Promise<T> = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(fallbackValue), REDIS_COMMAND_TIMEOUT_MS);
  });
  const result = await Promise.race([operation, timeoutPromise]);
  if (timeoutId) clearTimeout(timeoutId);
  return result;
}

export async function trackUserActivity(userId: string, sessionId: string): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    pipeline.sadd(ACTIVE_USERS_KEY, userId);
    pipeline.sadd(ACTIVE_SESSIONS_KEY, sessionId);
    pipeline.expire(ACTIVE_USERS_KEY, TTL_SECONDS);
    pipeline.expire(ACTIVE_SESSIONS_KEY, TTL_SECONDS);
    await runWithTimeout(pipeline.exec(), null);
  } catch (error) {
    // Realtime counters are best-effort; never block user flow on redis outage.
    if (!isRedisUnavailableError(error)) {
      throw error;
    }
    logWarn("analytics.realtime.track_activity.degraded", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

async function safeScard(key: string): Promise<number> {
  try {
    const value = await runWithTimeout(redis.scard(key), 0);
    if (value === 0) {
      return 0;
    }
    return value;
  } catch (error) {
    if (isRedisUnavailableError(error)) {
      logWarn("analytics.realtime.read_counter.degraded", {
        key,
        message: error instanceof Error ? error.message : "unknown_error",
      });
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
