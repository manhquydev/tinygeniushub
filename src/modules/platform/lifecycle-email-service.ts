import { LifecycleEmailType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const PROVIDER = env.REPORT_EMAIL_PROVIDER;
const BASE_URL = "https://cungcontuhoc.io.vn";

function lifecycleLink(path: string, campaign: string) {
  return `${BASE_URL}${path}?utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
}

function buildTrialWelcomeEmail(displayName: string | null) {
  const name = displayName ?? "bạn";
  const dashboardUrl = lifecycleLink("/parent/dashboard", "trial_d0");

  return {
    subject: "Chào mừng đến Cùng Con Tự Học! Bắt đầu trong 2 phút 🎉",
    text: [
      `Xin chào ${name},`,
      "",
      "Cảm ơn bạn đã đăng ký Cùng Con Tự Học.",
      "Bé nhà bạn sắp bắt đầu lộ trình Toán tư duy + Tiếng Anh Phonics với nhịp học 15 phút/ngày.",
      "",
      "Bước tiếp theo (mất khoảng 2 phút):",
      "1) Mở dashboard phụ huynh",
      "2) Chọn bài đầu tiên phù hợp độ tuổi của bé",
      "3) Duy trì lịch học ngắn, đều mỗi ngày",
      "",
      `Bắt đầu ngay: ${dashboardUrl}`,
      "",
      "Không cần thẻ tín dụng · Trial 7 ngày miễn phí.",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD3Email(displayName: string | null) {
  const name = displayName ?? "bạn";
  const reportUrl = lifecycleLink("/parent/reports", "trial_d3_progress");

  return {
    subject: "Báo cáo mini 3 ngày đầu của bé — đang tiến bộ thế nào? 📊",
    text: [
      `Xin chào ${name},`,
      "",
      "Bé đã đi được 3 ngày đầu tiên trong trial.",
      "Đây là mốc quan trọng để giữ nhịp học và xây thói quen đều mỗi ngày.",
      "",
      "Mẹo tăng hiệu quả trong tuần đầu:",
      "• Giữ khung giờ học cố định mỗi ngày",
      "• Sau mỗi bài, phụ huynh hỏi lại bé 1 câu ngắn để củng cố ghi nhớ",
      "• Mỗi buổi học chỉ cần 15 phút, không cần kéo dài",
      "",
      `Xem báo cáo và tiến độ hiện tại: ${reportUrl}`,
      "",
      "Còn 4 ngày trial để kiểm chứng rõ sự phù hợp với gia đình.",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD7Email(displayName: string | null) {
  const name = displayName ?? "bạn";
  const pricingUrl = lifecycleLink("/pricing", "trial_d7_convert");
  const courseUrl = lifecycleLink("/courses", "trial_d7_courses_upsell");

  return {
    subject: "Trial sắp kết thúc — giữ lộ trình học cho bé ngay hôm nay",
    text: [
      `Xin chào ${name},`,
      "",
      "Hôm nay là ngày cuối của 7 ngày dùng thử miễn phí.",
      "Nếu bé đã bắt đầu vào nếp học, đây là lúc giữ lộ trình không gián đoạn.",
      "",
      "Gói năm hiện tại:",
      "• Standard: 799,000 VND/năm (~2,189 VND/ngày)",
      "• Family+: 1,199,000 VND/năm (~3,285 VND/ngày)",
      "",
      "Quyền lợi chính:",
      "✓ Toán tư duy + Tiếng Anh Phonics trọn năm",
      "✓ Báo cáo tuần tự động cho phụ huynh",
      "✓ Hoàn tiền 100% trong 30 ngày đầu nếu chưa phù hợp",
      "",
      `Chọn gói phù hợp: ${pricingUrl}`,
      "",
      "Ưu đãi thêm cho thành viên gói năm: giảm 20% toàn bộ Khóa học Premium.",
      `Xem khóa học: ${courseUrl}`,
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

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

export async function sendLifecycleEmail(parentId: string, type: LifecycleEmailType) {
  const parent = await prisma.parentAccount.findUnique({
    where: { id: parentId },
    select: { email: true, displayName: true },
  });

  if (!parent) return;

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

export async function dispatchPendingLifecycleEmails() {
  const now = new Date();

  const d3Start = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const d3End = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

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
