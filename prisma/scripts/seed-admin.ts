/**
 * Seed admin account for production.
 * Usage: pnpm tsx prisma/scripts/seed-admin.ts
 */
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "demo.admin@cungcontuhoc.vn";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "CungConTuHoc@2026!";
const ADMIN_DISPLAY_NAME = "Admin";
const ADMIN_ROLE = "SUPER_ADMIN";

async function main() {
  const existing = await prisma.adminAccount.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
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
