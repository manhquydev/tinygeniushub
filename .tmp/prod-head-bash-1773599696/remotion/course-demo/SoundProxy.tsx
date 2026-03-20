import { useCurrentFrame, spring, interpolate } from "remotion";

interface SoundProxyProps {
  type: "music" | "surprise" | "thinking" | "glow";
  x?: number;
  y?: number;
}

// Visual proxy for sound events — renders animated cues since no audio in render.
export function SoundProxy({ type, x = 1700, y = 200 }: SoundProxyProps) {
  const frame = useCurrentFrame();

  if (type === "music") {
    return <MusicNotes x={x} y={y} frame={frame} />;
  }
  if (type === "surprise") {
    return <SurpriseExclaim x={x} y={y} frame={frame} />;
  }
  if (type === "thinking") {
    return <ThinkingDots x={x} y={y} frame={frame} />;
  }
  if (type === "glow") {
    return <GlowCircles x={x} y={y} frame={frame} />;
  }
  return null;
}

// 3 musical notes float upward with stagger
function MusicNotes({ x, y, frame }: { x: number; y: number; frame: number }) {
  const notes = ["♪", "♫", "♪"];
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {notes.map((note, i) => {
        const noteFrame = frame % 40;
        const offset = i * 12;
        const effectFrame = (noteFrame - offset + 40) % 40;
        const translateY = interpolate(effectFrame, [0, 40], [0, -80], { extrapolateRight: "clamp" });
        const opacity = interpolate(effectFrame, [0, 20, 40], [1, 1, 0], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 28,
              fontSize: 36,
              color: "#FFD93D",
              fontWeight: 700,
              transform: `translateY(${translateY}px)`,
              opacity,
            }}
          >
            {note}
          </div>
        );
      })}
    </div>
  );
}

// "!" pops: scale 0→1.4→1.0 over 12 frames, repeats
function SurpriseExclaim({ x, y, frame }: { x: number; y: number; frame: number }) {
  const loopFrame = frame % 36;
  const scale = spring({
    frame: loopFrame,
    fps: 30,
    config: { damping: 4, stiffness: 200 },
    from: 0,
    to: 1,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: 64,
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      ❕
    </div>
  );
}

// Thinking dots appear sequentially
function ThinkingDots({ x, y, frame }: { x: number; y: number; frame: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", gap: 8 }}>
      {[0, 12, 24].map((startF, i) => {
        const visible = frame >= startF;
        return (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#C77DFF",
              opacity: visible ? 1 : 0,
              transform: `scale(${visible ? 1 : 0})`,
            }}
          />
        );
      })}
    </div>
  );
}

// Concentric circles expanding from center
function GlowCircles({ x, y, frame }: { x: number; y: number; frame: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {[0, 10, 20].map((offset, i) => {
        const circleFrame = (frame - offset + 30) % 30;
        const scale = interpolate(circleFrame, [0, 30], [0.2, 2], { extrapolateRight: "clamp" });
        const opacity = interpolate(circleFrame, [0, 30], [0.8, 0], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "4px solid #6BCB77",
              top: -30,
              left: -30,
              transform: `scale(${scale})`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
