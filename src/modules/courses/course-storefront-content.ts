import type { CourseBundleSlug } from "@/modules/courses/course-bundles";

export type BundleStorefrontContent = {
  shortLabel: string;
  parentProblem: string;
  promise: string;
  bestFor: string;
  outcomes: string[];
  parentVisibleValue: string[];
  courseUnitLabel: string;
};

type CourseScopeResolution = {
  scopeLabel: string;
  scopeIndex: number | null;
  rawScopeCode: string | null;
};

export type CourseClaritySnapshot = {
  scopeLabel: string;
  unitLabel: "bài" | "tập";
  pacePerWeek: number;
  week4Target: number;
  week5Target?: number;
  week6Target?: number;
  phaseCounts: {
    foundation: number;
    core: number;
    mastery: number;
  };
  cardOutcomeLine: string;
  detailOutcomeLines: string[];
};

function resolveAbekaScope(courseSlug: string, courseTitle: string): CourseScopeResolution {
  const slugMatch = courseSlug.match(/(?:^|-)(k[45]|g\d{1,2})(?:-|$)/i);
  const titleMatch = courseTitle.match(/\b(K[45]|G\d{1,2})\b/i);
  const scopeCode = (slugMatch?.[1] ?? titleMatch?.[1] ?? "G1").toUpperCase();
  const scopeIndex = Number.parseInt(scopeCode.slice(1), 10);

  return {
    scopeLabel: `Grade ${scopeCode}`,
    scopeIndex: Number.isNaN(scopeIndex) ? null : scopeIndex,
    rawScopeCode: scopeCode,
  };
}

function resolveLittleFoxScope(courseSlug: string, courseTitle: string): CourseScopeResolution {
  const levelFromSlug =
    courseSlug.match(/(?:^|-)level-(\d{1,2})(?:-|$)/i)?.[1] ??
    courseSlug.match(/(?:^|-)l(\d{1,2})(?:-|$)/i)?.[1];
  const levelFromTitle = courseTitle.match(/\bLevel\s*(\d{1,2})\b/i)?.[1];
  const level = Number.parseInt(levelFromSlug ?? levelFromTitle ?? "1", 10);
  const normalizedLevel = Number.isNaN(level) ? 1 : level;

  return {
    scopeLabel: `Level ${normalizedLevel}`,
    scopeIndex: normalizedLevel,
    rawScopeCode: String(normalizedLevel),
  };
}

function resolveScope(bundleSlug: CourseBundleSlug, courseSlug: string, courseTitle: string): CourseScopeResolution {
  if (bundleSlug === "abeka") {
    return resolveAbekaScope(courseSlug, courseTitle);
  }
  return resolveLittleFoxScope(courseSlug, courseTitle);
}

function resolvePacePerWeek(bundleSlug: CourseBundleSlug, scope: CourseScopeResolution) {
  if (bundleSlug === "abeka") {
    return scope.rawScopeCode === "K4" || scope.rawScopeCode === "K5" ? 4 : 5;
  }

  if (bundleSlug === "little-fox-en") {
    if (scope.scopeIndex !== null && scope.scopeIndex <= 2) return 5;
    if (scope.scopeIndex !== null && scope.scopeIndex <= 5) return 4;
    return 3;
  }

  if (scope.scopeIndex !== null && scope.scopeIndex <= 2) return 5;
  return 4;
}

function resolveUnitLabel(bundleSlug: CourseBundleSlug): "bài" | "tập" {
  return bundleSlug === "abeka" ? "bài" : "tập";
}

function resolvePhaseCounts(lessonCount: number) {
  const total = Math.max(1, lessonCount);
  if (total === 1) {
    return { foundation: 1, core: 0, mastery: 0 };
  }
  if (total === 2) {
    return { foundation: 1, core: 1, mastery: 0 };
  }

  let foundation = Math.max(1, Math.round(total * 0.3));
  let core = Math.max(1, Math.round(total * 0.5));
  let mastery = total - foundation - core;

  if (mastery < 1) {
    const required = 1 - mastery;
    const reducibleCore = Math.max(0, core - 1);
    const reduceCoreBy = Math.min(required, reducibleCore);
    core -= reduceCoreBy;

    const remaining = required - reduceCoreBy;
    if (remaining > 0) {
      const reducibleFoundation = Math.max(0, foundation - 1);
      const reduceFoundationBy = Math.min(remaining, reducibleFoundation);
      foundation -= reduceFoundationBy;
    }

    mastery = total - foundation - core;
  }

  return { foundation, core, mastery: Math.max(1, mastery) };
}

