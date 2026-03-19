import type { CourseBundleSlug } from "@/modules/courses/course-bundles";

export type FitChecklistContent = {
  fitIf: string[];
  notFitIf: string[];
  buyWhen: string[];
};

export type TimelineStage = {
  label: string;
  points: string[];
};

export type TrackCourseLite = {
  id: string;
  slug: string;
  title: string;
  durationDays: number;
  lessonCount: number;
};

// ─── Fit Checklist ───────────────────────────────────────────────────────────

const DEFAULT_FIT_CHECKLIST: FitChecklistContent = {
  fitIf: [
    "Phụ huynh muốn có lộ trình học rõ ràng theo tuần.",
    "Gia đình cần theo dõi tiến độ bằng số bài hoàn thành.",
    "Muốn mua khóa có thể học ngay, không cần setup thêm.",
  ],
  notFitIf: [
    "Bé chưa sẵn sàng tự học tối thiểu 3 buổi mỗi tuần.",
    "Gia đình chưa có khung giờ cố định để duy trì nhịp học.",
    "Đang cần chương trình luyện thi cấp tốc trong thời gian rất ngắn.",
  ],
  buyWhen: [
    "Bạn đã xác định mục tiêu học 8-12 tuần cho con.",
    "Con có thể cam kết hoàn thành bài đều đặn mỗi tuần.",
    "Phụ huynh muốn có dữ liệu rõ ràng để quyết định học tiếp.",
  ],
};

const FIT_CHECKLIST_BY_BUNDLE: Record<CourseBundleSlug, FitChecklistContent> = {
  abeka: {
    fitIf: [
      "Con cần lộ trình học thuật theo cấp lớp từ cơ bản đến nâng cao.",
      "Phụ huynh muốn thấy rõ con đang ở cấp lớp nào và còn bao nhiêu bài.",
      "Gia đình muốn duy trì nhịp học ổn định 4-5 bài mỗi tuần.",
    ],
    notFitIf: [
      "Con đang cần chương trình siêu ngắn để luyện thi gấp.",
      "Bé chưa có thời gian duy trì nhịp học hàng tuần.",
      "Gia đình chỉ muốn học thử ngắn hạn mà chưa xác định mục tiêu dài hơn 1 tháng.",
    ],
    buyWhen: [
      "Bạn đã xác định được cấp lớp xuất phát phù hợp cho con.",
      "Con sẵn sàng hoàn thành các cụm bài theo thứ tự.",
      "Phụ huynh muốn có dữ liệu tiến độ để nâng cấp lộ trình đúng lúc.",
    ],
  },
  "little-fox-en": {
    fitIf: [
      "Con cần tăng nghe hiểu và từ vựng tiếng Anh qua truyện.",
      "Phụ huynh muốn lộ trình chia level rõ ràng để tránh học dàn trải.",
      "Gia đình muốn con luyện tập ngắn hàng ngày thay vì buổi học quá dài.",
    ],
    notFitIf: [
      "Con chưa thể ngồi học liên tục 10-15 phút cho mỗi phiên.",
      "Gia đình muốn lộ trình ngữ pháp chuyên sâu thay vì học qua ngữ cảnh truyện.",
      "Bé đang cần luyện thi chứng chỉ trong thời gian quá gấp.",
    ],
    buyWhen: [
      "Con đã có nền tảng cơ bản và cần tăng nghe hiểu theo lộ trình.",
      "Phụ huynh muốn theo dõi level hiện tại và mục tiêu level kế tiếp.",
      "Gia đình chấp nhận nhịp học đều 4-5 buổi mỗi tuần để tạo phản xạ.",
    ],
  },
  "little-fox-cn": {
    fitIf: [
      "Con bắt đầu hoặc củng cố nền tảng tiếng Trung theo level.",
      "Gia đình muốn mô hình học ngắn, đều và đo tiến độ hàng tuần.",
      "Phụ huynh cần tiêu chí rõ ràng để biết khi nào nên nâng level.",
    ],
    notFitIf: [
      "Con chưa sẵn sàng nghe và nhắc lại từ mới theo chu kỳ.",
      "Gia đình chưa có thời gian học ổn định hàng tuần.",
      "Bạn đang cần lộ trình luyện thi HSK chuyên sâu trong ngắn hạn.",
    ],
    buyWhen: [
      "Con bắt đầu nhận diện âm-từ cơ bản và cần luyện đều.",
      "Phụ huynh muốn theo dõi các mốc level rõ ràng thay vì học rời rạc.",
      "Gia đình muốn có checklist để ra quyết định nâng cấp đúng thời điểm.",
    ],
  },
};

export function getFitChecklist(bundleSlug: CourseBundleSlug | null): FitChecklistContent {
  if (!bundleSlug) return DEFAULT_FIT_CHECKLIST;
  return FIT_CHECKLIST_BY_BUNDLE[bundleSlug];
}

// ─── Outcome Timeline ─────────────────────────────────────────────────────────

const DEFAULT_TIMELINE: TimelineStage[] = [
  { label: "Tuần 1-2", points: ["Làm quen lộ trình và nhịp học.", "Hoàn thành các bài nền tảng đầu tiên."] },
  { label: "Tuần 3-4", points: ["Tăng dần độ chủ động khi học.", "Bắt đầu có checkpoint rõ cho phụ huynh theo dõi."] },
  {
    label: "Sau hoàn thành",
    points: ["Xác định được mức hiện tại của con.", "Có cơ sở rõ ràng để quyết định mua giai đoạn tiếp theo."],
  },
];

