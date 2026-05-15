export const COURSE_LEVEL_CHANGE_REASON_CODES = [
  "too_easy",
  "too_hard",
  "pace_mismatch",
  "wrong_track",
  "other",
] as const;

export type CourseLevelChangeReasonCode = (typeof COURSE_LEVEL_CHANGE_REASON_CODES)[number];

export const COURSE_LEVEL_CHANGE_REASON_LABELS: Record<CourseLevelChangeReasonCode, string> = {
  too_easy: "The lesson is too easy",
  too_hard: "The lesson is too difficult",
  pace_mismatch: "The learning rhythm is not appropriate",
  wrong_track: "Need to switch to another route",
  other: "Other reasons",
};
