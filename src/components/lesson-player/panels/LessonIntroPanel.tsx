"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import Image from "next/image";

interface LessonIntroPanelProps {
  title: string;
  objective: string;
  estimatedMinutes: number;
  trackCode: "ENGLISH" | "MATH" | "HABIT";
  tierLabel?: string | null;
  onStart: () => void;
  isLoading?: boolean;
}

const TRACK_CLASS: Record<string, string> = {
  ENGLISH: "lp-track-english",
  MATH: "lp-track-math",
  HABIT: "lp-track-habit",
};

const TRACK_LABEL: Record<string, string> = {
  ENGLISH: "Tiếng Anh",
  MATH: "Toán học",
  HABIT: "Thói quen",
};

// Kisu mascot stickers for intro
const KISU_INTRO = "/kisu-assets/stickers/sticker_combat_ready.png";

export function LessonIntroPanel({
  title,
  objective,
  estimatedMinutes,
  trackCode,
  tierLabel,
  onStart,
  isLoading,
}: LessonIntroPanelProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <div className="lp-main">
      {/* Kisu float */}
      <m.div
        className="lp-float-anim"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={KISU_INTRO}
          alt="Kisu sẵn sàng"
          width={100}
          height={100}
          className="lp-mascot-float"
          priority
        />
      </m.div>

      {/* Main card */}
      <m.div
        className={`lp-panel ${TRACK_CLASS[trackCode] ?? "lp-track-english"}`}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      >
        {/* Track badge – CSS only, no emoji box */}
        <div className="lp-track-badge">
          <div className="lp-track-badge-mark" />
        </div>

        {/* Tier pill */}
        {tierLabel ? (
          <div style={{ textAlign: "center" }}>
            <span className="lp-tier-pill">
              {TRACK_LABEL[trackCode] ?? "Bài học"}
              {" · "}
              {tierLabel}
            </span>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <span className="lp-tier-pill">{TRACK_LABEL[trackCode] ?? "Bài học"}</span>
          </div>
        )}

        {/* Title */}
        <h1 className="lp-intro-title">{title}</h1>

        {/* Objective */}
        <p className="lp-intro-objective">{objective}</p>

        {/* Duration meta – CSS clock icon */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span className="lp-intro-meta">
            <span className="lp-intro-meta-icon" aria-hidden="true" />
            <strong>{estimatedMinutes}</strong>&nbsp;phút
          </span>
        </div>

        {/* CTA */}
        <m.button
          type="button"
          className="lp-btn-primary lp-pulse-btn lp-bounce-in"
          disabled={isLoading}
          onClick={onStart}
          whileHover={prefersReducedMotion || isLoading ? undefined : { scale: 1.03, y: -2 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          aria-label="Bắt đầu bài học"
          style={{ position: "relative", overflow: "hidden", marginTop: "0.5rem" }}
        >
          {isLoading ? (
            <>
              <span className="lp-hud-time-pill" style={{ color: "rgba(255,255,255,0.8)", border: "none", background: "none" }}>Đang chuẩn bị...</span>
            </>
          ) : (
            "Bắt đầu bài học"
          )}
        </m.button>
      </m.div>
    </div>
  );
}
