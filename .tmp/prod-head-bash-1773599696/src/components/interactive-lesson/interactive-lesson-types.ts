import type { MascotVariant, MascotState, MascotGesture, MascotActionProp } from "@/components/mascot/types";
import type { ActivitySpec, ActivityType } from "@/modules/content/activity-types";

export type InteractiveStepType = "hook" | "concept" | "demonstrate" | "activity" | "reinforce" | "celebrate";

export interface KeywordWithAudio {
  word: string;
  audioUrl?: string;
}

export interface InteractiveLessonMascotConfig {
  variant: MascotVariant;
  state: MascotState;
  gesture?: MascotGesture;
  actionProp?: MascotActionProp;
}

export interface InteractiveLessonStep {
  type: InteractiveStepType;
  mascot: InteractiveLessonMascotConfig;
  /** Speech bubble text (max 4 words) */
  speech?: string;
  /** Large keyword display */
  keyword?: string;
  /** Example word cards shown in demonstrate step */
  keywords?: string[];
  /** Per-keyword audio for synced demonstrate step (card appears when its audio plays) */
  keywordsWithAudio?: KeywordWithAudio[];
  /** Supporting subtext below keyword */
  subtext?: string;
  /** TTS audio file URL */
  audioUrl?: string;
  /** Activity config for activity step */
  activity?: {
    type: ActivityType;
    prompt: string;
    spec: ActivitySpec;
    /** Minimum score (0–1) to pass */
    passCriteria: number;
  };
  /** Auto-advance delay in ms after audio ends; omit to wait for tap */
  autoAdvanceMs?: number;
}

export interface InteractiveLessonData {
  id: string;
  title: string;
  mascotVariant: MascotVariant;
  steps: InteractiveLessonStep[];
}
