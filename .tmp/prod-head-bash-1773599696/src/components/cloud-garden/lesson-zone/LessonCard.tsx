"use client";

/**
 * LessonCard — Individual lesson card in the Lesson Zone branch view.
 *
 * Visual states:
 *  - available    : white cloud card, subject-color border
 *  - today        : golden glow beacon pulse
 *  - in-progress  : teal border, progress arc SVG
 *  - completed    : green fill, checkmark
 *  - locked       : grayscale + lock icon, shake on tap
 *
 * ICON POLICY: Lock = inline Feather SVG path. Check = inline SVG path.
 * Subject glyphs use the same custom SVG as CloudZone.
 */

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useState, useCallback } from "react";
import type { CSSProperties } from "react";
import "../cloud-garden.css";

export type LessonCardState = "available" | "today" | "in-progress" | "completed" | "locked";
export type LessonSubject = "math" | "phonics" | "art" | "music" | "story";

const SUBJECT_META: Record<LessonSubject, { accent: string; bg: string; name: string }> = {
  math:    { accent: "var(--garden-math-gold)",    bg: "var(--garden-math-gold-bg)",  name: "To\u00e1n" },
  phonics: { accent: "var(--garden-phonics-teal)", bg: "var(--garden-phonics-bg)",    name: "Phonics" },
  art:     { accent: "var(--garden-art-coral)",    bg: "var(--garden-art-bg)",        name: "K\u1ef9 n\u0103ng" },
  music:   { accent: "var(--garden-music-rose)",   bg: "var(--garden-music-bg)",      name: "\u00c2m nh\u1ea1c" },
  story:   { accent: "var(--garden-story-green)",  bg: "var(--garden-story-bg)",      name: "K\u1ec3 chuy\u1ec7n" },
};

interface LessonCardProps {
  lessonId: string;
  title: string;
  subject: LessonSubject;
  state: LessonCardState;
  estimatedMinutes?: number;
  completedCount?: number;
  totalCount?: number;
  onSelect?: (lessonId: string) => void;
}

export function LessonCard({
  lessonId,
  title,
  subject,
  state,
  estimatedMinutes,
  completedCount = 0,
  totalCount = 1,
  onSelect,
}: LessonCardProps) {
  const meta = SUBJECT_META[subject];
  const prefersReducedMotion = useReducedMotion();
  const [shaking, setShaking] = useState(false);

  const handleClick = useCallback(() => {
    if (state === "locked") {
      if (!shaking) {
        setShaking(true);
        setTimeout(() => setShaking(false), 450);
      }
      return;
    }
    onSelect?.(lessonId);
  }, [state, lessonId, onSelect, shaking]);

  // Progress arc for in-progress state
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <m.div
      className={[
        "cg-lesson-card",
        `cg-lesson-card--${state}`,
      ].join(" ")}
      style={
        {
          "--zone-accent": meta.accent,
          "--zone-bg": meta.bg,
        } as CSSProperties
      }
      role="button"
      tabIndex={state === "locked" ? -1 : 0}
      aria-label={`${title}${state === "locked" ? " (kh\u00f3a)" : ""}${state === "today" ? " - H\u00f4m nay!" : ""}`}
      aria-disabled={state === "locked"}
      onClick={handleClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
      animate={shaking && !prefersReducedMotion ? { x: [0, -10, 10, -7, 7, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      initial={false}
      whileHover={state !== "locked" && !prefersReducedMotion ? { y: -4, scale: 1.04 } : undefined}
      whileTap={state !== "locked" && !prefersReducedMotion ? { scale: 0.95 } : undefined}
    >
      {/* Progress arc (in-progress state) */}
      {state === "in-progress" && (
        <svg
          className="cg-lesson-card__progress-arc"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            cx="50" cy="50" r={r * (100 / 96)}
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="50" cy="50" r={r * (100 / 96)}
            stroke={meta.accent}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ * (100 / 96)}
            strokeDashoffset={offset * (100 / 96)}
            transform="rotate(-90 50 50)"
            opacity="0.85"
          />
        </svg>
      )}

      {/* Icon area */}
      <div
        className="cg-lesson-card__icon"
        style={{ background: state === "locked" ? "#f3f4f6" : meta.bg }}
      >
        {state === "locked" ? (
          // Feather lock — inline SVG path
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9ca3af" strokeWidth="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="#9ca3af" />
          </svg>
        ) : state === "completed" ? (
          // Checkmark inline SVG
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill={meta.bg} />
            <path d="M7 13l3.5 3.5L17 9" stroke={meta.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : state === "today" ? (
          // Sun/star for today
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {[0,45,90,135,180,225,270,315].map((deg, i) => {
              const r2 = Math.PI * deg / 180;
              return (
                <line key={i}
                  x1={12 + Math.cos(r2) * 6} y1={12 + Math.sin(r2) * 6}
                  x2={12 + Math.cos(r2) * 10} y2={12 + Math.sin(r2) * 10}
                  stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"
                />
              );
            })}
            <circle cx="12" cy="12" r="4" fill="#fde047" />
          </svg>
        ) : (
          // Play triangle for available/in-progress
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 5.5l10 6.5-10 6.5V5.5z" fill={meta.accent} opacity="0.85" />
          </svg>
        )}
      </div>

      {/* Title */}
      <div className="cg-lesson-card__title">{title}</div>

      {/* Meta: time */}
      {estimatedMinutes && (
        <div className="cg-lesson-card__meta">
          {/* Feather clock icon inline */}
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {`${estimatedMinutes} ph\u00fat`}
        </div>
      )}
    </m.div>
  );
}
