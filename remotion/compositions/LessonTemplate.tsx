import { AbsoluteFill, Sequence } from "remotion";
import { MascotScene } from "./MascotScene";
import type { MascotVariant, MascotSequenceStep } from "../../src/components/mascot/types";

interface LessonTemplateProps {
  title: string;
  variant: MascotVariant;
  sequence: MascotSequenceStep[];
}

// Basic lesson video template with intro / content / outro structure.
// Intro: 3s title card, Content: mascot sequence, Outro: 3s farewell card.
export function LessonTemplate({ title, variant, sequence }: LessonTemplateProps) {
  const introFrames = 90; // 3s at 30fps

  // Calculate content duration from sequence steps
  const contentMs = sequence.reduce((sum, step) => sum + step.duration, 0);
  const contentFrames = Math.ceil((contentMs / 1000) * 30);
  const outroFrames = 90;

  return (
    <AbsoluteFill style={{ backgroundColor: "#fef3c7" }}>
      {/* Intro title card */}
      <Sequence from={0} durationInFrames={introFrames}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 48, fontWeight: "bold", color: "#1e3a8a", textAlign: "center" }}>
            {title}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Mascot content sequence */}
      <Sequence from={introFrames} durationInFrames={contentFrames}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MascotScene sequence={sequence} variant={variant} size={400} />
        </AbsoluteFill>
      </Sequence>

      {/* Outro farewell card */}
      <Sequence from={introFrames + contentFrames} durationInFrames={outroFrames}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 36, color: "#1e3a8a" }}>See you soon!</div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}
