"use client";

import * as m from "motion/react-m";

interface HeartPropProps {
  target: "big" | "small";
  reducedMotion: boolean;
}

export function HeartProp({ target, reducedMotion }: HeartPropProps) {
  if (target === "big") {
    return (
      <m.g
        initial={{ opacity: 0, y: 4 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: [0.4, 1, 0.4], y: [0, -7, 0] }}
        transition={reducedMotion ? undefined : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      >
        <path d="M 132 88 C 132 80 142 76 148 84 C 154 76 164 80 164 88 C 164 96 157 101 148 108 C 139 101 132 96 132 88 Z" fill="#fb7185" />
        <path d="M 238 62 C 238 55 247 52 252 58 C 257 52 266 55 266 62 C 266 69 260 73 252 79 C 244 73 238 69 238 62 Z" fill="#f43f5e" />
        <path d="M 264 118 C 264 112 271 109 275 114 C 279 109 286 112 286 118 C 286 124 281 127 275 132 C 269 127 264 124 264 118 Z" fill="#fda4af" />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0, y: 3 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: [0.45, 1, 0.45], y: [0, -4, 0] }}
      transition={reducedMotion ? undefined : { duration: 1.7, ease: "easeInOut", repeat: Infinity }}
    >
      <path d="M 176 142 C 176 138 181 136 184 140 C 187 136 192 138 192 142 C 192 146 189 149 184 152 C 179 149 176 146 176 142 Z" fill="#fb7185" />
      <path d="M 220 132 C 220 128 224 126 227 130 C 230 126 234 128 234 132 C 234 136 231 139 227 142 C 223 139 220 136 220 132 Z" fill="#f43f5e" />
    </m.g>
  );
}
