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

        const secret = new TextEncoder().encode(env.BETTER_AUTH_SECRET + "_admin");
        const { payload } = await jwtVerify(token, secret) as { payload: AdminSessionPayload };

        if (!payload.sub || !payload.isActive) return null;

        // Verify admin still exists and is active
        const admin = await prisma.adminAccount.findUnique({
            where: { id: payload.sub },
            select: { id: true, isActive: true },
        });
        if (!admin || !admin.isActive) return null;

        return {
            user: {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
                displayName: payload.displayName,
                isActive: payload.isActive,
            },
        };
    } catch {
        return null;
    }
}

export async function requireAdminSession(allowedRoles?: string[]) {
    const session = await getAdminSession();
    if (!session?.user) {
        throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(session.user.role)) {
            throw new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
        }
    }

    return session;
}
