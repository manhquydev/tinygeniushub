"use server";

import { headers } from "next/headers";
import { adminAuth } from "@/lib/auth/admin-auth";
import { DomainError } from "@/modules/platform/errors";
import { normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { prisma } from "@/lib/db";

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
        const userExt = session?.user as any;
        if (userExt && !userExt.isActive) {
            await adminAuth.api.signOut({ headers: reqHeaders });
            return null;
        }

        return session;
    } catch (error) {
        return null;
    }
}

export async function requireAdminSession(allowedRoles?: string[]) {
    const session = await getAdminSession();
    if (!session?.user) {
        throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userExt = session.user as any;
        if (!allowedRoles.includes(userExt.role)) {
            throw new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
        }
    }

    return session;
}
