"use client";

import * as m from "motion/react-m";

interface SpacePropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function SpaceProp({ target, reducedMotion }: SpacePropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, scale: 0.96 }}
        animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: [0.8, 1, 0.8], scale: [1, 1.01, 1] }}
        transition={reducedMotion ? undefined : { duration: 2.8, ease: "easeInOut", repeat: Infinity }}
      >
        <ellipse cx="200" cy="140" rx="92" ry="102" fill="none" stroke="#e0f2fe" strokeWidth="3" />
        <ellipse cx="200" cy="140" rx="84" ry="94" fill="none" stroke="#7dd3fc" strokeWidth="1.6" opacity="0.5" />
        <ellipse cx="175" cy="86" rx="24" ry="13" fill="#f8fafc" opacity="0.15" />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, scale: 0.96 }}
      animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: [0.82, 1, 0.82], scale: [1, 1.01, 1] }}
      transition={reducedMotion ? undefined : { duration: 2.5, ease: "easeInOut", repeat: Infinity }}
    >
      <ellipse cx="200" cy="166.5" rx="35.5" ry="33.5" fill="none" stroke="#e0f2fe" strokeWidth="2.1" />
      <ellipse cx="200" cy="166.5" rx="31.8" ry="30.6" fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.5" />
      <ellipse cx="189" cy="148" rx="8.8" ry="5" fill="#f8fafc" opacity="0.16" />
    </m.g>
  );
}

