"use client";

/**
 * CloudProgressBar — Progress bar styled as cloud puffs
 *
 * Shows progress through a series of cloud-puff circles:
 *  - Filled puffs = white/glowing (completed steps)
 *  - Empty puffs = semi-transparent (remaining steps)
 *
 * Example: 3 of 5 steps done → ●●●○○
 */

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import "../cloud-garden.css";

interface CloudProgressBarProps {
  /** Total number of progress puffs */
  total: number;
  /** Number of filled (complete) puffs */
  filled: number;
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export function CloudProgressBar({
  total,
  filled,
  className,
  ariaLabel,
}: CloudProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const clampedFilled = Math.min(Math.max(0, filled), total);

  return (
    <div
      className={`cg-progress-bar ${className ?? ""}`.trim()}
      role="progressbar"
      aria-valuenow={clampedFilled}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={ariaLabel ?? `${clampedFilled} / ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isFilled = i < clampedFilled;
        return (
          <m.span
            key={i}
            className={`cg-progress-puff${isFilled ? " cg-progress-puff--filled" : ""}`}
            initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 18 }}
          />
        );
      })}
    </div>
  );
}
