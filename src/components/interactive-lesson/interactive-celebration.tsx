"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import confetti from "canvas-confetti";

interface InteractiveCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

// Burst star positions for SVG overlay animation
const BURST_STARS = [
  { angle: 0, distance: 80 },
  { angle: 45, distance: 100 },
  { angle: 90, distance: 90 },
  { angle: 135, distance: 110 },
  { angle: 180, distance: 85 },
  { angle: 225, distance: 95 },
  { angle: 270, distance: 100 },
  { angle: 315, distance: 88 },
];

export function InteractiveCelebration({ trigger, onComplete }: InteractiveCelebrationProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!trigger) {
      firedRef.current = false;
      return;
    }

    // Guard against firing multiple times for same trigger
    if (firedRef.current) return;
    firedRef.current = true;

    if (!prefersReducedMotion) {
      const end = Date.now() + 1800;
      const launch = () => {
        confetti({
          particleCount: 16,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.6 },
          colors: ["#facc15", "#22d3ee", "#a78bfa", "#fb7185", "#34d399"],
        });
        confetti({
          particleCount: 16,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.6 },
          colors: ["#facc15", "#22d3ee", "#a78bfa", "#fb7185", "#34d399"],
        });
        if (Date.now() < end) {
          requestAnimationFrame(launch);
        }
      };
      launch();
    }

    timerRef.current = setTimeout(() => {
      onComplete?.();
      timerRef.current = null;
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [trigger, prefersReducedMotion, onComplete]);

  if (!trigger) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {BURST_STARS.map(({ angle, distance }) => {
        const radians = (angle * Math.PI) / 180;
        const tx = Math.cos(radians) * distance;
        const ty = Math.sin(radians) * distance;

        return (
          <m.div
            key={angle}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: [1, 1, 0], x: tx, y: ty, scale: [0, 1.4, 0.8] }
            }
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ position: "absolute" }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polygon
                points="14,2 17.5,10 26,10 19.5,15.5 22,24 14,19 6,24 8.5,15.5 2,10 10.5,10"
                fill="#facc15"
                stroke="#f59e0b"
                strokeWidth="1"
              />
            </svg>
          </m.div>
        );
      })}
    </div>
  );
}
