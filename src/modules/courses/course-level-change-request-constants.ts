export const COURSE_LEVEL_CHANGE_REASON_CODES = [
  "too_easy",
  "too_hard",
  "pace_mismatch",
  "wrong_track",
  "other",
] as const;

export type CourseLevelChangeReasonCode = (typeof COURSE_LEVEL_CHANGE_REASON_CODES)[number];

export const COURSE_LEVEL_CHANGE_REASON_LABELS: Record<CourseLevelChangeReasonCode, string> = {
  too_easy: "Bài học quá dễ",
  too_hard: "Bài học quá khó",
  pace_mismatch: "Nhịp học chưa phù hợp",
  wrong_track: "Cần chuyển sang lộ trình khác",
  other: "Lý do khác",
};
