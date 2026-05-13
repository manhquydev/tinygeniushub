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

async function requestText(baseUrl, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const clientIp = process.env.E2E_CLIENT_IP;
  if (clientIp && !headers.has("x-real-ip")) {
    headers.set("x-real-ip", clientIp);
  }
  if (clientIp && !headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", clientIp);
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    redirect: options.redirect ?? "follow",
  });
  const text = await response.text();
  return { response, text };
}

async function loginParent(baseUrl, payload) {
  const login = await requestJson(baseUrl, "/api/auth/login", {
    method: "POST",
    body: payload,
  });
  assert(login.response.status === 200, `Login failed for ${payload.email}: status=${login.response.status}`);
  assert(login.json?.ok === true, `Login did not return ok=true for ${payload.email}`);
  const cookie = getSessionCookie(login.response.headers.get("set-cookie"));
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
  const cookie = getAdminSessionCookie(login.response.headers.get("set-cookie"));
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
  const cookie = getSessionCookie(signup.response.headers.get("set-cookie"));
  assert(cookie, `Missing session cookie for ${payload.email}`);
  return cookie;
}

function buildOverridesFromPolicies(policies, mode = "current") {
  return Object.fromEntries(
    policies.map((policy) => [
      policy.key,
      mode === "default"
        ? {
            limit: policy.defaultLimit,
            windowMs: policy.defaultWindowMs,
          }
        : {
            limit: policy.currentLimit,
            windowMs: policy.currentWindowMs,
          },
    ]),
  );
}

async function createChild(baseUrl, authHeaders, payload) {
  const create = await requestJson(baseUrl, "/api/children", {
    method: "POST",
    headers: authHeaders,
    body: payload,
  });
  assert(create.response.status === 201, `Create child failed: status=${create.response.status}`);
  assert(create.json?.ok === true, "Create child did not return ok=true");
  const childId = create.json?.data?.child?.id;
  assert(typeof childId === "string" && childId.length > 0, "Create child response missing child id");
  return childId;
}

