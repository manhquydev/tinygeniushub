import { z } from "zod";
import { normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { auth } from "@/lib/auth/better-auth";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(120),
});

const RESET_SUCCESS_MESSAGE = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.";
const RESET_INVALID_MESSAGE = "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";

export async function POST(request: Request) {
  let clientIp = "unknown";

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    clientIp = getRequestIp(request);
    const input = resetPasswordSchema.parse(await request.json());

    await auth.api.resetPassword({
      headers: request.headers,
      body: {
        token: input.token,
        newPassword: input.newPassword,
      },
    });

    logInfo("auth.reset_password.succeeded", {
      ip: clientIp,
    });

    return ok({ message: RESET_SUCCESS_MESSAGE });
  } catch (error) {
    const normalizedError = normalizeBetterAuthError(error);

    if (normalizedError instanceof DomainError && normalizedError.code === "AUTH_API_ERROR" && normalizedError.status === 400) {
      logWarn("auth.reset_password.failed", {
        reason: "invalid_or_expired_token",
        ip: clientIp,
      });

      return fail(RESET_INVALID_MESSAGE, 400, {
        code: "RESET_TOKEN_INVALID",
      });
    }

    return handleRouteError(normalizedError, {
      routeId: "auth.reset-password",
      ip: clientIp,
    });
  }
}
