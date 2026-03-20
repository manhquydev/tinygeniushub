import { useCurrentFrame, spring } from "remotion";

interface BottomPromptProps {
  text: string;
}

// Bottom bar showing a prompt/sublabel text.
// Slides up using spring animation. Height 80px.
export function BottomPrompt({ text }: BottomPromptProps) {
  const frame = useCurrentFrame();

  // Slide-up from below on entry
  const translateY = spring({
    frame,
    fps: 30,
    config: { damping: 14, stiffness: 100 },
    from: 80,
    to: 0,
  });

  const opacity = spring({
    frame,
    fps: 30,
    config: { damping: 14, stiffness: 100 },
    from: 0,
    to: 1,
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: "rgba(255,255,255,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        transform: `translateY(${translateY}px)`,
        opacity,
        borderTop: "2px solid rgba(255,255,255,0.6)",
      }}
    >
      <div
        style={{
          fontSize: 28,
          color: "#64748b",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        {text}
      </div>
    </div>
  );
}
