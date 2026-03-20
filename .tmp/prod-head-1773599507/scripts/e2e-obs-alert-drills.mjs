import { randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

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
        ? spawn("pnpm build", { stdio: "inherit", shell: true, env: process.env })
        : spawn("pnpm", ["build"], { stdio: "inherit", env: process.env });

    build.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Build failed with exit code ${code}`));
    });
  });
}

function startServer(port, logBuffer) {
  const child =
    process.platform === "win32"
      ? spawn(`pnpm start --port ${port}`, {
          stdio: ["ignore", "pipe", "pipe"],
          shell: true,
          env: process.env,
        })
      : spawn("pnpm", ["start", "--port", String(port)], {
          stdio: ["ignore", "pipe", "pipe"],
          env: process.env,
        });

  const collect = (chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    logBuffer.push(...lines);
  };

  child.stdout?.on("data", collect);
  child.stderr?.on("data", collect);
  return child;
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
      // no-op while server boots
    }
    await sleep(1_000);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(baseUrl, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const method = (options.method ?? "GET").toUpperCase();
  let body = undefined;

  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !headers.has("origin")) {
    headers.set("origin", baseUrl);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body,
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

function parseStructuredLogs(logLines) {
  return logLines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
        return null;
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    })
    .filter((entry) => entry && typeof entry.message === "string");
}

function hasMessage(entries, message) {
  return entries.some((entry) => entry.message === message);
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.E2E_CLIENT_IP =
    process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;

  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const logs = [];
  const server = startServer(port, logs);

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(readiness.status === 200, `OBS drills require live dependencies. /api/health/ready=${readiness.status}`);

    const parentEmail = `obs-drill-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const parentPassword = "ObsDrillPass123!";

    const signup = await requestJson(baseUrl, "/api/auth/signup", {
      method: "POST",
      body: {
        email: parentEmail,
        password: parentPassword,
        displayName: "OBS Drill Parent",
      },
    });
    assert(signup.response.status === 200, `Signup for obs drills failed: status=${signup.response.status}`);

    const authFailure = await requestJson(baseUrl, "/api/auth/login", {
      method: "POST",
      body: {
        email: parentEmail,
        password: "WrongPass999!",
      },
    });
    assert(
      authFailure.response.status === 401 || authFailure.response.status === 429,
      `Expected auth failure status 401/429, got ${authFailure.response.status}`,
    );

    const invalidWebhook = await requestJson(baseUrl, "/api/billing/webhooks/mock", {
      method: "POST",
      headers: {
        "x-provider-signature": "invalid-signature",
      },
      body: {
        provider: "mock_gateway",
        eventId: `evt-${randomUUID().slice(0, 8)}`,
      },
    });
    assert(invalidWebhook.response.status === 401, `Invalid webhook signature should return 401, got ${invalidWebhook.response.status}`);

    const reportUnauthorized = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
    });
    assert(reportUnauthorized.response.status === 401, `Unauthorized report send-email should return 401, got ${reportUnauthorized.response.status}`);

    await sleep(500);
    const structuredLogs = parseStructuredLogs(logs);

    const authSignalEmitted =
      hasMessage(structuredLogs, "auth.login.failed") || hasMessage(structuredLogs, "auth.login.rate_limited");
    const webhookSignalEmitted = hasMessage(structuredLogs, "billing.webhook.mock.invalid_signature");
    const reportSignalEmitted = hasMessage(structuredLogs, "reports.send_email.unauthorized");

    assert(authSignalEmitted, "Missing auth failure/rate-limit structured log signal");
    assert(webhookSignalEmitted, "Missing webhook invalid-signature structured log signal");
    assert(reportSignalEmitted, "Missing report unauthorized structured log signal");

    console.log(
      JSON.stringify(
        {
          ok: true,
          parentEmail,
          checks: {
            authFailureSignal: authSignalEmitted,
            webhookFailureSignal: webhookSignalEmitted,
            reportFailureSignal: reportSignalEmitted,
          },
          observedMessages: Array.from(new Set(structuredLogs.map((entry) => entry.message))).sort(),
        },
        null,
        2,
      ),
    );
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
