import { cookies } from "next/headers";
import { ZodError } from "zod";
import { defaultLocale, localeCookieName, resolveAppLocale, type AppLocale } from "@/i18n/locales";
import { translate, type TranslationValues } from "@/i18n/translator";
import { env } from "@/lib/env";
import { fail } from "@/lib/http";
import { logError, logWarn } from "@/lib/observability/logger";
import { DomainError } from "@/modules/platform/errors";

function isInvalidJsonSyntaxError(error: unknown) {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("json") || message.includes("unexpected token");
}

export async function resolveRequestLocale(): Promise<AppLocale> {
  try {
    const cookieStore = await cookies();
    return resolveAppLocale(cookieStore.get(localeCookieName)?.value);
  } catch {
    return defaultLocale;
  }
}

export async function translateError(key: string, values?: TranslationValues): Promise<string> {
  return translate(key, values, await resolveRequestLocale());
}

export async function handleRouteError(error: unknown, context?: Record<string, unknown>) {
  if (isInvalidJsonSyntaxError(error)) {
    logWarn("route.invalid_json", {
      message: (error as SyntaxError).message,
      context,
    });

    return fail(await translateError("errors.invalidJson"), 400);
  }

  if (error instanceof ZodError) {
    logWarn("route.validation_failed", {
      issues: error.issues,
      context,
    });

    return fail(await translateError("errors.invalidPayload"), 400, {
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
      ...(env.NODE_ENV !== "production" && { stack: error.stack }),
      context,
    });

    return fail(await translateError("errors.unknown"), 500);
  }

  logError("route.unknown_error", {
    error,
    context,
  });

  return fail(await translateError("errors.unknown"), 500);
}
