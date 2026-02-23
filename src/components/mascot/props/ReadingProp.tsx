"use client";

import * as m from "motion/react-m";

interface ReadingPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function ReadingProp({ target, reducedMotion }: ReadingPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, y: 2 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -1.4, 0] }}
        transition={reducedMotion ? undefined : { duration: 2.6, ease: "easeInOut", repeat: Infinity }}
      >
        <circle cx="165" cy="110" r="20" stroke="#0f172a" strokeWidth="2" fill="none" />
        <circle cx="235" cy="110" r="20" stroke="#0f172a" strokeWidth="2" fill="none" />
        <path d="M 185 111 L 215 111" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        <path d="M 155 186 L 196 180 L 200 206 L 160 212 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1.3" />
        <path d="M 204 180 L 245 186 L 240 212 L 200 206 Z" fill="#fef9c3" stroke="#b45309" strokeWidth="1.3" />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, y: 2 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -1, 0] }}
      transition={reducedMotion ? undefined : { duration: 2.4, ease: "easeInOut", repeat: Infinity }}
    >
      <circle cx="186" cy="160" r="10.5" stroke="#0f172a" strokeWidth="1.6" fill="none" />
      <circle cx="214" cy="160" r="10.5" stroke="#0f172a" strokeWidth="1.6" fill="none" />
      <path d="M 196.2 160.2 L 203.8 160.2" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 177.5 185 L 187.4 183.2 L 188.8 194.8 L 178.9 196.6 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
      <path d="M 188.2 183.2 L 198.3 184.4 L 197 196.1 L 186.9 194.9 Z" fill="#fef9c3" stroke="#b45309" strokeWidth="1" />
    </m.g>
  );
}

