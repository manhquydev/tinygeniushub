"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { BIG_BEAK_PATHS, BIG_EYE_PATHS, type MascotExpression } from "@/components/mascot/expressions";
import type { MascotGazeDirection, MascotMotionLevel, MascotState } from "@/components/mascot/types";

interface BigOwlProps {
  state: MascotState;
  expression: MascotExpression;
  gazeDirection: MascotGazeDirection;
  reducedMotion: boolean;
  motionLevel: MascotMotionLevel;
  accessory?: ReactNode;
}

export function BigOwl({ state, expression, gazeDirection, reducedMotion, motionLevel, accessory }: BigOwlProps) {
  const pupilOffset = gazeDirection === "left" ? -2.4 : gazeDirection === "right" ? 2.4 : 0;
  const beakPath = BIG_BEAK_PATHS[expression.beak];
  const shouldAnimateWings = motionLevel === "full";
  const softBlinkScale = motionLevel === "soft" ? 0.45 : 0.1;
  const softPupilBlinkScale = motionLevel === "soft" ? 0.36 : 0.08;
  const leftWingAnimate =
    reducedMotion || !shouldAnimateWings || (state !== "celebrating" && state !== "playful" && state !== "proud" && state !== "love")
      ? undefined
      : {
          rotate:
            state === "celebrating"
              ? [0, -20, -8, 0]
              : state === "playful"
                ? [0, -14, -5, 0]
                : state === "love"
                  ? [0, -10, -3, 0]
                  : [0, -8, 0],
        };
  const rightWingAnimate =
    reducedMotion || !shouldAnimateWings || (state !== "celebrating" && state !== "playful" && state !== "proud" && state !== "love")
      ? undefined
      : {
          rotate:
            state === "celebrating"
              ? [0, 20, 8, 0]
              : state === "playful"
                ? [0, 14, 5, 0]
                : state === "love"
                  ? [0, 10, 3, 0]
                  : [0, 8, 0],
        };
  const wingTransition =
    reducedMotion || !shouldAnimateWings || (state !== "celebrating" && state !== "playful" && state !== "proud" && state !== "love")
      ? undefined
      : {
          duration: state === "celebrating" ? 0.9 : state === "playful" ? 1.05 : 1.4,
          ease: "easeInOut" as const,
          repeat: Infinity,
      };
  const blinkTransition = reducedMotion
    ? undefined
    : {
        duration: motionLevel === "soft" ? 9.8 : 7.6,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "loop" as const,
        times: [0, 0.26, 0.29, 0.32, 0.35, 0.67, 0.7, 0.9, 0.93, 0.96],
      };
  const blinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softBlinkScale, 1, 1, 1, 1, softBlinkScale, 1] };
  const pupilBlinkAnimate = reducedMotion
    ? undefined
    : { scaleY: [1, 1, 1, softPupilBlinkScale, 1, 1, 1, 1, softPupilBlinkScale, 1] };
  const beakAnimate = reducedMotion || (expression.beak !== "talking" && expression.beak !== "cheer")
    ? undefined
    : motionLevel === "soft"
      ? { y: [0, 0.9, 0], scaleY: [1, 1.12, 1] }
      : { y: [0, 1.5, 0], scaleY: [1, 1.2, 1] };
  const beakTransition = reducedMotion || (expression.beak !== "talking" && expression.beak !== "cheer")
    ? undefined
    : { duration: state === "celebrating" ? (motionLevel === "soft" ? 0.36 : 0.26) : motionLevel === "soft" ? 0.58 : 0.44, ease: "easeInOut" as const, repeat: Infinity };

  return (
    <m.g>
      <path d="M 125,188 C 125,73 150,48 200,48 C 250,48 275,73 275,188 C 275,233 125,233 125,188 Z" fill="#172554" opacity="0.15" />
      <path d="M 125,185 C 125,70 150,45 200,45 C 250,45 275,70 275,185 C 275,230 125,230 125,185 Z" fill="#1e3a8a" />
      <path d="M 145,185 C 145,115 255,115 255,185 C 255,225 145,225 145,185 Z" fill="#3b82f6" opacity="0.25" />
      <m.path
        d="M 125,125 C 105,160 115,200 145,205"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="6"
        strokeLinecap="round"
        animate={leftWingAnimate}
        transition={wingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "right center" }}
      />
      <m.path
        d="M 275,125 C 295,160 285,200 255,205"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="6"
        strokeLinecap="round"
        animate={rightWingAnimate}
        transition={wingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }}
      />

      {expression.eye === "open" ? (
        <>
          <m.circle
            cx="165"
            cy="110"
            r="18"
            fill="#ffffff"
            stroke="#93c5fd"
            strokeWidth="1.5"
            animate={blinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <m.circle
            cx={165 + pupilOffset}
            cy="110"
            r="7"
            fill="#1e1b4b"
            animate={pupilBlinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <circle cx={168 + pupilOffset} cy="107" r="2.5" fill="#ffffff" />
          <m.circle
            cx="235"
            cy="110"
            r="18"
            fill="#ffffff"
            stroke="#93c5fd"
            strokeWidth="1.5"
            animate={blinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <m.circle
            cx={235 + pupilOffset}
            cy="110"
            r="7"
            fill="#1e1b4b"
            animate={pupilBlinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <circle cx={238 + pupilOffset} cy="107" r="2.5" fill="#ffffff" />
        </>
      ) : null}

      {expression.eye === "star" ? (
        <>
          <polygon points="165,98 168,106 176,106 170,111 172,119 165,114 158,119 160,111 154,106 162,106" fill="#fde047" stroke="#f59e0b" strokeWidth="1.2" />
          <polygon points="235,98 238,106 246,106 240,111 242,119 235,114 228,119 230,111 224,106 232,106" fill="#fde047" stroke="#f59e0b" strokeWidth="1.2" />
        </>
      ) : null}

      {expression.eye !== "open" && expression.eye !== "star" ? (
        <>
          {expression.eye === "wink" ? (
            <>
              <path d="M 149 113 C 161 123 170 123 183 113" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <circle cx="235" cy="110" r="18" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
              <circle cx={235 + pupilOffset} cy="110" r="7" fill="#1e1b4b" />
              <circle cx={238 + pupilOffset} cy="107" r="2.5" fill="#ffffff" />
            </>
          ) : (
            <>
              <path d={BIG_EYE_PATHS[expression.eye].left} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <path d={BIG_EYE_PATHS[expression.eye].right} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </>
      ) : null}

      {state === "love" || state === "playful" ? (
        <>
          <circle cx="157" cy="138" r="8" fill="#fda4af" opacity="0.35" />
          <circle cx="243" cy="138" r="8" fill="#fda4af" opacity="0.35" />
        </>
      ) : null}

      <m.path
        d={beakPath}
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="1"
        animate={beakAnimate}
        transition={beakTransition}
        style={{ transformBox: "fill-box", transformOrigin: "center top" }}
      />

      {accessory}
    </m.g>
  );
}
