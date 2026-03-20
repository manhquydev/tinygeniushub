"use client";

import * as m from "motion/react-m";

interface DrawingPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function DrawingProp({ target, reducedMotion }: DrawingPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Paintbrush at translate(268,155) angled */}
        <g transform="translate(268, 155) rotate(-25)">
          {/* Handle */}
          <rect x="-3" y="-30" width="6" height="30" fill="#92400e" rx="1" />
          {/* Bristle tip arc */}
          <ellipse cx="0" cy="6" rx="4" ry="7" fill="#6b7280" />
          {/* Bristle tip point */}
          <polygon points="-2,10 2,10 0,16" fill="#4b5563" />
        </g>
        {/* Color splash circles near tip */}
        <m.circle
          cx="260"
          cy="174"
          r="4"
          fill="#ef4444"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
          transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity, delay: 0 }}
        />
        <m.circle
          cx="270"
          cy="180"
          r="3.5"
          fill="#3b82f6"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
          transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity, delay: 0.4 }}
        />
        <m.circle
          cx="252"
          cy="180"
          r="3"
          fill="#fbbf24"
          animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
          transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
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
      {/* Small: scaled ~0.6x at translate(216,170) */}
      <g transform="translate(216, 170) rotate(-25) scale(0.6)">
        <rect x="-3" y="-30" width="6" height="30" fill="#92400e" rx="1" />
        <ellipse cx="0" cy="6" rx="4" ry="7" fill="#6b7280" />
        <polygon points="-2,10 2,10 0,16" fill="#4b5563" />
      </g>
      <m.circle
        cx="210"
        cy="178"
        r="2.5"
        fill="#ef4444"
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity, delay: 0 }}
      />
      <m.circle
        cx="217"
        cy="182"
        r="2"
        fill="#3b82f6"
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity, delay: 0.4 }}
      />
      <m.circle
        cx="204"
        cy="182"
        r="2"
        fill="#fbbf24"
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={reducedMotion ? undefined : { duration: 1.2, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
      />
    </m.g>
  );
}
