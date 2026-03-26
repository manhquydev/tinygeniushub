import { createHmac, randomUUID } from "node:crypto";
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

  const match = setCookieHeader.match(/(?:__Secure-|__Host-)?ccth_session=[^;]+/);
  return match ? match[0] : null;
}

function extractAdminSessionCookie(setCookieHeader) {
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

async function signupParent(baseUrl, payload) {
  const signup = await requestJson(baseUrl, "/api/auth/signup", {
    method: "POST",
    body: payload,
  });

  assert(signup.response.status === 200, `Signup failed: status=${signup.response.status}`);
  assert(signup.json?.ok === true, "Signup did not return ok=true");

  const cookie = extractSessionCookie(signup.response.headers.get("set-cookie"));
  assert(cookie, "Signup response missing session cookie");

  const parent = signup.json?.data?.parent;
  const parentId = typeof parent?.id === "string" ? parent.id : null;
  assert(parentId, "Signup response missing parent id");

  return {
    cookie,
    parentId,
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
  return cookie;
}

async function loginAdmin(baseUrl, payload) {
  const login = await requestJson(baseUrl, "/api/admin/auth/login", {
    method: "POST",
    body: payload,
  });

  assert(login.response.status === 200, `Admin login failed: status=${login.response.status}`);
  assert(login.json?.ok === true, "Admin login did not return ok=true");

  const cookie = extractAdminSessionCookie(login.response.headers.get("set-cookie"));
  assert(cookie, "Admin login response missing session cookie");
  return cookie;
}

async function createChild(baseUrl, authHeaders) {
  const create = await requestJson(baseUrl, "/api/children", {
    method: "POST",
    headers: authHeaders,
    body: {
      nickname: "Provider Kid",
      ageBand: "4-5",
    },
  });
  assert(create.response.status === 201, `Create child failed: status=${create.response.status}`);
  assert(create.json?.ok === true, "Create child did not return ok=true");
  const childId = create.json?.data?.child?.id;
  assert(typeof childId === "string" && childId.length > 0, "Create child response missing id");
  return childId;
}

async function getLessonId(baseUrl, authHeaders, childId) {
  const today = await requestJson(baseUrl, `/api/lessons/today?childId=${encodeURIComponent(childId)}`, {
    method: "GET",
    headers: authHeaders,
  });
  assert(today.response.status === 200, `Get today lessons failed: status=${today.response.status}`);
  assert(today.json?.ok === true, "Get today lessons did not return ok=true");
  const lessons = Array.isArray(today.json?.data?.lessons) ? today.json.data.lessons : [];
  assert(lessons.length > 0, "No lessons available for provider e2e");
  const lessonId = lessons[0]?.id;
  assert(typeof lessonId === "string" && lessonId.length > 0, "Lesson id missing");
  return lessonId;
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
  const watchBody = { childId };
  if (session?.watchRequired) {
    assert(typeof session.sessionToken === "string", "Watch-required session missing token");
    const heartbeat = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch/heartbeat`, {
      method: "POST",
      headers: authHeaders,
      body: {
        childId,
        sessionToken: session.sessionToken,
        sequence: 1,
      },
    });
    assert(heartbeat.response.status === 200, `Watch heartbeat failed: status=${heartbeat.response.status}`);
    assert(heartbeat.json?.ok === true, "Watch heartbeat did not return ok=true");
    watchBody.sessionToken = session.sessionToken;
  }

  const watch = await requestJson(baseUrl, `/api/lessons/${lessonId}/watch`, {
    method: "POST",
    headers: authHeaders,
    body: watchBody,
  });
  assert(watch.response.status === 200, `Mark watch failed: status=${watch.response.status}`);
  assert(watch.json?.ok === true, "Mark watch did not return ok=true");

  const complete = await requestJson(baseUrl, `/api/lessons/${lessonId}/complete`, {
    method: "POST",
    headers: authHeaders,
    body: {
      childId,
      quizScore: 92,
      minutesLearned: 16,
      checklist: ["watch", "answer", "repeat"],
    },
  });
  assert(complete.response.status === 200, `Complete lesson failed: status=${complete.response.status}`);
  assert(complete.json?.ok === true, "Complete lesson did not return ok=true");
}

function signWebhookPayload(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

function parseCsvSecrets(raw) {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function signStripeWebhookPayload(rawBody, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function postMockWebhook(baseUrl, payload) {
  const rawWebhookBody = JSON.stringify(payload);
  const webhookSecret = process.env.BILLING_WEBHOOK_SECRET ?? "dev-webhook-secret";
  const webhookSignature = signWebhookPayload(rawWebhookBody, webhookSecret);

  const response = await fetch(`${baseUrl}/api/billing/webhooks/mock`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-provider-signature": webhookSignature,
    },
    body: rawWebhookBody,
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

async function postStripeWebhook(baseUrl, secret, event) {
  const rawStripeWebhookBody = JSON.stringify(event);
  const stripeSignatureHeader = signStripeWebhookPayload(rawStripeWebhookBody, secret);

  const response = await fetch(`${baseUrl}/api/billing/webhooks/stripe`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": stripeSignatureHeader,
    },
    body: rawStripeWebhookBody,
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

async function sendBillingWebhookEvent(baseUrl, input) {
  const {
    billingProvider,
    checkoutData,
    parentId,
    parentEmail,
    eventId,
    eventType,
    transactionId,
    stripeWebhookSecret,
  } = input;

  if (billingProvider === "stripe") {
    const stripeType =
      eventType === "payment_succeeded"
        ? "checkout.session.completed"
        : eventType === "payment_failed"
          ? "checkout.session.async_payment_failed"
          : "charge.refunded";

    const stripeEvent =
      stripeType === "charge.refunded"
        ? {
            id: eventId,
            type: stripeType,
            created: Math.floor(Date.now() / 1000),
            data: {
              object: {
                id: `ch_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
                payment_intent: transactionId,
                amount_refunded: checkoutData.amountVnd,
                metadata: {
                  parentId,
                  parentEmail,
                  planCode: checkoutData.planCode,
                },
                billing_details: {
                  email: parentEmail,
                },
              },
            },
          }
        : {
            id: eventId,
            type: stripeType,
            created: Math.floor(Date.now() / 1000),
            data: {
              object: {
                id: checkoutData.externalSessionId,
                payment_intent: transactionId,
                amount_total: checkoutData.amountVnd,
                metadata: {
                  parentId,
                  parentEmail,
                  planCode: checkoutData.planCode,
                },
                customer_details: {
                  email: parentEmail,
                },
              },
            },
          };

    return postStripeWebhook(baseUrl, stripeWebhookSecret, stripeEvent);
  }

  return postMockWebhook(baseUrl, {
    provider: checkoutData.provider,
    eventId,
    eventType,
    transactionId,
    parentId,
    parentEmail,
    amountVnd: checkoutData.amountVnd,
    planCode: checkoutData.planCode,
    occurredAt: new Date().toISOString(),
    raw: {
      source: "e2e-staging-provider",
      externalSessionId: checkoutData.externalSessionId,
    },
  });
}

