import { NextResponse } from "next/server";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { logWarn } from "@/lib/observability/logger";
import { handleRouteError } from "@/lib/route-error";
import { consumeParentEmailVerificationToken } from "@/modules/identity/parent-email-verification-service";
import { enqueueLifecycleEmail } from "@/worker/queue";
import { LifecycleEmailType } from "@prisma/client";

function redirectToLoginWithVerifyState(requestUrl: string, state: string) {
  const target = new URL("/auth/login", resolveEmailPublicBaseUrl(requestUrl));
  target.searchParams.set("verify", state);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
    if (token.length === 0) {
      return redirectToLoginWithVerifyState(request.url, "missing");
    }

    const result = await consumeParentEmailVerificationToken(token);
    if (result.status === "verified") {
      enqueueLifecycleEmail(result.parentId, LifecycleEmailType.TRIAL_WELCOME).catch(() => {
        logWarn("auth.verify_email.lifecycle_email_enqueue_failed", {
          parentId: result.parentId,
        });
      });
      return redirectToLoginWithVerifyState(request.url, "success");
    }

    if (result.status === "expired") {
      return redirectToLoginWithVerifyState(request.url, "expired");
    }

    return redirectToLoginWithVerifyState(request.url, "invalid");
  } catch (error) {
    return handleRouteError(error, {
      routeId: "auth.verify_email",
    });
  }
}
