"use client";

export type MascotVariant = "big" | "small" | "duo" | "dad" | "sister" | "baby" | "family";
export type MascotState =
  | "idle"
  | "happy"
  | "thinking"
  | "celebrating"
  | "sad"
  | "sleepy"
  | "playful"
  | "proud"
  | "love"
  | "surprised"
  | "excited"
  | "nervous"
  | "angry"
  | "bored";
export type MascotActionProp = "reading" | "space" | "magic" | "heart" | "music"
  | "writing" | "drawing" | "flashcard" | "pointing-stick" | "trophy" | "magnifying-glass" | "none";
export type MascotLayout = "horizontal" | "vertical";
export type MascotGazeDirection = "left" | "center" | "right";
export type MascotMotionLevel = "full" | "soft" | "minimal";
export type MascotGesture =
  | "none" | "pointing" | "waving" | "nodding"
  | "head-shake" | "clapping" | "thinking-scratch" | "raise-hand";

export type MascotAnimationMode = "loop" | "once" | "sequence";
export type EntryPreset = "fly-in" | "bounce-in" | "fade-in" | "slide-in";
export type ExitPreset = "wave-out" | "fade-out" | "fly-out" | "slide-out";

export interface MascotSequenceStep {
  state: MascotState;
  gesture?: MascotGesture;
  actionProp?: MascotActionProp;
  duration: number; // milliseconds
  entry?: EntryPreset;
  exit?: ExitPreset;
}

export interface MascotProps {
  variant: MascotVariant;
  state: MascotState;
  actionProp?: MascotActionProp;
  parentState?: MascotState;
  childState?: MascotState;
  parentActionProp?: MascotActionProp;
  childActionProp?: MascotActionProp;
  parentGazeDirection?: MascotGazeDirection;
  childGazeDirection?: MascotGazeDirection;
  dadState?: MascotState;
  sisterState?: MascotState;
  babyState?: MascotState;
  dadActionProp?: MascotActionProp;
  sisterActionProp?: MascotActionProp;
  babyActionProp?: MascotActionProp;
  dadGazeDirection?: MascotGazeDirection;
  sisterGazeDirection?: MascotGazeDirection;
  babyGazeDirection?: MascotGazeDirection;
  layout?: MascotLayout;
  size?: number;
  className?: string;
  title?: string;
  gazeDirection?: MascotGazeDirection;
  motionLevel?: MascotMotionLevel;
  gesture?: MascotGesture;
  pauseWhenOffscreen?: boolean;
  showBaseGlow?: boolean;
  zoom?: number;
  animationMode?: MascotAnimationMode;
  sequence?: MascotSequenceStep[];
  onSequenceComplete?: () => void;
}
