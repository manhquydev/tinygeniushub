import { spawn } from "node:child_process";

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn(command, {
            stdio: "inherit",
            shell: true,
            env: options.env ?? process.env,
          })
        : spawn(command, {
            stdio: "inherit",
            shell: true,
            env: options.env ?? process.env,
          });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`Command failed (${code}): ${command}`));
    });
  });
}

async function main() {
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "demo.admin@tinygeniushubvn.tech";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!";
  const adminAuthSecret =
    process.env.ADMIN_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? "local-admin-auth-secret-minimum-32-characters";
  const disableParentEmailVerification = process.env.E2E_DISABLE_PARENT_EMAIL_VERIFICATION === "1";
  process.env.ADMIN_AUTH_SECRET = adminAuthSecret;

  await runCommand("docker compose up -d");
  await runCommand("pnpm exec prisma migrate deploy");
  await runCommand("pnpm db:seed");
  await runCommand("pnpm db:seed", {
    env: {
      ...process.env,
      SEED_PARENT_EMAIL: adminEmail,
      SEED_PARENT_PASSWORD: adminPassword,
    },
  });
  await runCommand("pnpm tsx prisma/scripts/seed-admin.ts", {
    env: {
      ...process.env,
      ADMIN_EMAILS: adminEmail,
      ADMIN_SEED_PASSWORD: adminPassword,
    },
  });
  await runCommand("pnpm tsx prisma/scripts/import-three-courses-bootstrap.ts --publish");
  await runCommand(
    "node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); (async () => { const lessons = await prisma.lesson.findMany({ where: { trialEnabled: true }, select: { id: true }, orderBy: { id: 'asc' }, take: 12 }); if (lessons.length === 0) { throw new Error('No trial lessons available for E2E course bootstrap.'); } const course = await prisma.course.upsert({ where: { slug: 'abeka-k4' }, update: { title: 'Abeka K4', description: 'E2E bootstrap course for local full regression.', priceVnd: 300000, listPriceVnd: 300000, salePriceVnd: 0, durationDays: 365, isPublished: true }, create: { slug: 'abeka-k4', title: 'Abeka K4', description: 'E2E bootstrap course for local full regression.', priceVnd: 300000, listPriceVnd: 300000, salePriceVnd: 0, durationDays: 365, isPublished: true } }); await prisma.courseLesson.deleteMany({ where: { courseId: course.id } }); await prisma.courseLesson.createMany({ data: lessons.map((lesson, index) => ({ courseId: course.id, lessonId: lesson.id, orderNo: index + 1 })), skipDuplicates: true }); })().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma['$disconnect'](); });\"",
  );

  if (disableParentEmailVerification) {
    await runCommand(
      "node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); const controls = { ddosMode: 'normal', globalLimitMultiplier: 1, blockedIpCidrs: [], readinessAllowlistCidrs: [], parentEmailVerificationRequired: false, parentEmailVerificationTokenTtlMinutes: 15 }; prisma.adminSecuritySettings.upsert({ where: { id: 'default' }, update: { securityControls: controls, updatedByActorId: 'e2e-local-full' }, create: { id: 'default', rateLimitPolicies: {}, securityControls: controls, updatedByActorId: 'e2e-local-full' } }).then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });\"",
    );
  }

  await runCommand("pnpm build");

  const e2eEnv = {
    ...process.env,
    ADMIN_AUTH_SECRET: adminAuthSecret,
    E2E_SKIP_BUILD: "1",
    E2E_ADMIN_EMAIL: adminEmail,
    E2E_ADMIN_PASSWORD: adminPassword,
    E2E_PARENT_EMAIL: process.env.E2E_PARENT_EMAIL ?? adminEmail,
    E2E_PARENT_PASSWORD: process.env.E2E_PARENT_PASSWORD ?? adminPassword,
    RATE_LIMIT_TRUST_PROXY: process.env.RATE_LIMIT_TRUST_PROXY ?? "true",
    E2E_AUTH_TIMING_MEDIAN_DELTA_MAX_MS: process.env.E2E_AUTH_TIMING_MEDIAN_DELTA_MAX_MS ?? "220",
    E2E_AUTH_TIMING_P95_DELTA_MAX_MS: process.env.E2E_AUTH_TIMING_P95_DELTA_MAX_MS ?? "320",
  };

  await runCommand("pnpm test:e2e", { env: e2eEnv });
  await runCommand("pnpm test:e2e:auth-timing", { env: e2eEnv });
  await runCommand("pnpm test:e2e:p0", { env: e2eEnv });
  await runCommand("pnpm test:e2e:video-layout", { env: e2eEnv });
  await runCommand("pnpm test:e2e:auth-session", { env: e2eEnv });
  if (process.env.E2E_RUN_AUTH_SESSION_HTTPS === "1") {
    await runCommand("pnpm test:e2e:auth-session:https", { env: e2eEnv });
  }
  await runCommand("pnpm test:e2e:integrity", { env: e2eEnv });
  await runCommand("pnpm test:e2e:full", { env: e2eEnv });
  await runCommand("pnpm test:e2e:security", {
    env: {
      ...e2eEnv,
      COURSE_PAYMENT_PROVIDER: process.env.E2E_SECURITY_COURSE_PAYMENT_PROVIDER ?? "payos",
      ALLOW_PROD_MOCK_CHECKOUT_CALLBACK: "false",
      PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID ?? "e2e-payos-client-id",
      PAYOS_API_KEY: process.env.PAYOS_API_KEY ?? "e2e-payos-api-key",
      PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY ?? "e2e-payos-checksum-key",
    },
  });

  if (process.env.E2E_RUN_STAGING_PROVIDERS === "1") {
    await runCommand("pnpm test:e2e:staging-providers", {
      env: {
        ...e2eEnv,
        E2E_STAGING_ALLOW_MOCK: process.env.E2E_STAGING_ALLOW_MOCK ?? "1",
      },
    });
  }

  if (process.env.E2E_RUN_OBS_DRILLS === "1") {
    await runCommand("pnpm test:obs:drills", { env: e2eEnv });
  }

  console.log("Local full regression completed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
