"use client";

import { Mascot } from "@/components/mascot";
import type { MascotActionProp, MascotGazeDirection, MascotMotionLevel, MascotState } from "@/components/mascot";

export type KidMascotState =
  | "idle"
  | "talking"
  | "happy"
  | "confused"
  | "sleeping"
  | "celebrating"
  | "playful"
  | "proud";

export type KidMascotActionProp = "reading" | "math" | "exploring" | "heart" | "music";
export type KidMascotGazeDirection = MascotGazeDirection;

interface KidMascotProps {
  size?: number;
  className?: string;
  state?: KidMascotState;
  actionProp?: KidMascotActionProp;
  gazeDirection?: KidMascotGazeDirection;
  motionLevel?: MascotMotionLevel;
  pauseWhenOffscreen?: boolean;
  title?: string;
}

const STATE_MAP: Record<KidMascotState, MascotState> = {
  idle: "idle",
  talking: "thinking",
  happy: "happy",
  confused: "sad",
  sleeping: "sleepy",
  celebrating: "celebrating",
  playful: "playful",
  proud: "proud",
};

const ACTION_MAP: Record<KidMascotActionProp, MascotActionProp> = {
  reading: "reading",
  math: "magic",
  exploring: "space",
  heart: "heart",
  music: "music",
};

export function KidMascot({
  size = 120,
  className,
  state = "idle",
  actionProp = "exploring",
  gazeDirection = "center",
  motionLevel = "full",
  pauseWhenOffscreen = true,
  title = "Cu Con",
}: KidMascotProps) {
  return (
    <Mascot
      variant="small"
      state={STATE_MAP[state]}
      actionProp={ACTION_MAP[actionProp]}
      gazeDirection={gazeDirection}
      size={size}
      className={className}
      title={title}
      motionLevel={motionLevel}
      pauseWhenOffscreen={pauseWhenOffscreen}
    />
  );
}
