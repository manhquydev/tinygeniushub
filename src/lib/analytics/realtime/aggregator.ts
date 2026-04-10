import { redis } from "@/lib/redis";
import { logWarn } from "@/lib/observability/logger";

const HOURLY_EVENTS_KEY = "analytics:hourly_events";
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

export async function recordHourlyEvent(eventType: string): Promise<void> {
  try {
    const hour = new Date().toISOString().slice(0, 13); // "2026-04-01T10"
    const key = `${HOURLY_EVENTS_KEY}:${hour}`;
    await runWithTimeout(redis.hincrby(key, eventType, 1), 0);
    await runWithTimeout(redis.expire(key, 86400), 0); // 24 hours
  } catch (error) {
    if (!isRedisUnavailableError(error)) {
      throw error;
    }
    logWarn("analytics.realtime.record_hourly_event.degraded", {
      eventType,
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export interface HourlyStats {
  hour: string;
  [key: string]: number | string;
}

export async function getHourlyStats(hours: number = 24): Promise<HourlyStats[]> {
  const results: HourlyStats[] = [];
  for (let i = 0; i < hours; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    const hour = date.toISOString().slice(0, 13);
    const key = `${HOURLY_EVENTS_KEY}:${hour}`;
    let stats: Record<string, string> = {};
    try {
      stats = await runWithTimeout(redis.hgetall(key), {});
    } catch (error) {
      if (!isRedisUnavailableError(error)) {
        throw error;
      }
      logWarn("analytics.realtime.get_hourly_stats.degraded", {
        key,
        message: error instanceof Error ? error.message : "unknown_error",
      });
    }
    const numericStats: Record<string, number> = {};
    for (const [k, value] of Object.entries(stats)) {
      numericStats[k] = Number.parseInt(value, 10) || 0;
    }
    results.push({
      hour: date.toISOString(),
      ...numericStats,
    });
  }
  return results.reverse();
}
