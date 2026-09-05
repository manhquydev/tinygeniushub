"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";

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

const KISU_INTRO = "/kisu-assets/stickers/sticker_combat_ready.png";

function trackKey(trackCode: string): "english" | "math" | "habit" | "fallback" {
  if (trackCode === "ENGLISH") return "english";
  if (trackCode === "MATH") return "math";
  if (trackCode === "HABIT") return "habit";
  return "fallback";
}

export function LessonIntroPanel({
  title,
  objective,
  estimatedMinutes,
  trackCode,
  tierLabel,
  onStart,
  isLoading,
}: LessonIntroPanelProps) {
  const t = useTranslations("kid.lesson");
  const prefersReducedMotion = useReducedMotion() ?? false;
  const trackLabel = t(`track.${trackKey(trackCode)}`);

  return (
    <div className="lp-main">
      <m.div
        className="lp-float-anim"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src={KISU_INTRO}
          alt={t("intro.mascotAlt")}
          width={100}
          height={100}
          className="lp-mascot-float"
          priority
        />
      </m.div>

      <m.div
        className={`lp-panel ${TRACK_CLASS[trackCode] ?? "lp-track-english"}`}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      >
        <div className="lp-track-badge">
          <div className="lp-track-badge-mark" />
        </div>

        <div style={{ textAlign: "center" }}>
          <span className="lp-tier-pill">
            {tierLabel ? `${trackLabel} · ${tierLabel}` : trackLabel}
          </span>
        </div>

        <h1 className="lp-intro-title">{title}</h1>

        <p className="lp-intro-objective">{objective}</p>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <span className="lp-intro-meta">
            <span className="lp-intro-meta-icon" aria-hidden="true" />
            {t("minutes", { minutes: estimatedMinutes })}
          </span>
        </div>

        <m.button
          type="button"
          className="lp-btn-primary lp-pulse-btn lp-bounce-in"
          disabled={isLoading}
          onClick={onStart}
          whileHover={prefersReducedMotion || isLoading ? undefined : { scale: 1.03, y: -2 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          aria-label={t("intro.startAria")}
          style={{ position: "relative", overflow: "hidden", marginTop: "0.5rem" }}
        >
          {isLoading ? (
            <span className="lp-hud-time-pill" style={{ color: "rgba(255,255,255,0.8)", border: "none", background: "none" }}>
              {t("intro.preparing")}
            </span>
          ) : (
            t("intro.startCta")
          )}
        </m.button>
      </m.div>
    </div>
  );
}