async function main() {
  process.env.RATE_LIMIT_TRUST_PROXY = process.env.RATE_LIMIT_TRUST_PROXY ?? "true";
  process.env.BILLING_WEBHOOK_SECRET = process.env.BILLING_WEBHOOK_SECRET ?? "dev-webhook-secret";
  process.env.STRIPE_WEBHOOK_SECRETS =
    process.env.STRIPE_WEBHOOK_SECRETS ?? process.env.BILLING_WEBHOOK_SECRET;
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "demo.admin@cungcontuhoc.io.vn";
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "DemoAdmin123!";
  process.env.ADMIN_EMAILS = process.env.ADMIN_EMAILS ?? adminEmail;
  const billingProvider = process.env.BILLING_PROVIDER ?? "mock_gateway";
  const emailProvider = process.env.REPORT_EMAIL_PROVIDER ?? "mock_email";
  const allowMock = process.env.E2E_STAGING_ALLOW_MOCK === "1";
  const requireRealProviders = process.env.E2E_STAGING_REQUIRE_REAL_PROVIDERS === "1";

  if (!allowMock && billingProvider === "mock_gateway") {
    throw new Error("BILLING_PROVIDER=mock_gateway is not allowed for staging provider e2e. Set E2E_STAGING_ALLOW_MOCK=1 to override.");
  }
  if (requireRealProviders && emailProvider === "mock_email") {
    throw new Error(
      "REPORT_EMAIL_PROVIDER=mock_email is not allowed when E2E_STAGING_REQUIRE_REAL_PROVIDERS=1.",
    );
  }

  if (requireRealProviders && billingProvider === "stripe" && !process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required when BILLING_PROVIDER=stripe and E2E_STAGING_REQUIRE_REAL_PROVIDERS=1.");
  }
  if (billingProvider === "stripe") {
    const stripeWebhookSecrets = parseCsvSecrets(process.env.STRIPE_WEBHOOK_SECRETS);
    if (stripeWebhookSecrets.length === 0) {
      throw new Error("STRIPE_WEBHOOK_SECRETS is required when BILLING_PROVIDER=stripe.");
    }
  }

  if (requireRealProviders && emailProvider === "resend") {
    if (!process.env.REPORT_EMAIL_RESEND_API_KEY) {
      throw new Error("REPORT_EMAIL_RESEND_API_KEY is required when REPORT_EMAIL_PROVIDER=resend.");
    }

    if (!process.env.REPORT_EMAIL_FROM) {
      throw new Error("REPORT_EMAIL_FROM is required when REPORT_EMAIL_PROVIDER=resend.");
    }
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
      `Staging provider e2e requires live dependencies. /api/health/ready returned ${readiness.status}.`,
    );

    const parentEmail = `provider-e2e-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
    const parentPassword = "ProviderFlowPass123!";

    const signupResult = await signupParent(baseUrl, {
      email: parentEmail,
      password: parentPassword,
      displayName: "Provider E2E Parent",
      legalAccepted: true,
    });

    const parentCookie = signupResult.cookie;
    const parentHeaders = { cookie: parentCookie };
    const childId = await createChild(baseUrl, parentHeaders);
    const lessonId = await getLessonId(baseUrl, parentHeaders, childId);
    await completeLessonJourney(baseUrl, parentHeaders, childId, lessonId);

    const checkout = await requestJson(baseUrl, "/api/billing/checkout", {
      method: "POST",
      headers: parentHeaders,
      body: {
        planCode: "YEARLY_STANDARD",
        successPath: "/parent/dashboard?checkout=ok",
        cancelPath: "/pricing?checkout=cancel",
      },
    });

    assert(checkout.response.status === 200, `Checkout failed: status=${checkout.response.status}`);
    assert(checkout.json?.ok === true, "Checkout did not return ok=true");
    const checkoutData = checkout.json?.data?.checkout;
    assert(checkoutData?.provider === billingProvider, `Checkout provider mismatch. expected=${billingProvider}, got=${checkoutData?.provider}`);
    assert(typeof checkoutData?.externalSessionId === "string", "Checkout missing externalSessionId");
    assert(typeof checkoutData?.checkoutUrl === "string", "Checkout missing checkoutUrl");

    const stripeWebhookSecret =
      billingProvider === "stripe" ? parseCsvSecrets(process.env.STRIPE_WEBHOOK_SECRETS)[0] : null;
    if (billingProvider === "stripe") {
      assert(stripeWebhookSecret, "Missing stripe webhook secret for e2e");
    }

    const webhookProvider = checkoutData.provider;
    const webhookSuccessTransactionId =
      billingProvider === "stripe"
        ? `pi_${randomUUID().replace(/-/g, "").slice(0, 24)}`
        : `txn-${randomUUID().slice(0, 12)}`;
    const webhookFailedTransactionId =
      billingProvider === "stripe"
        ? `pi_${randomUUID().replace(/-/g, "").slice(0, 24)}`
        : `txn-${randomUUID().slice(0, 12)}`;
    const successEventId =
      billingProvider === "stripe"
        ? `evt_${randomUUID().replace(/-/g, "").slice(0, 24)}`
        : `evt-${randomUUID().slice(0, 12)}`;
    const failedEventId =
      billingProvider === "stripe"
        ? `evt_${randomUUID().replace(/-/g, "").slice(0, 24)}`
        : `evt-${randomUUID().slice(0, 12)}`;
    const refundEventId =
      billingProvider === "stripe"
        ? `evt_${randomUUID().replace(/-/g, "").slice(0, 24)}`
        : `evt-${randomUUID().slice(0, 12)}`;

    const successWebhook = await sendBillingWebhookEvent(baseUrl, {
      billingProvider,
      checkoutData,
      parentId: signupResult.parentId,
      parentEmail,
      eventId: successEventId,
      eventType: "payment_succeeded",
      transactionId: webhookSuccessTransactionId,
      stripeWebhookSecret,
    });
    assert(successWebhook.response.status === 200, `Success webhook failed: status=${successWebhook.response.status}`);
    assert(successWebhook.json?.ok === true, "Success webhook did not return ok=true");
    assert(
      successWebhook.json?.data?.paymentStatus === "SUCCEEDED",
      "Success webhook should mark payment status as SUCCEEDED",
    );

    const failedWebhook = await sendBillingWebhookEvent(baseUrl, {
      billingProvider,
      checkoutData,
      parentId: signupResult.parentId,
      parentEmail,
      eventId: failedEventId,
      eventType: "payment_failed",
      transactionId: webhookFailedTransactionId,
      stripeWebhookSecret,
    });
    assert(failedWebhook.response.status === 200, `Failed webhook failed: status=${failedWebhook.response.status}`);
    assert(failedWebhook.json?.ok === true, "Failed webhook did not return ok=true");
    assert(failedWebhook.json?.data?.paymentStatus === "FAILED", "Failed webhook should mark payment status as FAILED");

    const refundWebhook = await sendBillingWebhookEvent(baseUrl, {
      billingProvider,
      checkoutData,
      parentId: signupResult.parentId,
      parentEmail,
      eventId: refundEventId,
      eventType: "payment_refunded",
      transactionId: webhookSuccessTransactionId,
      stripeWebhookSecret,
    });
    assert(refundWebhook.response.status === 200, `Refund webhook failed: status=${refundWebhook.response.status}`);
    assert(refundWebhook.json?.ok === true, "Refund webhook did not return ok=true");
    assert(refundWebhook.json?.data?.paymentStatus === "REFUNDED", "Refund webhook should mark payment status as REFUNDED");

    const duplicateRefundWebhook = await sendBillingWebhookEvent(baseUrl, {
      billingProvider,
      checkoutData,
      parentId: signupResult.parentId,
      parentEmail,
      eventId: refundEventId,
      eventType: "payment_refunded",
      transactionId: webhookSuccessTransactionId,
      stripeWebhookSecret,
    });
    assert(
      duplicateRefundWebhook.response.status === 200,
      `Duplicate refund webhook failed: status=${duplicateRefundWebhook.response.status}`,
    );
    assert(duplicateRefundWebhook.json?.ok === true, "Duplicate refund webhook did not return ok=true");
    assert(
      duplicateRefundWebhook.json?.data?.duplicate === true,
      "Duplicate refund webhook should be reported as duplicate=true",
    );

    const adminCookie = await loginAdmin(baseUrl, {
      email: adminEmail,
      password: adminPassword,
    });
    const adminHeaders = { cookie: adminCookie };

    const adminPayments = await requestJson(baseUrl, "/api/admin/payments?limit=100", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(adminPayments.response.status === 200, `Admin payments failed: status=${adminPayments.response.status}`);
    assert(adminPayments.json?.ok === true, "Admin payments did not return ok=true");

    const paymentRows = Array.isArray(adminPayments.json?.data?.payments) ? adminPayments.json.data.payments : [];
    const refundedPayment = paymentRows.find(
      (row) =>
        row.provider === webhookProvider &&
        row.providerTransactionId === webhookSuccessTransactionId &&
        row.status === "REFUNDED",
    );
    assert(Boolean(refundedPayment), "Admin payments should include refunded transition for success transaction");

    const failedPayment = paymentRows.find(
      (row) =>
        row.provider === webhookProvider &&
        row.providerTransactionId === webhookFailedTransactionId &&
        row.status === "FAILED",
    );
    assert(Boolean(failedPayment), "Admin payments should include failed transaction record");

    const adminWebhooks = await requestJson(baseUrl, "/api/admin/webhooks?limit=100", {
      method: "GET",
      headers: adminHeaders,
    });
    assert(adminWebhooks.response.status === 200, `Admin webhooks failed: status=${adminWebhooks.response.status}`);
    assert(adminWebhooks.json?.ok === true, "Admin webhooks did not return ok=true");

    const webhookRows = Array.isArray(adminWebhooks.json?.data?.webhooks) ? adminWebhooks.json.data.webhooks : [];
    const refundEvents = webhookRows.filter((row) => row.provider === webhookProvider && row.eventId === refundEventId);
    assert(refundEvents.length === 1, "Duplicate webhook delivery should not create duplicate webhook event rows");

    const generateReport = await requestJson(baseUrl, "/api/reports/generate", {
      method: "POST",
      headers: parentHeaders,
    });
    assert(generateReport.response.status === 200, `Generate report failed: status=${generateReport.response.status}`);
    assert(generateReport.json?.ok === true, "Generate report did not return ok=true");

    const sendEmail = await requestJson(baseUrl, "/api/reports/send-email", {
      method: "POST",
      headers: parentHeaders,
    });
    assert(sendEmail.response.status === 200, `Send email failed: status=${sendEmail.response.status}`);
    assert(sendEmail.json?.ok === true, "Send email did not return ok=true");
    const emailResult = sendEmail.json?.data?.result;
    assert(emailResult && typeof emailResult === "object", "Send email result payload missing");
    assert(emailResult.provider === emailProvider, `Email provider mismatch. expected=${emailProvider}, got=${emailResult.provider}`);
    assert(Number.isInteger(emailResult.queued), "Send email result missing queued counter");
    assert(Number.isInteger(emailResult.sent), "Send email result missing sent counter");
    assert(emailResult.queued >= 1 || emailResult.sent >= 1, "Expected at least one weekly report email processing candidate");

    console.log(
      JSON.stringify(
        {
          ok: true,
          billingProvider,
          emailProvider,
          checks: {
            checkoutContract: true,
            webhookContract: true,
            webhookTransitionMatrix: true,
            webhookDuplicateIdempotency: true,
            adminPaymentVisibility: true,
            adminWebhookDedupVisibility: true,
            weeklyReportDeliveryContract: true,
          },
          parentEmail,
          transactions: {
            successThenRefunded: webhookSuccessTransactionId,
            failed: webhookFailedTransactionId,
          },
          emailResult,
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
