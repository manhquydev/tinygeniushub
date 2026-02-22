import { isIP } from "node:net";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import { getRedisClient } from "@/lib/redis-client";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
  reason?: "quota_exceeded" | "store_unavailable";
};

const store = new Map<string, RateLimitEntry>();

const RATE_LIMIT_LUA_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])

local current = redis.call("INCR", key)
if current == 1 then
  redis.call("PEXPIRE", key, window_ms)
end

local ttl = redis.call("PTTL", key)
if ttl < 0 then
  ttl = window_ms
end

if current > limit then
  return {0, 0, ttl}
end

return {1, limit - current, ttl}
`;

function enforceRateLimitInMemory(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const current = store.get(input.key);

  if (!current || current.resetAt <= now) {
    store.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });

    return { allowed: true, remaining: input.limit - 1 };
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(current.resetAt - now, 0),
      reason: "quota_exceeded",
    };
  }

  current.count += 1;
  store.set(input.key, current);

  return {
    allowed: true,
    remaining: Math.max(input.limit - current.count, 0),
  };
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

async function enforceRateLimitInRedis(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult | null> {
  if (env.NODE_ENV === "test") {
    return null;
  }

  const redisKey = `rate_limit:${input.key}`;

  try {
    const redis = getRedisClient();
    await redis.connect().catch(() => {});
    const rawResult = await redis.eval(
      RATE_LIMIT_LUA_SCRIPT,
      1,
      redisKey,
      String(input.limit),
      String(input.windowMs),
    );

    if (!Array.isArray(rawResult) || rawResult.length < 3) {
      return null;
    }

    const allowedFlag = toFiniteNumber(rawResult[0]);
    const remaining = toFiniteNumber(rawResult[1]);
    const retryAfterMs = toFiniteNumber(rawResult[2]);
    if (allowedFlag === null || remaining === null || retryAfterMs === null) {
      return null;
    }

    return {
      allowed: allowedFlag === 1,
      remaining: Math.max(remaining, 0),
      retryAfterMs: Math.max(retryAfterMs, 0),
      reason: allowedFlag === 1 ? undefined : "quota_exceeded",
    };
  } catch {
    return null;
  }
}

export async function enforceRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  storeFailureMode?: "fallback_in_memory" | "deny";
}): Promise<RateLimitResult> {
  const redisResult = await enforceRateLimitInRedis(input);
  if (redisResult) {
    return redisResult;
  }

  if (input.storeFailureMode === "deny") {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: input.windowMs,
      reason: "store_unavailable",
    };
  }

  return enforceRateLimitInMemory(input);
}

export function buildRateLimitIdentity(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24);
}

function normalizeIpCandidate(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // RFC 3986 host: "[ipv6]:port" or plain "ipv4:port"
  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    const end = trimmed.indexOf("]");
    return trimmed.slice(1, end);
  }

  if (trimmed.includes(":") && trimmed.includes(".")) {
    return trimmed.split(":", 2)[0];
  }

  return trimmed;
}

function extractIpFromHeader(raw: string | null) {
  if (!raw) {
    return null;
  }

  const normalized = normalizeIpCandidate(raw);
  if (!normalized || isIP(normalized) === 0) {
    return null;
  }

  return normalized;
}

function extractForwardedChain(raw: string | null) {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => extractIpFromHeader(item))
    .filter((item): item is string => Boolean(item));
}

export function getRequestIp(
  request: Request,
  options?: {
    trustProxy?: boolean;
    trustedProxyHops?: number;
  },
) {
  const trustProxy = options?.trustProxy ?? env.RATE_LIMIT_TRUST_PROXY;
  const trustedProxyHops = options?.trustedProxyHops ?? env.RATE_LIMIT_TRUSTED_HOPS;

  if (trustProxy) {
    const forwardedChain = extractForwardedChain(request.headers.get("x-forwarded-for"));
    if (forwardedChain.length > 0) {
      const index = Math.max(forwardedChain.length - trustedProxyHops - 1, 0);
      return forwardedChain[index];
    }
    const realIp = extractIpFromHeader(request.headers.get("x-real-ip"));
    if (realIp) {
      return realIp;
    }
  }

  return "unknown";
}
