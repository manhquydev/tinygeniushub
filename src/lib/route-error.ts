import { fail } from "@/lib/http";
import { logError, logWarn } from "@/lib/observability/logger";
import { DomainError } from "@/modules/platform/errors";
import { ZodError } from "zod";

export function handleRouteError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof ZodError) {
    logWarn("route.validation_failed", {
      issues: error.issues,
      context,
    });

    return fail("Invalid request payload", 400, {
      issues: error.issues,
    });
  }

  if (error instanceof DomainError) {
    logWarn("route.domain_error", {
      code: error.code,
      message: error.message,
      status: error.status,
      context,
    });

    return fail(error.message, error.status, {
      code: error.code,
    });
  }

  if (error instanceof Error) {
    logError("route.unhandled_error", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });

    return fail("Internal server error", 500);
  }

  logError("route.unknown_error", {
    error,
    context,
  });

  return fail("Unexpected error", 500);
}
