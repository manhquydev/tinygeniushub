"use server";

import { headers } from "next/headers";
import { adminAuth } from "@/lib/auth/admin-auth";
import { DomainError } from "@/modules/platform/errors";
import { prisma } from "@/lib/db";

type AdminSessionUserExt = {
    role?: string;
    isActive?: boolean;
};

function toAdminSessionUserExt(user: unknown): AdminSessionUserExt {
    if (!user || typeof user !== "object") {
        return {};
    }
    const value = user as Record<string, unknown>;
    return {
        role: typeof value.role === "string" ? value.role : undefined,
        isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    };
}

export async function getAdminSession() {
    const reqHeaders = await headers();
    try {
        const session = await adminAuth.api.getSession({
            headers: reqHeaders,
        });

        // Verify the session belongs to a real AdminAccount (guards against cross-table confusion)
        if (session?.user?.id) {
            const adminRecord = await prisma.adminAccount.findUnique({
                where: { id: session.user.id },
                select: { id: true, isActive: true },
            });
            if (!adminRecord) {
                await adminAuth.api.signOut({ headers: reqHeaders });
                return null;
            }
        }

        // Additional domain-level check to ensure the account is still active
        const userExt = toAdminSessionUserExt(session?.user);
        if (userExt.isActive === false) {
            await adminAuth.api.signOut({ headers: reqHeaders });
            return null;
        }

        return session;
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
        const userExt = toAdminSessionUserExt(session.user);
        if (!userExt.role || !allowedRoles.includes(userExt.role)) {
            throw new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
        }
    }

    return session;
}
