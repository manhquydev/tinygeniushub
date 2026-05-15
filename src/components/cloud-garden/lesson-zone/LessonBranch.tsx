"use client";

/**
 * LessonBranch — Layout for lesson cards in a zone.
 *
 * Renders a staggered grid of LessonCard components.
 * Uses the `listStagger` variant from existing kid-motion-variants.ts.
 *
 * Also shows:
 *  - Zone title header
 *  - Back-to-map button (inline Feather chevron-left)
 *  - GardenMascotGuide instance (zone context)
 */

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { listStagger, fadeInUp } from "@/components/animation/kid-motion-variants";
import { LessonCard, type LessonCardState, type LessonSubject } from "./LessonCard";
import { GardenMascotGuide } from "../mascot-guide/GardenMascotGuide";
import type { GardenContext } from "../mascot-guide/use-garden-dialogue";
import "../cloud-garden.css";

export interface LessonItem {
  id: string;
  title: string;
  estimatedMinutes?: number;
  completedCount?: number;
  totalCount?: number;
  state: LessonCardState;
}

interface LessonBranchProps {
  subject: LessonSubject;
  zoneTitle: string;
  lessons: LessonItem[];
  streak?: number;
  onSelectLesson?: (lessonId: string) => void;
  onBack?: () => void;
}

const SUBJECT_TO_CONTEXT: Record<LessonSubject, GardenContext> = {
  math:    "zone-math",
  phonics: "zone-phonics",
  art:     "zone-art",
  music:   "zone-music",
  story:   "zone-story",
};

export function LessonBranch({
  subject,
  zoneTitle,
  lessons,
  streak = 0,
  onSelectLesson,
  onBack,
}: LessonBranchProps) {
  const lessonsDone = lessons.filter((l) => l.state === "completed").length;
  const context = SUBJECT_TO_CONTEXT[subject];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, var(--garden-sky-mid) 0%, var(--garden-sky-dawn) 40%, var(--garden-sky-horizon) 80%, var(--garden-sky-peach) 100%)",
      }}
    >
      {/* Header */}
      <m.header
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem 1rem 0.5rem",
          zIndex: 5,
          position: "relative",
        }}
      >
        {/* Back button — inline chevron SVG */}
        <button
          onClick={onBack}
          aria-label="Back to map"
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 999,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: "#fff",
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div>
          <div className="cg-subtext" style={{ fontSize: "0.72rem", opacity: 0.75 }}>Garden</div>
          <h1 className="cg-heading" style={{ fontSize: "clamp(1.2rem, 3.5vw, 1.8rem)" }}>
            {zoneTitle}
          </h1>
        </div>
      </m.header>

      {/* Cards */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          overflow: "auto",
        }}
      >
        <AnimatePresence>
          <m.div
            className="cg-lesson-branch"
            variants={listStagger}
            initial="hidden"
            animate="visible"
          >
            {lessons.map((lesson) => (
              <m.div key={lesson.id} variants={fadeInUp}>
                <LessonCard
                  lessonId={lesson.id}
                  title={lesson.title}
                  subject={subject}
                  state={lesson.state}
                  estimatedMinutes={lesson.estimatedMinutes}
                  completedCount={lesson.completedCount}
                  totalCount={lesson.totalCount}
                  onSelect={onSelectLesson}
                />
              </m.div>
            ))}
          </m.div>
        </AnimatePresence>
      </main>

      {/* Mascot guide (bottom-left, same as world map) */}
      <GardenMascotGuide
        context={context}
        streak={streak}
        lessonsDone={lessonsDone}
        lessonsTotal={lessons.length}
        className="cg-mascot-guide"
      />
    </div>
  );
}
