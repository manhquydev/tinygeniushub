import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { performance } from "node:perf_hooks";

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

function startServer(port) {
  if (process.platform === "win32") {
    return spawn(`pnpm start --port ${port}`, {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
  }

  return spawn("pnpm", ["start", "--port", String(port)], {
    stdio: "inherit",
    env: process.env,
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
      // no-op while booting
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

function getSessionCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }
  const match = setCookieHeader.match(/ccth_session=[^;]+/);
  return match ? match[0] : null;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function buildOverridesFromPolicies(policies) {
  return Object.fromEntries(
    policies.map((policy) => [
      policy.key,
      {
        limit: policy.currentLimit,
        windowMs: policy.currentWindowMs,
      },
    ]),
  );
}

async function requestJson(baseUrl, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const method = (options.method ?? "GET").toUpperCase();
  let body = undefined;
  const clientIp = process.env.E2E_CLIENT_IP;

  if (clientIp && !headers.has("x-real-ip")) {
    headers.set("x-real-ip", clientIp);
  }
  if (clientIp && !headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", clientIp);
  }
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
    redirect: options.redirect ?? "follow",
  });

  const json = await response.json().catch(() => null);
  return { response, json };
}

async function loginParent(baseUrl, payload) {
  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: payload,
  });
  assert(login.response.status === 200, `Login failed for ${payload.email}: status=${login.response.status}`);
  const cookie = getSessionCookie(login.response.headers.get("set-cookie"));
  assert(cookie, `Missing session cookie for ${payload.email}`);
  return cookie;
}

async function signupParent(baseUrl, payload) {
  const signup = await requestJson(baseUrl, "/api/auth/signup", {
    method: "POST",
    body: payload,
  });
  assert(signup.response.status === 200, `Signup failed for ${payload.email}: status=${signup.response.status}`);
  assert(signup.json?.ok === true, `Signup did not return ok=true for ${payload.email}`);
  const cookie = getSessionCookie(signup.response.headers.get("set-cookie"));
  assert(cookie, `Missing session cookie for ${payload.email}`);
  return cookie;
}

async function getAdminSecuritySettings(baseUrl, adminHeaders) {
  const settings = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
    method: "GET",
    headers: adminHeaders,
  });
  assert(settings.response.status === 200, `Admin security GET failed: status=${settings.response.status}`);
  assert(settings.json?.ok === true, "Admin security GET did not return ok=true");
  return {
    policies: settings.json?.data?.policies,
    controls: settings.json?.data?.controls,
  };
}

async function patchAdminSecuritySettings(baseUrl, adminHeaders, payload) {
  const patch = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
    method: "PATCH",
    headers: adminHeaders,
    body: payload,
  });
  assert(patch.response.status === 200, `Admin security PATCH failed: status=${patch.response.status}`);
  assert(patch.json?.ok === true, "Admin security PATCH did not return ok=true");
}

