import { redis } from "@/lib/redis";

const HOURLY_EVENTS_KEY = "analytics:hourly_events";

export async function recordHourlyEvent(eventType: string): Promise<void> {
  const hour = new Date().toISOString().slice(0, 13); // "2026-04-01T10"
  const key = `${HOURLY_EVENTS_KEY}:${hour}`;
  await redis.hincrby(key, eventType, 1);
  await redis.expire(key, 86400); // 24 hours
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
    const stats = await redis.hgetall(key);
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
