"use client";

import React, { type ReactNode } from "react";
import * as m from "motion/react-m";
import { DAD_BEAK_PATHS, DAD_EYE_PATHS, DAD_EXTENDED_EYE_PATHS, type MascotExpression } from "@/components/mascot/expressions";
import type { MascotGazeDirection, MascotGesture, MascotMotionLevel, MascotState } from "@/components/mascot/types";
import { GestureLayer, GESTURE_CONFIGS } from "@/components/mascot/gestures";
import type { PersonalityAnimation } from "@/components/mascot/personality";

interface DadOwlProps {
  state: MascotState;
  expression: MascotExpression;
  gazeDirection: MascotGazeDirection;
  reducedMotion: boolean;
  motionLevel: MascotMotionLevel;
  accessory?: ReactNode;
  gesture?: MascotGesture;
  personality?: PersonalityAnimation;
}

export function DadOwl({ state, expression, gazeDirection, reducedMotion, motionLevel, accessory, gesture = "none", personality = "none" }: DadOwlProps) {
  const pupilOffset = gazeDirection === "left" ? -2.8 : gazeDirection === "right" ? 2.8 : 0;
  const beakPath = DAD_BEAK_PATHS[expression.beak];
  const shouldAnimateWings = motionLevel === "full";
  const softBlinkScale = motionLevel === "soft" ? 0.45 : 0.1;
  const softPupilBlinkScale = motionLevel === "soft" ? 0.36 : 0.08;

  const wingActive = !reducedMotion && shouldAnimateWings &&
    (state === "celebrating" || state === "playful" || state === "proud" || state === "love");

  // Gesture config overrides wing paths/animations when active
  const gestureConfig = gesture && gesture !== "none" ? GESTURE_CONFIGS["dad"]?.[gesture] : undefined;

  const defaultLeftWingAnimate = !wingActive ? undefined : {
    rotate: state === "celebrating" ? [0, -23, -9, 0]
      : state === "playful" ? [0, -16, -6, 0]
      : state === "love" ? [0, -12, -4, 0]
      : [0, -9, 0],
  };
  const defaultRightWingAnimate = !wingActive ? undefined : {
    rotate: state === "celebrating" ? [0, 23, 9, 0]
      : state === "playful" ? [0, 16, 6, 0]
      : state === "love" ? [0, 12, 4, 0]
      : [0, 9, 0],
  };
  const defaultWingTransition = !wingActive ? undefined : {
    duration: state === "celebrating" ? 0.88 : state === "playful" ? 1.02 : 1.38,
    ease: "easeInOut" as const,
    repeat: Infinity,
  };

  const leftWingD = gestureConfig?.leftWing?.d ?? "M 120,120 C 98,158 110,200 140,208";
  const leftWingAnimate = gestureConfig?.leftWing ? (reducedMotion ? undefined : gestureConfig.leftWing.animate) : defaultLeftWingAnimate;
  const leftWingTransition = gestureConfig?.leftWing ? (reducedMotion ? undefined : gestureConfig.leftWing.transition) : defaultWingTransition;
  const rightWingD = gestureConfig?.rightWing?.d ?? "M 280,120 C 302,158 290,200 260,208";
  const rightWingAnimate = gestureConfig?.rightWing ? (reducedMotion ? undefined : gestureConfig.rightWing.animate) : defaultRightWingAnimate;
  const rightWingTransition = gestureConfig?.rightWing ? (reducedMotion ? undefined : gestureConfig.rightWing.transition) : defaultWingTransition;

  const blinkTransition = reducedMotion ? undefined : {
    duration: motionLevel === "soft" ? 10.0 : 7.8,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "loop" as const,
    times: [0, 0.26, 0.29, 0.32, 0.35, 0.67, 0.7, 0.9, 0.93, 0.96],
  };
  const blinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softBlinkScale, 1, 1, 1, 1, softBlinkScale, 1] };
  const pupilBlinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softPupilBlinkScale, 1, 1, 1, 1, softPupilBlinkScale, 1] };

  const beakActive = !reducedMotion && (expression.beak === "talking" || expression.beak === "cheer");
  const beakAnimate = !beakActive ? undefined
    : motionLevel === "soft"
      ? { y: [0, 1.0, 0], scaleY: [1, 1.12, 1] }
      : { y: [0, 1.6, 0], scaleY: [1, 1.22, 1] };
  const beakTransition = !beakActive ? undefined : {
    duration: state === "celebrating" ? (motionLevel === "soft" ? 0.36 : 0.26) : motionLevel === "soft" ? 0.58 : 0.44,
    ease: "easeInOut" as const,
    repeat: Infinity,
  };

  const stateStyle: React.CSSProperties =
    state === "nervous" ? { animation: "mascot-nervous 0.3s ease-in-out infinite" }
    : state === "bored" ? { animation: "mascot-bored 3s ease-in-out infinite" }
    : {};

  const doAuthoritativeNod = !reducedMotion && personality === "authoritative-nod";
  const doSpectaclesPeer = !reducedMotion && personality === "peer-over-glasses";
  const transformStyle = { transformBox: "fill-box" as const, transformOrigin: "center" as const };

  const innerContent = (
      <GestureLayer gesture={gesture} characterKey="dad" reducedMotion={reducedMotion}>
      {/* Body shadow */}
      <path d="M 120,192 C 120,68 148,42 200,42 C 252,42 280,68 280,192 C 280,240 120,240 120,192 Z" fill="#064e3b" opacity="0.15" />
      {/* Body */}
      <path d="M 120,189 C 120,65 148,39 200,39 C 252,39 280,65 280,189 C 280,237 120,237 120,189 Z" fill="#065f46" />
      {/* Chest highlight */}
      <path d="M 140,189 C 140,112 260,112 260,189 C 260,230 140,230 140,189 Z" fill="#34d399" opacity="0.25" />
      {/* Belly patch */}
      <ellipse cx="200" cy="198" rx="30" ry="22" fill="#a7f3d0" opacity="0.2" />

      {/* Wings */}
      <m.path
        d={leftWingD}
        fill="none" stroke="#34d399" strokeWidth="7" strokeLinecap="round"
        animate={leftWingAnimate} transition={leftWingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "right center" }}
      />
      <m.path
        d={rightWingD}
        fill="none" stroke="#34d399" strokeWidth="7" strokeLinecap="round"
        animate={rightWingAnimate} transition={rightWingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }}
      />

      {/* Eyes — open */}
      {expression.eye === "open" ? (
        <>
          <m.circle cx="163" cy="105" r="20" fill="#ffffff" stroke="#86efac" strokeWidth="1.5"
            animate={blinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <m.circle cx={163 + pupilOffset} cy="105" r="8" fill="#1e1b4b"
            animate={pupilBlinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx={166 + pupilOffset} cy="102" r="2.8" fill="#ffffff" />
          <m.circle cx="237" cy="105" r="20" fill="#ffffff" stroke="#86efac" strokeWidth="1.5"
            animate={blinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <m.circle cx={237 + pupilOffset} cy="105" r="8" fill="#1e1b4b"
            animate={pupilBlinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx={240 + pupilOffset} cy="102" r="2.8" fill="#ffffff" />
        </>
      ) : null}

      {/* Eyes — star */}
      {expression.eye === "star" ? (
        <>
          <polygon points="163,93 166,101 174,101 168,106 170,114 163,109 156,114 158,106 152,101 160,101" fill="#fde047" stroke="#f59e0b" strokeWidth="1.2" />
          <polygon points="237,93 240,101 248,101 242,106 244,114 237,109 230,114 232,106 226,101 234,101" fill="#fde047" stroke="#f59e0b" strokeWidth="1.2" />
        </>
      ) : null}

      {expression.eye === "wide" ? (
        <>
          <path d={DAD_EXTENDED_EYE_PATHS.wide.left} fill="#ffffff" stroke="#86efac" strokeWidth="1.5" />
          <circle cx={163 + pupilOffset} cy="105" r="6" fill="#1e1b4b" />
          <circle cx={166 + pupilOffset} cy="102" r="2.8" fill="#ffffff" />
          <path d={DAD_EXTENDED_EYE_PATHS.wide.right} fill="#ffffff" stroke="#86efac" strokeWidth="1.5" />
          <circle cx={237 + pupilOffset} cy="105" r="6" fill="#1e1b4b" />
          <circle cx={240 + pupilOffset} cy="102" r="2.8" fill="#ffffff" />
        </>
      ) : null}

      {expression.eye === "angry" ? (
        <>
          <path d={DAD_EXTENDED_EYE_PATHS.angry.left} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.angry.leftBrow!} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.angry.right} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.angry.rightBrow!} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}

      {expression.eye === "nervous" ? (
        <>
          <path d={DAD_EXTENDED_EYE_PATHS.nervous.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.nervous.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.nervous.sweatDrop!} fill="#60a5fa" opacity="0.7" />
        </>
      ) : null}

      {expression.eye === "drowsy" ? (
        <>
          <path d={DAD_EXTENDED_EYE_PATHS.drowsy.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.drowsy.lidLeft!} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.drowsy.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={DAD_EXTENDED_EYE_PATHS.drowsy.lidRight!} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}

      {/* Eyes — other variants */}
      {(expression.eye === "smile" || expression.eye === "sleep" || expression.eye === "sad" || expression.eye === "wink") ? (
        <>
          {expression.eye === "wink" ? (
            <>
              <path d="M 146 108 C 159 119 170 119 184 108" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <circle cx="237" cy="105" r="20" fill="#ffffff" stroke="#86efac" strokeWidth="1.5" />
              <circle cx={237 + pupilOffset} cy="105" r="8" fill="#1e1b4b" />
              <circle cx={240 + pupilOffset} cy="102" r="2.8" fill="#ffffff" />
            </>
          ) : (
            <>
              <path d={DAD_EYE_PATHS[expression.eye].left} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <path d={DAD_EYE_PATHS[expression.eye].right} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
        </>
      ) : null}

      {/* Blush */}
      {state === "love" || state === "playful" ? (
        <>
          <circle cx="155" cy="133" r="9" fill="#fda4af" opacity="0.35" />
          <circle cx="245" cy="133" r="9" fill="#fda4af" opacity="0.35" />
        </>
      ) : null}

      {/* Spectacles — conditionally animated for peer-over-glasses */}
      {doSpectaclesPeer ? (
        <m.g
          animate={{ rotate: [0, 3, 0], y: [0, 2, 0] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          style={transformStyle}
        >
          <circle cx="163" cy="105" r="22" fill="none" stroke="#854d0e" strokeWidth="2" opacity="0.85" />
          <circle cx="237" cy="105" r="22" fill="none" stroke="#854d0e" strokeWidth="2" opacity="0.85" />
          <path d="M 185 105 Q 200 97 215 105" fill="none" stroke="#854d0e" strokeWidth="1.5" opacity="0.85" />
          <path d="M 141 105 L 128 86" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 259 105 L 272 86" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
        </m.g>
      ) : (
        <g>
          <circle cx="163" cy="105" r="22" fill="none" stroke="#854d0e" strokeWidth="2" opacity="0.85" />
          <circle cx="237" cy="105" r="22" fill="none" stroke="#854d0e" strokeWidth="2" opacity="0.85" />
          <path d="M 185 105 Q 200 97 215 105" fill="none" stroke="#854d0e" strokeWidth="1.5" opacity="0.85" />
          <path d="M 141 105 L 128 86" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 259 105 L 272 86" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
        </g>
      )}

      {/* Beak */}
      <m.path
        d={beakPath} fill="#f59e0b" stroke="#d97706" strokeWidth="1"
        animate={beakAnimate} transition={beakTransition}
        style={{ transformBox: "fill-box", transformOrigin: "center top" }}
      />

      {accessory}
      </GestureLayer>
  );

  return (
    <m.g data-state={state} style={stateStyle}>
      {doAuthoritativeNod ? (
        <m.g
          animate={{ y: [0, 3, 0, 3, 0] }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          style={transformStyle}
        >
          {innerContent}
        </m.g>
      ) : innerContent}
    </m.g>
  );
}
