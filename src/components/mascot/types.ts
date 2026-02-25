"use client";

export type MascotVariant = "big" | "small" | "duo";
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
export type MascotActionProp = "reading" | "space" | "magic" | "heart" | "music" | "none";
export type MascotLayout = "horizontal" | "vertical";
export type MascotGazeDirection = "left" | "center" | "right";
export type MascotMotionLevel = "full" | "soft" | "minimal";

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
  layout?: MascotLayout;
  size?: number;
  className?: string;
  title?: string;
  gazeDirection?: MascotGazeDirection;
  motionLevel?: MascotMotionLevel;
  pauseWhenOffscreen?: boolean;
  showBaseGlow?: boolean;
  zoom?: number;
}
