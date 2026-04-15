import { randomUUID } from "node:crypto";
import type { Redis } from "ioredis";
import { getRedisClient } from "@/lib/redis-client";

const AUDIT_EVENTS_KEY = "ops:jules:audit:events";
const AUDIT_METRICS_KEY = "ops:jules:audit:metrics";
const FAILED_CI_PRIORITY_LOCK_PREFIX = "ops:jules:failed-ci-priority";

const inMemoryEvents: JulesAuditEvent[] = [];
const inMemoryMetrics = new Map<string, number>();
const inMemoryLocks = new Map<string, number>();

export type JulesAuditOutcome = "created" | "skipped" | "blocked" | "error" | "updated";
export type JulesAuditTrigger = "failed_ci" | "issue_label" | "feedback" | "manual";

export type JulesAuditEvent = {
  id: string;
  timestamp: string;
  repo: string;
  trigger: JulesAuditTrigger;
  outcome: JulesAuditOutcome;
  sessionId?: string;
  sessionUrl?: string;
  detail?: Record<string, unknown>;
};

export type JulesMonitoringSnapshot = {
  metrics: Record<string, number>;
  events: JulesAuditEvent[];
};

function incrementInMemoryMetric(key: string, value: number) {
  const current = inMemoryMetrics.get(key) ?? 0;
  inMemoryMetrics.set(key, current + value);
}

async function withRedis<T>(action: (client: Redis) => Promise<T>): Promise<T | null> {
  try {
    const redis = getRedisClient();
    await redis.connect().catch(() => {});
    return await action(redis);
  } catch {
    return null;
  }
}

export async function recordJulesAuditEvent(
  input: Omit<JulesAuditEvent, "id" | "timestamp"> & { timestamp?: string },
  maxEvents = 300,
) {
  const event: JulesAuditEvent = {
    id: randomUUID(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    repo: input.repo,
    trigger: input.trigger,
    outcome: input.outcome,
    sessionId: input.sessionId,
    sessionUrl: input.sessionUrl,
    detail: input.detail,
  };

  inMemoryEvents.unshift(event);
  if (inMemoryEvents.length > maxEvents) {
    inMemoryEvents.length = maxEvents;
  }
  incrementInMemoryMetric("total", 1);
  incrementInMemoryMetric(`outcome:${event.outcome}`, 1);
  incrementInMemoryMetric(`trigger:${event.trigger}`, 1);

  await withRedis(async (redis) => {
    const tx = redis.multi();
    tx.lpush(AUDIT_EVENTS_KEY, JSON.stringify(event));
    tx.ltrim(AUDIT_EVENTS_KEY, 0, Math.max(maxEvents - 1, 0));
    tx.hincrby(AUDIT_METRICS_KEY, "total", 1);
    tx.hincrby(AUDIT_METRICS_KEY, `outcome:${event.outcome}`, 1);
    tx.hincrby(AUDIT_METRICS_KEY, `trigger:${event.trigger}`, 1);
    await tx.exec();
  });

  return event;
}

export async function setFailedCiPriorityLock(repo: string, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  inMemoryLocks.set(repo, expiresAt);

  await withRedis(async (redis) => {
    await redis.set(`${FAILED_CI_PRIORITY_LOCK_PREFIX}:${repo}`, String(expiresAt), "EX", ttlSeconds);
  });
}

export async function hasFailedCiPriorityLock(repo: string) {
  const inMemoryExpiry = inMemoryLocks.get(repo);
  if (typeof inMemoryExpiry === "number" && inMemoryExpiry > Date.now()) {
    return true;
  }

  if (typeof inMemoryExpiry === "number" && inMemoryExpiry <= Date.now()) {
    inMemoryLocks.delete(repo);
  }

  const redisResult = await withRedis(async (redis) =>
    redis.get(`${FAILED_CI_PRIORITY_LOCK_PREFIX}:${repo}`),
  );
  return typeof redisResult === "string" && redisResult.length > 0;
}

function readInMemorySnapshot(limit: number): JulesMonitoringSnapshot {
  return {
    metrics: Object.fromEntries(inMemoryMetrics.entries()),
    events: inMemoryEvents.slice(0, limit),
  };
}

export async function getJulesMonitoringSnapshot(limit = 50): Promise<JulesMonitoringSnapshot> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  const redisSnapshot = await withRedis(async (redis) => {
    const [rawMetrics, rawEvents] = await Promise.all([
      redis.hgetall(AUDIT_METRICS_KEY),
      redis.lrange(AUDIT_EVENTS_KEY, 0, normalizedLimit - 1),
    ]);

    const metrics = Object.fromEntries(
      Object.entries(rawMetrics).map(([key, value]) => [key, Number.parseInt(value, 10) || 0]),
    );
    const events = rawEvents
      .map((value) => {
        try {
          return JSON.parse(value) as JulesAuditEvent;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is JulesAuditEvent => Boolean(entry));

    return {
      metrics,
      events,
    };
  });

  if (redisSnapshot) {
    return redisSnapshot;
  }

  return readInMemorySnapshot(normalizedLimit);
}

