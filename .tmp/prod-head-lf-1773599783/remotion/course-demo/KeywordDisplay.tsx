import { useCurrentFrame, spring, interpolate } from "remotion";

const VOWELS = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);

// Renders a single character with phonics-based coloring:
// vowels = #FF6B6B (red), consonants = #4D96FF (blue)
function PhonicsChar({ char }: { char: string }) {
  const isVowel = VOWELS.has(char);
  const isLetter = /[a-zA-Z]/.test(char);
  const color = isLetter ? (isVowel ? "#FF6B6B" : "#4D96FF") : "#1e293b";
  return (
    <span style={{ color }}>{char}</span>
  );
}

interface KeywordDisplayProps {
  keyword: string;
  subtext?: string;
  delay?: number; // frames before bounce-in starts
}

// Large keyword display with phonics coloring (vowels vs consonants).
// Bounce-in: spring scale 0→1. One-time glow pulse on entry, then stable.
export function KeywordDisplay({ keyword, subtext, delay = 0 }: KeywordDisplayProps) {
  const frame = useCurrentFrame();
  const animFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: animFrame,
    fps: 30,
    config: { damping: 5, stiffness: 90 },
    from: 0,
    to: 1,
  });

  // One-time glow: pulse once at entry, then stable — no more flicker
  const glowOpacity = animFrame < 30
    ? interpolate(animFrame, [0, 15, 30], [0.5, 1, 0.85], { extrapolateRight: "clamp" })
    : 0.85;

  // Entry glow radius is bigger, then settles
  const glowRadius = animFrame < 30 ? 30 : 20;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      {/* Keyword text */}
      <div
        style={{
          fontSize: 110,
          fontWeight: 900,
          fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif",
          letterSpacing: "0.06em",
          lineHeight: 1.1,
          opacity: glowOpacity,
          filter: `drop-shadow(0 0 ${glowRadius}px rgba(77,150,255,0.4))`,
        }}
      >
        {keyword.split("").map((char, i) => (
          <PhonicsChar key={i} char={char} />
        ))}
      </div>

      {/* Optional subtext */}
      {subtext && (
        <div
          style={{
            fontSize: 44,
            color: "#4b5563",
            fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif",
            fontWeight: 500,
            textAlign: "center",
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
