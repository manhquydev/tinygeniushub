"use client";

export type ApiResponse<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message?: string;
  };
};

export type TrackRow = {
  id: string;
  code: "ENGLISH" | "MATH" | "HABIT" | string;
  title: string;
  isTrialEnabled: boolean;
  _count: { levels: number; units: number; lessons: number };
};

export type LevelRow = {
  id: string;
  trackId: string;
  orderNo: number;
  title: string;
  _count: { units: number };
};

export type UnitRow = {
  id: string;
  levelId: string;
  orderNo: number;
  title: string;
  _count: { lessons: number };
};

export type LessonRow = {
  id: string;
  unitId: string;
  orderNo: number;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  videoSource: string | null;
  bunnyVideoId: string | null;
  videoStatus: string;
  offlineCardMarkdown: string | null;
  parentScriptMarkdown: string | null;
  _count: { activities: number; completions: number };
};

export type ActivityType = "MCQ" | "TRUE_FALSE" | "WORD_MATCH" | "FILL_BLANK";
export type ActivityRow = {
  id: string;
  lessonId: string;
  type: ActivityType;
  prompt: string;
  passCriteria: number;
  spec: unknown;
};

export type LessonFormState = {
  orderNo: string;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: string;
  trialEnabled: boolean;
  videoSource: string;
  offlineCardMarkdown: string;
  parentScriptMarkdown: string;
};

export type McqChoiceForm = { id: string; text: string };
export type WordPairForm = { id: string; left: string; right: string };

export type ActivityFormState = {
  type: ActivityType;
  prompt: string;
  passCriteria: string;
  mcqChoices: McqChoiceForm[];
  mcqCorrectChoiceId: string;
  trueFalseAnswer: boolean;
  wordPairs: WordPairForm[];
  fillSentence: string;
  fillAnswer: string;
  fillHint: string;
};