const TIMELINE_BY_BUNDLE: Record<CourseBundleSlug, TimelineStage[]> = {
  abeka: [
    {
      label: "Tuần 1-2",
      points: ["Chọn đúng cấp lớp bắt đầu và ổn định nhịp 4-5 bài/tuần.", "Con làm quen bài cốt lõi đầu tiên."],
    },
    {
      label: "Tuần 3-4",
      points: [
        "Con đi đều theo cấp lớp, giảm tình trạng học nhảy cóc.",
        "Phụ huynh thấy rõ mốc hoàn thành theo cụm bài.",
      ],
    },
    {
      label: "Sau hoàn thành",
      points: [
        "Con sẵn sàng chuyển cấp lớp tiếp theo.",
        "Gia đình có dữ liệu tiến độ để quyết định nâng cấp chính xác.",
      ],
    },
  ],
  "little-fox-en": [
    {
      label: "Tuần 1-2",
      points: ["Con làm quen nhịp nghe-đọc bằng truyện ngắn.", "Thiết lập thói quen học ngắn nhưng đều."],
    },
    {
      label: "Tuần 3-4",
      points: [
        "Từ vựng và nghe hiểu cải thiện qua cụm bài liên tục.",
        "Phụ huynh nhìn rõ level hiện tại và tốc độ tiến bộ.",
      ],
    },
    {
      label: "Sau hoàn thành",
      points: ["Con đủ tự tin để lên level cao hơn.", "Gia đình có căn cứ rõ để quyết định mua level tiếp theo."],
    },
  ],
  "little-fox-cn": [
    {
      label: "Tuần 1-2",
      points: ["Con làm quen âm và từ theo level đang học.", "Thiết lập nhịp học ngắn, đều, không quá tải."],
    },
    {
      label: "Tuần 3-4",
      points: [
        "Khả năng nhận diện và ghi nhớ từ cải thiện rõ.",
        "Phụ huynh thấy được mức sẵn sàng trước khi nâng level.",
      ],
    },
    {
      label: "Sau hoàn thành",
      points: [
        "Con sẵn sàng level kế tiếp với nền bền vững hơn.",
        "Gia đình có tiêu chí rõ để mua giai đoạn tiếp.",
      ],
    },
  ],
};

export function getOutcomeTimeline(bundleSlug: CourseBundleSlug | null): TimelineStage[] {
  if (!bundleSlug) return DEFAULT_TIMELINE;
  return TIMELINE_BY_BUNDLE[bundleSlug];
}

// ─── Track / Difference Helpers ───────────────────────────────────────────────

export function extractLastNumber(value: string): number | null {
  const match = value.match(/(\d+)(?!.*\d)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function compareTrackCourses(a: TrackCourseLite, b: TrackCourseLite, entryCourseSlug: string) {
  const aIsEntry = a.slug === entryCourseSlug ? 0 : 1;
  const bIsEntry = b.slug === entryCourseSlug ? 0 : 1;
  if (aIsEntry !== bIsEntry) return aIsEntry - bIsEntry;

  const aLevel = extractLastNumber(a.slug);
  const bLevel = extractLastNumber(b.slug);
  if (aLevel !== null && bLevel !== null && aLevel !== bLevel) return aLevel - bLevel;
  if (aLevel !== null && bLevel === null) return 1;
  if (aLevel === null && bLevel !== null) return -1;

  return a.slug.localeCompare(b.slug, "vi");
}

function formatDelta(currentValue: number, adjacentValue: number, unit: string) {
  const delta = currentValue - adjacentValue;
  if (delta === 0) return `Khối lượng ${unit} tương đương.`;
  if (delta > 0) return `Nhiều hơn ${delta} ${unit}.`;
  return `Ít hơn ${Math.abs(delta)} ${unit}.`;
}

export function buildDifferencePoints(
  current: TrackCourseLite,
  adjacent: TrackCourseLite,
  direction: "previous" | "next",
  courseUnitLabel: string,
) {
  const points: string[] = [];
  const currentLevel = extractLastNumber(current.slug);
  const adjacentLevel = extractLastNumber(adjacent.slug);

  if (currentLevel !== null && adjacentLevel !== null && currentLevel !== adjacentLevel) {
    const levelGap = Math.abs(currentLevel - adjacentLevel);
    if (direction === "previous") {
      points.push(`Mức độ tiếp nối sau khóa trước khoảng ${levelGap} ${courseUnitLabel}.`);
    } else {
      points.push(`Là bước đệm trước khóa kế tiếp khoảng ${levelGap} ${courseUnitLabel}.`);
    }
  }

  points.push(`Số bài so với khóa liền kề: ${formatDelta(current.lessonCount, adjacent.lessonCount, "bài")}`);
  points.push(`Thời hạn truy cập: ${formatDelta(current.durationDays, adjacent.durationDays, "ngày")}`);

  if (direction === "previous") {
    points.push(`Nên chọn khi con đã sẵn sàng đi tiếp từ ${adjacent.title}.`);
  } else {
    points.push(`Nếu con hoàn thành tốt khóa này, có thể nâng lên ${adjacent.title}.`);
  }

  return points;
}

export function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
