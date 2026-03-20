"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

interface InteractiveSpeechBubbleProps {
  text: string;
  visible: boolean;
  position?: "top" | "bottom";
  className?: string;
}

// Speech bubble with CSS triangle tail pointing down (toward mascot below)
export function InteractiveSpeechBubble({
  text,
  visible,
  position = "bottom",
  className,
}: InteractiveSpeechBubbleProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <AnimatePresence>
      {visible ? (
        <m.div
          role="status"
          aria-live="polite"
          className={className}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 340, damping: 22 }
          }
          style={{
            position: "relative",
            display: "inline-block",
            background: "#ffffff",
            borderRadius: 24,
            padding: "16px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
            maxWidth: 520,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', system-ui, sans-serif",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1.25,
              color: "#1e293b",
            }}
          >
            {text}
          </span>

          {/* Triangle tail — points down toward mascot when position="bottom" */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: position === "bottom" ? -18 : "auto",
              top: position === "top" ? -18 : "auto",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: position === "bottom" ? "18px solid #ffffff" : "none",
              borderBottom: position === "top" ? "18px solid #ffffff" : "none",
              filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.08))",
            }}
          />
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
