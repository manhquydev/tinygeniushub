"use client";

/**
 * SpeechBubble — Cloud-style speech bubble for the mascot guide
 *
 * Renders a rounded white cloud bubble with a tail pointing toward
 * the mascot. Animates in/out with Framer Motion.
 *
 * DESIGN: Pure CSS + shape — no image assets, no icon packages.
 */

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import "../cloud-garden.css";

interface SpeechBubbleProps {
  /** Text content shown in the bubble */
  text: string;
  /** Which side the tail points toward */
  position?: "left" | "right";
  /** Whether to show or hide the bubble */
  visible?: boolean;
  className?: string;
}

export function SpeechBubble({
  text,
  position = "left",
  visible = true,
  className,
}: SpeechBubbleProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          role="status"
          aria-live="polite"
          className={[
            "cg-bubble",
            position === "right" ? "cg-bubble--right" : "",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 4 }}
          transition={{ type: "spring", stiffness: 360, damping: 22 }}
        >
          {text}
        </m.div>
      )}
    </AnimatePresence>
  );
}
