import { hash, compare } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { enqueueTransactionalEmail } from "@/worker/queue";

const PASSWORD_ROUNDS = 12;
const trustedOrigins = Array.from(new Set([env.BETTER_AUTH_URL, ...env.AUTH_TRUSTED_ORIGINS]));

function resolveUserLabel(name: string | null | undefined, email: string) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }
  const [localPart] = email.split("@");
  return localPart || "bạn";
}

function sanitizeUrlForEmail(rawUrl: string) {
  return rawUrl.replace(/\u00ad/g, "").replace(/%C2%AD/gi, "");
}

function resolveResetPasswordPageUrl(rawUrl: string) {
  const fallbackUrl = new URL("/auth/reset-password", env.BETTER_AUTH_URL);

  try {
    const parsedUrl = new URL(sanitizeUrlForEmail(rawUrl));
    const tokenFromQuery = parsedUrl.searchParams.get("token");
    const tokenFromPath = parsedUrl.pathname.split("/").filter(Boolean).at(-1);
    const token = (tokenFromQuery ?? tokenFromPath ?? "").trim().replace(/\u00ad/g, "");

    if (!token || token.toLowerCase() === "reset-password") {
      return fallbackUrl.toString();
    }

    fallbackUrl.searchParams.set("token", token);
    return fallbackUrl.toString();
  } catch {
    return fallbackUrl.toString();
  }
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      const resetPasswordUrl = resolveResetPasswordPageUrl(url);
      const userLabel = resolveUserLabel(user.name, user.email);
      const text = [
        `Xin chào ${userLabel},`,
        "",
        "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản TinyGenius Hub của bạn.",
        "Để tiếp tục, vui lòng truy cập liên kết sau:",
        resetPasswordUrl,
        "",
        "Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.",
        "Vì lý do bảo mật, liên kết có thời hạn sử dụng ngắn.",
      ].join("\n");

      await enqueueTransactionalEmail({
        to: user.email,
        subject: "Đặt lại mật khẩu tài khoản TinyGenius Hub",
        text,
        tags: [{ name: "feature", value: "forgot_password" }],
      });
    },
    password: {
      hash: async (password) => hash(password, PASSWORD_ROUNDS),
      verify: async ({ hash: passwordHash, password }) => compare(password, passwordHash),
    },
  },
  user: {
    additionalFields: {
      parentId: {
        type: "string",
        required: false,
      },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    cookies: {
      session_token: {
        name: "ccth_session",
      },
    },
  },
});