export function buildCourseClaritySnapshot(input: {
  bundleSlug: CourseBundleSlug;
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
}): CourseClaritySnapshot {
  const scope = resolveScope(input.bundleSlug, input.courseSlug, input.courseTitle);
  const unitLabel = resolveUnitLabel(input.bundleSlug);
  const pacePerWeek = resolvePacePerWeek(input.bundleSlug, scope);
  const week4Target = pacePerWeek * 4;
  const week5Target = input.bundleSlug === "little-fox-cn" ? pacePerWeek * 5 : undefined;
  const week6Target = input.bundleSlug === "little-fox-en" ? pacePerWeek * 6 : undefined;
  const phaseCounts = resolvePhaseCounts(input.lessonCount);

  const cadenceLine =
    week5Target !== undefined
      ? `Mốc 5 tuần khoảng ${week5Target} ${unitLabel}.`
      : week6Target !== undefined
        ? `Mốc 6 tuần khoảng ${week6Target} ${unitLabel}.`
        : `Mốc 4 tuần khoảng ${week4Target} ${unitLabel}.`;

  const cardOutcomeLine = `${scope.scopeLabel}: ${pacePerWeek} ${unitLabel}/tuần, mốc 4 tuần khoảng ${week4Target} ${unitLabel}.`;
  const detailOutcomeLines = [
    `Giữ nhịp ${pacePerWeek} ${unitLabel}/tuần để con không bị quá tải.`,
    `Sau 4 tuần có thể đạt khoảng ${week4Target} ${unitLabel}. ${cadenceLine}`,
    `Checkpoint theo pha: Foundation ${phaseCounts.foundation} ${unitLabel}, Core ${phaseCounts.core} ${unitLabel}, Mastery ${phaseCounts.mastery} ${unitLabel}.`,
  ];

  return {
    scopeLabel: scope.scopeLabel,
    unitLabel,
    pacePerWeek,
    week4Target,
    week5Target,
    week6Target,
    phaseCounts,
    cardOutcomeLine,
    detailOutcomeLines,
  };
}

const STORE_CONTENT: Record<CourseBundleSlug, BundleStorefrontContent> = {
  abeka: {
    shortLabel: "Nền tảng học thuật có lộ trình",
    parentProblem:
      "Con cần học bài bản theo lớp nhưng phụ huynh không có nhiều thời gian tự soạn lộ trình mỗi tuần.",
    promise:
      "Tách theo từng cấp lớp rõ ràng để ba mẹ chọn đúng điểm bắt đầu, theo dõi tiến bộ và mở rộng dần.",
    bestFor: "Phụ huynh muốn xây nền đọc hiểu - từ vựng - tư duy học thuật theo cấp lớp.",
    outcomes: [
      "Bé học theo từng cấp lớp (K4 đến G12), không bị ngợp vì lộ trình quá dài.",
      "Có checkpoint theo cụm bài để ôn truy hồi và nhớ lâu hơn.",
      "Dễ nâng từ cấp lớp hiện tại lên cấp lớp tiếp theo khi đã hoàn thành.",
    ],
    parentVisibleValue: [
      "Nhìn thấy rõ bé đang học cấp lớp nào và còn bao nhiêu bài.",
      "Mỗi giai đoạn đều có mốc hoàn thành để đánh giá tiến bộ.",
      "Có thể bắt đầu từ cấp lớp phù hợp thay vì mua một khóa quá rộng ngay từ đầu.",
    ],
    courseUnitLabel: "cấp lớp",
  },
  "little-fox-en": {
    shortLabel: "Luyện nghe - đọc tiếng Anh qua truyện",
    parentProblem:
      "Con học tiếng Anh qua video rời rạc, thiếu lộ trình tăng dần độ khó nên dễ chán và khó theo dõi.",
    promise:
      "Chia theo cấp độ 1-9 để phụ huynh thấy rõ con đang ở đâu, học bao nhiêu tập và tiến bộ như thế nào.",
    bestFor: "Phụ huynh muốn con tăng nghe hiểu, từ vựng và phản xạ tiếng Anh qua hình thức học bằng truyện.",
    outcomes: [
      "Nội dung đi từ cấp độ dễ đến khó, phù hợp tiến độ tự nhiên của trẻ.",
      "Bài học ngắn + truy hồi theo cụm giúp tăng ghi nhớ dài hạn.",
      "Có thể học đều mỗi ngày với khối lượng nhỏ, giảm áp lực cho cả con và phụ huynh.",
    ],
    parentVisibleValue: [
      "Thấy rõ cấp độ hiện tại và tổng số tập đã hoàn thành.",
      "Dễ đặt mục tiêu tuần theo số bài cụ thể.",
      "Dễ chuyển cấp độ khi đã hoàn thành giai đoạn hiện tại.",
    ],
    courseUnitLabel: "cấp độ",
  },
  "little-fox-cn": {
    shortLabel: "Lộ trình tiếng Trung cho trẻ mới bắt đầu",
    parentProblem:
      "Tiếng Trung cho trẻ thường thiếu lộ trình rõ theo mức độ, phụ huynh khó chọn điểm bắt đầu.",
    promise:
      "Tách theo cấp độ 1-5 để ba mẹ bắt đầu đúng mức, theo dõi dễ và mở rộng từng bước.",
    bestFor: "Phụ huynh muốn con làm quen tiếng Trung theo nhịp ổn định, có thể theo dõi được hàng tuần.",
    outcomes: [
      "Lộ trình cấp độ rõ ràng, tránh học dàn trải.",
      "Học đều với cụm bài ngắn để giữ thói quen học liên tục.",
      "Dễ đánh giá mức sẵn sàng trước khi chuyển cấp độ tiếp theo.",
    ],
    parentVisibleValue: [
      "Bảng tiến độ rõ theo từng cấp độ.",
      "Thấy ngay tổng số bài, thời lượng truy cập và trạng thái hoàn thành.",
      "Dễ phối hợp cùng con tại nhà nhờ mục tiêu tuần ngắn gọn.",
    ],
    courseUnitLabel: "cấp độ",
  },
};

export function getBundleStorefrontContent(bundleSlug: CourseBundleSlug): BundleStorefrontContent {
  return STORE_CONTENT[bundleSlug];
}
