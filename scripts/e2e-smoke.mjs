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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSessionCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/(?:__Secure-|__Host-)?ccth_session=[^;]+/);
  return match ? match[0] : null;
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
    redirect: options.redirect ?? "follow",
  });
  const json = await response.json().catch(() => null);

  return {
    response,
    json,
  };
}

async function signupParent(baseUrl, email, password) {
  const signup = await requestJson(baseUrl, "/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password,
      displayName: "E2E Parent",
      legalAccepted: true,
    },
  });

  assert(signup.response.status === 200, `Parent signup failed: status=${signup.response.status}`);
  assert(signup.json?.ok === true, "Parent signup response must include ok=true");

  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });
  assert(login.response.status === 200, `Parent login after signup failed: status=${login.response.status}`);
  assert(login.json?.ok === true, "Parent login after signup response must include ok=true");

  const sessionCookie = getSessionCookie(login.response.headers.get("set-cookie"));
  assert(sessionCookie, "Parent login after signup missing ccth_session cookie");

  return sessionCookie;
}

async function loginParent(baseUrl) {
  const seededEmail = "demo.parent@cungcontuhoc.io.vn";
  const configuredEmail = process.env.E2E_PARENT_EMAIL;
  const configuredPassword = process.env.E2E_PARENT_PASSWORD;
  const email = configuredEmail ?? seededEmail;
  const password = configuredPassword ?? "DemoPass123!";
  const credentialsAreConfigured = Boolean(configuredEmail || configuredPassword);

  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });

  if (login.response.status === 200 && login.json?.ok === true) {
    const sessionCookie = getSessionCookie(login.response.headers.get("set-cookie"));
    assert(sessionCookie, "Parent login response missing ccth_session cookie");
    return sessionCookie;
  }

  if (credentialsAreConfigured) {
    assert(login.response.status === 200, `Parent login failed: status=${login.response.status}`);
    assert(login.json?.ok === true, "Parent login response must include ok=true");
  }

  const fallbackEmail = `e2e.parent+${Date.now()}@example.com`;
  return signupParent(baseUrl, fallbackEmail, password);
}

async function runCaregiverInviteSmoke(baseUrl) {
  const readiness = await fetch(`${baseUrl}/api/health/ready`);
  if (readiness.status !== 200) {
    console.log(`Caregiver smoke skipped: /api/health/ready=${readiness.status}`);
    return;
  }

  const sessionCookie = await loginParent(baseUrl);

  const initialList = await requestJson(baseUrl, "/api/caregivers", {
    method: "GET",
    headers: {
      cookie: sessionCookie,
    },
  });
  assert(initialList.response.status === 200, `Initial caregiver list failed: status=${initialList.response.status}`);
  assert(initialList.json?.ok === true, "Initial caregiver list must return ok=true");

  let caregiverLimit = Number(initialList.json?.data?.caregiverLimit ?? 0);
  let usedSlots = Number(initialList.json?.data?.usedSlots ?? 0);
  let caregiverRows = Array.isArray(initialList.json?.data?.caregivers) ? initialList.json.data.caregivers : [];

  if (usedSlots >= caregiverLimit) {
    const pendingInvites = caregiverRows.filter((row) => row.status === "pending");

    for (const pendingInvite of pendingInvites) {
      const revoke = await requestJson(baseUrl, `/api/caregivers/${encodeURIComponent(pendingInvite.id)}`, {
        method: "DELETE",
        headers: {
          cookie: sessionCookie,
        },
      });
      assert(revoke.response.status === 200, `Caregiver revoke failed: status=${revoke.response.status}`);
      assert(revoke.json?.ok === true, "Caregiver revoke must return ok=true");

      caregiverLimit = Number(revoke.json?.data?.caregiverLimit ?? caregiverLimit);
      usedSlots = Number(revoke.json?.data?.usedSlots ?? usedSlots);
      caregiverRows = Array.isArray(revoke.json?.data?.caregivers) ? revoke.json.data.caregivers : caregiverRows;

      if (usedSlots < caregiverLimit) {
        break;
      }
    }
  }

  assert(usedSlots < caregiverLimit, "No caregiver slot available for invite smoke test");
  const inviteEmail = `test.caregiver+${Date.now()}@example.com`;

  const invite = await requestJson(baseUrl, "/api/caregivers/invite", {
    method: "POST",
    headers: {
      cookie: sessionCookie,
    },
    body: {
      email: inviteEmail,
    },
  });

  assert(invite.response.status === 201, `Caregiver invite failed: status=${invite.response.status}`);
  assert(invite.json?.ok === true, "Caregiver invite must return ok=true");
  const inviteId = invite.json?.data?.inviteId ?? invite.json?.data?.invite?.id;
  const inviteToken = invite.json?.data?.token;
  assert(typeof inviteId === "string" && inviteId.length > 0, "Caregiver invite missing inviteId");
  assert(typeof inviteToken === "string" && inviteToken.length > 0, "Caregiver invite missing token");

  const caregivers = await requestJson(baseUrl, "/api/caregivers", {
    method: "GET",
    headers: {
      cookie: sessionCookie,
    },
  });

  assert(caregivers.response.status === 200, `Caregiver list failed: status=${caregivers.response.status}`);
  assert(caregivers.json?.ok === true, "Caregiver list must return ok=true");
  const updatedRows = Array.isArray(caregivers.json?.data?.caregivers) ? caregivers.json.data.caregivers : [];
  const createdInvite = updatedRows.find((row) => row.email === inviteEmail);
  assert(Boolean(createdInvite), "Invited caregiver email not found in /api/caregivers response");

  console.log(`Caregiver smoke passed: inviteId=${inviteId}`);
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
  process.env.CRON_SECRET = process.env.CRON_SECRET ?? "e2e-cron-secret-please-change";
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
    await runCaregiverInviteSmoke(baseUrl);

    console.log("E2E smoke checks passed");
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
