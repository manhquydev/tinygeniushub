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

function extractSessionCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/(?:__Secure-|__Host-)?(?:__Secure-|__Host-)?ccth_session=[^;]+/);
  return match ? match[0] : null;
}

function assertSessionCookieHardening(setCookieHeader, context, options = {}) {
  assert(Boolean(setCookieHeader), `${context}: missing set-cookie header`);
  const normalized = String(setCookieHeader).toLowerCase();
  assert(normalized.includes("httponly"), `${context}: missing HttpOnly flag`);
  assert(normalized.includes("path=/"), `${context}: missing Path=/ attribute`);
  assert(normalized.includes("samesite"), `${context}: missing SameSite attribute`);
  if (options.requireSecure) {
    assert(normalized.includes("secure"), `${context}: missing Secure flag in HTTPS mode`);
  }
}

async function requestJson(baseUrl, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const method = (options.method ?? "GET").toUpperCase();
  let body = undefined;
  const requestOrigin = process.env.E2E_REQUEST_ORIGIN ?? baseUrl;
  let requestOriginUrl = null;
  try {
    requestOriginUrl = new URL(requestOrigin);
  } catch {
    requestOriginUrl = null;
  }
  const clientIp = process.env.E2E_CLIENT_IP;

  if (clientIp) {
    const explicitRealIp = headers.get("x-real-ip");
    const explicitForwardedFor = headers.get("x-forwarded-for");

    if (!explicitRealIp && !explicitForwardedFor) {
      headers.set("x-real-ip", clientIp);
      headers.set("x-forwarded-for", clientIp);
    } else if (explicitRealIp && !explicitForwardedFor) {
      headers.set("x-forwarded-for", explicitRealIp);
    } else if (!explicitRealIp && explicitForwardedFor) {
      headers.set("x-real-ip", explicitForwardedFor.split(",")[0].trim());
    }
  }

  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!headers.has("origin")) {
      headers.set("origin", requestOrigin);
    }

    if (requestOriginUrl?.protocol === "https:") {
      if (!headers.has("x-forwarded-proto")) {
        headers.set("x-forwarded-proto", "https");
      }
      if (!headers.has("x-forwarded-host")) {
        headers.set("x-forwarded-host", requestOriginUrl.host);
      }
    }
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

async function signupParent(baseUrl, payload) {
  const signup = await requestJson(baseUrl, "/api/auth/signup", {
    method: "POST",
    body: payload,
  });

  assert(signup.response.status === 200, `Signup failed: status=${signup.response.status}`);
  assert(signup.json?.ok === true, "Signup did not return ok=true");

  const cookie = extractSessionCookie(signup.response.headers.get("set-cookie"));
  if (cookie) {
    return {
      cookie,
      setCookieHeader: signup.response.headers.get("set-cookie"),
      source: "signup",
    };
  }

  const loginFallback = await loginParent(baseUrl, payload);
  return {
    ...loginFallback,
    source: "login-fallback",
  };
}

async function loginParent(baseUrl, payload) {
  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: payload,
  });

  assert(login.response.status === 200, `Login failed: status=${login.response.status}`);
  assert(login.json?.ok === true, "Login did not return ok=true");

  const cookie = extractSessionCookie(login.response.headers.get("set-cookie"));
  assert(cookie, "Login response missing session cookie");
  return {
    cookie,
    setCookieHeader: login.response.headers.get("set-cookie"),
  };
}

async function logoutParent(baseUrl, cookie) {
  const logout = await requestJson(baseUrl, "/api/auth/logout", {
    method: "POST",
    headers: {
      cookie,
    },
  });

  assert(logout.response.status === 200, `Logout failed: status=${logout.response.status}`);
  assert(logout.json?.ok === true, "Logout did not return ok=true");
  return logout;
}

async function assertCanonicalAuthSurfaceLocked(baseUrl) {
  const checks = [
    {
      method: "GET",
      path: "/api/auth/get-session",
      context: "Non-canonical get-session endpoint",
    },
    {
      method: "POST",
      path: "/api/auth/sign-in/email",
      context: "Non-canonical sign-in endpoint",
    },
    {
      method: "POST",
      path: "/api/auth/sign-up/email",
      context: "Non-canonical sign-up endpoint",
    },
    {
      method: "POST",
      path: "/api/auth/sign-out",
      context: "Non-canonical sign-out endpoint",
    },
  ];

  for (const check of checks) {
    const response = await requestJson(baseUrl, check.path, { method: check.method });
    assert(response.response.status === 404, `${check.context} must be blocked with 404`);
  }
}

