"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { MascotProps, MascotState, MascotVariant } from "@/components/mascot/types";

const VARIANT_ASSET_MAP: Record<MascotVariant, string> = {
  big: "/kisu-assets/stickers/sticker_reward_coin.png",
  small: "/kisu-assets/stickers/sticker_cheer.png",
  duo: "/logos/tinygeniushub_logo_stacked.png",
  dad: "/kisu-assets/stickers/sticker_combat_ready.png",
  sister: "/kisu-assets/stickers/sticker_party_celebration.png",
  baby: "/kisu-assets/stickers/sticker_hint.png",
  family: "/logos/tinygeniushub_logo_horizon.png",
};

const VARIANT_ALT_MAP: Record<MascotVariant, string> = {
  big: "Linh vật cáo TinyGeniusHub",
  small: "Linh vật cáo TinyGeniusHub",
  duo: "Logo linh vật TinyGeniusHub",
  dad: "Linh vật cáo TinyGeniusHub",
  sister: "Linh vật cáo TinyGeniusHub",
  baby: "Linh vật cáo TinyGeniusHub",
  family: "Logo TinyGeniusHub",
};

function getSizeByVariant(size: number, variant: MascotVariant, layout: MascotProps["layout"]) {
  if (variant === "family") {
    return { width: Math.round(size * (layout === "vertical" ? 1.1 : 1.65)), height: size };
  }

  if (variant === "duo") {
    return { width: Math.round(size * (layout === "vertical" ? 1.15 : 1.3)), height: size };
  }

  return { width: size, height: size };
}

function getMotionByState(state: MascotState, reduced: boolean, motionLevel: MascotProps["motionLevel"]) {
  if (reduced || motionLevel === "minimal") {
    return {
      animate: { y: 0, rotate: 0, scale: 1 },
      transition: undefined,
    };
  }

  if (state === "celebrating" || state === "excited") {
    return {
      animate: { y: [0, -10, 0], rotate: [0, -3, 3, 0], scale: [1, 1.04, 1] },
      transition: { duration: 1.05, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (state === "thinking" || state === "playful") {
    return {
      animate: { y: [0, -4, 0], rotate: [0, -2, 2, 0] },
      transition: { duration: 1.45, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  if (state === "sleepy" || state === "sad" || state === "bored") {
    return {
      animate: { y: [0, 2, 0], scaleY: [1, 0.98, 1] },
      transition: { duration: 2.1, repeat: Infinity, ease: "easeInOut" as const },
    };
  }

  return {
    animate: { y: [0, -3, 0], scale: [1, 1.02, 1] },
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const },
  };
}

export function Mascot({
  variant,
  state,
  layout = "horizontal",
  size = 160,
  className,
  title,
  motionLevel = "full",
  showBaseGlow = true,
  zoom = 1,
  animationMode = "loop",
  sequence,
  onSequenceComplete,
}: MascotProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const source = VARIANT_ASSET_MAP[variant];
  const { width, height } = getSizeByVariant(size, variant, layout);
  const motion = getMotionByState(state, prefersReducedMotion, motionLevel);
  const resolvedTitle = title ?? VARIANT_ALT_MAP[variant];
  const glowScale = variant === "family" ? 0.7 : 0.86;
  const safeZoom = Number.isFinite(zoom) ? Math.max(0.5, zoom) : 1;
  const shouldLoop = animationMode !== "once";

  useEffect(() => {
    if (animationMode !== "sequence" || !onSequenceComplete) {
      return;
    }

    const timelineDuration =
      sequence?.reduce((sum, step) => sum + Math.max(step.duration, 0), 0) ?? 0;

    const timeout = window.setTimeout(() => onSequenceComplete(), Math.max(timelineDuration, 1000));
    return () => window.clearTimeout(timeout);
  }, [animationMode, onSequenceComplete, sequence]);

  return (
    <m.div
      role="img"
      aria-label={resolvedTitle}
      className={className}
      style={{
        width,
        height,
        position: "relative",
        display: "grid",
        placeItems: "center",
        transform: `scale(${safeZoom})`,
        transformOrigin: "center center",
      }}
      animate={motion.animate}
      transition={
        shouldLoop
          ? motion.transition
          : motion.transition
            ? { ...motion.transition, repeat: 0 }
            : undefined
      }
    >
      {showBaseGlow ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[2%] left-1/2 -z-10 h-[28%] w-[72%] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(253,224,71,0.32) 0%, rgba(253,224,71,0) 72%)",
            transform: `scale(${glowScale})`,
          }}
        />
      ) : null}

      <div className="relative h-full w-full">
        <Image
          src={source}
          alt={resolvedTitle}
          fill
          sizes={`${Math.max(width, 120)}px`}
          className="object-contain drop-shadow-[0_16px_28px_rgba(15,23,42,0.28)]"
        />
      </div>
    </m.div>
  );
}
