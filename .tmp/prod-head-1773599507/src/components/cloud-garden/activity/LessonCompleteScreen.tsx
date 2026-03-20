"use client";

/**
 * LessonCompleteScreen — Full-screen celebration overlay.
 *
 * Shown when a lesson is completed. Features:
 *  - Full-screen star burst (StarBurstCanvas at center)
 *  - 3-star rating (SVG stars, animated fill)
 *  - Mascot in celebrating state
 *  - Stars earned counter
 *  - CTA buttons: "Bài tiếp" / "Về vườn"
 */

import { useEffect, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot";
import { StarBurstCanvas } from "../shared/StarBurstCanvas";
import "../cloud-garden.css";

interface LessonCompleteScreenProps {
  starsEarned: 1 | 2 | 3;
  totalStars: number;
  lessonTitle: string;
  onNext?: () => void;
  onBackToGarden?: () => void;
}

function StarRating({ stars, total = 3 }: { stars: number; total?: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }} aria-label={`${stars} sao`}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < stars;
        return (
          <m.svg
            key={i}
            width="42" height="42" viewBox="0 0 24 24" fill="none"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 360, damping: 18 }}
            aria-hidden="true"
          >
            <polygon
              points="12,2 15.1,8.4 22,9.3 17,14.1 18.3,21 12,17.8 5.7,21 7,14.1 2,9.3 8.9,8.4"
              fill={filled ? "#fde047" : "rgba(255,255,255,0.15)"}
              stroke={filled ? "#f59e0b" : "rgba(255,255,255,0.3)"}
              strokeWidth="1.5"
            />
          </m.svg>
        );
      })}
    </div>
  );
}

export function LessonCompleteScreen({
  starsEarned,
  totalStars,
  lessonTitle,
  onNext,
  onBackToGarden,
}: LessonCompleteScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showBurst, setShowBurst] = useState(!prefersReducedMotion);

  // Center of screen for burst origin
  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 400;
  const cy = typeof window !== "undefined" ? window.innerHeight / 3 : 250;

  useEffect(() => {
    // Second burst wave after 0.8s
    if (prefersReducedMotion) return;
    const t = setTimeout(() => setShowBurst(true), 800);
    return () => clearTimeout(t);
  }, [prefersReducedMotion]);

  return (
    <m.div
      className="cg-complete-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      role="dialog"
      aria-modal="true"
      aria-label="Ho\u00e0n th\u00e0nh b\u00e0i h\u1ecdc!"
    >
      {/* Particle burst */}
      {showBurst && !prefersReducedMotion && (
        <StarBurstCanvas
          x={cx}
          y={cy}
          color="rainbow"
          particleCount={64}
          duration={1400}
          onComplete={() => setShowBurst(false)}
        />
      )}

      {/* Panel */}
      <m.div
        className="cg-complete-panel"
        initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 22 }}
      >
        {/* Mascot celebrating */}
        <div style={{ textAlign: "center" }}>
          <Mascot
            variant="small"
            state="celebrating"
            size={120}
            motionLevel="full"
            showBaseGlow={false}
          />
        </div>

        {/* Heading */}
        <m.h2
          className="cg-heading"
          style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)", textAlign: "center" }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {"Xu\u1ea5t s\u1eafc! \ud83c\udf89"}
        </m.h2>

        <p className="cg-subtext" style={{ textAlign: "center" }}>
          {lessonTitle}
        </p>

        {/* Star rating */}
        <StarRating stars={starsEarned} />

        {/* Stars earned counter */}
        <m.div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "1rem",
            fontWeight: 800,
            color: "#fde047",
            justifyContent: "center",
          }}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polygon
              points="12,2 15.1,8.4 22,9.3 17,14.1 18.3,21 12,17.8 5.7,21 7,14.1 2,9.3 8.9,8.4"
              fill="#fde047" stroke="#f59e0b" strokeWidth="1"
            />
          </svg>
          <span>{`+${starsEarned} sao • T\u1ed5ng: ${totalStars}`}</span>
        </m.div>

        {/* CTA buttons */}
        <div style={{ display: "grid", gap: "0.6rem", width: "100%" }}>
          {onNext && (
            <m.button
              className="cg-cta-btn"
              onClick={onNext}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              aria-label="Ti\u1ebfp t\u1ee5c b\u00e0i ti\u1ebfp theo"
            >
              {"B\u00e0i ti\u1ebfp \u2192"}
            </m.button>
          )}
          <m.button
            onClick={onBackToGarden}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            aria-label="V\u1ec1 khu v\u01b0\u1eddn"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "0.7rem 1.2rem",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            {"V\u1ec1 khu v\u01b0\u1eddn \ud83c\udf3f"}
          </m.button>
        </div>
      </m.div>
    </m.div>
  );
}
