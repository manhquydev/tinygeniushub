/**
 * Seed admin account for production.
 * Usage: pnpm tsx prisma/scripts/seed-admin.ts
 */
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "demo.admin@tinygeniushubvn.tech";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "CungConTuHoc@2026!";
const ADMIN_DISPLAY_NAME = "Admin";
const ADMIN_ROLE = "SUPER_ADMIN";

async function main() {
  const existingSuperAdmins = await prisma.adminAccount.findMany({
    where: { role: "SUPER_ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (existingSuperAdmins.length > 1) {
    const keeper = existingSuperAdmins[0];
    const demoteIds = existingSuperAdmins.slice(1).map((admin) => admin.id);
    await prisma.adminAccount.updateMany({
      where: {
        id: {
          in: demoteIds,
        },
      },
      data: {
        role: "SUPPORT_AGENT",
      },
    });

    console.log(
      `Enforced single SUPER_ADMIN. Kept: ${keeper.email}. Demoted ${demoteIds.length} account(s) to SUPPORT_AGENT.`,
    );
  }

  const existingSuperAdmin = await prisma.adminAccount.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true, email: true, role: true },
  });
  const existing = await prisma.adminAccount.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existingSuperAdmin && existingSuperAdmin.email !== ADMIN_EMAIL) {
    console.log(
      `SUPER_ADMIN already configured: ${existingSuperAdmin.email}. Skip creating another SUPER_ADMIN for ${ADMIN_EMAIL}.`,
    );
    if (existing) {
      console.log(`Existing account at target email remains role: ${existing.role}`);
    }
    return;
  }

  if (existing) {
    if (existing.role !== "SUPER_ADMIN") {
      const promoted = await prisma.adminAccount.update({
        where: { id: existing.id },
        data: {
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
      console.log(`Promoted existing account to SUPER_ADMIN: ${promoted.email}`);
      return;
    }

    console.log(`Admin account already exists: ${ADMIN_EMAIL} (role: ${existing.role})`);
    return;
  }

  const passwordHash = await hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.adminAccount.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      displayName: ADMIN_DISPLAY_NAME,
      role: ADMIN_ROLE,
      isActive: true,
    },
  });

  console.log(`Created admin account:`);
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Role: ${admin.role}`);
  console.log(`  ID: ${admin.id}`);
  console.log(`\nPassword: ${ADMIN_PASSWORD}`);
  console.log(`\n⚠️  Change the password after first login!`);
}

main()
  .catch((e) => {
    console.error("Failed to seed admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
