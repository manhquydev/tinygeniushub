"use client";

import * as m from "motion/react-m";

interface WritingPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function WritingProp({ target, reducedMotion }: WritingPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Pencil group at translate(270,160) rotated -30deg */}
        <g transform="translate(270, 160) rotate(-30)">
          {/* Pencil body */}
          <rect x="-4" y="-28" width="8" height="28" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          {/* Pencil tip triangle */}
          <polygon points="-4,0 4,0 0,10" fill="#374151" />
          {/* Pink eraser */}
          <rect x="-4" y="-34" width="8" height="6" fill="#f472b6" stroke="#db2777" strokeWidth="0.8" />
        </g>
        {/* Animated squiggle line below pencil tip */}
        <m.path
          d="M 256 178 Q 260 174 264 178 Q 268 182 272 178"
          stroke="#374151"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [0.3, 1, 0.3] }}
          transition={reducedMotion ? undefined : { duration: 1.4, ease: "easeInOut", repeat: Infinity }}
        />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Small: scaled ~0.6x at translate(218,172) */}
      <g transform="translate(218, 172) rotate(-30) scale(0.6)">
        <rect x="-4" y="-28" width="8" height="28" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <polygon points="-4,0 4,0 0,10" fill="#374151" />
        <rect x="-4" y="-34" width="8" height="6" fill="#f472b6" stroke="#db2777" strokeWidth="0.8" />
      </g>
      <m.path
        d="M 210 180 Q 213 177 216 180 Q 219 183 222 180"
        stroke="#374151"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.3, 1, 0.3] }}
        transition={reducedMotion ? undefined : { duration: 1.4, ease: "easeInOut", repeat: Infinity }}
      />
    </m.g>
  );
}
