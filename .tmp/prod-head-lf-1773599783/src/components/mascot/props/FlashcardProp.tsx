"use client";

import * as m from "motion/react-m";

interface FlashcardPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function FlashcardProp({ target, reducedMotion }: FlashcardPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, y: 2 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -2, 0] }}
        transition={reducedMotion ? undefined : { duration: 2.4, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Flashcard at translate(260,140): rect 44x30 rx=4 */}
        <g transform="translate(260, 140)">
          <rect x="0" y="0" width="44" height="30" rx="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
          {/* ABC text */}
          <text
            x="22"
            y="20"
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#1e3a8a"
            fontFamily="monospace"
          >
            ABC
          </text>
        </g>
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, y: 2 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -1.5, 0] }}
      transition={reducedMotion ? undefined : { duration: 2.4, ease: "easeInOut", repeat: Infinity }}
    >
      {/* Small: scaled ~0.6x at translate(214,165) */}
      <g transform="translate(214, 165) scale(0.6)">
        <rect x="0" y="0" width="44" height="30" rx="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
        <text
          x="22"
          y="20"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#1e3a8a"
          fontFamily="monospace"
        >
          ABC
        </text>
      </g>
    </m.g>
  );
}
