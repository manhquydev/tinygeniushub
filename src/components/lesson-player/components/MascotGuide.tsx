"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { KidMascot, type KidMascotState, type KidMascotActionProp } from "@/components/animation/kid-mascot";

interface MascotGuideProps {
  message: string;
  state?: KidMascotState;
  actionProp?: KidMascotActionProp;
  size?: number;
  /** Compact mode: mascot nhỏ hơn, không float */
  compact?: boolean;
}

export function MascotGuide({
  message,
  state = "idle",
  actionProp = "exploring",
  size = 100,
  compact = false,
}: MascotGuideProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <div className="lp-mascot-area">
      {/* Speech bubble – xuất hiện trước mascot để tail chỉ xuống */}
      <m.div
        className="lp-mascot-bubble"
        key={message}
        initial={{ opacity: 0, y: -6, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {message}
      </m.div>

      {/* Mascot */}
      <m.div
        className="lp-mascot-float"
        animate={
          compact || prefersReducedMotion
            ? { y: 0 }
            : { y: [0, -10, 0] }
        }
        transition={
          compact || prefersReducedMotion
            ? undefined
            : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <KidMascot
          size={compact ? Math.round(size * 0.7) : size}
          state={state}
          actionProp={actionProp}
          pauseWhenOffscreen
        />
      </m.div>
    </div>
  );
}
