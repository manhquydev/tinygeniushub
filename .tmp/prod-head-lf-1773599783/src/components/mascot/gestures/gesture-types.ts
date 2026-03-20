import type { TargetAndTransition, Transition } from "motion/react";

export interface GestureWingConfig {
  d: string;
  animate?: TargetAndTransition;
  transition?: Transition;
}

export interface GestureConfig {
  leftWing?: GestureWingConfig;
  rightWing?: GestureWingConfig;
  headTransform?: {
    animate: TargetAndTransition;
    transition: Transition;
  };
}
