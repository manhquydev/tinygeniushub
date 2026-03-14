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
      // no-op during boot
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
  });

  const json = await response.json().catch(() => null);
  return { response, json };
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

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.E2E_CLIENT_IP = process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;

  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(
      readiness.status === 200,
      `P0 e2e requires live dependencies. /api/health/ready returned ${readiness.status}. Start PostgreSQL and Redis first.`,
    );

    const testEmail = `p0-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const password = "P0JourneyPass123!";

    const signup = await requestJson(baseUrl, "/api/auth/signup", {
      method: "POST",
      body: {
        email: testEmail,
        password,
        displayName: "P0 Parent",
      },
    });

    assert(signup.response.status === 200, `Signup failed: status=${signup.response.status}`);
    assert(signup.json?.ok === true, "Signup did not return ok=true");

    const sessionCookie = getSessionCookie(signup.response.headers.get("set-cookie"));
    assert(sessionCookie, "Missing session cookie from signup response");

    const authHeaders = {
      cookie: sessionCookie,
    };

    const createChild = await requestJson(baseUrl, "/api/children", {
      method: "POST",
      headers: authHeaders,
      body: {
        nickname: "Be Na",
        ageBand: "4-5",
      },
    });

    assert(createChild.response.status === 201, `Create child failed: status=${createChild.response.status}`);
    assert(createChild.json?.ok === true, "Create child did not return ok=true");

    const childId = createChild.json?.data?.child?.id;
    assert(typeof childId === "string" && childId.length > 0, "Create child response missing child id");

    const coursesResponse = await requestJson(baseUrl, "/api/courses", {
      method: "GET",
      headers: authHeaders,
    });
    assert(coursesResponse.response.status === 200, `List courses failed: status=${coursesResponse.response.status}`);
    assert(coursesResponse.json?.ok === true, "List courses did not return ok=true");

    const availableCourses = Array.isArray(coursesResponse.json?.data?.courses) ? coursesResponse.json.data.courses : [];
    assert(availableCourses.length > 0, "No published courses available for P0 enrollment");

    const preferredCourseSlugs = [
      "abeka-k4",
      "abeka-k5",
      "abeka-g1",
      "little-fox-en-level-1",
      "little-fox-cn-level-1",
    ];
    const selectedCourse =
      availableCourses.find((course) => preferredCourseSlugs.includes(String(course.slug))) ?? availableCourses[0];
    const selectedCourseSlug = selectedCourse?.slug;
    assert(
      typeof selectedCourseSlug === "string" && selectedCourseSlug.length > 0,
      "Selected course is missing slug",
    );

    const checkout = await requestJson(baseUrl, `/api/courses/${encodeURIComponent(selectedCourseSlug)}/checkout`, {
      method: "POST",
      headers: authHeaders,
    });
    assert(checkout.response.status === 200, `Create checkout failed: status=${checkout.response.status}`);
    assert(checkout.json?.ok === true, "Create checkout did not return ok=true");

    const checkoutUrl = checkout.json?.data?.checkoutUrl;
    assert(typeof checkoutUrl === "string" && checkoutUrl.startsWith("/"), "Checkout response missing checkoutUrl");

    const mockSuccess = await fetch(`${baseUrl}${checkoutUrl}`, {
      method: "GET",
      headers: authHeaders,
      redirect: "manual",
    });
    assert(
      [302, 303, 307, 308].includes(mockSuccess.status),
      `Mock checkout callback failed: status=${mockSuccess.status}`,
    );

    const enrolledCourses = await requestJson(baseUrl, `/api/courses/enrolled?childId=${encodeURIComponent(childId)}`, {
      method: "GET",
      headers: authHeaders,
    });
    assert(
      enrolledCourses.response.status === 200,
      `List enrolled courses failed: status=${enrolledCourses.response.status}`,
    );
    assert(enrolledCourses.json?.ok === true, "List enrolled courses did not return ok=true");
    const enrolledCourseRows = Array.isArray(enrolledCourses.json?.data?.courses) ? enrolledCourses.json.data.courses : [];
    assert(enrolledCourseRows.length > 0, "Parent enrollment was not created by checkout flow");

    const todayMission = await requestJson(baseUrl, `/api/lessons/today?childId=${encodeURIComponent(childId)}`, {
      method: "GET",
      headers: authHeaders,
    });

    assert(todayMission.response.status === 200, `Today mission failed: status=${todayMission.response.status}`);
    assert(todayMission.json?.ok === true, "Today mission did not return ok=true");

    const lessons = todayMission.json?.data?.lessons;
    assert(Array.isArray(lessons) && lessons.length > 0, "No lessons returned for today mission");

    const selectedLesson = lessons.find((lesson) => lesson?.trialEnabled === true) ?? lessons[0];
    const lessonId = selectedLesson?.id;
    assert(typeof lessonId === "string" && lessonId.length > 0, "Today mission lesson missing id");

    const completePayload = {
      childId,
      quizScore: 90,
      minutesLearned: 15,
      checklist: ["watch", "answer", "repeat"],
    };

    const watchSession = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch/session`, {
      method: "POST",
      headers: authHeaders,
      body: {
        childId,
      },
    });

    assert(watchSession.response.status === 200, `Watch session failed: status=${watchSession.response.status}`);
    assert(watchSession.json?.ok === true, "Watch session did not return ok=true");

    const watchSessionData = watchSession.json?.data?.session;
    const markWatchBody = { childId };
    if (watchSessionData?.watchRequired) {
      assert(
        typeof watchSessionData.sessionToken === "string" && watchSessionData.sessionToken.length > 0,
        "Watch-required lesson must return session token",
      );

      const requiredWatchSeconds = Math.max(1, Number(watchSessionData.requiredWatchSeconds ?? 0));
      const heartbeatIntervalSeconds = Math.max(1, Number(watchSessionData.heartbeatIntervalSeconds ?? 5));
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
            sessionToken: watchSessionData.sessionToken,
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
      markWatchBody.sessionToken = watchSessionData.sessionToken;
    }

    const markWatch = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch`, {
      method: "POST",
      headers: authHeaders,
      body: markWatchBody,
    });

    assert(markWatch.response.status === 200, `Mark watch failed: status=${markWatch.response.status}`);
    assert(markWatch.json?.ok === true, "Mark watch did not return ok=true");
    if (watchSessionData?.watchRequired) {
      const readyForCompletion = markWatch.json?.data?.watch?.readyForCompletion;
      assert(
        readyForCompletion === true,
        "Watch-required lesson not ready for completion in e2e. Provide no-video lesson data for this fast P0 journey.",
      );
    }

    const completion = await requestJson(baseUrl, `/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: authHeaders,
      body: completePayload,
    });

    assert(completion.response.status === 200, `Complete lesson failed: status=${completion.response.status}`);
    assert(completion.json?.ok === true, "Complete lesson did not return ok=true");
    assert(completion.json?.data?.idempotent === false, "First completion should not be idempotent");

    const completionRetry = await requestJson(baseUrl, `/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: authHeaders,
      body: completePayload,
    });

    assert(
      completionRetry.response.status === 200,
      `Retry completion failed: status=${completionRetry.response.status}`,
    );
    assert(completionRetry.json?.ok === true, "Retry completion did not return ok=true");
    assert(completionRetry.json?.data?.idempotent === true, "Retry completion should be idempotent");

    const generateReport = await requestJson(baseUrl, "/api/reports/generate", {
      method: "POST",
      headers: authHeaders,
    });

    assert(
      generateReport.response.status === 200,
      `Generate report failed: status=${generateReport.response.status}`,
    );
    assert(generateReport.json?.ok === true, "Generate report did not return ok=true");

    const sendEmail = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
      headers: authHeaders,
    });

    assert(sendEmail.response.status === 200, `Send report email failed: status=${sendEmail.response.status}`);
    assert(sendEmail.json?.ok === true, "Send report email did not return ok=true");

    const emailResult = sendEmail.json?.data?.result;
    assert(emailResult && typeof emailResult === "object", "Send report email missing result");
    assert(emailResult.queued >= 1, "Expected at least one queued report for email dispatch");

    const reports = await requestJson(baseUrl, `/api/reports/weekly?childId=${encodeURIComponent(childId)}`, {
      method: "GET",
      headers: authHeaders,
    });

    assert(reports.response.status === 200, `Get weekly reports failed: status=${reports.response.status}`);
    assert(reports.json?.ok === true, "Get weekly reports did not return ok=true");

    const weeklyReports = reports.json?.data?.reports ?? [];
    assert(Array.isArray(weeklyReports) && weeklyReports.length >= 1, "Weekly reports should include generated report");

    const childReport = weeklyReports[0];
    assert(childReport.lessonsCompleted >= 1, "Weekly report should count completed lesson");
    assert(childReport.minutesLearned >= 15, "Weekly report minutes should include completion minutes");

    // Read-only report API must not re-queue already sent emails.
    const sendEmailAfterRead = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
      headers: authHeaders,
    });
    assert(
      sendEmailAfterRead.response.status === 200,
      `Send report email after read failed: status=${sendEmailAfterRead.response.status}`,
    );
    assert(sendEmailAfterRead.json?.ok === true, "Send report email after read did not return ok=true");
    const emailResultAfterRead = sendEmailAfterRead.json?.data?.result;
    assert(emailResultAfterRead.queued === 0, "Viewing weekly reports must not re-queue sent report emails");

    console.log(
      JSON.stringify(
        {
          ok: true,
          parentEmail: testEmail,
          childId,
          lessonId,
          reports: weeklyReports.length,
          emailResult,
          emailResultAfterRead,
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
