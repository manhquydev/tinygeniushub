import { LifecycleEmailType } from "@prisma/client";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";

type BuildLifecycleEmailInput = {
  displayName: string | null;
  renewalEndDate?: Date | null;
};

type LifecycleEmailContent = {
  subject: string;
  text: string;
};

function lifecycleLink(path: string, campaign: string) {
  return `${resolveEmailPublicBaseUrl()}${path}?utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
}

function formatDateVi(date: Date) {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parentName(displayName: string | null) {
  return displayName?.trim() || "bạn";
}

function buildTrialWelcomeEmail(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const dashboardUrl = lifecycleLink("/parent/dashboard", "trial_d0");
  return {
    subject: "Chào mừng bạn đến Cùng Con Tự Học - bắt đầu trong 2 phút",
    text: [
      `Xin chào ${name},`,
      "",
      "Cảm ơn bạn đã đăng ký Cùng Con Tự Học.",
      "Bé nhà bạn sắp bắt đầu lộ trình Toán tư duy + Tiếng Anh Phonics với nhịp học 15 phút/ngày.",
      "",
      "Bắt đầu ngay:",
      dashboardUrl,
      "",
      "Không cần thẻ tín dụng · Trial 7 ngày miễn phí.",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD1Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const dashboardUrl = lifecycleLink("/parent/dashboard", "trial_d1_activation");
  return {
    subject: "Nhắc nhẹ ngày 1 - giúp bé hoàn thành bài đầu tiên hôm nay",
    text: [
      `Xin chào ${name},`,
      "",
      "Ngày đầu tiên là mốc quan trọng để bé vào nếp học.",
      "Chỉ cần 15 phút để hoàn thành bài đầu tiên và tạo đà cho cả tuần.",
      "",
      `Mở dashboard: ${dashboardUrl}`,
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD3Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const reportUrl = lifecycleLink("/parent/reports", "trial_d3_progress");
  return {
    subject: "Báo cáo mini 3 ngày đầu của bé — đang tiến bộ thế nào? 📊",
    text: [
      `Xin chào ${name},`,
      "",
      "Bé đã đi được 3 ngày đầu tiên trong trial.",
      "Đây là mốc quan trọng để giữ nhịp học và xây thói quen đều mỗi ngày.",
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

function buildTrialD5Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const referralUrl = lifecycleLink("/auth/signup", "trial_d5_referral");
  return {
    subject: "Ngày 5 trial - chia sẻ cho phụ huynh khác để nhận thêm ưu đãi",
    text: [
      `Xin chào ${name},`,
      "",
      "Nếu gia đình thấy hành trình học của bé đang phù hợp, bạn có thể giới thiệu cho phụ huynh khác.",
      "Mỗi lượt giới thiệu thành công sẽ giúp cả hai gia đình nhận thêm ưu đãi theo chương trình giới thiệu hiện hành.",
      "",
      `Chia sẻ tại đây: ${referralUrl}`,
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildTrialD7Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const pricingUrl = lifecycleLink("/pricing", "trial_d7_convert");
  return {
    subject: "Trial sắp kết thúc — giữ lộ trình học cho bé ngay hôm nay",
    text: [
      `Xin chào ${name},`,
      "",
      "Hôm nay là ngày cuối của 7 ngày dùng thử miễn phí.",
      "Nếu bé đã bắt đầu vào nếp học, đây là lúc giữ lộ trình không gián đoạn.",
      "",
      "Gói năm hiện tại:",
      "• Standard: 799,000 VND/năm",
      "• Family+: 1,199,000 VND/năm",
      "",
      `Chọn gói phù hợp: ${pricingUrl}`,
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildWinbackD30Email(displayName: string | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const dashboardUrl = lifecycleLink("/parent/dashboard", "winback_d30");
  return {
    subject: "Bé nhớ bạn rồi - quay lại học 15 phút hôm nay nhé",
    text: [
      `Xin chào ${name},`,
      "",
      "Đã một thời gian gia đình chưa quay lại lộ trình học.",
      "Chỉ cần 15 phút hôm nay để khởi động lại thói quen học tập của bé.",
      "",
      `Quay lại dashboard: ${dashboardUrl}`,
      "",
      "Nếu cần hỗ trợ, bạn chỉ cần phản hồi email này.",
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

function buildRenewal14dEmail(displayName: string | null, renewalEndDate?: Date | null): LifecycleEmailContent {
  const name = parentName(displayName);
  const pricingUrl = lifecycleLink("/pricing", "renewal_14d");
  const renewalDateLine = renewalEndDate
    ? `Gói hiện tại sẽ hết hạn vào ngày ${formatDateVi(renewalEndDate)}.`
    : "Gói hiện tại của bạn sắp đến hạn gia hạn.";

  return {
    subject: "Nhắc gia hạn gói học trước 14 ngày để không gián đoạn lộ trình",
    text: [
      `Xin chào ${name},`,
      "",
      renewalDateLine,
      "Gia hạn sớm giúp giữ nhịp học liên tục cho bé.",
      "",
      `Gia hạn tại đây: ${pricingUrl}`,
      "",
      "Thân,",
      "Đội ngũ Cùng Con Tự Học",
    ].join("\n"),
  };
}

export function buildLifecycleEmailContent(
  type: LifecycleEmailType,
  input: BuildLifecycleEmailInput,
): LifecycleEmailContent {
  if (type === LifecycleEmailType.TRIAL_WELCOME) return buildTrialWelcomeEmail(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D1) return buildTrialD1Email(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D3) return buildTrialD3Email(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D5) return buildTrialD5Email(input.displayName);
  if (type === LifecycleEmailType.TRIAL_D7) return buildTrialD7Email(input.displayName);
  if (type === LifecycleEmailType.WINBACK_D30) return buildWinbackD30Email(input.displayName);
  return buildRenewal14dEmail(input.displayName, input.renewalEndDate);
}

