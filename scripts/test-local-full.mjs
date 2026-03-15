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
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "demo.admin@cungcontuhoc.io.vn";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!";

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

  await runCommand("pnpm build");

  const e2eEnv = {
    ...process.env,
    E2E_SKIP_BUILD: "1",
    E2E_ADMIN_EMAIL: adminEmail,
    E2E_ADMIN_PASSWORD: adminPassword,
    RATE_LIMIT_TRUST_PROXY: process.env.RATE_LIMIT_TRUST_PROXY ?? "true",
  };

  await runCommand("pnpm test:e2e", { env: e2eEnv });
  await runCommand("pnpm test:e2e:p0", { env: e2eEnv });
  await runCommand("pnpm test:e2e:video-layout", { env: e2eEnv });
  await runCommand("pnpm test:e2e:auth-timing", { env: e2eEnv });
  await runCommand("pnpm test:e2e:auth-session", { env: e2eEnv });
  if (process.env.E2E_RUN_AUTH_SESSION_HTTPS === "1") {
    await runCommand("pnpm test:e2e:auth-session:https", { env: e2eEnv });
  }
  await runCommand("pnpm test:e2e:integrity", { env: e2eEnv });
  await runCommand("pnpm test:e2e:full", { env: e2eEnv });
  await runCommand("pnpm test:e2e:security", { env: e2eEnv });

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
