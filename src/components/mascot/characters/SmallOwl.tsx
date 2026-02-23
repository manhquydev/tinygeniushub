"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { SMALL_BEAK_PATHS, SMALL_EYE_PATHS, type MascotExpression } from "@/components/mascot/expressions";
import type { MascotGazeDirection, MascotMotionLevel, MascotState } from "@/components/mascot/types";

interface SmallOwlProps {
  state: MascotState;
  expression: MascotExpression;
  gazeDirection: MascotGazeDirection;
  reducedMotion: boolean;
  motionLevel: MascotMotionLevel;
  accessory?: ReactNode;
}

export function SmallOwl({ state, expression, gazeDirection, reducedMotion, motionLevel, accessory }: SmallOwlProps) {
  const pupilOffset = gazeDirection === "left" ? -1.3 : gazeDirection === "right" ? 1.3 : 0;
  const beakPath = SMALL_BEAK_PATHS[expression.beak];
  const shouldAnimateWings = motionLevel === "full";
  const softBlinkScale = motionLevel === "soft" ? 0.5 : 0.12;
  const softPupilBlinkScale = motionLevel === "soft" ? 0.42 : 0.08;
  const leftWingAnimate =
    reducedMotion || !shouldAnimateWings || (state !== "celebrating" && state !== "playful" && state !== "proud" && state !== "love")
      ? undefined
      : {
          rotate:
            state === "celebrating"
              ? [0, -18, -7, 0]
              : state === "playful"
                ? [0, -13, -4, 0]
                : state === "love"
                  ? [0, -9, -3, 0]
                  : [0, -7, 0],
        };
  const rightWingAnimate =
    reducedMotion || !shouldAnimateWings || (state !== "celebrating" && state !== "playful" && state !== "proud" && state !== "love")
      ? undefined
      : {
          rotate:
            state === "celebrating"
              ? [0, 18, 7, 0]
              : state === "playful"
                ? [0, 13, 4, 0]
                : state === "love"
                  ? [0, 9, 3, 0]
                  : [0, 7, 0],
        };
  const wingTransition =
    reducedMotion || !shouldAnimateWings || (state !== "celebrating" && state !== "playful" && state !== "proud" && state !== "love")
      ? undefined
      : {
          duration: state === "celebrating" ? 0.92 : state === "playful" ? 1.06 : 1.35,
          ease: "easeInOut" as const,
          repeat: Infinity,
      };
  const blinkTransition = reducedMotion
    ? undefined
    : {
        duration: motionLevel === "soft" ? 9.5 : 7.2,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "loop" as const,
        times: [0, 0.28, 0.31, 0.34, 0.37, 0.68, 0.71, 0.9, 0.93, 0.96],
      };
  const blinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softBlinkScale, 1, 1, 1, 1, softBlinkScale, 1] };
  const pupilBlinkAnimate = reducedMotion
    ? undefined
    : { scaleY: [1, 1, 1, softPupilBlinkScale, 1, 1, 1, 1, softPupilBlinkScale, 1] };
  const beakAnimate = reducedMotion || (expression.beak !== "talking" && expression.beak !== "cheer")
    ? undefined
    : motionLevel === "soft"
      ? { y: [0, 0.65, 0], scaleY: [1, 1.2, 1] }
      : { y: [0, 1.2, 0], scaleY: [1, 1.45, 1] };
  const beakTransition = reducedMotion || (expression.beak !== "talking" && expression.beak !== "cheer")
    ? undefined
    : { duration: state === "celebrating" ? (motionLevel === "soft" ? 0.34 : 0.25) : motionLevel === "soft" ? 0.5 : 0.36, ease: "easeInOut" as const, repeat: Infinity };

  return (
    <m.g>
      <path d="M 168,198 C 168,148 180,138 200,138 C 220,138 232,148 232,198 C 232,218 168,218 168,198 Z" fill="#0369a1" opacity="0.2" />
      <path d="M 168,195 C 168,145 180,135 200,135 C 220,135 232,145 232,195 C 232,215 168,215 168,195 Z" fill="#0ea5e9" />
      <m.path
        d="M 167,170 C 156,176 155,193 167,198"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="4.4"
        strokeLinecap="round"
        animate={leftWingAnimate}
        transition={wingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "right center" }}
      />
      <m.path
        d="M 233,170 C 244,176 245,193 233,198"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="4.4"
        strokeLinecap="round"
        animate={rightWingAnimate}
        transition={wingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }}
      />

      {expression.eye === "open" ? (
        <>
          <m.circle
            cx="186"
            cy="160"
            r="9"
            fill="#ffffff"
            animate={blinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <m.circle
            cx={186 + pupilOffset}
            cy="158"
            r="4"
            fill="#0f172a"
            animate={pupilBlinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <circle cx={187.5 + pupilOffset} cy="156.5" r="1.5" fill="#ffffff" />
          <m.circle
            cx="214"
            cy="160"
            r="9"
            fill="#ffffff"
            animate={blinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <m.circle
            cx={214 + pupilOffset}
            cy="158"
            r="4"
            fill="#0f172a"
            animate={pupilBlinkAnimate}
            transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          <circle cx={215.5 + pupilOffset} cy="156.5" r="1.5" fill="#ffffff" />
        </>
      ) : null}

      {expression.eye === "star" ? (
        <>
          <polygon points="186,150 188.2,155.8 194.4,156 189.5,159.8 191.3,165.8 186,162.3 180.7,165.8 182.5,159.8 177.6,156 183.8,155.8" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
          <polygon points="214,150 216.2,155.8 222.4,156 217.5,159.8 219.3,165.8 214,162.3 208.7,165.8 210.5,159.8 205.6,156 211.8,155.8" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
        </>
      ) : null}

      {expression.eye !== "open" && expression.eye !== "star" ? (
        <>
          {expression.eye === "wink" ? (
            <>
              <path d="M 178 160 C 182 165 190 165 194 160" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="214" cy="160" r="9" fill="#ffffff" />
              <circle cx={214 + pupilOffset} cy="158" r="4" fill="#0f172a" />
              <circle cx={215.5 + pupilOffset} cy="156.5" r="1.5" fill="#ffffff" />
            </>
          ) : (
            <>
              <path d={SMALL_EYE_PATHS[expression.eye].left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <path d={SMALL_EYE_PATHS[expression.eye].right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </>
      ) : null}

      {state === "love" || state === "playful" ? (
        <>
          <circle cx="178" cy="174" r="4.6" fill="#fda4af" opacity="0.35" />
          <circle cx="222" cy="174" r="4.6" fill="#fda4af" opacity="0.35" />
        </>
      ) : null}

      <m.path
        d={beakPath}
        fill="#f59e0b"
        animate={beakAnimate}
        transition={beakTransition}
        style={{ transformBox: "fill-box", transformOrigin: "center top" }}
      />
      <polygon points="200,182 202,189 208,189 203,193 205,200 200,195 195,200 197,193 192,189 198,189" fill="#f59e0b" />

      {accessory}
    </m.g>
  );
}
