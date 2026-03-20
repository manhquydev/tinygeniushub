import { useCurrentFrame } from "remotion";

// Confetti piece colors from the brand palette.
const CONFETTI_COLORS = [
  "#FFD93D",
  "#4D96FF",
  "#FF6B6B",
  "#6BCB77",
  "#C77DFF",
  "#FF9F1C",
];

// Seeded pseudo-random to get consistent values per confetti piece.
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface ConfettiBurstProps {
  count?: number;
}

// 30 confetti pieces falling from top of screen over ~60 frames.
// Rendered only during celebrate sections.
export function ConfettiBurst({ count = 30 }: ConfettiBurstProps) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 20,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const startX = seededRandom(i * 3) * 1920;
        const drift = (seededRandom(i * 7) - 0.5) * 300;
        const speed = 8 + seededRandom(i * 11) * 6;
        const size = 10 + seededRandom(i * 5) * 6;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const isCircle = seededRandom(i * 13) > 0.6;
        const rotation = seededRandom(i * 17) * 360 + frame * (seededRandom(i * 19) * 6 - 3);
        const delay = Math.floor(seededRandom(i * 23) * 20);

        // Don't start until delay frames have passed
        if (frame < delay) return null;

        const effectiveFrame = frame - delay;
        const y = effectiveFrame * speed;
        const x = startX + drift * (effectiveFrame / 60);
        const opacity = effectiveFrame > 40 ? Math.max(0, 1 - (effectiveFrame - 40) / 20) : 1;

        if (y > 1180) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: -20 + y,
              width: size,
              height: isCircle ? size : size * 1.6,
              background: color,
              borderRadius: isCircle ? "50%" : 2,
              transform: `rotate(${rotation}deg)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
