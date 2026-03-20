import { env } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const severity: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel) {
  return severity[level] >= severity[env.LOG_LEVEL];
}

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, sanitizeValue(nested)]),
    );
  }

  return value;
}

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: env.OBSERVABILITY_SERVICE_NAME,
    environment: env.NODE_ENV,
    message,
    metadata: metadata ? sanitizeValue(metadata) : undefined,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logDebug(message: string, metadata?: Record<string, unknown>) {
  write("debug", message, metadata);
}

export function logInfo(message: string, metadata?: Record<string, unknown>) {
  write("info", message, metadata);
}

export function logWarn(message: string, metadata?: Record<string, unknown>) {
  write("warn", message, metadata);
}

export function logError(message: string, metadata?: Record<string, unknown>) {
  write("error", message, metadata);
}
