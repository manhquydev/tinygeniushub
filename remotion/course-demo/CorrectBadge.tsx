import { useCurrentFrame, spring } from "remotion";

// Green badge "✓ Đúng rồi!" slides from top-right into view.
// Used in celebrate phase.
export function CorrectBadge() {
  const frame = useCurrentFrame();

  const translateY = spring({
    frame,
    fps: 30,
    config: { damping: 8, stiffness: 100 },
    from: -100,
    to: 0,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 120,
        right: 80,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: "#6BCB77",
          borderRadius: 100,
          padding: "16px 40px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 6px 24px rgba(107,203,119,0.5)",
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          ✓ Đúng rồi!
        </span>
      </div>
    </div>
  );
}
