import type { MascotActionProp, MascotMotionLevel, MascotState, MascotVariant } from "@/components/mascot/types";

export type MascotNarrativeSurface = "auth-entry" | "parent-dashboard";
export type MascotNarrativeTone = "sky" | "indigo" | "rose" | "mint";

export interface MascotNarrativeContext {
  surface: MascotNarrativeSurface;
  hourOfDay?: number;
  hasRecentCompletion?: boolean;
  childrenCount?: number;
  reportsCount?: number;
  paidReferrals?: number;
  rewardedReferrals?: number;
  subscriptionStatus?: string | null;
}

export interface MascotNarrativeScene {
  id: string;
  title: string;
  description: string;
  badge: string;
  variant: MascotVariant;
  state: MascotState;
  actionProp: MascotActionProp;
  size: number;
  tone: MascotNarrativeTone;
  motionLevel?: MascotMotionLevel;
  parentState?: MascotState;
  childState?: MascotState;
  parentActionProp?: MascotActionProp;
  childActionProp?: MascotActionProp;
}

function resolveAuthDayPhase(hourOfDay: number): Pick<MascotNarrativeScene, "state" | "actionProp" | "title" | "description" | "badge"> {
  if (hourOfDay < 6) {
    return {
      state: "sleepy",
      actionProp: "space",
      title: "Canh Giữ Giấc Mơ",
      description: "Khoảnh khắc đêm muộn: linh vật giữ nhịp êm để phụ huynh vẫn thấy an tâm.",
      badge: "Night Ritual",
    };
  }
  if (hourOfDay < 11) {
    return {
      state: "happy",
      actionProp: "music",
      title: "Năng Lượng Buổi Sớm",
      description: "Giai điệu nhẹ mở đầu ngày mới, giúp phiên học đầu tiên của bé đầy hứng thú.",
      badge: "Morning Spark",
    };
  }
  if (hourOfDay < 18) {
    return {
      state: "proud",
      actionProp: "magic",
      title: "Nhịp Tiến Bộ Ban Ngày",
      description: "Phong thái tự tin nhấn mạnh tinh thần chủ động và phát triển liên tục.",
      badge: "Day Momentum",
    };
  }
  return {
    state: "love",
    actionProp: "heart",
    title: "Khoảnh Khắc Gia Đình",
    description: "Buổi tối là thời điểm kết nối: cảm xúc ấm áp giúp bé kết thúc ngày học trọn vẹn.",
    badge: "Evening Bond",
  };
}

function buildAuthNarrative(context: MascotNarrativeContext): MascotNarrativeScene[] {
  const hourOfDay = context.hourOfDay ?? new Date().getHours();
  const phase = resolveAuthDayPhase(hourOfDay);

  return [
    {
      id: "auth-phase",
      variant: "small",
      size: 188,
      tone: "sky",
      motionLevel: "soft",
      ...phase,
    },
    {
      id: "auth-family-trust",
      title: "Cặp Cú Đồng Hành",
      description: "Bố cục duo truyền tải thông điệp: bé và phụ huynh luôn đi cùng một nhịp học.",
      badge: "Family Duo",
      variant: "duo",
      state: "happy",
      actionProp: "none",
      parentState: "proud",
      childState: "playful",
      parentActionProp: "magic",
      childActionProp: "music",
      size: 214,
      tone: "mint",
      motionLevel: "soft",
    },
    {
      id: "auth-focus",
      title: "Chuẩn Bị Phiên Học",
      description: "Sắc thái tập trung tạo cảm giác vào luồng rõ ràng trước khi phụ huynh đăng nhập.",
      badge: "Focus Gate",
      variant: "big",
      state: "thinking",
      actionProp: "reading",
      size: 210,
      tone: "indigo",
      motionLevel: "soft",
    },
    {
      id: "auth-care",
      title: "Tình Cảm Nuôi Dưỡng",
      description: "Nốt cảm xúc mềm giúp trang auth không khô cứng, tăng tính gần gũi và đáng nhớ.",
      badge: "Care Layer",
      variant: "duo",
      state: "love",
      actionProp: "heart",
      parentState: "love",
      childState: "happy",
      parentActionProp: "heart",
      childActionProp: "heart",
      size: 214,
      tone: "rose",
      motionLevel: "soft",
    },
  ];
}

