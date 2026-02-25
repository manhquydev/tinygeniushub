"use server";

import { prisma } from "@/lib/db";
import { AdminRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminSession } from "./admin-auth-service";
import { adminAuth } from "@/lib/auth/admin-auth";

export const adminAccountCreateSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1).max(50),
    role: z.nativeEnum(AdminRole),
});

export const adminAccountUpdateSchema = z.object({
    id: z.string(),
    displayName: z.string().min(1).max(50).optional(),
    role: z.nativeEnum(AdminRole).optional(),
    isActive: z.boolean().optional(),
});

export async function listAdminStaff() {
    await requireAdminSession(["SUPER_ADMIN"]);

    return prisma.adminAccount.findMany({
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
        }
    });
}

export async function createAdminStaff(input: unknown) {
    const session = await requireAdminSession(["SUPER_ADMIN"]);
    const payload = adminAccountCreateSchema.parse(input);

    // Hash password using better-auth api directly
    const hashedPassword = await adminAuth.options.emailAndPassword?.password?.hash?.(payload.password);
    if (!hashedPassword) {
        throw new Error("Failed to hash password");
    }

    const newAdmin = await prisma.adminAccount.create({
        data: {
            email: payload.email,
            passwordHash: hashedPassword,
            displayName: payload.displayName,
            role: payload.role,
            isActive: true,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
        }
    });

    await prisma.adminActionLog.create({
        data: {
            adminEmail: session.user.email,
            action: "CREATE_STAFF_ACCOUNT",
            target: newAdmin.email,
            detail: { role: payload.role } as Prisma.InputJsonValue,
        }
    });

    return newAdmin;
}

export async function updateAdminStaff(input: unknown) {
    const session = await requireAdminSession(["SUPER_ADMIN"]);
    const payload = adminAccountUpdateSchema.parse(input);

    // Prevent self-deactivation or self-demotion
    const isSelf = session.user.id === payload.id;
    const isDemoting = payload.role !== undefined && payload.role !== "SUPER_ADMIN";
    const isDeactivating = payload.isActive === false;
    if (isSelf && (isDemoting || isDeactivating)) {
        throw new Error("Cannot demote or deactivate your own SUPER_ADMIN account.");
    }

    const updatedAdmin = await prisma.adminAccount.update({
        where: { id: payload.id },
        data: {
            displayName: payload.displayName,
            role: payload.role,
            isActive: payload.isActive,
        },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
        }
    });

    await prisma.adminActionLog.create({
        data: {
            adminEmail: session.user.email,
            action: "UPDATE_STAFF_ACCOUNT",
            target: updatedAdmin.email,
            detail: {
                updatedFields: Object.keys(payload).filter(k => k !== 'id')
            } as Prisma.InputJsonValue,
        }
    });

    return updatedAdmin;
}
