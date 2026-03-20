"use client";

import * as m from "motion/react-m";

interface PointingStickPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function PointingStickProp({ target, reducedMotion }: PointingStickPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0 }}
        animate={
          reducedMotion
            ? { opacity: 1 }
            : { opacity: 1, rotate: [-2, 2, -2] }
        }
        style={{ transformOrigin: "270px 185px" }}
        transition={reducedMotion ? undefined : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Stick at translate(270,130): line from (0,0) to (50,-55) */}
        <g transform="translate(270, 130)">
          <line
            x1="0"
            y1="0"
            x2="50"
            y2="-55"
            stroke="#92400e"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Red circle at tip */}
          <circle cx="50" cy="-55" r="3" fill="#ef4444" />
        </g>
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0 }}
      animate={
        reducedMotion
          ? { opacity: 1 }
          : { opacity: 1, rotate: [-2, 2, -2] }
      }
      style={{ transformOrigin: "218px 175px" }}
      transition={reducedMotion ? undefined : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
    >
      {/* Small: scaled ~0.6x at translate(218,160) */}
      <g transform="translate(218, 160) scale(0.6)">
        <line
          x1="0"
          y1="0"
          x2="50"
          y2="-55"
          stroke="#92400e"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="50" cy="-55" r="3" fill="#ef4444" />
      </g>
    </m.g>
  );
}
