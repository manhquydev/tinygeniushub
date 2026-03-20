import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { logError } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import Redis from "ioredis";

type DependencyCheck = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

type ReadinessSnapshot = {
  database: DependencyCheck;
  redis: DependencyCheck;
  isReady: boolean;
  cachedAtMs: number;
};

let readinessSnapshot: ReadinessSnapshot | null = null;

async function checkDatabase(): Promise<DependencyCheck> {
  const startedAt = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

async function checkRedis(): Promise<DependencyCheck> {
  const startedAt = performance.now();
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  // We capture connectivity failures through try/catch below.
  client.on("error", () => {});

  try {
    await client.connect();
    const result = await client.ping();

    if (result !== "PONG") {
      throw new Error(`Unexpected ping response: ${result}`);
    }

    return {
      ok: true,
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Number((performance.now() - startedAt).toFixed(2)),
      error: error instanceof Error ? error.message : "Unknown redis error",
    };
  } finally {
    client.disconnect();
  }
}

export async function GET(request: Request) {
  try {
    await assertRequestAllowedBySecurityControls(request, {
      enforceReadinessAllowlist: true,
    });

    const ipPolicy = await getRateLimitPolicy("health.ready.ip");
    const ip = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `health:ready:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
    });

    if (!rateLimit.allowed) {
      return fail("Too many readiness probe requests", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const nowMs = Date.now();
    const cacheWindowMs = env.HEALTH_READY_CACHE_MS;
    const canUseCache =
      cacheWindowMs > 0 &&
      readinessSnapshot !== null &&
      nowMs - readinessSnapshot.cachedAtMs <= cacheWindowMs;

    let snapshot: ReadinessSnapshot;
    if (canUseCache && readinessSnapshot) {
      snapshot = readinessSnapshot;
    } else {
      const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
      snapshot = {
        database,
        redis,
        isReady: database.ok && redis.ok,
        cachedAtMs: Date.now(),
      };
      readinessSnapshot = snapshot;
    }

    const checks = {
      database: snapshot.database,
      redis: snapshot.redis,
      cacheAgeMs: Math.max(0, nowMs - snapshot.cachedAtMs),
    };
    const isReady = snapshot.isReady;

    if (!isReady) {
      logError("health.readiness_failed", {
        checks,
      });

      return fail(
        "Service dependencies not ready",
        503,
        env.HEALTH_EXPOSE_DETAILS
          ? {
              checks,
            }
          : undefined,
      );
    }

    return ok({
      status: "ready",
      service: env.OBSERVABILITY_SERVICE_NAME,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      ...(env.HEALTH_EXPOSE_DETAILS ? { checks } : {}),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
