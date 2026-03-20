"use client";

/**
 * ContentStage — Cloud-framed content area for the activity screen.
 *
 * A rounded white panel that displays the lesson content:
 * math problems, phonics flashcards, vocabulary, etc.
 *
 * Children are rendered inside the cloud-shaped frame.
 */

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import "../cloud-garden.css";

interface ContentStageProps {
  children: ReactNode;
  /** Key to trigger slide-in animation on content change */
  contentKey?: string | number;
}

export function ContentStage({ children, contentKey }: ContentStageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="cg-content-stage"
      role="main"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <m.div
          key={contentKey}
          className="cg-stage-frame"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
