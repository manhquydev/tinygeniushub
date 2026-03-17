import type { RedisOptions } from "ioredis";

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function createRedisConnectionOptions(redisUrl: string): RedisOptions {
  const parsed = new URL(redisUrl);
  const protocol = parsed.protocol.toLowerCase();

  if (protocol !== "redis:" && protocol !== "rediss:") {
    throw new Error(`Unsupported Redis URL protocol: ${parsed.protocol}`);
  }

  const options: RedisOptions = {};
  const hasHost = parsed.hostname.length > 0;

  if (hasHost) {
    options.host = parsed.hostname;
    options.port = parsePositiveInt(parsed.port) ?? 6379;
  }

  if (parsed.username) {
    options.username = decodeURIComponent(parsed.username);
  }

  if (parsed.password) {
    options.password = decodeURIComponent(parsed.password);
  }

  const pathSegment = parsed.pathname.replace(/^\/+/, "");
  if (!hasHost && parsed.pathname.length > 0 && pathSegment.length > 0 && !/^\d+$/.test(pathSegment)) {
    options.path = decodeURIComponent(parsed.pathname);
  } else if (pathSegment.length > 0) {
    const db = parsePositiveInt(pathSegment);
    if (db !== null) {
      options.db = db;
    }
  }

  const family = parsePositiveInt(parsed.searchParams.get("family"));
  if (family === 4 || family === 6) {
    options.family = family;
  }

  if (protocol === "rediss:") {
    options.tls = {};
  }

  return options;
}
