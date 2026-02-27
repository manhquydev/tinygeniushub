"use client";

import * as m from "motion/react-m";

interface TrophyPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function TrophyProp({ target, reducedMotion }: TrophyPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.05, 1] }}
        style={{ transformOrigin: "287px 158px" }}
        transition={reducedMotion ? undefined : { duration: 2, ease: "easeInOut", repeat: Infinity }}
      >
        <g transform="translate(265, 130)">
          {/* Cup body path */}
          <path
            d="M 8 0 L 36 0 L 32 22 Q 22 30 12 22 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="1.5"
          />
          {/* Cup handles */}
          <path d="M 8 4 Q 0 8 2 16 Q 4 20 10 18" fill="none" stroke="#d97706" strokeWidth="1.5" />
          <path d="M 36 4 Q 44 8 42 16 Q 40 20 34 18" fill="none" stroke="#d97706" strokeWidth="1.5" />
          {/* Base rect */}
          <rect x="12" y="30" width="20" height="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          {/* Pedestal rect */}
          <rect x="8" y="34" width="28" height="5" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          {/* Star polygon */}
          <polygon
            points="22,4 23.5,9 28,9 24.5,12 26,17 22,14 18,17 19.5,12 16,9 20.5,9"
            fill="#fde047"
            stroke="#ca8a04"
            strokeWidth="0.5"
          />
        </g>
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, scale: 0.9 }}
      animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.05, 1] }}
      style={{ transformOrigin: "222px 178px" }}
      transition={reducedMotion ? undefined : { duration: 2, ease: "easeInOut", repeat: Infinity }}
    >
      {/* Small: scaled ~0.6x at translate(214,160) */}
      <g transform="translate(214, 160) scale(0.6)">
        <path
          d="M 8 0 L 36 0 L 32 22 Q 22 30 12 22 Z"
          fill="#fbbf24"
          stroke="#d97706"
          strokeWidth="1.5"
        />
        <path d="M 8 4 Q 0 8 2 16 Q 4 20 10 18" fill="none" stroke="#d97706" strokeWidth="1.5" />
        <path d="M 36 4 Q 44 8 42 16 Q 40 20 34 18" fill="none" stroke="#d97706" strokeWidth="1.5" />
        <rect x="12" y="30" width="20" height="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <rect x="8" y="34" width="28" height="5" rx="1" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <polygon
          points="22,4 23.5,9 28,9 24.5,12 26,17 22,14 18,17 19.5,12 16,9 20.5,9"
          fill="#fde047"
          stroke="#ca8a04"
          strokeWidth="0.5"
        />
      </g>
    </m.g>
  );
}
