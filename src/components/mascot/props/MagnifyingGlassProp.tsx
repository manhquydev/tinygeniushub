"use client";

import * as m from "motion/react-m";

interface MagnifyingGlassPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function MagnifyingGlassProp({ target, reducedMotion }: MagnifyingGlassPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: [-3, 3, -3] }}
        transition={reducedMotion ? undefined : { duration: 2.2, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Lens circle at translate(265,135) */}
        <g transform="translate(265, 135)">
          <circle
            cx="0"
            cy="0"
            r="15"
            stroke="#1e3a8a"
            strokeWidth="3"
            fill="white"
            fillOpacity="0.2"
          />
          {/* Glint arc inside lens */}
          <path
            d="M -8 -8 Q -4 -12 2 -10"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Handle line (10,10 to 24,24) */}
          <line
            x1="10"
            y1="10"
            x2="24"
            y2="24"
            stroke="#92400e"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: [-2, 2, -2] }}
      transition={reducedMotion ? undefined : { duration: 2.2, ease: "easeInOut", repeat: Infinity }}
    >
      {/* Small: scaled ~0.6x at translate(214,162) */}
      <g transform="translate(214, 162) scale(0.6)">
        <circle
          cx="0"
          cy="0"
          r="15"
          stroke="#1e3a8a"
          strokeWidth="3"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M -8 -8 Q -4 -12 2 -10"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="10"
          y1="10"
          x2="24"
          y2="24"
          stroke="#92400e"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </m.g>
  );
}
