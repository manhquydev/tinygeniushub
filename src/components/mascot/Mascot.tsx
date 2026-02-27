"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import type { TargetAndTransition } from "motion/react";
import * as m from "motion/react-m";
import { BigOwl } from "@/components/mascot/characters/BigOwl";
import { SmallOwl } from "@/components/mascot/characters/SmallOwl";
import { DadOwl } from "@/components/mascot/characters/DadOwl";
import { SisterOwl } from "@/components/mascot/characters/SisterOwl";
import { BabyOwl } from "@/components/mascot/characters/BabyOwl";
import { STATE_EXPRESSIONS } from "@/components/mascot/expressions";
import { ActionPropLayer } from "@/components/mascot/props";
import { useMascotTimeline } from "@/components/mascot/hooks/use-mascot-timeline";
import type {
  MascotAnimationMode,
  MascotLayout,
  MascotMotionLevel,
  MascotProps,
  MascotState,
  MascotVariant,
  MascotGesture,
} from "@/components/mascot/types";

function getMainPose(state: MascotState, motionLevel: MascotMotionLevel, mode: MascotAnimationMode = "loop") {
  if (motionLevel === "minimal") {
    return { animate: { y: 0, rotate: 0, scale: 1 }, transition: undefined };
  }

  const soft = motionLevel === "soft";
  const amplitude = soft ? 0.58 : 1;
  const durationScale = soft ? 1.26 : 1;

  let result: { animate: TargetAndTransition; transition: Record<string, unknown> };

  if (state === "celebrating") {
    result = {
      animate: { y: [0, -14 * amplitude, 0], rotate: [0, -4 * amplitude, 4 * amplitude, 0], scale: [1, 1 + 0.05 * amplitude, 1] },
      transition: { duration: 1.05 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "happy") {
    result = {
      animate: { y: [0, -9 * amplitude, 0], scaleY: [1, 1 + 0.04 * amplitude, 1] },
      transition: { duration: 1.1 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "thinking") {
    result = {
      animate: { y: [0, -3 * amplitude, 0], rotate: [0, -2 * amplitude, 2 * amplitude, 0] },
      transition: { duration: 1.5 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "sad") {
    result = {
      animate: { y: [0, 1.8 * amplitude, 0], rotate: [0, -1.8 * amplitude, 0], scaleY: [1, 1 - 0.01 * amplitude, 1] },
      transition: { duration: 1.8 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "sleepy") {
    result = {
      animate: { y: [0, 1.6 * amplitude, 0], scaleY: [1, 1 - 0.03 * amplitude, 1] },
      transition: { duration: 3.3 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "playful") {
    result = {
      animate: { y: [0, -6 * amplitude, 0], rotate: [0, 5 * amplitude, -5 * amplitude, 0], scale: [1, 1 + 0.02 * amplitude, 1] },
      transition: { duration: 1.25 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "proud") {
    result = {
      animate: { y: [0, -3 * amplitude, 0], scaleY: [1, 1 + 0.04 * amplitude, 1], rotate: [0, -1 * amplitude, 1 * amplitude, 0] },
      transition: { duration: 1.8 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else if (state === "love") {
    result = {
      animate: { y: [0, -4 * amplitude, 0], scale: [1, 1 + 0.03 * amplitude, 1] },
      transition: { duration: 1.45 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  } else {
    result = {
      animate: { y: [0, -1.2 * amplitude, 0], scaleY: [1, 1 + 0.01 * amplitude, 1] },
      transition: { duration: 2.8 * durationScale, ease: "easeInOut" as const, repeat: Infinity },
    };
  }

  if (mode === "once") {
    return { animate: result.animate, transition: { ...result.transition, repeat: 0 } };
  }
  return result;
}

function getMarkerAnchor(variant: MascotVariant, layout: MascotLayout) {
  if (variant === "big") return { x: 200, y: 30 };
  if (variant === "small") return { x: 200, y: 120 };
  if (variant === "dad") return { x: 200, y: 24 };
  if (variant === "sister") return { x: 200, y: 110 };
  if (variant === "baby") return { x: 200, y: 148 };
  if (variant === "family") return layout === "horizontal" ? { x: 280, y: 20 } : { x: 200, y: 20 };
  return layout === "horizontal" ? { x: 268, y: 108 } : { x: 200, y: 132 };
}

function getZoomAnchor(variant: MascotVariant, layout: MascotLayout) {
  if (variant === "small") return { x: 200, y: 175 };
  if (variant === "big") return { x: 200, y: 154 };
  if (variant === "dad") return { x: 200, y: 148 };
  if (variant === "sister") return { x: 200, y: 168 };
  if (variant === "baby") return { x: 200, y: 190 };
  if (variant === "family") return { x: 280, y: 164 };
  return layout === "horizontal" ? { x: 200, y: 156 } : { x: 200, y: 164 };
}

function renderStateMarker(state: MascotState, x: number, y: number, motionLevel: MascotMotionLevel) {
  if (state === "idle") return null;

  const minimal = motionLevel === "minimal";
  const soft = motionLevel === "soft";
  const floatDistance = soft ? 1.6 : 3;
  const durationScale = soft ? 1.25 : 1;

  if (state === "thinking") {
    return (
      <m.g
        initial={{ opacity: 0, y: 4 }}
        animate={minimal ? { opacity: 1 } : { opacity: [0.4, 1, 0.45], y: [0, -floatDistance, 0] }}
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 1.2 * durationScale, ease: "easeInOut", repeat: Infinity }}
      >
        <circle cx={x} cy={y + 7} r="12" fill="#f8fafc" fillOpacity="0.92" />
        <text x={x - 9} y={y + 11} fontSize="13" fill="#2563eb" fontWeight="700">
          ...
        </text>
      </m.g>
    );
  }

  if (state === "sleepy") {
    return (
      <m.text
        x={x - 18}
        y={y + 7}
        fontSize="12"
        fill="#dbeafe"
        fontWeight="700"
        initial={{ opacity: 0 }}
        animate={minimal ? { opacity: 0.9 } : { opacity: [0, 0.95, 0], y: [y + 7, y - 1, y - (soft ? 6 : 9)] }}
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 2.2 * durationScale, ease: "easeOut", repeat: Infinity }}
      >
        Zzz...
      </m.text>
    );
  }

  if (state === "sad") {
    return (
      <m.path
        d={`M ${x + 16} ${y + 24} C ${x + 21} ${y + 34}, ${x + 9} ${y + 36}, ${x + 12} ${y + 24} C ${x + 13} ${y + 20}, ${x + 15} ${y + 20}, ${x + 16} ${y + 24} Z`}
        fill="#60a5fa"
        initial={{ opacity: 0, y: 0 }}
        animate={minimal ? { opacity: 0.85 } : { opacity: [0.3, 0.95, 0.2], y: [0, soft ? 2.5 : 4, soft ? 5 : 8] }}
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 1 * durationScale, ease: "easeInOut", repeat: Infinity }}
      />
    );
  }

  if (state === "celebrating") {
    return (
      <m.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={
          minimal
            ? { opacity: 1 }
            : {
                opacity: [0.4, 1, 0.6],
                rotate: [0, soft ? 7 : 12, soft ? -7 : -12, 0],
                scale: [0.95, soft ? 1.03 : 1.08, 1],
              }
        }
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 0.9 * durationScale, ease: "easeInOut", repeat: Infinity }}
      >
        <polygon
          points={`${x},${y} ${x + 4},${y + 11} ${x + 15},${y + 11} ${x + 6},${y + 17} ${x + 10},${y + 28} ${x},${y + 21} ${x - 10},${y + 28} ${x - 6},${y + 17} ${x - 15},${y + 11} ${x - 4},${y + 11}`}
          fill="#fde047"
          stroke="#f59e0b"
          strokeWidth="1.2"
        />
      </m.g>
    );
  }

  if (state === "playful") {
    return (
      <m.g
        initial={{ opacity: 0, rotate: -8 }}
        animate={
          minimal
            ? { opacity: 1, rotate: 0 }
            : { opacity: [0.5, 1, 0.6], rotate: [-8, soft ? 5 : 8, -8], y: [0, soft ? -1 : -2, 0] }
        }
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 1.1 * durationScale, ease: "easeInOut", repeat: Infinity }}
      >
        <path
          d={`M ${x - 12} ${y + 18} C ${x - 2} ${y + 5}, ${x + 10} ${y + 5}, ${x + 18} ${y + 18} C ${x + 10} ${y + 31}, ${x - 2} ${y + 31}, ${x - 12} ${y + 18} Z`}
          fill="#22d3ee"
          opacity="0.9"
        />
      </m.g>
    );
  }

  if (state === "proud") {
    return (
      <m.g
        initial={{ opacity: 0, y: 4 }}
        animate={minimal ? { opacity: 1 } : { opacity: [0.4, 1, 0.65], y: [0, soft ? -1 : -2, 0] }}
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 1.35 * durationScale, ease: "easeInOut", repeat: Infinity }}
      >
        <path
          d={`M ${x - 18} ${y + 18} L ${x - 12} ${y} L ${x - 4} ${y + 10} L ${x + 4} ${y} L ${x + 12} ${y + 10} L ${x + 18} ${y} L ${x + 20} ${y + 18} Z`}
          fill="#facc15"
          stroke="#f59e0b"
          strokeWidth="1"
        />
      </m.g>
    );
  }

  if (state === "love") {
    return (
      <m.g
        initial={{ opacity: 0, y: 2 }}
        animate={minimal ? { opacity: 1 } : { opacity: [0.5, 1, 0.5], y: [0, soft ? -2 : -4, 0] }}
        exit={{ opacity: 0 }}
        transition={minimal ? undefined : { duration: 1.25 * durationScale, ease: "easeInOut", repeat: Infinity }}
      >
        <path
          d={`M ${x - 10} ${y + 14} C ${x - 10} ${y + 6}, ${x - 1} ${y + 3}, ${x + 4} ${y + 10} C ${x + 9} ${y + 3}, ${x + 18} ${y + 6}, ${x + 18} ${y + 14} C ${x + 18} ${y + 22}, ${x + 11} ${y + 27}, ${x + 4} ${y + 32} C ${x - 3} ${y + 27}, ${x - 10} ${y + 22}, ${x - 10} ${y + 14} Z`}
          fill="#fb7185"
        />
      </m.g>
    );
  }

  return (
    <m.g
      initial={{ opacity: 0 }}
      animate={minimal ? { opacity: 1 } : { opacity: [0.55, 1, 0.55], y: [0, soft ? -1 : -2, 0] }}
      exit={{ opacity: 0 }}
      transition={minimal ? undefined : { duration: 1 * durationScale, ease: "easeInOut", repeat: Infinity }}
    >
      <circle cx={x - 8} cy={y + 9} r="3.2" fill="#f472b6" />
      <circle cx={x + 8} cy={y + 9} r="3.2" fill="#f472b6" />
    </m.g>
  );
}

const DUO_MARKER_PRIORITY: MascotState[] = [
  "celebrating",
  "love",
  "playful",
  "proud",
  "thinking",
  "happy",
  "sad",
  "sleepy",
  "idle",
];

function resolveDuoMarkerState(parentState: MascotState, childState: MascotState): MascotState {
  for (const candidate of DUO_MARKER_PRIORITY) {
    if (parentState === candidate || childState === candidate) {
      return candidate;
    }
  }
  return parentState;
}

export function Mascot({
  variant,
  state,
  actionProp = "none",
  parentState,
  childState,
  parentActionProp,
  childActionProp,
  parentGazeDirection,
  childGazeDirection,
  dadState,
  sisterState,
  babyState,
  dadActionProp,
  sisterActionProp,
  babyActionProp,
  dadGazeDirection,
  sisterGazeDirection,
  babyGazeDirection,
  layout = "horizontal",
  size = 160,
  className,
  title,
  gazeDirection = "center",
  motionLevel = "full",
  gesture = "none",
  pauseWhenOffscreen = false,
  showBaseGlow = true,
  zoom = 1,
  animationMode = "loop",
  sequence,
  onSequenceComplete,
}: MascotProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isInView, setIsInView] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!pauseWhenOffscreen) return;

    const node = svgRef.current;
    if (!node || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting || entry.intersectionRatio > 0.12);
      },
      { threshold: [0, 0.12, 0.24] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pauseWhenOffscreen]);

  const effectiveMotionLevel: MascotMotionLevel =
    prefersReducedMotion || (pauseWhenOffscreen && !isInView) ? "minimal" : motionLevel;
  const gradientId = `mascotGlow-${useId().replace(/:/g, "")}`;

  const { currentStep, isComplete } = useMascotTimeline(sequence, animationMode);

  // Override state/gesture/actionProp in sequence mode
  const effectiveState = currentStep?.state ?? state;
  const effectiveGesture = (currentStep?.gesture ?? gesture ?? "none") as MascotGesture;
  const effectiveActionProp = currentStep?.actionProp ?? actionProp;

  // Fire callback when sequence completes
  useEffect(() => {
    if (isComplete && onSequenceComplete) onSequenceComplete();
  }, [isComplete, onSequenceComplete]);

  const resolvedParentState = parentState ?? state;
  const resolvedChildState = childState ?? state;
  const resolvedParentAction = parentActionProp ?? actionProp;
  const resolvedChildAction = childActionProp ?? actionProp;
  const resolvedParentGazeDirection = parentGazeDirection ?? gazeDirection;
  const resolvedChildGazeDirection = childGazeDirection ?? gazeDirection;
  const resolvedDadState = dadState ?? state;
  const resolvedSisterState = sisterState ?? state;
  const resolvedBabyState = babyState ?? state;
  const resolvedDadAction = dadActionProp ?? actionProp;
  const resolvedSisterAction = sisterActionProp ?? actionProp;
  const resolvedBabyAction = babyActionProp ?? actionProp;
  const resolvedDadGaze = dadGazeDirection ?? gazeDirection;
  const resolvedSisterGaze = sisterGazeDirection ?? gazeDirection;
  const resolvedBabyGaze = babyGazeDirection ?? gazeDirection;

  const markerState = variant === "duo" ? resolveDuoMarkerState(resolvedParentState, resolvedChildState) : effectiveState;
  const markerAnchor = getMarkerAnchor(variant, layout);
  const { animate, transition } = getMainPose(effectiveState, effectiveMotionLevel, animationMode);
  const duoParentPose = getMainPose(resolvedParentState, effectiveMotionLevel, animationMode);
  const resolvedTitle = title ?? (
    variant === "big" ? "Cu Me" :
    variant === "small" ? "Cu Con" :
    variant === "dad" ? "Cu Bo" :
    variant === "sister" ? "Cu Chi" :
    variant === "baby" ? "Cu Em" :
    variant === "family" ? "Gia dinh Cu" :
    "Cap me con Cu"
  );
  const zoomAnchor = getZoomAnchor(variant, layout);

  const duoChildFloatAnimate =
    effectiveMotionLevel === "minimal"
      ? { y: 0 }
      : effectiveMotionLevel === "soft"
        ? { y: [0, -2, 0] }
        : { y: [0, -5, 0] };
  const duoChildFloatTransition =
    effectiveMotionLevel === "minimal"
      ? undefined
      : { duration: effectiveMotionLevel === "soft" ? 1.8 : 1.2, ease: "easeInOut" as const, repeat: Infinity };
  const layers = (
    <>
      <AnimatePresence mode="wait">
        {renderStateMarker(markerState, markerAnchor.x, markerAnchor.y, effectiveMotionLevel)}
      </AnimatePresence>

      {variant === "big" ? (
        <m.g animate={animate} transition={transition}>
          <BigOwl
            state={effectiveState}
            expression={STATE_EXPRESSIONS[effectiveState]}
            gazeDirection={gazeDirection}
            reducedMotion={effectiveMotionLevel === "minimal"}
            motionLevel={effectiveMotionLevel}
            gesture={effectiveGesture}
            accessory={<ActionPropLayer actionProp={effectiveActionProp} target="big" reducedMotion={effectiveMotionLevel === "minimal"} />}
          />
        </m.g>
      ) : null}

      {variant === "small" ? (
        <m.g animate={animate} transition={transition}>
          <SmallOwl
            state={effectiveState}
            expression={STATE_EXPRESSIONS[effectiveState]}
            gazeDirection={gazeDirection}
            reducedMotion={effectiveMotionLevel === "minimal"}
            motionLevel={effectiveMotionLevel}
            gesture={effectiveGesture}
            accessory={<ActionPropLayer actionProp={effectiveActionProp} target="small" reducedMotion={effectiveMotionLevel === "minimal"} />}
          />
        </m.g>
      ) : null}

      {variant === "dad" ? (
        <m.g animate={animate} transition={transition}>
          <DadOwl
            state={effectiveState}
            expression={STATE_EXPRESSIONS[effectiveState]}
            gazeDirection={gazeDirection}
            reducedMotion={effectiveMotionLevel === "minimal"}
            motionLevel={effectiveMotionLevel}
            gesture={effectiveGesture}
            accessory={<ActionPropLayer actionProp={effectiveActionProp} target="dad" reducedMotion={effectiveMotionLevel === "minimal"} />}
          />
        </m.g>
      ) : null}

      {variant === "sister" ? (
        <m.g animate={animate} transition={transition}>
          <SisterOwl
            state={effectiveState}
            expression={STATE_EXPRESSIONS[effectiveState]}
            gazeDirection={gazeDirection}
            reducedMotion={effectiveMotionLevel === "minimal"}
            motionLevel={effectiveMotionLevel}
            gesture={effectiveGesture}
            accessory={<ActionPropLayer actionProp={effectiveActionProp} target="sister" reducedMotion={effectiveMotionLevel === "minimal"} />}
          />
        </m.g>
      ) : null}

      {variant === "baby" ? (
        <m.g animate={animate} transition={transition}>
          <BabyOwl
            state={effectiveState}
            expression={STATE_EXPRESSIONS[effectiveState]}
            gazeDirection={gazeDirection}
            reducedMotion={effectiveMotionLevel === "minimal"}
            motionLevel={effectiveMotionLevel}
            gesture={effectiveGesture}
            accessory={<ActionPropLayer actionProp={effectiveActionProp} target="baby" reducedMotion={effectiveMotionLevel === "minimal"} />}
          />
        </m.g>
      ) : null}

      {variant === "duo" ? (
        <>
          <m.g
            transform={layout === "horizontal" ? "translate(-74 0)" : "translate(0 -34)"}
            animate={duoParentPose.animate}
            transition={duoParentPose.transition}
          >
            <BigOwl
              state={resolvedParentState}
              expression={STATE_EXPRESSIONS[resolvedParentState]}
              gazeDirection={resolvedParentGazeDirection}
              reducedMotion={effectiveMotionLevel === "minimal"}
              motionLevel={effectiveMotionLevel}
              accessory={
                <ActionPropLayer
                  actionProp={resolvedParentAction}
                  target="big"
                  reducedMotion={effectiveMotionLevel === "minimal"}
                />
              }
            />
          </m.g>
          <m.g
            transform={layout === "horizontal" ? "translate(86 18)" : "translate(0 56)"}
            animate={duoChildFloatAnimate}
            transition={duoChildFloatTransition}
          >
            <SmallOwl
              state={resolvedChildState}
              expression={STATE_EXPRESSIONS[resolvedChildState]}
              gazeDirection={resolvedChildGazeDirection}
              reducedMotion={effectiveMotionLevel === "minimal"}
              motionLevel={effectiveMotionLevel}
              accessory={
                <ActionPropLayer
                  actionProp={resolvedChildAction}
                  target="small"
                  reducedMotion={effectiveMotionLevel === "minimal"}
                />
              }
            />
          </m.g>
        </>
      ) : null}

      {variant === "family" ? (
        <>
          <m.g transform="translate(-160 0)" animate={getMainPose(resolvedDadState, effectiveMotionLevel, animationMode).animate} transition={getMainPose(resolvedDadState, effectiveMotionLevel, animationMode).transition}>
            <DadOwl state={resolvedDadState} expression={STATE_EXPRESSIONS[resolvedDadState]} gazeDirection={resolvedDadGaze} reducedMotion={effectiveMotionLevel === "minimal"} motionLevel={effectiveMotionLevel}
              accessory={<ActionPropLayer actionProp={resolvedDadAction} target="dad" reducedMotion={effectiveMotionLevel === "minimal"} />} />
          </m.g>
          <m.g transform="translate(-74 0)" animate={duoParentPose.animate} transition={duoParentPose.transition}>
            <BigOwl state={resolvedParentState} expression={STATE_EXPRESSIONS[resolvedParentState]} gazeDirection={resolvedParentGazeDirection} reducedMotion={effectiveMotionLevel === "minimal"} motionLevel={effectiveMotionLevel}
              accessory={<ActionPropLayer actionProp={resolvedParentAction} target="big" reducedMotion={effectiveMotionLevel === "minimal"} />} />
          </m.g>
          <m.g transform="translate(12 10)" animate={getMainPose(resolvedSisterState, effectiveMotionLevel, animationMode).animate} transition={getMainPose(resolvedSisterState, effectiveMotionLevel, animationMode).transition}>
            <SisterOwl state={resolvedSisterState} expression={STATE_EXPRESSIONS[resolvedSisterState]} gazeDirection={resolvedSisterGaze} reducedMotion={effectiveMotionLevel === "minimal"} motionLevel={effectiveMotionLevel}
              accessory={<ActionPropLayer actionProp={resolvedSisterAction} target="sister" reducedMotion={effectiveMotionLevel === "minimal"} />} />
          </m.g>
          <m.g transform="translate(86 18)" animate={duoChildFloatAnimate} transition={duoChildFloatTransition}>
            <SmallOwl state={resolvedChildState} expression={STATE_EXPRESSIONS[resolvedChildState]} gazeDirection={resolvedChildGazeDirection} reducedMotion={effectiveMotionLevel === "minimal"} motionLevel={effectiveMotionLevel}
              accessory={<ActionPropLayer actionProp={resolvedChildAction} target="small" reducedMotion={effectiveMotionLevel === "minimal"} />} />
          </m.g>
          <m.g transform="translate(152 25)" animate={getMainPose(resolvedBabyState, effectiveMotionLevel, animationMode).animate} transition={getMainPose(resolvedBabyState, effectiveMotionLevel, animationMode).transition}>
            <BabyOwl state={resolvedBabyState} expression={STATE_EXPRESSIONS[resolvedBabyState]} gazeDirection={resolvedBabyGaze} reducedMotion={effectiveMotionLevel === "minimal"} motionLevel={effectiveMotionLevel}
              accessory={<ActionPropLayer actionProp={resolvedBabyAction} target="baby" reducedMotion={effectiveMotionLevel === "minimal"} />} />
          </m.g>
        </>
      ) : null}
    </>
  );

  return (
    <m.svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={variant === "family" ? "0 0 560 280" : "0 0 400 280"}
      role="img"
      aria-label={resolvedTitle}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{resolvedTitle}</title>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="100%" r="100%">
          <stop offset="0%" style={{ stopColor: "#fef08a", stopOpacity: 0.5 }} />
          <stop offset="44%" style={{ stopColor: "#fde047", stopOpacity: 0.16 }} />
          <stop offset="100%" style={{ stopColor: "#ffffff", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {showBaseGlow ? <path d="M 70,228 A 130 130 0 0 1 330,228 Z" fill={`url(#${gradientId})`} /> : null}
      {zoom === 1 ? (
        layers
      ) : (
        <g transform={`translate(${zoomAnchor.x} ${zoomAnchor.y}) scale(${zoom}) translate(${-zoomAnchor.x} ${-zoomAnchor.y})`}>
          {layers}
        </g>
      )}
    </m.svg>
  );
}