async function measureLoginFailure(baseUrl, email, password, ip) {
  const startedAt = performance.now();
  const result = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    headers: {
      "x-real-ip": ip,
    },
    body: {
      email,
      password,
    },
  });
  const endedAt = performance.now();
  return {
    status: result.response.status,
    durationMs: endedAt - startedAt,
    body: result.json,
  };
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.E2E_CLIENT_IP = process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;

  const sampleSize = Number(process.env.E2E_AUTH_TIMING_SAMPLES ?? 12);
  const minFailureMs = Number(process.env.E2E_AUTH_TIMING_MIN_FAILURE_MS ?? 220);
  const medianDeltaMaxMs = Number(process.env.E2E_AUTH_TIMING_MEDIAN_DELTA_MAX_MS ?? 120);
  const p95DeltaMaxMs = Number(process.env.E2E_AUTH_TIMING_P95_DELTA_MAX_MS ?? 180);

  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "demo.admin@cungcontuhoc.vn";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!";
  const timingParentEmail = process.env.E2E_AUTH_TIMING_EMAIL ?? `timing-${Date.now()}@example.com`;
  const timingParentPassword = process.env.E2E_AUTH_TIMING_PASSWORD ?? "TimingPass123!";
  process.env.ADMIN_EMAILS = adminEmail;

  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);

  let baselineSettings = null;
  let adminHeaders = null;

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(
      readiness.status === 200,
      `Auth timing e2e requires live dependencies. /api/health/ready returned ${readiness.status}.`,
    );

    await signupParent(baseUrl, {
      email: timingParentEmail,
      password: timingParentPassword,
      displayName: "Timing Parent",
    });

    const adminCookie = await loginParent(baseUrl, {
      email: adminEmail,
      password: adminPassword,
    });
    adminHeaders = { cookie: adminCookie };

    baselineSettings = await getAdminSecuritySettings(baseUrl, adminHeaders);
    const baselineOverrides = buildOverridesFromPolicies(baselineSettings.policies);
    const elevatedOverrides = {
      ...baselineOverrides,
      "auth.login.ip": {
        limit: Math.max(200, sampleSize * 8),
        windowMs: 60_000,
      },
      "auth.login.email": {
        limit: Math.max(200, sampleSize * 8),
        windowMs: 60_000,
      },
    };
    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E auth timing temporary high limits",
      overrides: elevatedOverrides,
      controls: baselineSettings.controls,
    });

    const unknownDurations = [];
    const wrongPasswordDurations = [];

    for (let i = 0; i < sampleSize; i += 1) {
      const unknownEmail = `unknown-${Date.now()}-${i}@example.com`;
      const unknownAttempt = await measureLoginFailure(
        baseUrl,
        unknownEmail,
        "WrongPass123!",
        `198.51.100.${80 + i}`,
      );
      assert(unknownAttempt.status === 401, `Unknown account login should be 401, got ${unknownAttempt.status}`);
      unknownDurations.push(unknownAttempt.durationMs);

      const wrongPassAttempt = await measureLoginFailure(
        baseUrl,
        timingParentEmail,
        "DefinitelyWrongPass123!",
        `198.51.100.${140 + i}`,
      );
      assert(
        wrongPassAttempt.status === 401,
        `Wrong-password login should be 401, got ${wrongPassAttempt.status}`,
      );
      wrongPasswordDurations.push(wrongPassAttempt.durationMs);
    }

    const unknownMedian = median(unknownDurations);
    const wrongMedian = median(wrongPasswordDurations);
    const unknownP95 = percentile(unknownDurations, 95);
    const wrongP95 = percentile(wrongPasswordDurations, 95);
    const medianDelta = Math.abs(unknownMedian - wrongMedian);
    const p95Delta = Math.abs(unknownP95 - wrongP95);
    const minUnknown = Math.min(...unknownDurations);
    const minWrong = Math.min(...wrongPasswordDurations);

    assert(minUnknown >= minFailureMs, `Unknown-account failure duration too low: ${minUnknown.toFixed(2)}ms`);
    assert(minWrong >= minFailureMs, `Wrong-password failure duration too low: ${minWrong.toFixed(2)}ms`);
    assert(
      medianDelta <= medianDeltaMaxMs,
      `Median timing delta too high: ${medianDelta.toFixed(2)}ms (max ${medianDeltaMaxMs}ms)`,
    );
    assert(
      p95Delta <= p95DeltaMaxMs,
      `P95 timing delta too high: ${p95Delta.toFixed(2)}ms (max ${p95DeltaMaxMs}ms)`,
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          sampleSize,
          thresholds: {
            minFailureMs,
            medianDeltaMaxMs,
            p95DeltaMaxMs,
          },
          unknownAccount: {
            min: Number(minUnknown.toFixed(2)),
            median: Number(unknownMedian.toFixed(2)),
            p95: Number(unknownP95.toFixed(2)),
          },
          wrongPassword: {
            min: Number(minWrong.toFixed(2)),
            median: Number(wrongMedian.toFixed(2)),
            p95: Number(wrongP95.toFixed(2)),
          },
          deltas: {
            median: Number(medianDelta.toFixed(2)),
            p95: Number(p95Delta.toFixed(2)),
          },
        },
        null,
        2,
      ),
    );
  } finally {
    if (baselineSettings && adminHeaders) {
      const baselineOverrides = buildOverridesFromPolicies(baselineSettings.policies);
      await patchAdminSecuritySettings(baseUrl, adminHeaders, {
        reason: "E2E auth timing rollback",
        overrides: baselineOverrides,
        controls: baselineSettings.controls,
      }).catch(() => {});
    }
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
