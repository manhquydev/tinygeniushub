import type { CSSProperties } from "react";
import "../cloud-garden.css";

type SkyMode = "day" | "dusk";

interface StarFieldProps {
  mode?: SkyMode;
}

/**
 * StarField — Deterministic star placement layer for the sky.
 *
 * Uses a seeded pseudo-random formula (same pattern as SpaceBackground)
 * so the layout is stable across SSR/CSR. 28 stars total.
 * Stars are dimmer in "day" mode, brighter in "dusk" mode.
 *
 * SERVER component — no JS animations, uses pure CSS gardenStarTwinkle.
 */

const STAR_COUNT = 28;

const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const s = Math.abs(Math.sin((i + 1) * 14.31));
  const c = Math.abs(Math.cos((i + 3) * 17.67));
  return {
    id: `gst-${i + 1}`,
    top: `${Math.round(s * 75)}%`,          // only top 75% of sky (stars above horizon)
    left: `${Math.round(c * 100)}%`,
    size: i % 7 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
    dur: `${(3 + s * 5).toFixed(2)}s`,
    delay: `${(s * 3.2).toFixed(2)}s`,
    minAlpha: (0.1 + s * 0.15).toFixed(2),
    maxAlpha: (0.5 + s * 0.4).toFixed(2),
    scale: (0.7 + s * 0.6).toFixed(2),
  };
});

export function StarField({ mode = "day" }: StarFieldProps) {
  const alphaMultiplier = mode === "dusk" ? 1.6 : 1;

  return (
    <>
      {STARS.map((star) => (
        <span
          key={star.id}
          className="cg-star"
          style={
            {
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: star.dur,
              animationDelay: star.delay,
              "--gst-min": `${Math.min(parseFloat(star.minAlpha) * alphaMultiplier, 1).toFixed(2)}`,
              "--gst-max": `${Math.min(parseFloat(star.maxAlpha) * alphaMultiplier, 1).toFixed(2)}`,
              "--gst-scale": star.scale,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
