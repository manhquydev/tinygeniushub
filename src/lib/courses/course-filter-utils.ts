import { defaultLocale, type AppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";

export const SUBJECT_KEYS = ["MATH", "ENGLISH", "SCIENCE", "ART", "MUSIC", "OTHER"] as const;
export const PROGRAM_KEYS = ["abeka", "lfen", "lfcn"] as const;
export const PHASE_KEYS = ["intro", "starter", "foundation", "builder"] as const;
export const AGE_GROUP_KEYS = [
  "ALL_AGES",
  "UNDER_3",
  "AGE_3_5",
  "AGE_4_6",
  "AGE_6_8",
  "AGE_7_9",
  "AGE_9_12",
  "AGE_10_12",
] as const;
export const DURATION_KEYS = ["short", "medium", "long"] as const;
export const SORT_VALUES = ["newest", "price_asc", "price_desc", "duration_asc"] as const;

export type SubjectKey = (typeof SUBJECT_KEYS)[number];
export type ProgramKey = (typeof PROGRAM_KEYS)[number];
export type PhaseKey = (typeof PHASE_KEYS)[number];
export type AgeGroupKey = (typeof AGE_GROUP_KEYS)[number];
export type DurationKey = (typeof DURATION_KEYS)[number];
export type SortValue = (typeof SORT_VALUES)[number];
export type CourseFilterLabelGroup = "subject" | "program" | "phase" | "ageGroup" | "duration" | "sort";

export function getCourseFilterLabel(
  group: CourseFilterLabelGroup,
  key: string,
  locale: AppLocale = defaultLocale,
): string {
  return translate(`courses.filter.${group}.${key}`, undefined, locale);
}

export type CourseFilterParams = {
  q?: string;
  program?: string;
  phase?: string;
  subject?: string;
  ageGroup?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: DurationKey;
  sort?: string;
  page?: number;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function isListed(keys: readonly string[], value: string | undefined): value is string {
  return typeof value === "string" && keys.includes(value);
}

const MAX_PRICE = 10_000_000;

export function parseFilterParams(
  searchParams: Record<string, string | string[] | undefined>,
): CourseFilterParams {
  const q = firstString(searchParams.q)?.trim();
  const program = firstString(searchParams.program);
  const phase = firstString(searchParams.phase);
  const subject = firstString(searchParams.subject);
  const ageGroup = firstString(searchParams.ageGroup);
  const duration = firstString(searchParams.duration);
  const sort = firstString(searchParams.sort);
  const page = parseInt(firstString(searchParams.page) ?? "1", 10);
  const minPrice = parseInt(firstString(searchParams.minPrice) ?? "0", 10);
  const maxPrice = parseInt(firstString(searchParams.maxPrice) ?? "0", 10);

  return {
    q: q && q.length > 0 ? q.slice(0, 80) : undefined,
    program: isListed(PROGRAM_KEYS, program) ? program : undefined,
    phase: isListed(PHASE_KEYS, phase) ? phase : undefined,
    subject: isListed(SUBJECT_KEYS, subject) ? subject : undefined,
    ageGroup: isListed(AGE_GROUP_KEYS, ageGroup) ? ageGroup : undefined,
    duration: isListed(DURATION_KEYS, duration) ? (duration as DurationKey) : undefined,
    sort: isListed(SORT_VALUES, sort) ? sort : undefined,
    page: isNaN(page) || page < 1 ? 1 : page,
    minPrice: isNaN(minPrice) || minPrice <= 0 ? undefined : Math.min(minPrice, MAX_PRICE),
    maxPrice: isNaN(maxPrice) || maxPrice <= 0 ? undefined : Math.min(maxPrice, MAX_PRICE),
  };
}
