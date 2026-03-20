import { hash, compare } from "bcryptjs";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const PASSWORD_ROUNDS = 12;
const trustedOrigins = Array.from(new Set([env.BETTER_AUTH_URL, ...env.AUTH_TRUSTED_ORIGINS]));

export const adminAuth = betterAuth({
    basePath: "/api/admin/auth",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET + "_admin", // Salt secret to isolate sessions
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    trustedOrigins,
    emailAndPassword: {
        enabled: true,
        disableSignUp: true, // Only super admins can create other admins
        autoSignIn: true,
        password: {
            hash: async (password) => hash(password, PASSWORD_ROUNDS),
            verify: async ({ hash: passwordHash, password }) => compare(password, passwordHash),
        },
    },
    user: {
        modelName: "adminAccount",
        additionalFields: {
            role: {
                type: "string",
            },
            displayName: {
                type: "string",
            },
            isActive: {
                type: "boolean",
            },
        },
    },
    session: {
        modelName: "authSession", // Uses generic session table, but cookies isolate it.
        expiresIn: 60 * 60 * 8, // Admin sessions expire quicker (8 hours)
    },
    advanced: {
        cookies: {
            session_token: {
                name: "ccth_admin_session", // Distinct cookie name for admins
            },
        },
    },
});
