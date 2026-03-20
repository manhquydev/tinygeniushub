import type { MascotVariant, MascotState, MascotGesture, MascotActionProp } from "../../src/components/mascot/types";

export type PhaseType =
  | "hook"
  | "concept"
  | "demonstrate"
  | "your-turn"
  | "reinforce"
  | "celebrate"
  | "recap";

export interface LessonPhase {
  type: PhaseType;
  durationFrames: number;
  mascot: {
    state: MascotState;
    midState?: MascotState; // expression change mid-phase (for long phases >=150f)
    gesture?: MascotGesture;
    actionProp?: MascotActionProp;
    enterFrom?: "left" | "right" | "bottom";
  };
  speech?: string;         // speech bubble text (max 4 words)
  keyword?: string;        // large keyword display (96-120px)
  subtext?: string;        // supporting text (40px)
  keywords?: string[];     // multiple keywords for demonstrate phase
  answerOptions?: string[]; // for your-turn phase
  correctIndex?: number;
  soundProxy?: "music" | "surprise" | "thinking" | "glow";
}

export interface LessonVideoDataV2 {
  id: string;
  title: string;
  mascotVariant: MascotVariant;
  phases: LessonPhase[];
}
