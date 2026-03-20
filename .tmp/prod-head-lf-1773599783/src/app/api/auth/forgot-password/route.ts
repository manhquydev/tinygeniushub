import { z } from "zod";
import { normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { auth } from "@/lib/auth/better-auth";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const SUCCESS_MESSAGE = "Nếu email tồn tại trong hệ thống, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu trong ít phút.";
const RESET_NOT_ENABLED_MESSAGE = "Chức năng quên mật khẩu đang được cấu hình. Vui lòng liên hệ hỗ trợ trong thời gian chờ cập nhật.";

export async function POST(request: Request) {
  let clientIp = "unknown";
  let emailIdentityHash: string | undefined;

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    clientIp = getRequestIp(request);
    const input = forgotPasswordSchema.parse(await request.json());
    emailIdentityHash = buildRateLimitIdentity(input.email);

    await auth.api.requestPasswordReset({
      headers: request.headers,
      body: {
        email: input.email,
        redirectTo: new URL("/auth/reset-password", env.BETTER_AUTH_URL).toString(),
      },
    });

    logInfo("auth.forgot_password.requested", {
      ip: clientIp,
      identityHash: emailIdentityHash,
    });

    return ok({ message: SUCCESS_MESSAGE });
  } catch (error) {
    const normalizedError = normalizeBetterAuthError(error);
    if (
      normalizedError instanceof DomainError &&
      normalizedError.code === "AUTH_API_ERROR" &&
      /reset password isn't enabled/i.test(normalizedError.message)
    ) {
      logWarn("auth.forgot_password.not_configured", {
        ip: clientIp,
        identityHash: emailIdentityHash,
      });

      return fail(RESET_NOT_ENABLED_MESSAGE, 503, {
        code: "PASSWORD_RESET_NOT_ENABLED",
      });
    }

    return handleRouteError(normalizedError, {
      routeId: "auth.forgot-password",
      ip: clientIp,
      identityHash: emailIdentityHash,
    });
  }
}
