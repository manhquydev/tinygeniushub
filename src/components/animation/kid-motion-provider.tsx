"use client";

import { type ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

interface KidMotionProviderProps {
  children: ReactNode;
}

export function KidMotionProvider({ children }: KidMotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
