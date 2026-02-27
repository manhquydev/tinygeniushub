import { useCurrentFrame, interpolate } from "remotion";

// 5-point star clip-path from design spec.
const STAR_CLIP =
  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";

interface StarBurstProps {
  x?: number;
  y?: number;
  count?: number;
}

// Burst of 8-10 gold stars radiating outward from a center point.
// Scale 0→1.5→0 over 20 frames. Used in celebrate sections.
export function StarBurst({ x = 960, y = 540, count = 9 }: StarBurstProps) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        zIndex: 25,
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        const distance = 120 + (i % 3) * 30;
        const rad = (angle * Math.PI) / 180;
        const size = 28 + (i % 3) * 8;

        // scale: 0 → 1.5 over frames 0-12, then 1.5 → 0 over 12-24
        const scale = interpolate(frame, [0, 12, 24], [0, 1.5, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const progress = interpolate(frame, [0, 20], [0, 1], {
          extrapolateRight: "clamp",
        });

        const starX = x + Math.cos(rad) * distance * progress - size / 2;
        const starY = y + Math.sin(rad) * distance * progress - size / 2;
        const color = i % 2 === 0 ? "#FFD93D" : "#FF9F1C";

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: starX,
              top: starY,
              width: size,
              height: size,
              background: color,
              clipPath: STAR_CLIP,
              transform: `scale(${scale}) rotate(${frame * 6 + i * 40}deg)`,
              transformOrigin: "center",
              filter: "drop-shadow(0 0 6px rgba(255,217,61,0.8))",
            }}
          />
        );
      })}
    </div>
  );
}
