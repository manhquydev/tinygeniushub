import { useCurrentFrame, spring } from "remotion";

interface SpeechBubbleProps {
  text: string;
  delay?: number; // frames before bounce-in starts
}

// White rounded speech bubble with SVG tail pointing DOWN toward mascot.
// Now centered above mascot — tail exits bottom-center.
// Spring bounce-in from bottom center.
export function SpeechBubble({ text, delay = 0 }: SpeechBubbleProps) {
  const frame = useCurrentFrame();
  const animFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: animFrame,
    fps: 30,
    config: { damping: 6, stiffness: 80 },
    from: 0,
    to: 1,
  });

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        transform: `scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      {/* Bubble body */}
      <div
        style={{
          background: "white",
          border: "3px solid #64748b",
          borderRadius: 24,
          padding: "16px 28px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          maxWidth: 380,
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "#1e293b",
            fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>

      {/* SVG tail pointing DOWN from bubble to mascot below */}
      <svg
        width="32"
        height="28"
        viewBox="0 0 32 28"
        style={{
          position: "absolute",
          bottom: -26,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <path
          d="M0 0 L16 28 L32 0"
          fill="white"
          stroke="#64748b"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Overwrite inner triangle to hide border at top */}
        <path d="M2 0 L16 24 L30 0 Z" fill="white" />
      </svg>
    </div>
  );
}
