"use client";

import type { CSSProperties, ReactNode } from "react";

// Deterministic star positions — same pattern as lesson-wizard-flow LESSON_SPACE_STARS
const SCENE_STARS = Array.from({ length: 22 }, (_, index) => {
  const seed = Math.abs(Math.sin((index + 1) * 13.7));
  return {
    id: `scene-star-${index + 1}`,
    top: `${Math.round(seed * 100)}%`,
    left: `${Math.round(Math.abs(Math.cos((index + 3) * 19.3)) * 100)}%`,
    duration: `${(3.2 + seed * 3.8).toFixed(2)}s`,
    delay: `${(seed * 2.6).toFixed(2)}s`,
    scale: 0.5 + seed * 1.2,
  };
});

interface InteractiveSceneBackgroundProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function InteractiveSceneBackground({
  children,
  style,
  className,
}: InteractiveSceneBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "linear-gradient(160deg, #0d1b3e 0%, #1a2a5e 45%, #2d1b69 100%)",
        ...style,
      }}
    >
      {/* Nebula blobs */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "-10%",
          width: 320,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.22) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "5%",
          right: "-8%",
          width: 280,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(56,189,248,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Twinkling stars using lesson-wizard CSS class when available, else inline */}
      {SCENE_STARS.map((star) => (
        <span
          key={star.id}
          aria-hidden="true"
          className="lesson-wizard-star"
          style={
            {
              top: star.top,
              left: star.left,
              animationDuration: star.duration,
              animationDelay: star.delay,
              "--lesson-star-scale": star.scale.toFixed(2),
            } as CSSProperties
          }
        />
      ))}

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
