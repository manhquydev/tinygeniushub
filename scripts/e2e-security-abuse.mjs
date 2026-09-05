import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
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

function getSessionCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/(?:__Secure-|__Host-)?ccth_session=[^;]+/);
  return match ? match[0] : null;
}

function getAdminSessionCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  const match = setCookieHeader.match(/(?:__Secure-|__Host-)?ccth_admin_session=[^;]+/);
  return match ? match[0] : null;
}

async function requestJson(baseUrl, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const method = (options.method ?? "GET").toUpperCase();
  let body = undefined;
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
  assert(login.json?.ok === true, `Login did not return ok=true for ${payload.email}`);
  const setCookieHeader = login.response.headers.get("set-cookie");
  assert(setCookieHeader, `Missing set-cookie header for ${payload.email}`);
  assert(/httponly/i.test(setCookieHeader), `Session cookie must include HttpOnly for ${payload.email}`);
  assert(/path=\//i.test(setCookieHeader), `Session cookie must include Path=/ for ${payload.email}`);
  assert(/samesite=/i.test(setCookieHeader), `Session cookie should include SameSite for ${payload.email}`);

  const cookie = getSessionCookie(setCookieHeader);
  assert(cookie, `Missing session cookie for ${payload.email}`);
  return cookie;
}

async function loginAdmin(baseUrl, payload) {
  const login = await requestJson(baseUrl, "/api/admin/auth/login", {
    method: "POST",
    body: payload,
  });

  assert(login.response.status === 200, `Admin login failed for ${payload.email}: status=${login.response.status}`);
  assert(login.json?.ok === true, `Admin login did not return ok=true for ${payload.email}`);

  const setCookieHeader = login.response.headers.get("set-cookie");
  assert(setCookieHeader, `Missing admin set-cookie header for ${payload.email}`);
  const cookie = getAdminSessionCookie(setCookieHeader);
  assert(cookie, `Missing admin session cookie for ${payload.email}`);
  return cookie;
}

async function signupParent(baseUrl, payload) {
  const signup = await requestJson(baseUrl, "/api/auth/signup", {
    method: "POST",
    body: payload,
  });

  assert(signup.response.status === 200, `Signup failed for ${payload.email}: status=${signup.response.status}`);
  assert(signup.json?.ok === true, `Signup did not return ok=true for ${payload.email}`);
  const signupCookie = signup.response.headers.get("set-cookie");
  if (signupCookie) {
    const cookie = getSessionCookie(signupCookie);
    if (cookie) {
      return cookie;
    }
  }

  return loginParent(baseUrl, {
    email: payload.email,
    password: payload.password,
  });
}

function countStatuses(responses) {
  const counts = new Map();
  for (const item of responses) {
    const current = counts.get(item.response.status) ?? 0;
    counts.set(item.response.status, current + 1);
  }
  return counts;
}

function assertRetryAfterHeader(response, context) {
  const value = response.headers.get("Retry-After");
  const parsed = Number.parseInt(value ?? "", 10);
  assert(Number.isFinite(parsed) && parsed > 0, `Missing/invalid Retry-After header for ${context}`);
}

async function ensureChild(baseUrl, authHeaders) {
  const children = await requestJson(baseUrl, "/api/children", {
    method: "GET",
    headers: authHeaders,
  });
  assert(children.response.status === 200, `List children failed: status=${children.response.status}`);
  assert(children.json?.ok === true, "List children did not return ok=true");
  const rows = Array.isArray(children.json?.data?.children) ? children.json.data.children : [];
  if (rows.length > 0) {
    const childId = rows[0]?.id;
    assert(typeof childId === "string" && childId.length > 0, "Existing child is missing id");
    return childId;
  }

  const created = await requestJson(baseUrl, "/api/children", {
    method: "POST",
    headers: authHeaders,
    body: {
      nickname: "Security Kid",
      ageBand: "4-5",
    },
  });
  assert(created.response.status === 201, `Create child failed: status=${created.response.status}`);
  assert(created.json?.ok === true, "Create child did not return ok=true");
  const childId = created.json?.data?.child?.id;
  assert(typeof childId === "string" && childId.length > 0, "Create child response missing id");
  return childId;
}

async function ensureEnrolledCourse(baseUrl, authHeaders, childId) {
  const enrolled = await requestJson(baseUrl, `/api/courses/enrolled?childId=${encodeURIComponent(childId)}`, {
    method: "GET",
    headers: authHeaders,
  });
  assert(enrolled.response.status === 200, `List enrolled courses failed: status=${enrolled.response.status}`);
  assert(enrolled.json?.ok === true, "List enrolled courses did not return ok=true");
  const existingCourses = Array.isArray(enrolled.json?.data?.courses) ? enrolled.json.data.courses : [];
  if (existingCourses.length > 0) {
    return;
  }

  const courses = await requestJson(baseUrl, "/api/courses", {
    method: "GET",
    headers: authHeaders,
  });
  assert(courses.response.status === 200, `List courses failed: status=${courses.response.status}`);
  assert(courses.json?.ok === true, "List courses did not return ok=true");
  const availableCourses = Array.isArray(courses.json?.data?.courses) ? courses.json.data.courses : [];
  assert(availableCourses.length > 0, "No published courses available for enrollment");

  const preferredCourseSlugs = [
    "abeka-k4",
    "abeka-k5",
    "abeka-g1",
    "little-fox-en-level-1",
    "little-fox-cn-level-1",
  ];
  const selectedCourse =
    availableCourses.find((course) => preferredCourseSlugs.includes(String(course.slug))) ?? availableCourses[0];
  const selectedSlug = selectedCourse?.slug;
  assert(typeof selectedSlug === "string" && selectedSlug.length > 0, "Selected course missing slug");

  const checkout = await requestJson(baseUrl, `/api/courses/${encodeURIComponent(selectedSlug)}/checkout`, {
    method: "POST",
    headers: authHeaders,
    body: {},
  });
  assert(checkout.response.status === 200, `Checkout failed: status=${checkout.response.status}`);
  assert(checkout.json?.ok === true, "Checkout did not return ok=true");
  const checkoutUrl = checkout.json?.data?.checkoutUrl;
  assert(typeof checkoutUrl === "string" && checkoutUrl.length > 0, "Checkout response missing checkoutUrl");

  // Non-mock providers can return absolute hosted payment URLs.
  // In production-hardening runs, we avoid invoking external checkout callbacks.
  if (!checkoutUrl.startsWith("/")) {
    return;
  }

  const mockSuccess = await fetch(`${baseUrl}${checkoutUrl}`, {
    method: "GET",
    headers: authHeaders,
    redirect: "manual",
  });
  assert(
    [200, 302, 303, 307, 308].includes(mockSuccess.status),
    `Mock checkout callback failed: status=${mockSuccess.status}`,
  );
}

async function getLessonIdForChild(baseUrl, authHeaders, childId) {
  const today = await requestJson(baseUrl, `/api/lessons/today?childId=${encodeURIComponent(childId)}`, {
    method: "GET",
    headers: authHeaders,
  });
  assert(today.response.status === 200, `Get today lessons failed: status=${today.response.status}`);
  assert(today.json?.ok === true, "Get today lessons did not return ok=true");
  const lessons = Array.isArray(today.json?.data?.lessons) ? today.json.data.lessons : [];
  assert(lessons.length > 0, "No lessons available for child in security e2e");
  const trialLesson = lessons.find((lesson) => lesson?.trialEnabled === true);
  assert(trialLesson, "No trial-enabled lessons available for child in security e2e");
  const lessonId = trialLesson.id;
  assert(typeof lessonId === "string" && lessonId.length > 0, "Lesson id is missing");
  return lessonId;
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

async function getAdminSecuritySettings(baseUrl, adminHeaders) {
  const settings = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
    method: "GET",
    headers: adminHeaders,
  });

  assert(settings.response.status === 200, `Admin security GET failed: status=${settings.response.status}`);
  assert(settings.json?.ok === true, "Admin security GET did not return ok=true");
  const policies = settings.json?.data?.policies;
  const controls = settings.json?.data?.controls;
  assert(Array.isArray(policies) && policies.length > 0, "Admin security GET missing policies");
  assert(controls && typeof controls === "object", "Admin security GET missing controls");
  return {
    policies,
    controls,
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
  return patch.json?.data;
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.COURSE_PAYMENT_PROVIDER = process.env.COURSE_PAYMENT_PROVIDER ?? "payos";
  process.env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK =
    process.env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK ?? "false";
  if (process.env.COURSE_PAYMENT_PROVIDER === "payos") {
    process.env.PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID ?? "e2e-payos-client-id";
    process.env.PAYOS_API_KEY = process.env.PAYOS_API_KEY ?? "e2e-payos-api-key";
    process.env.PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY ?? "e2e-payos-checksum-key";
  }
  process.env.E2E_CLIENT_IP =
    process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;
  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const defaultParentEmail = `security-${runId}@example.com`;
  const parentEmail = process.env.E2E_PARENT_EMAIL ?? defaultParentEmail;
  const parentPassword = process.env.E2E_PARENT_PASSWORD ?? "DemoPass123!";
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "demo.admin@tinygeniushubvn.tech";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!";

  process.env.ADMIN_EMAILS = adminEmail;
  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? baseUrl;
  const server = startServer(port);
  const ipSeed = (Date.now() % 200) + 20;
  const octet = (offset) => (((ipSeed + offset - 1) % 254) + 1);
  const loginAttackIp = `198.51.100.${octet(1)}`;
  const watchBurstIp = `198.51.100.${octet(2)}`;
  const emailBurstIp = `198.51.100.${octet(3)}`;
  const readinessBurstIp = `198.51.100.${octet(4)}`;

  let adminHeaders = null;
  let parentHeaders = null;
  let baselineSettings = null;

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(
      readiness.status === 200,
      `Security e2e requires live dependencies. /api/health/ready returned ${readiness.status}.`,
    );

    const adminCookie = await loginAdmin(baseUrl, {
      email: adminEmail,
      password: adminPassword,
    });
    adminHeaders = { cookie: adminCookie };

    const parentCookie =
      process.env.E2E_PARENT_EMAIL && process.env.E2E_PARENT_PASSWORD
        ? await loginParent(baseUrl, {
            email: parentEmail,
            password: parentPassword,
          })
        : await signupParent(baseUrl, {
            email: parentEmail,
            password: parentPassword,
            displayName: "Security Parent",
            legalAccepted: true,
          });
    parentHeaders = { cookie: parentCookie };

    baselineSettings = await getAdminSecuritySettings(baseUrl, adminHeaders);
    const baselineOverrides = buildOverridesFromPolicies(baselineSettings.policies);

    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E security baseline reset",
      overrides: baselineOverrides,
      controls: {
        ddosMode: "normal",
        globalLimitMultiplier: 1,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
      },
    });

    const settingsAfterReset = await getAdminSecuritySettings(baseUrl, adminHeaders);
    const resetOverrides = buildOverridesFromPolicies(settingsAfterReset.policies);

    const ddosControlPatch = await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E verify ddos multiplier",
      overrides: resetOverrides,
      controls: {
        ddosMode: "elevated",
        globalLimitMultiplier: 0.5,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
      },
    });

    const authLoginPolicy = ddosControlPatch?.policies?.find((item) => item.key === "auth.login.ip");
    assert(authLoginPolicy, "Missing auth.login.ip policy after ddos control patch");
    const expectedEffectiveLimit = Math.min(
      Math.max(Math.floor(authLoginPolicy.currentLimit * 0.8 * 0.5), authLoginPolicy.minLimit),
      authLoginPolicy.maxLimit,
    );
    assert(
      authLoginPolicy.effectiveLimit === expectedEffectiveLimit,
      `Unexpected effective limit. expected=${expectedEffectiveLimit}, got=${authLoginPolicy.effectiveLimit}`,
    );

    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E verify blocked ip",
      overrides: resetOverrides,
      controls: {
        ddosMode: "normal",
        globalLimitMultiplier: 1,
        blockedIpCidrs: ["198.51.100.66"],
        readinessAllowlistCidrs: [],
      },
    });

    const blockedLogin = await requestJson(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: {
        "x-real-ip": "198.51.100.66",
      },
      body: {
        email: parentEmail,
        password: "wrong-password",
      },
    });
    assert(blockedLogin.response.status === 403, `Blocked IP login should return 403, got ${blockedLogin.response.status}`);
    assert(
      blockedLogin.json?.error?.details?.code === "SECURITY_IP_BLOCKED",
      "Blocked IP login should return SECURITY_IP_BLOCKED",
    );

    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E verify readiness allowlist",
      overrides: resetOverrides,
      controls: {
        ddosMode: "normal",
        globalLimitMultiplier: 1,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: ["10.0.0.0/8"],
      },
    });

    const deniedReadiness = await requestJson(baseUrl, "/api/health/ready", {
      method: "GET",
      headers: {
        "x-real-ip": "198.51.100.77",
      },
    });
    assert(deniedReadiness.response.status === 403, `Readiness allowlist deny should return 403, got ${deniedReadiness.response.status}`);
    assert(
      deniedReadiness.json?.error?.details?.code === "SECURITY_READINESS_IP_DENIED",
      "Readiness allowlist deny should return SECURITY_READINESS_IP_DENIED",
    );

    const loginPolicyOverrides = {
      ...resetOverrides,
      "auth.login.ip": {
        limit: 5,
        windowMs: 60_000,
      },
      "auth.login.email": {
        limit: 200,
        windowMs: 60_000,
      },
    };

    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E verify login rate limit",
      overrides: loginPolicyOverrides,
      controls: {
        ddosMode: "normal",
        globalLimitMultiplier: 1,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
      },
    });

    let rateLimitHit = false;
    for (let attempt = 1; attempt <= 7; attempt += 1) {
      const attemptLogin = await requestJson(baseUrl, "/api/auth/login", {
        method: "POST",
        headers: {
          "x-real-ip": loginAttackIp,
        },
        body: {
          email: `abuse-${attempt}@example.com`,
          password: "invalid-pass",
        },
      });

      if (attempt <= 5) {
        assert(
          [401, 429].includes(attemptLogin.response.status),
          `Unexpected login status before limit on attempt ${attempt}: ${attemptLogin.response.status}`,
        );
      }

      if (attemptLogin.response.status === 429) {
        rateLimitHit = true;
        break;
      }
    }
    assert(rateLimitHit, "Expected login rate limit (429) was not triggered");

    const distributedEmailPolicyOverrides = {
      ...resetOverrides,
      "auth.login.ip": {
        limit: 200,
        windowMs: 60_000,
      },
      "auth.login.email": {
        limit: 3,
        windowMs: 60_000,
      },
    };

    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E verify distributed login abuse on email bucket",
      overrides: distributedEmailPolicyOverrides,
      controls: {
        ddosMode: "normal",
        globalLimitMultiplier: 1,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
      },
    });

    let distributedBucketHit = false;
    for (let attempt = 1; attempt <= 8; attempt += 1) {
      const attemptLogin = await requestJson(baseUrl, "/api/auth/login", {
        method: "POST",
        headers: {
          "x-real-ip": `198.51.100.${octet(20 + attempt)}`,
        },
        body: {
          email: "target-shared@example.com",
          password: "invalid-pass",
        },
      });

      if (attemptLogin.response.status === 429) {
        distributedBucketHit = true;
        assertRetryAfterHeader(attemptLogin.response, "distributed auth.login.email rate limit");
        break;
      }
    }
    assert(distributedBucketHit, "Expected distributed login abuse to hit auth.login.email rate limit");

    const chaosPolicyOverrides = {
      ...resetOverrides,
      "learning.watch.session.ip": {
        limit: 2,
        windowMs: 60_000,
      },
      "learning.watch.session.parent": {
        limit: 2,
        windowMs: 60_000,
      },
      "reports.sendEmail.ip": {
        limit: 2,
        windowMs: 60_000,
      },
      "reports.sendEmail.parent": {
        limit: 2,
        windowMs: 60_000,
      },
      "health.ready.ip": {
        limit: 2,
        windowMs: 60_000,
      },
    };

    await patchAdminSecuritySettings(baseUrl, adminHeaders, {
      reason: "E2E chaos burst limits",
      overrides: chaosPolicyOverrides,
      controls: {
        ddosMode: "normal",
        globalLimitMultiplier: 1,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
      },
    });

    const childId = await ensureChild(baseUrl, parentHeaders);
    await ensureEnrolledCourse(baseUrl, parentHeaders, childId);
    const lessonId = await getLessonIdForChild(baseUrl, parentHeaders, childId);

    const watchBurstResponses = await Promise.all(
      Array.from({ length: 25 }, () =>
        requestJson(baseUrl, `/api/lessons/${lessonId}/watch/session`, {
          method: "POST",
          headers: {
            ...parentHeaders,
            "x-real-ip": watchBurstIp,
          },
          body: { childId },
        }),
      ),
    );
    const watchBurstStatus = countStatuses(watchBurstResponses);
    assert((watchBurstStatus.get(429) ?? 0) >= 1, "Expected watch/session burst to trigger 429");
    const watchRateLimited = watchBurstResponses.find((item) => item.response.status === 429);
    assert(watchRateLimited, "Expected at least one watch/session rate-limited response");
    assertRetryAfterHeader(watchRateLimited.response, "learning.watch.session");

    await requestJson(baseUrl, "/api/reports/generate", {
      method: "POST",
      headers: {
        ...parentHeaders,
        "x-real-ip": emailBurstIp,
      },
    });

    const emailBurstResponses = await Promise.all(
      Array.from({ length: 6 }, () =>
        requestJson(baseUrl, "/api/reports/send-email", {
          method: "POST",
          headers: {
            ...parentHeaders,
            "x-real-ip": emailBurstIp,
          },
        }),
      ),
    );
    const emailBurstStatus = countStatuses(emailBurstResponses);
    assert((emailBurstStatus.get(429) ?? 0) >= 1, "Expected reports/send-email burst to trigger 429");
    const emailRateLimited = emailBurstResponses.find((item) => item.response.status === 429);
    assert(emailRateLimited, "Expected at least one reports/send-email rate-limited response");
    assertRetryAfterHeader(emailRateLimited.response, "reports.sendEmail");

    const readinessBurstResponses = await Promise.all(
      Array.from({ length: 15 }, () =>
        requestJson(baseUrl, "/api/health/ready", {
          method: "GET",
          headers: {
            "x-real-ip": readinessBurstIp,
          },
        }),
      ),
    );
    const readinessBurstStatus = countStatuses(readinessBurstResponses);
    assert((readinessBurstStatus.get(429) ?? 0) >= 1, "Expected readiness burst to trigger 429");
    const readinessRateLimited = readinessBurstResponses.find((item) => item.response.status === 429);
    assert(readinessRateLimited, "Expected at least one readiness rate-limited response");
    assertRetryAfterHeader(readinessRateLimited.response, "health.ready");

    const edgeExport = await requestJson(baseUrl, "/api/admin/security/edge-export", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(edgeExport.response.status === 200, `Edge export failed: status=${edgeExport.response.status}`);
    assert(edgeExport.json?.ok === true, "Edge export did not return ok=true");
    assert(
      edgeExport.json?.data?.edgePolicy?.profile?.ddosMode === "normal",
      "Edge export profile should reflect latest ddos mode",
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: {
            ddosMultiplierApplied: true,
            blockedIpEnforced: true,
            readinessAllowlistEnforced: true,
            loginRateLimitTriggered: true,
            loginEmailBucketAcrossIpsLimited: true,
            watchSessionBurstLimited: true,
            reportSendEmailBurstLimited: true,
            readinessBurstLimited: true,
            edgeExportSynced: true,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    if (adminHeaders && baselineSettings) {
      const baselineOverrides = buildOverridesFromPolicies(baselineSettings.policies);
      await patchAdminSecuritySettings(baseUrl, adminHeaders, {
        reason: "E2E security rollback",
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
