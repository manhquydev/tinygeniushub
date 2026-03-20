import { hash, compare } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const PASSWORD_ROUNDS = 12;
const trustedOrigins = Array.from(new Set([env.BETTER_AUTH_URL, ...env.AUTH_TRUSTED_ORIGINS]));

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
