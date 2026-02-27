"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { SISTER_BEAK_PATHS, SISTER_EYE_PATHS, SISTER_EXTENDED_EYE_PATHS, type MascotExpression } from "@/components/mascot/expressions";
import type { MascotGazeDirection, MascotGesture, MascotMotionLevel, MascotState } from "@/components/mascot/types";
import { GestureLayer, GESTURE_CONFIGS } from "@/components/mascot/gestures";
import type { PersonalityAnimation } from "@/components/mascot/personality";

interface SisterOwlProps {
  state: MascotState;
  expression: MascotExpression;
  gazeDirection: MascotGazeDirection;
  reducedMotion: boolean;
  motionLevel: MascotMotionLevel;
  accessory?: ReactNode;
  gesture?: MascotGesture;
  personality?: PersonalityAnimation;
}

export function SisterOwl({ state, expression, gazeDirection, reducedMotion, motionLevel, accessory, gesture = "none", personality = "none" }: SisterOwlProps) {
  const pupilOffset = gazeDirection === "left" ? -1.6 : gazeDirection === "right" ? 1.6 : 0;
  const beakPath = SISTER_BEAK_PATHS[expression.beak];
  const shouldAnimateWings = motionLevel === "full";
  const softBlinkScale = motionLevel === "soft" ? 0.48 : 0.11;
  const softPupilBlinkScale = motionLevel === "soft" ? 0.4 : 0.08;

  const wingActive = !reducedMotion && shouldAnimateWings &&
    (state === "celebrating" || state === "playful" || state === "proud" || state === "love");

  const gestureConfig = gesture && gesture !== "none" ? GESTURE_CONFIGS["sister"]?.[gesture] : undefined;

  const defaultLeftWingAnimate = !wingActive ? undefined : {
    rotate: state === "celebrating" ? [0, -19, -7, 0] : state === "playful" ? [0, -14, -5, 0] : state === "love" ? [0, -10, -3, 0] : [0, -8, 0],
  };
  const defaultRightWingAnimate = !wingActive ? undefined : {
    rotate: state === "celebrating" ? [0, 19, 7, 0] : state === "playful" ? [0, 14, 5, 0] : state === "love" ? [0, 10, 3, 0] : [0, 8, 0],
  };
  const defaultWingTransition = !wingActive ? undefined : {
    duration: state === "celebrating" ? 0.9 : state === "playful" ? 1.04 : 1.36,
    ease: "easeInOut" as const,
    repeat: Infinity,
  };

  const leftWingD = gestureConfig?.leftWing?.d ?? "M 164,163 C 152,170 151,190 164,196";
  const leftWingAnimate = gestureConfig?.leftWing ? (reducedMotion ? undefined : gestureConfig.leftWing.animate) : defaultLeftWingAnimate;
  const leftWingTransition = gestureConfig?.leftWing ? (reducedMotion ? undefined : gestureConfig.leftWing.transition) : defaultWingTransition;
  const rightWingD = gestureConfig?.rightWing?.d ?? "M 236,163 C 248,170 249,190 236,196";
  const rightWingAnimate = gestureConfig?.rightWing ? (reducedMotion ? undefined : gestureConfig.rightWing.animate) : defaultRightWingAnimate;
  const rightWingTransition = gestureConfig?.rightWing ? (reducedMotion ? undefined : gestureConfig.rightWing.transition) : defaultWingTransition;

  const blinkTransition = reducedMotion ? undefined : {
    duration: motionLevel === "soft" ? 9.6 : 7.4,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "loop" as const,
    times: [0, 0.27, 0.3, 0.33, 0.36, 0.68, 0.71, 0.9, 0.93, 0.96],
  };
  const blinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softBlinkScale, 1, 1, 1, 1, softBlinkScale, 1] };
  const pupilBlinkAnimate = reducedMotion ? undefined : { scaleY: [1, 1, 1, softPupilBlinkScale, 1, 1, 1, 1, softPupilBlinkScale, 1] };

  const beakActive = !reducedMotion && (expression.beak === "talking" || expression.beak === "cheer");
  const beakAnimate = !beakActive ? undefined
    : motionLevel === "soft" ? { y: [0, 0.7, 0], scaleY: [1, 1.18, 1] } : { y: [0, 1.3, 0], scaleY: [1, 1.4, 1] };
  const beakTransition = !beakActive ? undefined : {
    duration: state === "celebrating" ? (motionLevel === "soft" ? 0.35 : 0.25) : motionLevel === "soft" ? 0.52 : 0.38,
    ease: "easeInOut" as const,
    repeat: Infinity,
  };

  const doSpin = !reducedMotion && personality === "spin-360";
  const doEarWiggle = !reducedMotion && personality === "ear-tuft-wiggle";
  const doBowWobble = !reducedMotion && personality === "bow-wobble";

  const earTufts = doEarWiggle ? (
    <m.g
      animate={{ rotate: [-3, 3, -3] }}
      transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
      style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
    >
      <path d="M 178 140 C 174 128 170 118 168 108" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 180 140 C 178 130 175 120 174 112" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M 222 140 C 226 128 230 118 232 108" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 220 140 C 222 130 225 120 226 112" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
    </m.g>
  ) : (
    <>
      <path d="M 178 140 C 174 128 170 118 168 108" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 180 140 C 178 130 175 120 174 112" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M 222 140 C 226 128 230 118 232 108" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M 220 140 C 222 130 225 120 226 112" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  );

  const flowerBow = doBowWobble ? (
    <m.g
      transform="translate(222, 124)"
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <circle cx="0" cy="-5" r="4" fill="#f472b6" />
      <circle cx="4.5" cy="-1" r="4" fill="#f472b6" />
      <circle cx="2.8" cy="4" r="4" fill="#f472b6" />
      <circle cx="-2.8" cy="4" r="4" fill="#f472b6" />
      <circle cx="-4.5" cy="-1" r="4" fill="#f472b6" />
      <circle cx="0" cy="0" r="2.5" fill="#fbbf24" />
    </m.g>
  ) : (
    <g transform="translate(222, 124)">
      <circle cx="0" cy="-5" r="4" fill="#f472b6" />
      <circle cx="4.5" cy="-1" r="4" fill="#f472b6" />
      <circle cx="2.8" cy="4" r="4" fill="#f472b6" />
      <circle cx="-2.8" cy="4" r="4" fill="#f472b6" />
      <circle cx="-4.5" cy="-1" r="4" fill="#f472b6" />
      <circle cx="0" cy="0" r="2.5" fill="#fbbf24" />
    </g>
  );

  const body = (
    <>
      {earTufts}
      <path d="M 165,196 C 165,140 178,128 200,128 C 222,128 235,140 235,196 C 235,220 165,220 165,196 Z" fill="#6d28d9" opacity="0.18" />
      <path d="M 165,193 C 165,137 178,125 200,125 C 222,125 235,137 235,193 C 235,217 165,217 165,193 Z" fill="#7c3aed" />
      <path d="M 175,193 C 175,155 225,155 225,193 C 225,215 175,215 175,193 Z" fill="#a78bfa" opacity="0.22" />
      <m.path d={leftWingD} fill="none" stroke="#a78bfa" strokeWidth="5" strokeLinecap="round"
        animate={leftWingAnimate} transition={leftWingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "right center" }} />
      <m.path d={rightWingD} fill="none" stroke="#a78bfa" strokeWidth="5" strokeLinecap="round"
        animate={rightWingAnimate} transition={rightWingTransition}
        style={{ transformBox: "fill-box", transformOrigin: "left center" }} />
      {expression.eye === "open" ? (
        <>
          <m.circle cx="184" cy="152" r="11" fill="#ffffff" stroke="#c4b5fd" strokeWidth="1.2"
            animate={blinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <m.circle cx={184 + pupilOffset} cy="151" r="5" fill="#1e1b4b"
            animate={pupilBlinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx={186 + pupilOffset} cy="149" r="1.8" fill="#ffffff" />
          <m.circle cx="216" cy="152" r="11" fill="#ffffff" stroke="#c4b5fd" strokeWidth="1.2"
            animate={blinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <m.circle cx={216 + pupilOffset} cy="151" r="5" fill="#1e1b4b"
            animate={pupilBlinkAnimate} transition={blinkTransition}
            style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx={218 + pupilOffset} cy="149" r="1.8" fill="#ffffff" />
        </>
      ) : null}
      {expression.eye === "star" ? (
        <>
          <polygon points="184,143 186.5,149.5 193,150 188.5,153.5 190,159.5 184,156 178,159.5 179.5,153.5 175,150 181.5,149.5" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
          <polygon points="216,143 218.5,149.5 225,150 220.5,153.5 222,159.5 216,156 210,159.5 211.5,153.5 207,150 213.5,149.5" fill="#fde047" stroke="#f59e0b" strokeWidth="1" />
        </>
      ) : null}
      {expression.eye === "wide" ? (
        <>
          <path d={SISTER_EXTENDED_EYE_PATHS.wide.left} fill="#ffffff" stroke="#c4b5fd" strokeWidth="1.5" />
          <circle cx={184 + pupilOffset} cy="151" r="3.5" fill="#1e1b4b" />
          <circle cx={186 + pupilOffset} cy="149" r="1.8" fill="#ffffff" />
          <path d={SISTER_EXTENDED_EYE_PATHS.wide.right} fill="#ffffff" stroke="#c4b5fd" strokeWidth="1.5" />
          <circle cx={216 + pupilOffset} cy="151" r="3.5" fill="#1e1b4b" />
          <circle cx={218 + pupilOffset} cy="149" r="1.8" fill="#ffffff" />
        </>
      ) : null}
      {expression.eye === "angry" ? (
        <>
          <path d={SISTER_EXTENDED_EYE_PATHS.angry.left} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.angry.leftBrow!} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.angry.right} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.angry.rightBrow!} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {expression.eye === "nervous" ? (
        <>
          <path d={SISTER_EXTENDED_EYE_PATHS.nervous.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.nervous.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.nervous.sweatDrop!} fill="#60a5fa" opacity="0.7" />
        </>
      ) : null}
      {expression.eye === "drowsy" ? (
        <>
          <path d={SISTER_EXTENDED_EYE_PATHS.drowsy.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.drowsy.lidLeft!} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.drowsy.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d={SISTER_EXTENDED_EYE_PATHS.drowsy.lidRight!} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      ) : null}
      {(expression.eye === "smile" || expression.eye === "sleep" || expression.eye === "sad" || expression.eye === "wink") ? (
        <>
          {expression.eye === "wink" ? (
            <>
              <path d="M 176 154 C 180 159 188 159 192 154" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="216" cy="152" r="11" fill="#ffffff" stroke="#c4b5fd" strokeWidth="1.2" />
              <circle cx={216 + pupilOffset} cy="151" r="5" fill="#1e1b4b" />
              <circle cx={218 + pupilOffset} cy="149" r="1.8" fill="#ffffff" />
            </>
          ) : (
            <>
              <path d={SISTER_EYE_PATHS[expression.eye].left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              <path d={SISTER_EYE_PATHS[expression.eye].right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </>
      ) : null}
      {state === "love" || state === "playful" ? (
        <>
          <circle cx="176" cy="167" r="5.2" fill="#fda4af" opacity="0.35" />
          <circle cx="224" cy="167" r="5.2" fill="#fda4af" opacity="0.35" />
        </>
      ) : null}
      <m.path d={beakPath} fill="#fbbf24"
        animate={beakAnimate} transition={beakTransition}
        style={{ transformBox: "fill-box", transformOrigin: "center top" }} />
      {flowerBow}
      {accessory}
    </>
  );

  return (
    <m.g>
      <GestureLayer gesture={gesture} characterKey="sister" reducedMotion={reducedMotion}>
        {doSpin ? (
          <m.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            {body}
          </m.g>
        ) : body}
      </GestureLayer>
    </m.g>
  );
}
