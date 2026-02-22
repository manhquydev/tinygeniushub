import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

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

async function runBuild() {
  if (process.env.E2E_SKIP_BUILD === "1") {
    const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
    if (existsSync(buildIdPath)) {
      return;
    }
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

async function waitForReady(baseUrl, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // noop while server boots
    }

    await sleep(1_000);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function assertRoute(baseUrl, path, expectedStatus, expectedText) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== expectedStatus) {
    throw new Error(`Unexpected status for ${path}. Expected ${expectedStatus}, got ${response.status}`);
  }

  const text = await response.text();
  if (expectedText && !text.includes(expectedText)) {
    throw new Error(`Response for ${path} does not include expected text: ${expectedText}`);
  }
}

async function assertRouteStatusIn(baseUrl, path, expectedStatuses) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `Unexpected status for ${path}. Expected one of ${expectedStatuses.join(", ")}, got ${response.status}`,
    );
  }
}

async function assertUnauthorizedApi(baseUrl) {
  const response = await fetch(`${baseUrl}/api/lessons/today?childId=test-child`);
  if (response.status !== 401) {
    throw new Error(`Expected unauthorized status 401, received ${response.status}`);
  }

  const body = await response.json();
  if (body.ok !== false) {
    throw new Error("Expected api response shape { ok: false } for unauthorized request");
  }
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
  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);

  try {
    await waitForReady(baseUrl);

    await assertRoute(baseUrl, "/", 200, "Cùng Con Tự Học");
    await assertRoute(baseUrl, "/pricing", 200, "Bảng giá rõ ràng");
    await assertRoute(baseUrl, "/auth/login", 200, "Đăng nhập phụ huynh");
    await assertRoute(baseUrl, "/api/health", 200, "\"status\":\"ok\"");
    await assertRouteStatusIn(baseUrl, "/api/health/ready", [200, 503]);
    await assertUnauthorizedApi(baseUrl);

    console.log("E2E smoke checks passed");
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
