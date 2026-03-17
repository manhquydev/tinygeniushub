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
