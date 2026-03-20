import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

const THRESHOLD_MS = Number(process.env.PERF_P95_THRESHOLD_MS ?? 1200);

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Cannot resolve free port"));
        return;
      }

      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function runBuildIfNeeded() {
  const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
  if (existsSync(buildIdPath)) {
    return;
  }

  await new Promise((resolve, reject) => {
    const build =
      process.platform === "win32"
        ? spawn("pnpm build", { stdio: "inherit", shell: true })
        : spawn("pnpm", ["build"], { stdio: "inherit" });

    build.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Build failed with exit code ${code}`));
    });
  });
}

function startServer(port) {
  if (process.platform === "win32") {
    return spawn(`pnpm start --port ${port}`, {
      stdio: "inherit",
      shell: true,
    });
  }

  return spawn("pnpm", ["start", "--port", String(port)], {
    stdio: "inherit",
  });
}

async function waitForReady(baseUrl, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // noop
    }

    await sleep(1_000);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function benchmark(baseUrl, path, sampleSize = 8) {
  const durations = [];

  for (let index = 0; index < sampleSize; index += 1) {
    const start = performance.now();
    const response = await fetch(`${baseUrl}${path}`);
    const end = performance.now();

    if (!response.ok) {
      throw new Error(`Perf check failed for ${path} with status ${response.status}`);
    }

    durations.push(end - start);
  }

  durations.sort((a, b) => a - b);
  const p95Index = Math.ceil(durations.length * 0.95) - 1;
  const p95 = durations[Math.max(p95Index, 0)];

  return {
    path,
    p95,
    average: durations.reduce((sum, value) => sum + value, 0) / durations.length,
  };
}

async function stopServer(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    return;
  }

  child.kill("SIGTERM");
  await sleep(1_000);

  if (!child.killed && child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.CRON_SECRET = process.env.CRON_SECRET ?? "perf-cron-secret-please-change";
  await runBuildIfNeeded();

  const port = Number(process.env.PERF_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);

  try {
    await waitForReady(baseUrl);

    await fetch(`${baseUrl}/`);
    await fetch(`${baseUrl}/pricing`);

    const results = [
      await benchmark(baseUrl, "/"),
      await benchmark(baseUrl, "/pricing"),
    ];

    const reportDir = join(process.cwd(), "reports", "perf");
    mkdirSync(reportDir, { recursive: true });

    const report = {
      generatedAt: new Date().toISOString(),
      thresholdMs: THRESHOLD_MS,
      results,
    };

    const reportPath = join(reportDir, "latest.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log(JSON.stringify(report, null, 2));

    const exceeded = results.find((item) => item.p95 > THRESHOLD_MS);
    if (exceeded) {
      throw new Error(`Performance sanity failed: ${exceeded.path} p95 ${exceeded.p95.toFixed(2)}ms > ${THRESHOLD_MS}ms`);
    }
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
