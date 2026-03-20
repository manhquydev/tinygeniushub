import type { CSSProperties } from "react";

interface SpaceBackgroundProps {
  className?: string;
}

const BACKGROUND_STARS = Array.from({ length: 38 }, (_, index) => {
  const seed = Math.abs(Math.sin((index + 1) * 12.73));
  return {
    id: `bg-star-${index + 1}`,
    left: `${Math.round((seed * 97 + index * 11) % 100)}%`,
    top: `${Math.round((Math.abs(Math.cos((index + 1) * 5.11)) * 95) % 100)}%`,
    size: index % 6 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
    duration: `${(3.4 + seed * 4.6).toFixed(2)}s`,
    delay: `${(seed * 2.2).toFixed(2)}s`,
    alphaMin: (0.16 + seed * 0.22).toFixed(2),
    alphaMax: (0.62 + seed * 0.28).toFixed(2),
  };
});

export function SpaceBackground({ className }: SpaceBackgroundProps) {
  return (
    <div className={`space-bg ${className ?? ""}`.trim()} aria-hidden="true">
      <div className="space-bg-gradient" />
      <div className="space-bg-fog space-bg-fog-a" />
      <div className="space-bg-fog space-bg-fog-b" />
      <div className="space-bg-fog space-bg-fog-c" />
      {BACKGROUND_STARS.map((star) => (
        <span
          key={star.id}
          className="space-bg-star"
          style={
            {
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: star.duration,
              animationDelay: star.delay,
              "--space-star-min": star.alphaMin,
              "--space-star-max": star.alphaMax,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