function buildDashboardNarrative(context: MascotNarrativeContext): MascotNarrativeScene[] {
  const childrenCount = context.childrenCount ?? 0;
  const reportsCount = context.reportsCount ?? 0;
  const paidReferrals = context.paidReferrals ?? 0;
  const rewardedReferrals = context.rewardedReferrals ?? 0;
  const hasRecentCompletion = context.hasRecentCompletion ?? false;
  const hasReferralImpact = paidReferrals > 0 || rewardedReferrals > 0;
  const isTrialing = (context.subscriptionStatus ?? "").toUpperCase() === "TRIALING";

  const progressScene: MascotNarrativeScene = hasRecentCompletion
    ? {
        id: "dashboard-progress-celebrate",
        title: "Ăn Mừng Thành Tựu Mới",
        description: "Một bài học vừa hoàn thành sẽ kích hoạt duo ăn mừng để củng cố động lực cho cả nhà.",
        badge: "Progress Pulse",
        variant: "duo",
        state: "celebrating",
        actionProp: "space",
        parentState: "proud",
        childState: "celebrating",
        parentActionProp: "magic",
        childActionProp: "space",
        size: 214,
        tone: "sky",
        motionLevel: "soft",
      }
    : {
        id: "dashboard-progress-steady",
        title: "Tiến Độ Ổn Định",
        description: "Khi chưa có mốc mới, mascot chuyển về nhịp đều để tạo cảm giác bền vững, không gấp gáp.",
        badge: "Steady Growth",
        variant: "duo",
        state: "happy",
        actionProp: "none",
        parentState: "proud",
        childState: "happy",
        parentActionProp: "magic",
        childActionProp: "music",
        size: 214,
        tone: "mint",
        motionLevel: "soft",
      };

  const familyScene: MascotNarrativeScene =
    childrenCount === 0
      ? {
          id: "dashboard-family-empty",
          title: "Gợi Ý Khởi Tạo Hồ Sơ Bé",
          description: "Khi chưa có hồ sơ bé, mascot dùng sắc thái định hướng để tránh cảm giác trống trải.",
          badge: "Onboarding Cue",
          variant: "big",
          state: "thinking",
          actionProp: "reading",
          size: 210,
          tone: "indigo",
          motionLevel: "soft",
        }
      : childrenCount === 1
        ? {
            id: "dashboard-family-single",
            title: "Nhịp Kèm Cặp 1-1",
            description: "Một bé - một nhịp đồng hành sâu: biểu cảm tập trung vào kết nối trực tiếp.",
            badge: "1:1 Journey",
            variant: "duo",
            state: "love",
            actionProp: "heart",
            parentState: "love",
            childState: "playful",
            parentActionProp: "heart",
            childActionProp: "music",
            size: 214,
            tone: "rose",
            motionLevel: "soft",
          }
        : {
            id: "dashboard-family-multi",
            title: "Điều Phối Nhiều Bé",
            description: "Gia đình nhiều hồ sơ cần nhịp điều phối linh hoạt: mascot thể hiện tinh thần tổ chức và vui tươi.",
            badge: "Multi-Kid Flow",
            variant: "big",
            state: "proud",
            actionProp: "magic",
            size: 210,
            tone: "indigo",
            motionLevel: "soft",
          };

  const reportScene: MascotNarrativeScene =
    reportsCount > 0
      ? {
          id: "dashboard-report-ready",
          title: "Báo Cáo Đã Hình Thành",
          description: "Khi dữ liệu báo cáo đã có, mascot giữ trạng thái tự tin để nhấn mạnh tiến trình có bằng chứng.",
          badge: "Insight Ready",
          variant: "small",
          state: "proud",
          actionProp: "reading",
          size: 188,
          tone: "mint",
          motionLevel: "soft",
        }
      : {
          id: "dashboard-report-waiting",
          title: "Đang Tích Lũy Dữ Liệu",
          description: "Giai đoạn đầu chưa có báo cáo: mascot ở trạng thái suy nghĩ để truyền tín hiệu chờ đợi tích cực.",
          badge: "Insight Building",
          variant: "small",
          state: "thinking",
          actionProp: "reading",
          size: 188,
          tone: "sky",
          motionLevel: "soft",
        };

  const referralScene: MascotNarrativeScene = hasReferralImpact
    ? {
        id: "dashboard-referral-active",
        title: "Hiệu Ứng Lan Tỏa",
        description: "Khi referral có kết quả, mascot chuyển sang sắc thái ấm áp để tôn vinh đóng góp của phụ huynh.",
        badge: "Community Impact",
        variant: "duo",
        state: "love",
        actionProp: "heart",
        parentState: "love",
        childState: "happy",
        parentActionProp: "heart",
        childActionProp: "heart",
        size: 214,
        tone: "rose",
        motionLevel: "soft",
      }
    : {
        id: "dashboard-referral-seed",
        title: isTrialing ? "Ươm Mầm Chia Sẻ" : "Nuôi Dưỡng Mạng Lưới",
        description: isTrialing
          ? "Trong giai đoạn trial, mascot giữ sắc thái nhẹ nhàng để khuyến khích chia sẻ tự nhiên."
          : "Khi đã ổn định gói dịch vụ, mascot nhấn vào nhịp phát triển cộng đồng bền vững.",
        badge: isTrialing ? "Trial Seed" : "Growth Network",
        variant: "small",
        state: "playful",
        actionProp: "music",
        size: 188,
        tone: "sky",
        motionLevel: "soft",
      };

  return [progressScene, familyScene, reportScene, referralScene];
}

export function buildMascotNarrativeMap(context: MascotNarrativeContext): MascotNarrativeScene[] {
  if (context.surface === "auth-entry") {
    return buildAuthNarrative(context);
  }
  return buildDashboardNarrative(context);
}