async function ensureChild(baseUrl, authHeaders) {
  const children = await requestJson(baseUrl, "/api/children", {
    method: "GET",
    headers: authHeaders,
  });
  assert(children.response.status === 200, `List children failed: status=${children.response.status}`);
  assert(children.json?.ok === true, "List children did not return ok=true");
  const childRows = Array.isArray(children.json?.data?.children) ? children.json.data.children : [];
  if (childRows.length > 0) {
    const childId = childRows[0]?.id;
    assert(typeof childId === "string" && childId.length > 0, "Existing child row missing id");
    return childId;
  }

  return createChild(baseUrl, authHeaders, {
    nickname: "Kid Full",
    ageBand: "4-5",
  });
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
  assert(typeof checkoutUrl === "string" && checkoutUrl.startsWith("/"), "Checkout response missing checkoutUrl");

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

async function getTodayLessons(baseUrl, authHeaders, childId) {
  const todayMission = await requestJson(baseUrl, `/api/lessons/today?childId=${encodeURIComponent(childId)}`, {
    method: "GET",
    headers: authHeaders,
  });
  assert(todayMission.response.status === 200, `Today mission failed: status=${todayMission.response.status}`);
  assert(todayMission.json?.ok === true, "Today mission did not return ok=true");
  const lessons = todayMission.json?.data?.lessons;
  assert(Array.isArray(lessons) && lessons.length > 0, "No lessons returned for today mission");
  return lessons;
}

async function completeLessonJourney(baseUrl, authHeaders, childId, lessonId) {
  const watchSession = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch/session`, {
    method: "POST",
    headers: authHeaders,
    body: { childId },
  });

  assert(watchSession.response.status === 200, `Watch session failed: status=${watchSession.response.status}`);
  assert(watchSession.json?.ok === true, "Watch session did not return ok=true");

  const session = watchSession.json?.data?.session;
  const markWatchBody = { childId };
  if (session?.watchRequired) {
    assert(
      typeof session.sessionToken === "string" && session.sessionToken.length > 0,
      "Watch-required lesson must return session token",
    );

    const requiredWatchSeconds = Math.max(1, Number(session.requiredWatchSeconds ?? 0));
    const heartbeatIntervalSeconds = Math.max(1, Number(session.heartbeatIntervalSeconds ?? 5));
    const heartbeatGapMs = heartbeatIntervalSeconds * 1000 + 300;
    const minimumHeartbeatCount = Math.ceil(requiredWatchSeconds / heartbeatIntervalSeconds);
    const heartbeatDeadlineMs = Date.now() + minimumHeartbeatCount * heartbeatGapMs + 120_000;
    let sequence = 0;
    let readyForCompletion = false;

    while (Date.now() < heartbeatDeadlineMs && !readyForCompletion) {
      await sleep(heartbeatGapMs);
      const nextSequence = sequence + 1;
      const heartbeat = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch/heartbeat`, {
        method: "POST",
        headers: authHeaders,
        body: {
          childId,
          sessionToken: session.sessionToken,
          sequence: nextSequence,
        },
      });

      if (heartbeat.response.status === 429) {
        await sleep(1_200);
        continue;
      }

      assert(heartbeat.response.status === 200, `Watch heartbeat failed: status=${heartbeat.response.status}`);
      assert(heartbeat.json?.ok === true, "Watch heartbeat did not return ok=true");
      sequence = nextSequence;
      readyForCompletion = heartbeat.json?.data?.watch?.readyForCompletion === true;
    }

    assert(
      readyForCompletion,
      `Watch heartbeat timed out before readiness. requiredWatchSeconds=${requiredWatchSeconds}, sequence=${sequence}`,
    );
    markWatchBody.sessionToken = session.sessionToken;
  }

  const markWatch = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch`, {
    method: "POST",
    headers: authHeaders,
    body: markWatchBody,
  });
  assert(markWatch.response.status === 200, `Mark watch failed: status=${markWatch.response.status}`);
  assert(markWatch.json?.ok === true, "Mark watch did not return ok=true");
  if (session?.watchRequired) {
    assert(markWatch.json?.data?.watch?.readyForCompletion === true, "Mark watch did not reach completion readiness");
  }

  const completionPayload = {
    childId,
    quizScore: 88,
    minutesLearned: 14,
    checklist: ["watch", "answer", "repeat"],
  };
  const completion = await requestJson(baseUrl, `/api/lessons/${lessonId}/complete`, {
    method: "POST",
    headers: authHeaders,
    body: completionPayload,
  });
  assert(completion.response.status === 200, `Complete lesson failed: status=${completion.response.status}`);
  assert(completion.json?.ok === true, "Complete lesson did not return ok=true");
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const defaultParentEmail = `full-${runId}@example.com`;
  const parentEmail = process.env.E2E_PARENT_EMAIL ?? defaultParentEmail;
  const parentPassword = process.env.E2E_PARENT_PASSWORD ?? "FullJourneyPass123!";
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "demo.admin@tinygeniushubvn.tech";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!";
  process.env.E2E_CLIENT_IP = process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;

  process.env.ADMIN_EMAILS = adminEmail;

  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);
  let adminHeaders = null;
  let baselineSettings = null;

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(
      readiness.status === 200,
      `Full e2e requires live dependencies. /api/health/ready returned ${readiness.status}.`,
    );

    const unauthParentPage = await requestText(baseUrl, "/parent/dashboard", {
      redirect: "manual",
    });
    const unauthStatus = unauthParentPage.response.status;
    const redirectStatuses = new Set([302, 303, 307, 308]);
    assert(
      redirectStatuses.has(unauthStatus) || unauthStatus === 200,
      `Expected unauth parent page to redirect or render login, got ${unauthStatus}`,
    );
    if (redirectStatuses.has(unauthStatus)) {
      assert(
        unauthParentPage.response.headers.get("location")?.includes("/auth/login"),
        "Unauth parent page should redirect to /auth/login",
      );
    }

    const adminCookie = await loginAdmin(baseUrl, {
      email: adminEmail,
      password: adminPassword,
    });
    adminHeaders = { cookie: adminCookie };

    const securitySettingsGet = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(
      securitySettingsGet.response.status === 200,
      `Admin security settings GET failed: status=${securitySettingsGet.response.status}`,
    );
    assert(securitySettingsGet.json?.ok === true, "Admin security settings GET did not return ok=true");
    const policies = securitySettingsGet.json?.data?.policies;
    const controls = securitySettingsGet.json?.data?.controls;
    assert(Array.isArray(policies) && policies.length > 0, "Admin security settings should include policies");
    assert(controls && typeof controls === "object", "Admin security settings should include controls");

    baselineSettings = {
      policies,
      controls,
    };

    const defaultOverrides = buildOverridesFromPolicies(policies, "default");
    const normalizeSecurity = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
      method: "PATCH",
      headers: adminHeaders,
      body: {
        reason: "E2E full local normalize to defaults",
        overrides: defaultOverrides,
        controls: {
          ddosMode: "normal",
          globalLimitMultiplier: 1,
          blockedIpCidrs: [],
          readinessAllowlistCidrs: [],
        },
      },
    });
    assert(
      normalizeSecurity.response.status === 200,
      `Admin security normalize failed: status=${normalizeSecurity.response.status}`,
    );
    assert(normalizeSecurity.json?.ok === true, "Admin security normalize did not return ok=true");

    const parentCookie =
      process.env.E2E_PARENT_EMAIL && process.env.E2E_PARENT_PASSWORD
        ? await loginParent(baseUrl, {
            email: parentEmail,
            password: parentPassword,
          })
        : await signupParent(baseUrl, {
            email: parentEmail,
            password: parentPassword,
            displayName: "Full Journey Parent",
            legalAccepted: true,
          });
    const parentHeaders = { cookie: parentCookie };

    const parentChildId = await ensureChild(baseUrl, parentHeaders);
    await ensureEnrolledCourse(baseUrl, parentHeaders, parentChildId);

    const parentDashboard = await requestText(baseUrl, "/parent/dashboard", {
      headers: parentHeaders,
    });
    assert(parentDashboard.response.status === 200, `Parent dashboard failed: status=${parentDashboard.response.status}`);
    assert(parentDashboard.text.includes("Parent Dashboard"), "Parent dashboard marker not found");

    const parentChildren = await requestText(baseUrl, "/parent/children", {
      headers: parentHeaders,
    });
    assert(parentChildren.response.status === 200, `Parent children page failed: status=${parentChildren.response.status}`);

    const kidCourses = await requestText(baseUrl, `/kid/courses?childId=${encodeURIComponent(parentChildId)}`, {
      headers: parentHeaders,
      redirect: "manual",
    });
    if (redirectStatuses.has(kidCourses.response.status)) {
      const location = kidCourses.response.headers.get("location") ?? "";
      assert(
        location.includes(`/kid/garden?childId=${encodeURIComponent(parentChildId)}`) || location.includes("/kid/courses/"),
        `Kid courses redirect location unexpected: ${location}`,
      );
    } else {
      assert(kidCourses.response.status === 200, `Kid courses page failed: status=${kidCourses.response.status}`);
      assert(
        kidCourses.text.includes("kcd-scene") ||
          kidCourses.text.includes("ksg-scene") ||
          kidCourses.text.includes("/kid/garden?childId=") ||
          kidCourses.text.includes("NEXT_REDIRECT"),
        "Kid courses marker not found",
      );
    }

    const kidGarden = await requestText(baseUrl, `/kid/garden?childId=${encodeURIComponent(parentChildId)}`, {
      headers: parentHeaders,
    });
    assert(kidGarden.response.status === 200, `Kid garden page failed: status=${kidGarden.response.status}`);
    assert(kidGarden.text.includes("ksg-scene"), "Kid garden marker not found");

    const lessons = await getTodayLessons(baseUrl, parentHeaders, parentChildId);
    const selectedLesson = lessons.find((lesson) => lesson?.trialEnabled === true);
    assert(selectedLesson, "No trial-enabled lesson available for full local journey");
    const lessonId = selectedLesson.id;
    assert(typeof lessonId === "string" && lessonId.length > 0, "Lesson id missing from today mission");

    await completeLessonJourney(baseUrl, parentHeaders, parentChildId, lessonId);

    const generate = await requestJson(baseUrl, "/api/reports/generate", {
      method: "POST",
      headers: parentHeaders,
    });
    assert(generate.response.status === 200, `Generate report failed: status=${generate.response.status}`);
    assert(generate.json?.ok === true, "Generate report did not return ok=true");

    const sendEmail = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
      headers: parentHeaders,
    });
    assert(sendEmail.response.status === 200, `Send email failed: status=${sendEmail.response.status}`);
    assert(sendEmail.json?.ok === true, "Send email did not return ok=true");

    const parentReportsPage = await requestText(baseUrl, "/parent/reports", {
      headers: parentHeaders,
    });
    assert(parentReportsPage.response.status === 200, `Parent reports page failed: status=${parentReportsPage.response.status}`);
    const reportMarkers = ["Report", "Bao cao", "Report", "Weekly"];
    assert(reportMarkers.some((marker) => parentReportsPage.text.includes(marker)), "Parent reports marker not found");

    const nonAdminOverview = await requestJson(baseUrl, "/api/admin/overview", {
      method: "GET",
      headers: parentHeaders,
    });
    assert(
      nonAdminOverview.response.status === 401 || nonAdminOverview.response.status === 403,
      `Non-admin should get 401/403 for admin overview (got ${nonAdminOverview.response.status})`,
    );

    const adminPage = await requestText(baseUrl, "/admin", {
      headers: adminHeaders,
    });
    assert(adminPage.response.status === 200, `Admin page failed: status=${adminPage.response.status}`);
    const adminPageMarkers = ["Admin", "CMS", "Dashboard"];
    assert(adminPageMarkers.some((marker) => adminPage.text.includes(marker)), "Admin page marker not found");

    const adminOverview = await requestJson(baseUrl, "/api/admin/overview", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(adminOverview.response.status === 200, `Admin overview failed: status=${adminOverview.response.status}`);
    assert(adminOverview.json?.ok === true, "Admin overview did not return ok=true");

    const adminPayments = await requestJson(baseUrl, "/api/admin/payments?limit=10", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(adminPayments.response.status === 200, `Admin payments failed: status=${adminPayments.response.status}`);
    assert(adminPayments.json?.ok === true, "Admin payments did not return ok=true");

    const adminWebhooks = await requestJson(baseUrl, "/api/admin/webhooks?limit=10", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(adminWebhooks.response.status === 200, `Admin webhooks failed: status=${adminWebhooks.response.status}`);
    assert(adminWebhooks.json?.ok === true, "Admin webhooks did not return ok=true");

    const currentSettings = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(currentSettings.response.status === 200, `Admin current security GET failed: status=${currentSettings.response.status}`);
    assert(currentSettings.json?.ok === true, "Admin current security GET did not return ok=true");
    const currentPolicies = currentSettings.json?.data?.policies;
    assert(Array.isArray(currentPolicies) && currentPolicies.length > 0, "Admin current security should include policies");
    const overrides = buildOverridesFromPolicies(currentPolicies, "current");

    const securitySettingsPatch = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
      method: "PATCH",
      headers: adminHeaders,
      body: {
        reason: "E2E full local controls sync",
        overrides,
        controls: {
          ddosMode: "elevated",
          globalLimitMultiplier: 0.85,
          blockedIpCidrs: [],
          readinessAllowlistCidrs: [],
        },
      },
    });
    assert(
      securitySettingsPatch.response.status === 200,
      `Admin security settings PATCH failed: status=${securitySettingsPatch.response.status}`,
    );
    assert(securitySettingsPatch.json?.ok === true, "Admin security settings PATCH did not return ok=true");

    const edgeExport = await requestJson(baseUrl, "/api/admin/security/edge-export", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(edgeExport.response.status === 200, `Edge export failed: status=${edgeExport.response.status}`);
    assert(edgeExport.json?.ok === true, "Edge export did not return ok=true");
    assert(Array.isArray(edgeExport.json?.data?.edgePolicy?.routes), "Edge export missing routes");

    const rollbackSecuritySettings = await requestJson(baseUrl, "/api/admin/security/rate-limits", {
      method: "PATCH",
      headers: adminHeaders,
      body: {
        reason: "E2E full local rollback",
        overrides,
        controls: {
          ddosMode: "normal",
          globalLimitMultiplier: 1,
          blockedIpCidrs: [],
          readinessAllowlistCidrs: [],
        },
      },
    });
    assert(
      rollbackSecuritySettings.response.status === 200,
      `Security settings rollback failed: status=${rollbackSecuritySettings.response.status}`,
    );
    assert(rollbackSecuritySettings.json?.ok === true, "Security settings rollback did not return ok=true");

    console.log(
      JSON.stringify(
        {
          ok: true,
          roles: ["parent", "kid", "admin"],
          parentEmail,
          adminEmail,
          childId: parentChildId,
          lessonId,
          securityPolicies: currentPolicies.length,
          edgeRoutes: edgeExport.json?.data?.edgePolicy?.routes?.length ?? 0,
        },
        null,
        2,
      ),
    );
  } finally {
    if (adminHeaders && baselineSettings) {
      const baselineOverrides = buildOverridesFromPolicies(baselineSettings.policies, "current");
      await requestJson(baseUrl, "/api/admin/security/rate-limits", {
        method: "PATCH",
        headers: adminHeaders,
        body: {
          reason: "E2E full local restore baseline",
          overrides: baselineOverrides,
          controls: baselineSettings.controls,
        },
      }).catch(() => {});
    }

    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
