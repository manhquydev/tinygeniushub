import { ok } from "@/lib/http";
import { env } from "@/lib/env";

export async function GET() {
  return ok({
    status: "ok",
    service: env.OBSERVABILITY_SERVICE_NAME,
    environment: env.NODE_ENV,
    version: env.APP_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
