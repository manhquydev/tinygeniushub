import { randomUUID, createHmac } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  EmailStatus,
  PaymentStatus,
  RewardType,
  SubscriptionStatus,
  WebhookStatus,
  PrismaClient,
} from "@prisma/client";

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

async function enrollTrialFriendlyCourse(baseUrl, authHeaders, childId) {
  const coursesResponse = await requestJson(baseUrl, "/api/courses", {
    method: "GET",
    headers: authHeaders,
  });
  assert(coursesResponse.response.status === 200, `List courses failed: status=${coursesResponse.response.status}`);
  assert(coursesResponse.json?.ok === true, "List courses did not return ok=true");

  const availableCourses = Array.isArray(coursesResponse.json?.data?.courses) ? coursesResponse.json.data.courses : [];
  assert(availableCourses.length > 0, "No published courses available for integrity enrollment");

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
}

async function sendSignedBillingWebhook(baseUrl, payload, secret) {
  const rawBody = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
  const headers = new Headers({
    "content-type": "application/json",
    "x-provider-signature": signature,
  });

  const clientIp = process.env.E2E_CLIENT_IP;
  if (clientIp) {
    headers.set("x-real-ip", clientIp);
    headers.set("x-forwarded-for", clientIp);
  }

  const response = await fetch(`${baseUrl}/api/billing/webhooks/mock`, {
    method: "POST",
    headers,
    body: rawBody,
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

async function completeLessonJourney(baseUrl, authHeaders, childId, lessonId) {
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
    assert(markWatch.json?.data?.watch?.readyForCompletion === true, "Mark watch did not reach completion readiness");
  }
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.E2E_CLIENT_IP = process.env.E2E_CLIENT_IP ?? `198.51.100.${20 + Math.floor(Math.random() * 180)}`;

  const webhookSecret = process.env.BILLING_WEBHOOK_SECRET ?? "dev-webhook-secret";

  await runBuild();

  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);
  const prisma = new PrismaClient();

  try {
    await waitForReady(baseUrl);

    const readiness = await fetch(`${baseUrl}/api/health/ready`);
    assert(
      readiness.status === 200,
      `Integrity e2e requires live dependencies. /api/health/ready returned ${readiness.status}.`,
    );

    const parentEmail = `integrity-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const parentPassword = "IntegrityPass123!";

    const signup = await requestJson(baseUrl, "/api/auth/signup", {
      method: "POST",
      body: {
        email: parentEmail,
        password: parentPassword,
        displayName: "Integrity Parent",
      },
    });
    assert(signup.response.status === 200, `Signup failed: status=${signup.response.status}`);
    assert(signup.json?.ok === true, "Signup did not return ok=true");
    const parentId = signup.json?.data?.parent?.id;
    assert(typeof parentId === "string" && parentId.length > 0, "Signup response missing parent id");

    const sessionCookie = getSessionCookie(signup.response.headers.get("set-cookie"));
    assert(sessionCookie, "Missing session cookie from signup");
    const authHeaders = { cookie: sessionCookie };

    const parent = await prisma.parentAccount.findUnique({
      where: { id: parentId },
      include: {
        preferences: true,
        subscription: true,
      },
    });
    assert(parent, "Parent record missing after signup");
    assert(parent.email === parentEmail.toLowerCase(), "Parent email not normalized as expected");
    assert(parent.subscription?.status === SubscriptionStatus.TRIALING, "Signup should create trial subscription");
    assert(parent.preferences !== null, "Signup should create parent preferences");

    const authUser = await prisma.user.findUnique({
      where: { id: parentId },
    });
    assert(authUser?.parentId === parentId, "Signup should create mapped auth user");

    const authAccount = await prisma.account.findUnique({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: parentId,
        },
      },
    });
    assert(authAccount?.userId === parentId, "Signup should create credential account mapping");

    const createChild = await requestJson(baseUrl, "/api/children", {
      method: "POST",
      headers: authHeaders,
      body: {
        nickname: "Integrity Kid",
        ageBand: "4-5",
      },
    });
    assert(createChild.response.status === 201, `Create child failed: status=${createChild.response.status}`);
    assert(createChild.json?.ok === true, "Create child did not return ok=true");

    const childId = createChild.json?.data?.child?.id;
    assert(typeof childId === "string" && childId.length > 0, "Create child response missing child id");
    await enrollTrialFriendlyCourse(baseUrl, authHeaders, childId);

    const todayMission = await requestJson(baseUrl, `/api/lessons/today?childId=${encodeURIComponent(childId)}`, {
      method: "GET",
      headers: authHeaders,
    });
    assert(todayMission.response.status === 200, `Today mission failed: status=${todayMission.response.status}`);
    assert(todayMission.json?.ok === true, "Today mission did not return ok=true");

    const lessons = todayMission.json?.data?.lessons;
    assert(Array.isArray(lessons) && lessons.length > 0, "No lessons returned for today mission");
    const selectedLesson = lessons.find((lessonItem) => lessonItem?.trialEnabled === true) ?? lessons[0];
    const lessonId = selectedLesson?.id;
    assert(typeof lessonId === "string" && lessonId.length > 0, "Today mission lesson missing id");

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            level: {
              include: {
                track: true,
              },
            },
          },
        },
      },
    });
    assert(lesson, "Lesson not found in database");

    await completeLessonJourney(baseUrl, authHeaders, childId, lessonId);

    const completionPayload = {
      childId,
      quizScore: 92,
      minutesLearned: 16,
      checklist: ["watch", "answer", "repeat"],
    };

    const completion = await requestJson(baseUrl, `/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: authHeaders,
      body: completionPayload,
    });
    assert(completion.response.status === 200, `Complete lesson failed: status=${completion.response.status}`);
    assert(completion.json?.ok === true, "Complete lesson did not return ok=true");
    assert(completion.json?.data?.idempotent === false, "First completion should not be idempotent");

    const completionRetry = await requestJson(baseUrl, `/api/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: authHeaders,
      body: completionPayload,
    });
    assert(
      completionRetry.response.status === 200,
      `Retry completion failed: status=${completionRetry.response.status}`,
    );
    assert(completionRetry.json?.ok === true, "Retry completion did not return ok=true");
    assert(completionRetry.json?.data?.idempotent === true, "Retry completion should be idempotent");

    const completionRows = await prisma.lessonCompletion.findMany({
      where: {
        childId,
        lessonId,
      },
      include: {
        evidence: true,
      },
    });
    assert(completionRows.length === 1, "Lesson completion must be unique per child/lesson");
    const completionId = completionRows[0].id;

    const evidenceCount = await prisma.evidence.count({
      where: {
        completionId,
      },
    });
    assert(evidenceCount === 1, "Lesson completion should create exactly one evidence record");

    const rewardCount = await prisma.rewardGrant.count({
      where: {
        childId,
        lessonId,
        type: RewardType.LESSON_COMPLETED,
      },
    });
    assert(rewardCount === 1, "Reward grant must be unique for child/lesson/type");

    const progressState = await prisma.progressState.findUnique({
      where: {
        childId_trackCode: {
          childId,
          trackCode: lesson.unit.level.track.code,
        },
      },
    });
    assert(progressState !== null, "Progress state should be created after completion");
    assert(progressState.lastLessonCompletedAt !== null, "Progress state should track last completion timestamp");

    const generateReport1 = await requestJson(baseUrl, "/api/reports/generate", {
      method: "POST",
      headers: authHeaders,
    });
    assert(generateReport1.response.status === 200, `Generate report #1 failed: status=${generateReport1.response.status}`);
    assert(generateReport1.json?.ok === true, "Generate report #1 did not return ok=true");

    const generateReport2 = await requestJson(baseUrl, "/api/reports/generate", {
      method: "POST",
      headers: authHeaders,
    });
    assert(generateReport2.response.status === 200, `Generate report #2 failed: status=${generateReport2.response.status}`);
    assert(generateReport2.json?.ok === true, "Generate report #2 did not return ok=true");

    const latestWeeklyReport = await prisma.weeklyReport.findFirst({
      where: {
        childId,
      },
      orderBy: {
        generatedAt: "desc",
      },
    });
    assert(latestWeeklyReport !== null, "Weekly report should exist after generation");
    assert(
      latestWeeklyReport.lessonsCompleted >= 1 && latestWeeklyReport.minutesLearned >= completionPayload.minutesLearned,
      "Weekly report aggregates should include lesson completion data",
    );
    assert(latestWeeklyReport.emailStatus === EmailStatus.QUEUED, "Weekly report should be queued before email delivery");

    const weeklyRowCountForWindow = await prisma.weeklyReport.count({
      where: {
        childId,
        weekStart: latestWeeklyReport.weekStart,
      },
    });
    assert(weeklyRowCountForWindow === 1, "Weekly report must be unique for child/weekStart");

    const sendEmail1 = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
      headers: authHeaders,
    });
    assert(sendEmail1.response.status === 200, `Send email #1 failed: status=${sendEmail1.response.status}`);
    assert(sendEmail1.json?.ok === true, "Send email #1 did not return ok=true");
    assert((sendEmail1.json?.data?.result?.queued ?? 0) >= 1, "First send-email should process queued reports");

    const sendEmail2 = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
      headers: authHeaders,
    });
    assert(sendEmail2.response.status === 200, `Send email #2 failed: status=${sendEmail2.response.status}`);
    assert(sendEmail2.json?.ok === true, "Send email #2 did not return ok=true");
    assert(sendEmail2.json?.data?.result?.queued === 0, "Second send-email should have no queued report left");

    const latestWeeklyReportAfterSend = await prisma.weeklyReport.findUnique({
      where: {
        id: latestWeeklyReport.id,
      },
    });
    assert(latestWeeklyReportAfterSend?.emailStatus === EmailStatus.SENT, "Weekly report should be marked as SENT");
    assert(latestWeeklyReportAfterSend?.deliveredEmailAt !== null, "Weekly report should store deliveredEmailAt");

    const provider = "mock_gateway";
    const transactionId = `txn-${randomUUID()}`;
    const paymentSucceededEventId = `evt-${randomUUID()}`;
    const succeededPayload = {
      provider,
      eventId: paymentSucceededEventId,
      eventType: "payment_succeeded",
      transactionId,
      parentEmail,
      amountVnd: 790000,
      planCode: "YEARLY_STANDARD",
      occurredAt: new Date().toISOString(),
    };

    const webhookSucceeded = await sendSignedBillingWebhook(baseUrl, succeededPayload, webhookSecret);
    assert(webhookSucceeded.response.status === 200, `Webhook success failed: status=${webhookSucceeded.response.status}`);
    assert(webhookSucceeded.json?.ok === true, "Webhook success did not return ok=true");
    assert(webhookSucceeded.json?.data?.duplicate === false, "First webhook event should not be duplicate");

    const webhookSucceededRetry = await sendSignedBillingWebhook(baseUrl, succeededPayload, webhookSecret);
    assert(
      webhookSucceededRetry.response.status === 200,
      `Webhook retry failed: status=${webhookSucceededRetry.response.status}`,
    );
    assert(webhookSucceededRetry.json?.ok === true, "Webhook retry did not return ok=true");
    assert(webhookSucceededRetry.json?.data?.duplicate === true, "Repeated webhook event should be duplicate");

    const paymentRefundedEventId = `evt-${randomUUID()}`;
    const refundedPayload = {
      ...succeededPayload,
      eventId: paymentRefundedEventId,
      eventType: "payment_refunded",
    };
    const webhookRefunded = await sendSignedBillingWebhook(baseUrl, refundedPayload, webhookSecret);
    assert(webhookRefunded.response.status === 200, `Webhook refund failed: status=${webhookRefunded.response.status}`);
    assert(webhookRefunded.json?.ok === true, "Webhook refund did not return ok=true");
    assert(webhookRefunded.json?.data?.duplicate === false, "New refund event should not be duplicate");

    const succeededEventRows = await prisma.webhookEvent.count({
      where: {
        provider,
        eventId: paymentSucceededEventId,
        status: WebhookStatus.PROCESSED,
      },
    });
    assert(succeededEventRows === 1, "Processed webhook row should stay unique for provider/eventId");

    const refundedEventRows = await prisma.webhookEvent.count({
      where: {
        provider,
        eventId: paymentRefundedEventId,
        status: WebhookStatus.PROCESSED,
      },
    });
    assert(refundedEventRows === 1, "Refund webhook row should be processed exactly once");

    const paymentRows = await prisma.paymentRecord.findMany({
      where: {
        provider,
        providerTransactionId: transactionId,
      },
    });
    assert(paymentRows.length === 1, "One provider transaction id must map to one payment record");
    assert(paymentRows[0].status === PaymentStatus.REFUNDED, "Payment record status should reflect latest webhook outcome");

    const subscriptionAfterWebhooks = await prisma.subscription.findUnique({
      where: {
        parentId,
      },
    });
    assert(subscriptionAfterWebhooks !== null, "Subscription should exist after webhook processing");
    assert(
      subscriptionAfterWebhooks.status === SubscriptionStatus.REFUNDED,
      "Refunded webhook should transition subscription to REFUNDED",
    );
    assert(subscriptionAfterWebhooks.autoRenew === false, "Refunded webhook should disable auto-renew");

    const auditRows = await prisma.auditLog.count({
      where: {
        action: "billing.webhook.processed",
        resourceType: "payment",
        resourceId: transactionId,
      },
    });
    assert(auditRows === 2, "Billing webhook processing should write one audit entry per unique webhook event");

    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: {
            signupAtomicRecords: true,
            completionIdempotent: true,
            rewardUniquePerLesson: true,
            weeklyReportUpsertUnique: true,
            weeklyEmailQueueConsistent: true,
            webhookEventIdempotent: true,
            paymentTransactionUnique: true,
            subscriptionTransitionConsistent: true,
            webhookAuditTrailPresent: true,
          },
          entities: {
            parentId,
            childId,
            lessonId,
            transactionId,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
