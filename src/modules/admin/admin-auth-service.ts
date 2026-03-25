"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { DomainError } from "@/modules/platform/errors";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const COOKIE_NAME = "ccth_admin_session";

type AdminSessionPayload = {
    sub: string;
    email: string;
    role: string;
    displayName: string;
    isActive: boolean;
};

type AdminSession = {
    user: {
        id: string;
        email: string;
        role: string;
        displayName: string;
        isActive: boolean;
    };
};

export async function getAdminSession(): Promise<AdminSession | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;

        const secret = new TextEncoder().encode(env.ADMIN_AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] }) as { payload: AdminSessionPayload };

        if (!payload.sub || !payload.isActive) return null;

        // Verify admin still exists and is active; use DB role (not JWT) to prevent stale role access
        const admin = await prisma.adminAccount.findUnique({
            where: { id: payload.sub },
            select: { id: true, isActive: true, role: true },
        });
        if (!admin || !admin.isActive) return null;

        return {
            user: {
                id: payload.sub,
                email: payload.email,
                role: admin.role,
                displayName: payload.displayName,
                isActive: admin.isActive,
            },
        };
    } catch {
        return null;
    }
}

const VALID_ADMIN_ROLES = ["SUPER_ADMIN", "CONTENT_EDITOR", "SUPPORT_AGENT"] as const;

function isValidAdminRole(role: string) {
    return (VALID_ADMIN_ROLES as readonly string[]).includes(role);
}

export async function requireAdminSession(allowedRoles?: string[]) {
    const session = await getAdminSession();
    if (!session?.user) {
        throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (!isValidAdminRole(session.user.role)) {
        throw new DomainError("Forbidden: Invalid role", 403, "FORBIDDEN");
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(session.user.role)) {
            throw new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
        }
    }

    return session;
}
