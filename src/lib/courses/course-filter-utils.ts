export const SUBJECT_LABELS: Record<string, string> = {
  MATH: "Mathematics",
  ENGLISH: "English",
  SCIENCE: "Science",
  ART: "Art",
  MUSIC: "Music",
  OTHER: "Other",
};

export const PROGRAM_LABELS: Record<string, string> = {
  abeka: "Abeka",
  lfen: "Little Fox English",
  lfcn: "Little Fox Chinese",
};

export const PHASE_LABELS: Record<string, string> = {
  intro: "Start up",
  starter: "Begin",
  foundation: "Foundation",
  builder: "Building the foundation",
};

export const AGE_GROUP_LABELS: Record<string, string> = {
  ALL_AGES: "All ages",
  UNDER_3: "Under 3 years old",
  AGE_3_5: "3-5 years old",
  AGE_4_6: "4-6 years old",
  AGE_6_8: "6-8 years old",
  AGE_7_9: "7-9 years old",
  AGE_9_12: "9-12 years old",
  AGE_10_12: "10-12 years old",
};

export const DURATION_LABELS = {
  short: "Short (<30 days)",
  medium: "Medium (30-60 days)",
  long: "Long (>60 days)",
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Latest" },
  { value: "price_asc", label: "Prices gradually increase" },
  { value: "price_desc", label: "Prices gradually decrease" },
  { value: "duration_asc", label: "Short duration first" },
];

export type CourseFilterParams = {
  q?: string;
  program?: string;
  phase?: string;
  subject?: string;
  ageGroup?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: "short" | "medium" | "long";
  sort?: string;
  page?: number;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const VALID_SUBJECTS = new Set(Object.keys(SUBJECT_LABELS));
const VALID_AGE_GROUPS = new Set(Object.keys(AGE_GROUP_LABELS));
const VALID_PROGRAMS = new Set(Object.keys(PROGRAM_LABELS));
const VALID_PHASES = new Set(Object.keys(PHASE_LABELS));
const VALID_DURATIONS = new Set(["short", "medium", "long"]);
const VALID_SORTS = new Set(SORT_OPTIONS.map((o) => o.value));
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
    program: program && VALID_PROGRAMS.has(program) ? program : undefined,
    phase: phase && VALID_PHASES.has(phase) ? phase : undefined,
    subject: subject && VALID_SUBJECTS.has(subject) ? subject : undefined,
    ageGroup: ageGroup && VALID_AGE_GROUPS.has(ageGroup) ? ageGroup : undefined,
    duration: duration && VALID_DURATIONS.has(duration) ? (duration as CourseFilterParams["duration"]) : undefined,
    sort: sort && VALID_SORTS.has(sort) ? sort : undefined,
    page: isNaN(page) || page < 1 ? 1 : page,
    minPrice: isNaN(minPrice) || minPrice <= 0 ? undefined : Math.min(minPrice, MAX_PRICE),
    maxPrice: isNaN(maxPrice) || maxPrice <= 0 ? undefined : Math.min(maxPrice, MAX_PRICE),
  };
}
