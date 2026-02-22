"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

export type KidMascotState =
  | "idle"
  | "talking"
  | "happy"
  | "confused"
  | "sleeping"
  | "celebrating";

export type KidMascotActionProp = "reading" | "math" | "exploring";

interface KidMascotProps {
  size?: number;
  className?: string;
  state?: KidMascotState;
  actionProp?: KidMascotActionProp;
  title?: string;
}

const BLINK_TRANSITION = {
  duration: 7.2,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatType: "loop" as const,
  times: [0, 0.28, 0.31, 0.34, 0.37, 0.68, 0.71, 0.9, 0.93, 0.96],
};

export function KidMascot({
  size = 120,
  className,
  state = "idle",
  actionProp,
  title = "Cu Con",
}: KidMascotProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  const isSleeping = state === "sleeping";
  const isConfused = state === "confused";
  const isHappy = state === "happy";
  const isCelebrating = state === "celebrating";
  const isTalking = state === "talking";

  const bodyAnimation = prefersReducedMotion
    ? undefined
    : isCelebrating
      ? { y: [0, -10, 0], rotate: [0, 360], scale: [1, 1.06, 1] }
      : isConfused
        ? { rotate: [0, -10, 10, -8, 6, 0], scaleY: [1, 1.02, 1] }
        : isHappy
          ? { y: [0, -8, 0, -5, 0], scaleY: [1, 1.05, 1, 1.03, 1] }
          : isSleeping
            ? { y: [0, 1.1, 0], scaleY: [1, 0.97, 1] }
            : isTalking
              ? { y: [0, -2, 0, 1, 0], scaleY: [1, 1.01, 1, 1.005, 1] }
              : { y: [0, -0.9, 0], scaleY: [1, 1.02, 1] };

  const bodyTransition = prefersReducedMotion
    ? undefined
    : isCelebrating
      ? { duration: 1.1, ease: "easeInOut" as const, repeat: Infinity }
      : isConfused
        ? { duration: 0.8, ease: "easeInOut" as const, repeat: Infinity }
        : isHappy
          ? { duration: 1.15, ease: "easeInOut" as const, repeat: Infinity }
          : isSleeping
            ? { duration: 3.4, ease: "easeInOut" as const, repeat: Infinity }
            : isTalking
              ? { duration: 0.85, ease: "easeInOut" as const, repeat: Infinity }
              : { duration: 3.2, ease: "easeInOut" as const, repeat: Infinity };

  const eyeWhiteAnimation = prefersReducedMotion || isSleeping || isHappy || isCelebrating
    ? undefined
    : isConfused
      ? { scaleY: [1, 0.32, 1, 0.44, 1, 1] }
      : { scaleY: [1, 1, 1, 0.12, 1, 1, 1, 1, 0.12, 1] };

  const eyePupilAnimation = prefersReducedMotion || isSleeping || isHappy || isCelebrating
    ? undefined
    : isConfused
      ? { scaleY: [1, 0.24, 1, 0.38, 1, 1] }
      : { scaleY: [1, 1, 1, 0.08, 1, 1, 1, 1, 0.08, 1] };

  const eyeTransition = prefersReducedMotion || isSleeping || isHappy || isCelebrating
    ? undefined
    : isConfused
      ? { duration: 0.72, ease: "easeInOut" as const, repeat: Infinity }
      : BLINK_TRANSITION;

  const beakAnimation = prefersReducedMotion || (!isTalking && !isCelebrating)
    ? undefined
    : { y: [0, 1.6, 0], scaleY: [1, 1.52, 1] };

  const beakTransition = prefersReducedMotion || (!isTalking && !isCelebrating)
    ? undefined
    : { duration: isCelebrating ? 0.25 : 0.36, ease: "easeInOut" as const, repeat: Infinity };

  return (
    <m.svg
      width={size}
      height={size}
      viewBox="160 128 80 92"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      <AnimatePresence mode="wait">
        {isSleeping ? (
          <m.g
            key="zzz"
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={prefersReducedMotion ? { opacity: 0.72 } : { opacity: [0, 0.85, 0], y: [0, -8, -16], scale: [0.8, 1, 1.1] }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? undefined : { duration: 2.2, ease: "easeOut", repeat: Infinity }}
          >
            <text x="220" y="130" fill="#dbeafe" fontSize="8" fontWeight="700">
              Zzz...
            </text>
          </m.g>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isConfused ? (
          <m.text
            key="confused-mark"
            x="222"
            y="137"
            fill="#fef08a"
            fontSize="11"
            fontWeight="800"
            initial={{ opacity: 0, y: 2, scale: 0.8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.25, 1, 0.35], y: [0, -2, 0], scale: [0.9, 1.1, 0.95] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={prefersReducedMotion ? undefined : { duration: 0.9, ease: "easeInOut", repeat: Infinity }}
          >
            ?
          </m.text>
        ) : null}
      </AnimatePresence>

      <m.g animate={bodyAnimation} transition={bodyTransition}>
        <path d="M 168,198 C 168,148 180,138 200,138 C 220,138 232,148 232,198 C 232,218 168,218 168,198 Z" fill="#0369a1" opacity="0.2" />
        <path d="M 168,195 C 168,145 180,135 200,135 C 220,135 232,145 232,195 C 232,215 168,215 168,195 Z" fill="#0ea5e9" />

        {!isHappy && !isSleeping && !isCelebrating ? (
          <>
            <m.ellipse
              cx="186"
              cy="160"
              rx="9"
              ry="9"
              fill="#ffffff"
              animate={eyeWhiteAnimation}
              transition={eyeTransition}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <m.ellipse
              cx="214"
              cy="160"
              rx="9"
              ry="9"
              fill="#ffffff"
              animate={eyeWhiteAnimation}
              transition={eyeTransition}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <m.ellipse
              cx="186"
              cy="158"
              rx="4"
              ry="4"
              fill="#0f172a"
              animate={eyePupilAnimation}
              transition={eyeTransition}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <m.ellipse
              cx="214"
              cy="158"
              rx="4"
              ry="4"
              fill="#0f172a"
              animate={eyePupilAnimation}
              transition={eyeTransition}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <circle cx="187.5" cy="156.5" r="1.5" fill="#ffffff" />
            <circle cx="215.5" cy="156.5" r="1.5" fill="#ffffff" />
          </>
        ) : null}

        {isHappy ? (
          <m.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path d="M 178 161 C 183 153, 189 153, 194 161" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 206 161 C 211 153, 217 153, 222 161" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
          </m.g>
        ) : null}

        {isSleeping ? (
          <m.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path d="M 178.5 160 C 182 162, 190 162, 193.5 160" stroke="#0f172a" strokeWidth="2.3" strokeLinecap="round" />
            <path d="M 206.5 160 C 210 162, 218 162, 221.5 160" stroke="#0f172a" strokeWidth="2.3" strokeLinecap="round" />
          </m.g>
        ) : null}

        {isCelebrating ? (
          <m.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <polygon points="186,150 188.2,155.8 194.4,156 189.5,159.8 191.3,165.8 186,162.3 180.7,165.8 182.5,159.8 177.6,156 183.8,155.8" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
            <polygon points="214,150 216.2,155.8 222.4,156 217.5,159.8 219.3,165.8 214,162.3 208.7,165.8 210.5,159.8 205.6,156 211.8,155.8" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
          </m.g>
        ) : null}

        <path d="M 196.8,168 L 203.2,168 L 200,172.4 Z" fill="#f59e0b" />
        <m.g animate={beakAnimation} transition={beakTransition} style={{ transformBox: "fill-box", transformOrigin: "center top" }}>
          <path d="M 196.8,168.6 L 203.2,168.6 L 200,176 Z" fill="#f59e0b" />
        </m.g>

        <polygon points="200,182 202,189 208,189 203,193 205,200 200,195 195,200 197,193 192,189 198,189" fill="#f59e0b" />
      </m.g>

      {actionProp === "reading" ? (
        <m.g
          initial={{ opacity: 0, y: 2 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -1, 0] }}
          transition={prefersReducedMotion ? undefined : { duration: 2.4, ease: "easeInOut", repeat: Infinity }}
        >
          <circle cx="186" cy="160" r="10.5" stroke="#0f172a" strokeWidth="1.6" fill="none" />
          <circle cx="214" cy="160" r="10.5" stroke="#0f172a" strokeWidth="1.6" fill="none" />
          <path d="M 196.2 160.2 L 203.8 160.2" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 177.5 185 L 187.4 183.2 L 188.8 194.8 L 178.9 196.6 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
          <path d="M 188.2 183.2 L 198.3 184.4 L 197 196.1 L 186.9 194.9 Z" fill="#fef9c3" stroke="#b45309" strokeWidth="1" />
        </m.g>
      ) : null}

      {actionProp === "math" ? (
        <m.g
          initial={{ opacity: 0, y: 2 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: [0, -2, 0] }}
          transition={prefersReducedMotion ? undefined : { duration: 2.1, ease: "easeInOut", repeat: Infinity }}
        >
          <path d="M 176 142 L 200 124 L 224 142 Z" fill="#4338ca" stroke="#a5b4fc" strokeWidth="1.2" />
          <rect x="183.8" y="141.2" width="32.4" height="5.4" rx="2.4" fill="#3730a3" />
          <path d="M 203.3 127 L 210 117" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="211.4" cy="115.2" r="2" fill="#fef08a" />
        </m.g>
      ) : null}

      {actionProp === "exploring" ? (
        <m.g
          initial={{ opacity: 0, scale: 0.96 }}
          animate={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: [0.82, 1, 0.82], scale: [1, 1.01, 1] }}
          transition={prefersReducedMotion ? undefined : { duration: 2.5, ease: "easeInOut", repeat: Infinity }}
        >
          <ellipse cx="200" cy="166.5" rx="35.5" ry="33.5" fill="none" stroke="#e0f2fe" strokeWidth="2.1" />
          <ellipse cx="200" cy="166.5" rx="31.8" ry="30.6" fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="189" cy="148" rx="8.8" ry="5" fill="#f8fafc" opacity="0.16" />
        </m.g>
      ) : null}
    </m.svg>
  );
}
