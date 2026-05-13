export const STOREFRONT_COURSE_CONTRACT_VERSION = "2026-04-05";

type SourceTag = "input" | "fallback";

export type StorefrontCourseContract = {
  trackLabel: string;
  lessonCount: number;
  durationDays: number;
  videoCount: number;
  source: {
    trackLabel: SourceTag;
    lessonCount: SourceTag;
    durationDays: SourceTag;
    videoCount: SourceTag;
  };
};

type Input = {
  trackLabel?: string | null;
  lessonCount?: number | null;
  durationDays?: number | null;
  videoCount?: number | null;
};

function normalizePositiveInt(value: number | null | undefined): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : null;
}

function fallbackDurationFromLessons(lessonCount: number) {
  // Keep duration conservative when source duration is missing.
  return Math.max(28, Math.ceil(lessonCount / 5) * 7);
}

export function buildStorefrontCourseContract(input: Input): StorefrontCourseContract {
  const normalizedTrackLabel = input.trackLabel?.trim();
  const trackLabel = normalizedTrackLabel ? normalizedTrackLabel : "Study roadmap";

  const inputLessonCount = normalizePositiveInt(input.lessonCount);
  const inputVideoCount = normalizePositiveInt(input.videoCount);
  const inputDurationDays = normalizePositiveInt(input.durationDays);

  const lessonCount = inputLessonCount ?? inputVideoCount ?? 1;
  const videoCount = inputVideoCount ?? lessonCount;
  const durationDays = inputDurationDays ?? fallbackDurationFromLessons(lessonCount);

  return {
    trackLabel,
    lessonCount,
    durationDays,
    videoCount,
    source: {
      trackLabel: normalizedTrackLabel ? "input" : "fallback",
      lessonCount: inputLessonCount ? "input" : "fallback",
      durationDays: inputDurationDays ? "input" : "fallback",
      videoCount: inputVideoCount ? "input" : "fallback",
    },
  };
}
