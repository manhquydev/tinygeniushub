"use client";

import * as m from "motion/react-m";

interface MagicPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function MagicProp({ target, reducedMotion }: MagicPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, y: 2 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -2, 0] }}
        transition={reducedMotion ? undefined : { duration: 2.2, ease: "easeInOut", repeat: Infinity }}
      >
        <path d="M 154 70 L 200 32 L 246 70 Z" fill="#4338ca" stroke="#a5b4fc" strokeWidth="1.6" />
        <rect x="166" y="68" width="68" height="10" rx="4" fill="#3730a3" />
        <path d="M 244 154 L 272 138" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
        <polygon points="276,136 279,143 286,143 280,147 282,154 276,150 270,154 272,147 266,143 273,143" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, y: 2 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -2, 0] }}
      transition={reducedMotion ? undefined : { duration: 2.1, ease: "easeInOut", repeat: Infinity }}
    >
      <path d="M 176 142 L 200 124 L 224 142 Z" fill="#4338ca" stroke="#a5b4fc" strokeWidth="1.2" />
      <rect x="183.8" y="141.2" width="32.4" height="5.4" rx="2.4" fill="#3730a3" />
      <path d="M 203.3 127 L 210 117" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="211.4" cy="115.2" r="2" fill="#fef08a" />
    </m.g>
  );
}

