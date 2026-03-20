"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";
import type { GestureConfig } from "./gesture-types";
import { GESTURE_CONFIGS } from "./gesture-configs";
import type { MascotGesture } from "@/components/mascot/types";

interface GestureLayerProps {
  gesture: MascotGesture;
  characterKey: string; // "big"|"small"|"dad"|"sister"|"baby"
  reducedMotion: boolean;
  children: ReactNode;
}

export function GestureLayer({ gesture, characterKey, reducedMotion, children }: GestureLayerProps) {
  if (gesture === "none") return <>{children}</>;
  const config: GestureConfig | undefined = GESTURE_CONFIGS[characterKey]?.[gesture];
  if (!config?.headTransform) return <>{children}</>;

  return (
    <m.g
      animate={reducedMotion ? undefined : config.headTransform.animate}
      transition={reducedMotion ? undefined : config.headTransform.transition}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      {children}
    </m.g>
  );
}
