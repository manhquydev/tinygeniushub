"use client";

import * as m from "motion/react-m";
import { useReducedMotion, useAnimation } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface CompletionPanelProps {
  title: string;
  trackCode: "ENGLISH" | "MATH" | "HABIT";
  earnedXp?: number;
  earnedCoins?: number;
  tierLabel?: string | null;
  tierProgressBefore?: number; // 0..100
  tierProgressAfter?: number;  // 0..100
  nextLessonTitle?: string | null;
  onNextLesson?: () => void;
  onBackToMap: () => void;
}

const HERO_STICKER = "/kisu-assets/stickers/sticker_party_celebration.png";

// Small TierProgressBar sub-component
function TierProgressBar({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number;
}) {
  const controls = useAnimation();
  const prefersReduced = useReducedMotion() ?? false;
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const startPct = Math.max(0, Math.min(100, before));
    const endPct = Math.max(0, Math.min(100, after));

    void controls.start({
      width: `${startPct}%`,
      transition: { duration: 0 },
    }).then(() => {
      void controls.start({
        width: `${endPct}%`,
        transition: prefersReduced
          ? { duration: 0 }
          : { duration: 0.95, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.35 },
      });
    });
  }, [before, after, controls, prefersReduced]);

  return (
    <div className="lp-tier-bar-wrap">
      <div className="lp-tier-bar-label">
        <span>{label}</span>
        <span>{Math.round(after)}%</span>
      </div>
      <div className="lp-tier-bar-track">
        <m.div className="lp-tier-bar-fill" animate={controls} initial={{ width: `${before}%` }} />
      </div>
    </div>
  );
}

export function CompletionPanel({
  title,
  earnedXp = 0,
  earnedCoins = 0,
  tierLabel,
  tierProgressBefore = 0,
  tierProgressAfter = 0,
  nextLessonTitle,
  onNextLesson,
  onBackToMap,
}: CompletionPanelProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <div className="lp-main">
      {/* Hero sticker – physics bounce */}
      <m.div
        initial={prefersReducedMotion ? false : { scale: 0.3, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.1 }}
      >
        <Image
          src={HERO_STICKER}
          alt="Complete the lesson"
          width={128}
          height={128}
          className="lp-done-hero-sticker"
          priority
        />
      </m.div>

      {/* Dark card */}
      <m.div
        className="lp-panel is-dark lp-done-panel"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
      >
        {/* Title – clean type, no emoji */}
        <h2 className="lp-done-title">{title} · Xong!</h2>

        {/* Decorative accent line */}
        <div className="lp-done-title-line" aria-hidden="true" />

        <p className="lp-done-subtitle">
          {tierLabel ? `Floor${tierLabel} ·` : ""} Child completed the lesson successfully!
        </p>

        {/* XP / Coin chips */}
        {(earnedXp > 0 || earnedCoins > 0) && (
          <m.div
            className="lp-xp-row"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            {earnedXp > 0 && (
              <span className="lp-xp-chip">
                <span className="lp-xp-chip-dot xp" aria-hidden="true" />
                +{earnedXp} XP
              </span>
            )}
            {earnedCoins > 0 && (
              <span className="lp-xp-chip">
                <span className="lp-xp-chip-dot coin" aria-hidden="true" />
                +{earnedCoins} Xu
              </span>
            )}
          </m.div>
        )}

        {/* Tier Progress Bar */}
        {tierProgressAfter > tierProgressBefore && (
          <TierProgressBar
            label={tierLabel ? `Progress floor${tierLabel}` : "Progress"}
            before={tierProgressBefore}
            after={tierProgressAfter}
          />
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1.1rem" }}>
          {nextLessonTitle && onNextLesson ? (
            <m.button
              type="button"
              className="lp-btn-primary"
              onClick={onNextLesson}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              aria-label={`Skip to the next lesson:${nextLessonTitle}`}
            >
              Next article
            </m.button>
          ) : null}

          <m.button
            type="button"
            className="lp-btn-ghost"
            onClick={onBackToMap}
            whileHover={prefersReducedMotion ? undefined : { opacity: 0.85 }}
            aria-label="Return to the learning map"
            style={{ width: "100%" }}
          >
            Return to the map
          </m.button>
        </div>
      </m.div>
    </div>
  );
}
