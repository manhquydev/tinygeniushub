import { LifecycleEmailType, SubscriptionStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

const PROVIDER = env.REPORT_EMAIL_PROVIDER;

// ---- Email templates ----

function buildTrialWelcomeEmail(displayName: string | null) {
  const name = displayName ?? "bạn";
  return {
    subject: "Chào mừng đến Cùng Con Tự Học — lộ trình Toán & Tiếng Anh cho bé!",
    text: [
      `Chào ${name},`,
      "",
      "Cảm ơn bạn đã đăng ký Cùng Con Tự Học!",
      "",
      "Bé nhà bạn sắp được học Toán tư duy + Tiếng Anh Phonics qua video ngắn và bài tập thú vị — chỉ 15 phút mỗi ngày.",
      "",
      "Bạn có 7 ngày dùng thử miễn phí. Sau 7 ngày, chọn gói 799.000đ/năm để tiếp tục hành trình cùng bé.",
      "",
      "👉 Bắt đầu bài học đầu tiên: https://cungcontuhoc.io.vn/parent/dashboard",
      "",
      "Nếu cần hỗ trợ, trả lời email này nhé.",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD3Email(displayName: string | null) {
  const name = displayName ?? "bạn";
  return {
    subject: "Bé nhà bạn đã học được gì sau 3 ngày? 🌟",
    text: [
      `Chào ${name},`,
      "",
      "Đã 3 ngày từ khi bé bắt đầu Cùng Con Tự Học!",
      "",
      "Mẹo để bé tiến bộ nhanh hơn:",
      "• Học đúng giờ mỗi ngày — não bé sẽ quen thói quen trong 7 ngày",
      "• Bé học xong, bố/mẹ hỏi lại 1 câu về bài — giúp bé nhớ sâu hơn gấp 2",
      "• Toán tư duy: đừng vội, mỗi bài 15 phút là đủ",
      "",
      "👉 Xem tiến độ của bé: https://cungcontuhoc.io.vn/parent/dashboard",
      "",
      "Còn 4 ngày dùng thử. Nâng cấp ngay hôm nay để không gián đoạn lộ trình của bé.",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD7Email(displayName: string | null) {
  const name = displayName ?? "bạn";
  return {
    subject: "Hôm nay là ngày cuối dùng thử — giữ lộ trình cho bé nhé!",
    text: [
      `Chào ${name},`,
      "",
      "Hôm nay là ngày cuối của 7 ngày dùng thử miễn phí.",
      "",
      "Nếu bé đã bắt đầu yêu thích học — đừng để gián đoạn.",
      "",
      "Gói Standard: 799.000đ/năm (~2.189đ/ngày)",
      "✓ Toán tư duy + Tiếng Anh Phonics cho bé cả năm",
      "✓ Báo cáo tuần tự động",
      "✓ Hoàn tiền 100% trong 30 ngày nếu không hài lòng",
      "",
      "👉 Nâng cấp ngay: https://cungcontuhoc.io.vn/pricing",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

// ---- Send via Resend ----

async function sendEmail(to: string, subject: string, text: string) {
  if (PROVIDER === "mock_email") {
    console.log(`[lifecycle-email] mock send to=${to} subject="${subject}"`);
    return;
  }

  if (PROVIDER === "resend") {
    const recipient = env.REPORT_EMAIL_TO_OVERRIDE ?? to;
    const payload = {
      from: env.REPORT_EMAIL_FROM,
      to: [recipient],
      subject,
      text,
      ...(env.REPORT_EMAIL_REPLY_TO ? { reply_to: env.REPORT_EMAIL_REPLY_TO } : {}),
      tags: [
        { name: "feature", value: "lifecycle" },
        { name: "environment", value: env.NODE_ENV },
      ],
    };

    const response = await fetch(`${env.REPORT_EMAIL_RESEND_API_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.REPORT_EMAIL_RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Resend lifecycle email failed: status=${response.status}`);
    }
    return;
  }

  throw new Error(`Unsupported email provider: ${PROVIDER}`);
}

// ---- Public API ----

export async function sendLifecycleEmail(parentId: string, type: LifecycleEmailType) {
  const parent = await prisma.parentAccount.findUnique({
    where: { id: parentId },
    select: { email: true, displayName: true },
  });

  if (!parent) return;

  // idempotency: skip if already sent
  const existing = await prisma.lifecycleEmailLog.findUnique({
    where: { parentId_type: { parentId, type } },
  });
  if (existing) return;

  let subject: string;
  let text: string;

  if (type === LifecycleEmailType.TRIAL_WELCOME) {
    ({ subject, text } = buildTrialWelcomeEmail(parent.displayName));
  } else if (type === LifecycleEmailType.TRIAL_D3) {
    ({ subject, text } = buildTrialD3Email(parent.displayName));
  } else {
    ({ subject, text } = buildTrialD7Email(parent.displayName));
  }

  await sendEmail(parent.email, subject, text);

  await prisma.lifecycleEmailLog.create({
    data: { parentId, type },
  });
}

// ---- Batch job: dispatch pending D3 / D7 for all trialing users ----

export async function dispatchPendingLifecycleEmails() {
  const now = new Date();

  // D3: trial started 3-4 days ago, hasn't received TRIAL_D3 yet
  const d3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const d3End = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // D7: trial started 7-8 days ago, hasn't received TRIAL_D7 yet
  const d7Start = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const d7End = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [d3Candidates, d7Candidates] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: { gte: d3Start, lt: d3End },
        parent: { lifecycleEmails: { none: { type: LifecycleEmailType.TRIAL_D3 } } },
      },
      select: { parentId: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: { gte: d7Start, lt: d7End },
        parent: { lifecycleEmails: { none: { type: LifecycleEmailType.TRIAL_D7 } } },
      },
      select: { parentId: true },
    }),
  ]);

  let sent = 0;
  let failed = 0;

  for (const sub of d3Candidates) {
    try {
      await sendLifecycleEmail(sub.parentId, LifecycleEmailType.TRIAL_D3);
      sent++;
    } catch {
      failed++;
    }
  }

  for (const sub of d7Candidates) {
    try {
      await sendLifecycleEmail(sub.parentId, LifecycleEmailType.TRIAL_D7);
      sent++;
    } catch {
      failed++;
    }
  }

  return { d3: d3Candidates.length, d7: d7Candidates.length, sent, failed };
}
