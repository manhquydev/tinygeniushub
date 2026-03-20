import { useCurrentFrame, interpolate } from "remotion";

interface YourTurnCueProps {
  options: string[];
  correctIndex: number;
}

// Renders answer option cards with pulsing glow border.
// Correct answer card revealed with green border at frame 80.
// Thinking dots appear sequentially.
export function YourTurnCue({ options, correctIndex }: YourTurnCueProps) {
  const frame = useCurrentFrame();

  // Pulsing gold glow
  const glowSize = 4 + Math.sin(frame / 15) * 2;

  // Reveal correct answer at frame 80
  const showCorrect = frame >= 80;

  // Thinking dots: one by one
  const dot1 = frame >= 0 ? 1 : 0;
  const dot2 = frame >= 15 ? 1 : 0;
  const dot3 = frame >= 30 ? 1 : 0;

  // Correct card fade-in
  const correctOpacity = showCorrect
    ? interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      {/* Thinking dots — bigger */}
      <div style={{ display: "flex", gap: 12 }}>
        {[dot1, dot2, dot3].map((visible, i) => (
          <div
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#FF9F1C",
              opacity: visible,
              transform: `scale(${visible})`,
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>

      {/* Answer option cards — bigger */}
      <div style={{ display: "flex", flexDirection: "row", gap: 32 }}>
        {options.map((option, idx) => {
          const isCorrect = idx === correctIndex;
          const borderColor = showCorrect && isCorrect ? "#6BCB77" : "rgba(255,200,0,0.8)";
          const boxShadow = `0 0 0 ${glowSize}px ${borderColor}`;
          return (
            <div
              key={idx}
              style={{
                width: 280,
                height: 160,
                background: "white",
                borderRadius: 24,
                border: `4px solid ${borderColor}`,
                boxShadow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  color: "#1e293b",
                  fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif",
                }}
              >
                {option}
              </span>

              {/* Green check overlay for correct answer */}
              {isCorrect && (
                <div
                  style={{
                    position: "absolute",
                    top: -18,
                    right: -18,
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#6BCB77",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: correctOpacity,
                  }}
                >
                  <span style={{ color: "white", fontSize: 26, fontWeight: 800 }}>✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
