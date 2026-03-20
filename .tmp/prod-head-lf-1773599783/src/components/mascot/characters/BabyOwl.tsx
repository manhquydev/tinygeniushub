"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { BABY_BEAK_PATHS, BABY_EYE_PATHS, BABY_EXTENDED_EYE_PATHS, type MascotExpression } from "@/components/mascot/expressions";
import type { MascotGazeDirection, MascotGesture, MascotMotionLevel, MascotState } from "@/components/mascot/types";
import { GestureLayer, GESTURE_CONFIGS } from "@/components/mascot/gestures";
import type { PersonalityAnimation } from "@/components/mascot/personality";

interface BabyOwlProps {
  state: MascotState;
  expression: MascotExpression;
  gazeDirection: MascotGazeDirection;
  reducedMotion: boolean;
  motionLevel: MascotMotionLevel;
  accessory?: ReactNode;
  gesture?: MascotGesture;
  personality?: PersonalityAnimation;
}

export function BabyOwl({ state, expression, gazeDirection, reducedMotion, motionLevel, accessory, gesture = "none", personality = "none" }: BabyOwlProps) {
  const pupilOffset = gazeDirection === "left" ? -1.0 : gazeDirection === "right" ? 1.0 : 0;
  const beakPath = BABY_BEAK_PATHS[expression.beak];
  const shouldAnimateWings = motionLevel === "full";
  const softBlinkScale = motionLevel === "soft" ? 0.5 : 0.12;
  const softPupilBlinkScale = motionLevel === "soft" ? 0.42 : 0.08;

  const wingActive = !reducedMotion && shouldAnimateWings &&
    (state === "celebrating" || state === "playful" || state === "proud" || state === "love");

  const gestureConfig = gesture && gesture !== "none" ? GESTURE_CONFIGS["baby"]?.[gesture] : undefined;

  const defaultLeftWingAnimate = !wingActive ? undefined : {
    rotate: state === "celebrating" ? [0, -15, -5, 0] : state === "playful" ? [0, -11, -3, 0] : state === "love" ? [0, -7, -2, 0] : [0, -5, 0],
  };
  const defaultRightWingAnimate = !wingActive ? undefined : {
    rotate: state === "celebrating" ? [0, 18, 7, 0] : state === "playful" ? [0, 14, 5, 0] : state === "love" ? [0, 9, 3, 0] : [0, 7, 0],
  };
  const defaultLeftWingTransition = !wingActive ? undefined : {
    duration: state === "celebrating" ? 0.95 : state === "playful" ? 1.1 : 1.4,
    ease: "easeInOut" as const, repeat: Infinity, delay: 0.15,
  };
  const defaultRightWingTransition = !wingActive ? undefined : {
    duration: state === "celebrating" ? 0.95 : state === "playful" ? 1.1 : 1.4,
    ease: "easeInOut" as const, repeat: Infinity,
  };

  const leftWingD = gestureConfig?.leftWing?.d ?? "M 179,188 C 172,192 172,202 179,205";
  const leftWingAnimate = gestureConfig?.leftWing ? (reducedMotion ? undefined : gestureConfig.leftWing.animate) : defaultLeftWingAnimate;
  const leftWingTransition = gestureConfig?.leftWing ? (reducedMotion ? undefined : gestureConfig.leftWing.transition) : defaultLeftWingTransition;
  const rightWingD = gestureConfig?.rightWing?.d ?? "M 221,188 C 228,192 228,202 221,205";
  const rightWingAnimate = gestureConfig?.rightWing ? (reducedMotion ? undefined : gestureConfig.rightWing.animate) : defaultRightWingAnimate;
  const rightWingTransition = gestureConfig?.rightWing ? (reducedMotion ? undefined : gestureConfig.rightWing.transition) : defaultRightWingTransition;

  const blinkTransition = reducedMotion ? undefined : {
    duration: motionLevel === "soft" ? 8.0 : 6.0,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "loop" as const,
    times: [0, 0.28, 0.31, 0.34, 0.37, 0.68, 0.71, 0.9, 0.93, 0.96],
  };
  const blinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softBlinkScale, 1, 1, 1, 1, softBlinkScale, 1] };
  const pupilBlinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softPupilBlinkScale, 1, 1, 1, 1, softPupilBlinkScale, 1] };

  const beakActive = !reducedMotion && (expression.beak === "talking" || expression.beak === "cheer");
  const beakAnimate = !beakActive ? undefined
    : motionLevel === "soft" ? { y: [0, 0.5, 0], scaleY: [1, 1.2, 1] } : { y: [0, 1.0, 0], scaleY: [1, 1.5, 1] };
  const beakTransition = !beakActive ? undefined : {
    duration: state === "celebrating" ? (motionLevel === "soft" ? 0.32 : 0.22) : motionLevel === "soft" ? 0.46 : 0.32,
    ease: "easeInOut" as const, repeat: Infinity,
  };

  const doStumble = !reducedMotion && personality === "stumble-toddle";
  const doBeanieFall = !reducedMotion && personality === "beanie-fall";
  const doNapping = !reducedMotion && personality === "napping-curl";

  const beanie = doBeanieFall ? (
    <m.g
      transform="translate(200, 168) rotate(5)"
      animate={{ x: [0, 8, 10], rotate: [5, 15, 20] }}
      transition={{ duration: 0.5, ease: "easeIn" }}
      style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
    >
      <path d="M -18 0 C -18 -14 -12 -22 0 -22 C 12 -22 18 -14 18 0 Z" fill="#fbbf24" />
      <path d="M -19 0 C -19 3 19 3 19 0" fill="#ea580c" stroke="#ea580c" strokeWidth="1" />
      <circle cx="2" cy="-22" r="4" fill="#fb923c" />
    </m.g>
  ) : (
    <g transform="translate(200, 168) rotate(5)">
      <path d="M -18 0 C -18 -14 -12 -22 0 -22 C 12 -22 18 -14 18 0 Z" fill="#fbbf24" />
      <path d="M -19 0 C -19 3 19 3 19 0" fill="#ea580c" stroke="#ea580c" strokeWidth="1" />
      <circle cx="2" cy="-22" r="4" fill="#fb923c" />
    </g>
  );

  const body = (
    <>
      <path d="M 180,205 C 180,172 188,165 200,165 C 212,165 220,172 220,205 C 220,216 180,216 180,205 Z" fill="#c2410c" opacity="0.2" />
      <path d="M 180,203 C 180,170 188,163 200,163 C 212,163 220,170 220,203 C 220,214 180,214 180,203 Z" fill="#ea580c" />
      <ellipse cx="200" cy="200" rx="12" ry="10" fill="#fed7aa" opacity="0.25" />
      <m.path d={leftWingD} fill="none" stroke="#fb923c" strokeWidth="3.5" strokeLinecap="round"
        animate={leftWingAnimate} transition={leftWingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "right center" }} />
      <m.path d={rightWingD} fill="none" stroke="#fb923c" strokeWidth="3.5" strokeLinecap="round"
        animate={rightWingAnimate} transition={rightWingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }} />
      {expression.eye === "open" ? (
        <>
          <m.circle cx="190" cy="183" r="10" fill="#ffffff"
            animate={blinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <m.circle cx={190 + pupilOffset} cy="182" r="4.5" fill="#1e1b4b"
            animate={pupilBlinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx={191.5 + pupilOffset} cy="180.5" r="1.6" fill="#ffffff" />
          <m.circle cx="210" cy="183" r="10" fill="#ffffff"
            animate={blinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <m.circle cx={210 + pupilOffset} cy="182" r="4.5" fill="#1e1b4b"
            animate={pupilBlinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx={211.5 + pupilOffset} cy="180.5" r="1.6" fill="#ffffff" />
        </>
      ) : null}
      {expression.eye === "star" ? (
        <>
          <polygon points="190,175 192,180 197,180.5 193.5,183.5 194.5,188 190,185.5 185.5,188 186.5,183.5 183,180.5 188,180" fill="#fde047" stroke="#f59e0b" strokeWidth="0.8" />
          <polygon points="210,175 212,180 217,180.5 213.5,183.5 214.5,188 210,185.5 205.5,188 206.5,183.5 203,180.5 208,180" fill="#fde047" stroke="#f59e0b" strokeWidth="0.8" />
        </>
      ) : null}
      {expression.eye === "wide" ? (
        <>
          <path d={BABY_EXTENDED_EYE_PATHS.wide.left} fill="#ffffff" />
          <circle cx={190 + pupilOffset} cy="182" r="3" fill="#1e1b4b" />
          <circle cx={191.5 + pupilOffset} cy="180.5" r="1.6" fill="#ffffff" />
          <path d={BABY_EXTENDED_EYE_PATHS.wide.right} fill="#ffffff" />
          <circle cx={210 + pupilOffset} cy="182" r="3" fill="#1e1b4b" />
          <circle cx={211.5 + pupilOffset} cy="180.5" r="1.6" fill="#ffffff" />
        </>
      ) : null}
      {expression.eye === "angry" ? (
        <>
          <path d={BABY_EXTENDED_EYE_PATHS.angry.left} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.angry.leftBrow!} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.angry.right} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.angry.rightBrow!} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {expression.eye === "nervous" ? (
        <>
          <path d={BABY_EXTENDED_EYE_PATHS.nervous.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.nervous.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.nervous.sweatDrop!} fill="#60a5fa" opacity="0.7" />
        </>
      ) : null}
      {expression.eye === "drowsy" ? (
        <>
          <path d={BABY_EXTENDED_EYE_PATHS.drowsy.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.drowsy.lidLeft!} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.drowsy.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={BABY_EXTENDED_EYE_PATHS.drowsy.lidRight!} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {(expression.eye === "smile" || expression.eye === "sleep" || expression.eye === "sad" || expression.eye === "wink") ? (
        <>
          {expression.eye === "wink" ? (
            <>
              <path d="M 184 185 C 186 188 194 188 196 185" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <circle cx="210" cy="183" r="10" fill="#ffffff" />
              <circle cx={210 + pupilOffset} cy="182" r="4.5" fill="#1e1b4b" />
              <circle cx={211.5 + pupilOffset} cy="180.5" r="1.6" fill="#ffffff" />
            </>
          ) : (
            <>
              <path d={BABY_EYE_PATHS[expression.eye].left} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d={BABY_EYE_PATHS[expression.eye].right} stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </>
      ) : null}
      {state === "love" || state === "playful" ? (
        <>
          <circle cx="183" cy="194" r="4.2" fill="#fda4af" opacity="0.4" />
          <circle cx="217" cy="194" r="4.2" fill="#fda4af" opacity="0.4" />
        </>
      ) : null}
      <m.path d={beakPath} fill="#fbbf24"
        animate={beakAnimate} transition={beakTransition}
        style={{ transformBox: "fill-box", transformOrigin: "center top" }} />
      {beanie}
      {accessory}
    </>
  );

  const wrappedBody = doStumble ? (
    <m.g
      animate={{ rotate: [-3, 3, -3], x: [-2, 2, -2] }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity }}
      style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
    >
      {body}
    </m.g>
  ) : doNapping ? (
    <m.g
      animate={{ scaleY: [1, 0.92, 0.92], y: [0, 4, 4] }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
    >
      {body}
    </m.g>
  ) : body;

  return (
    <m.g>
      <GestureLayer gesture={gesture} characterKey="baby" reducedMotion={reducedMotion}>
        {wrappedBody}
      </GestureLayer>
    </m.g>
  );
}
