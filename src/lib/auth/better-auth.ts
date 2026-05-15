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
  return localPart || "you";
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
        `Hello${userLabel},`,
        "",
        "We've received a request to reset your password for your TinyGenius Hub account.",
        "To continue, please visit the following link:",
        resetPasswordUrl,
        "",
        "If you did not request a password reset, you can ignore this email.",
        "For security reasons, links have a short expiration date.",
      ].join("\n");

      await enqueueTransactionalEmail({
        to: user.email,
        subject: "Reset TinyGenius Hub account password",
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