async function assertChildrenAccess(baseUrl, cookie, expectedStatus, context) {
  const response = await requestJson(baseUrl, "/api/children", {
    method: "GET",
    headers: {
      cookie,
    },
  });

  assert(
    response.response.status === expectedStatus,
    `${context}: expected status ${expectedStatus}, received ${response.response.status}`,
  );
  return response;
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.E2E_CLIENT_IP =
    process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;
  const requireSecureCookie = process.env.E2E_EXPECT_SECURE_COOKIE === "1";
  const requestOrigin = process.env.E2E_REQUEST_ORIGIN;

  if (requireSecureCookie && requestOrigin && !requestOrigin.toLowerCase().startsWith("https://")) {
    throw new Error("E2E_EXPECT_SECURE_COOKIE=1 requires E2E_REQUEST_ORIGIN to use https://");
  }

  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(
      readiness.status === 200,
      `Auth session lifecycle e2e requires live dependencies. /api/health/ready returned ${readiness.status}.`,
    );

    const parentEmail = `auth-session-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const parentPassword = "AuthSessionPass123!";

    await assertCanonicalAuthSurfaceLocked(baseUrl);

    const signup = await signupParent(baseUrl, {
      email: parentEmail,
      password: parentPassword,
      displayName: "Auth Session Parent",
      legalAccepted: true,
    });
    assertSessionCookieHardening(signup.setCookieHeader, "Signup cookie hardening", {
      requireSecure: requireSecureCookie,
    });

    const loginA = await loginParent(baseUrl, {
      email: parentEmail,
      password: parentPassword,
    });
    assertSessionCookieHardening(loginA.setCookieHeader, "Login cookie hardening (session A)", {
      requireSecure: requireSecureCookie,
    });

    const loginB = await loginParent(baseUrl, {
      email: parentEmail,
      password: parentPassword,
    });
    assertSessionCookieHardening(loginB.setCookieHeader, "Login cookie hardening (session B)", {
      requireSecure: requireSecureCookie,
    });

    const signupCookie = signup.cookie;
    const sessionA = loginA.cookie;
    const sessionB = loginB.cookie;

    assert(signupCookie !== sessionA, "Expected signup session and login session to be different (session rotation baseline)");
    assert(sessionA !== sessionB, "Expected successive logins to issue distinct sessions (rotation)");

    await assertChildrenAccess(baseUrl, sessionA, 200, "Session A before logout");
    await assertChildrenAccess(baseUrl, sessionB, 200, "Session B before logout");

    await logoutParent(baseUrl, sessionA);

    await assertChildrenAccess(baseUrl, sessionA, 401, "Session A after own logout");
    await assertChildrenAccess(baseUrl, sessionB, 200, "Session B should remain active after session A logout");

    await logoutParent(baseUrl, sessionB);
    await assertChildrenAccess(baseUrl, sessionB, 401, "Session B after its own logout");

    const loginC = await loginParent(baseUrl, {
      email: parentEmail,
      password: parentPassword,
    });
    assertSessionCookieHardening(loginC.setCookieHeader, "Login cookie hardening (session C)", {
      requireSecure: requireSecureCookie,
    });
    const sessionC = loginC.cookie;
    assert(sessionC !== sessionB, "Expected new login after logout to mint fresh session token");
    await assertChildrenAccess(baseUrl, sessionC, 200, "Session C after re-login");

    console.log(
      JSON.stringify(
        {
          ok: true,
          parentEmail,
          checks: {
            sessionRotationAcrossLogins: true,
            sessionInvalidateOnLogout: true,
            multiSessionIsolation: true,
            reLoginAfterLogoutCreatesFreshSession: true,
            canonicalAuthSurfaceBlocked: true,
            sessionCookieHardeningBaseline: true,
            ...(requireSecureCookie ? { sessionCookieSecureFlagInHttpsMode: true } : {}),
          },
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
