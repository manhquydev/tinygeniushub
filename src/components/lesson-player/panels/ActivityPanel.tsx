"use client";

import * as m from "motion/react-m";
import { AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MascotGuide } from "@/components/lesson-player/components/MascotGuide";
import type { KidMascotState } from "@/components/animation/kid-mascot";
import type { ActivitySpec, ActivityType } from "@/modules/content/activity-types";
import type { MascotGazeDirection } from "@/components/mascot";

type ActivityRow = {
  id: string;
  type: ActivityType;
  prompt: string;
  spec: ActivitySpec;
  passCriteria: number;
};

type AnswerResult = "idle" | "correct" | "wrong";

interface ActivityPanelProps {
  activities: ActivityRow[];
  activityIndex: number;
  activityLoading: boolean;
  activityAnswerLocked: boolean;
  result: AnswerResult;
  mascotState: KidMascotState;
  onAnswer: (isCorrect: boolean) => void;
  onOptionHoverStart?: (direction: MascotGazeDirection) => void;
  onOptionHoverEnd?: () => void;
  trackCode?: "ENGLISH" | "MATH" | "HABIT";
}

// Kisu sticker images for correct / wrong feedback
const STICKER_CORRECT = "/kisu-assets/stickers/sticker_cheer.png";
const STICKER_WRONG = "/kisu-assets/stickers/sticker_try_again.png";

// Dynamic import to avoid server-side issues
const ActivityRenderer = dynamic(
  () =>
    import("@/components/lesson-wizard/activity-renderer").then(
      (m) => m.ActivityRenderer,
    ),
  { ssr: false, loading: () => null },
);

export function ActivityPanel({
  activities,
  activityIndex,
  activityLoading,
  activityAnswerLocked,
  result,
  mascotState,
  onAnswer,
  onOptionHoverStart,
  onOptionHoverEnd,
}: ActivityPanelProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const currentActivity = activities[activityIndex] ?? null;
  const totalActivities = activities.length;

  const mascotMessage =
    result === "correct"
      ? "Great, correct answer!"
      : result === "wrong"
      ? "It's not right, please try again!"
      : activityLoading
      ? "Preparing questions..."
      : "Choose the most correct answer!";

  return (
    <div className="lp-main">
      {/* Progress dots */}
      <div
        className="lp-activity-progress-dots"
        role="progressbar"
        aria-valuenow={activityIndex + 1}
        aria-valuemax={totalActivities}
        aria-label={`Sentence${activityIndex + 1} trong ${totalActivities}`}
      >
        {Array.from({ length: totalActivities }, (_, i) => (
          <span
            key={i}
            className={`lp-activity-dot${i < activityIndex ? " is-done" : i === activityIndex ? " is-active" : ""}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Mascot bubble */}
      <MascotGuide
        message={mascotMessage}
        state={mascotState}
        actionProp="math"
        size={80}
        compact
      />

      {/* Quiz card */}
      <m.div
        className="lp-panel"
        style={{ position: "relative", overflow: "hidden", paddingBottom: "1.25rem" }}
        key={`quiz-${activityIndex}`}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {activityLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.5rem 0", color: "var(--lp-ink-muted)" }}>
            {/* Loading shimmer bar */}
            <div style={{ width: "60%", height: "12px", borderRadius: "999px", background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <m.div
                style={{ height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 50%, transparent 100%)", backgroundSize: "200% 100%" }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
              />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Loading questions...</span>
          </div>
        )}

        {!activityLoading && currentActivity && (
          <>
            {/* Question counter */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--lp-ink-muted)" }}>
                Sentence {activityIndex + 1}/{totalActivities}
              </span>
              {/* Decorative track indicator dots */}
              <span style={{ display: "flex", gap: "3px" }} aria-hidden="true">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} style={{ display: "block", width: i === 1 ? "14px" : "5px", height: "5px", borderRadius: "999px", background: "var(--lp-track-primary)", opacity: i !== 1 ? 0.28 : 0.85 }} />
                ))}
              </span>
            </div>

            {/* ActivityRenderer from lesson-wizard */}
            <ActivityRenderer
              activity={currentActivity}
              disabled={activityAnswerLocked}
              onAnswer={onAnswer}
              mascotGazeDirection="center"
              onHoverOption={(dir) => onOptionHoverStart?.(dir)}
              onHoverOptionEnd={() => onOptionHoverEnd?.()}
            />
          </>
        )}

        {!activityLoading && !currentActivity && (
          <p style={{ textAlign: "center", color: "var(--lp-ink-muted)", fontSize: "0.88rem", padding: "1rem 0" }}>
            Lesson completed, no more questions!
          </p>
        )}

        {/* Feedback Overlay */}
        <AnimatePresence>
          {result !== "idle" && (
            <m.div
              className={`lp-feedback-overlay ${result === "correct" ? "is-correct" : "is-wrong"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* CSS-only glyph — no emoji */}
              <m.div
                className={`lp-feedback-glyph ${result === "correct" ? "is-correct" : "is-wrong"}`}
                initial={prefersReducedMotion ? false : { scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              />
              <span className="lp-feedback-text">
                {result === "correct" ? "Exactly!" : "Try again!"}
              </span>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

      {/* Kisu sticker – pops at bottom-right */}
      <AnimatePresence>
        {result === "correct" && (
          <m.div
            className="lp-sticker-reward"
            initial={{ scale: 0, rotate: -20, opacity: 0, y: 40 }}
            animate={{ scale: 1, rotate: 5, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={STICKER_CORRECT}
              alt="Great"
              width={110}
              height={110}
              style={{ objectFit: "contain" }}
            />
          </m.div>
        )}
        {result === "wrong" && (
          <m.div
            className="lp-sticker-reward"
            initial={{ scale: 0, rotate: 15, opacity: 0, y: 40 }}
            animate={{ scale: 1, rotate: -5, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 30 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={STICKER_WRONG}
              alt="Retry"
              width={110}
              height={110}
              style={{ objectFit: "contain" }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
