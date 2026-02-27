import { useCurrentFrame } from "remotion";
import type { VideoSection } from "./lesson-video-data";
import type { PhaseType } from "./lesson-phase-types";

// V1 section gradients — preserved for backward compat
const SECTION_GRADIENTS: Record<VideoSection["type"], string> = {
  intro: "linear-gradient(160deg, #E8F4FD 0%, #FFF8E1 100%)",
  teach: "linear-gradient(160deg, #F3E5F5 0%, #E8F5E9 100%)",
  activity: "linear-gradient(160deg, #FFF8E1 0%, #E8F4FD 100%)",
  celebrate: "linear-gradient(160deg, #FFF176 0%, #FF8A65 100%)",
  outro: "linear-gradient(160deg, #E8F4FD 0%, #F3E5F5 100%)",
};

// V2 phase-specific gradients — child-friendly per-phase tones
const PHASE_GRADIENTS: Record<PhaseType, string> = {
  "hook": "linear-gradient(160deg, #E8F4FD 0%, #FFF8E1 100%)",
  "concept": "linear-gradient(160deg, #F3E5F5 0%, #E8F5E9 100%)",
  "demonstrate": "linear-gradient(160deg, #E8F4FD 0%, #E8F5E9 100%)",
  "your-turn": "linear-gradient(160deg, #FFF8E1 0%, #FFF3E0 100%)",
  "reinforce": "linear-gradient(160deg, #E8F5E9 0%, #E8F4FD 100%)",
  "celebrate": "linear-gradient(160deg, #FFF176 0%, #FF8A65 100%)",
  "recap": "linear-gradient(160deg, #E8F4FD 0%, #F3E5F5 100%)",
};

interface SceneBackgroundProps {
  sectionType?: VideoSection["type"];
  phaseType?: PhaseType;
}

// Bigger cloud shapes — pure CSS, no external assets
function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const frame = useCurrentFrame();
  const floatY = Math.sin((frame / 90) * Math.PI * 2) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        transform: `scale(${scale})`,
        transformOrigin: "left top",
        opacity: 0.85,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 50,
          width: 240,
          height: 80,
          position: "relative",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.08))",
        }}
      >
        <div style={{ position: "absolute", width: 100, height: 100, background: "white", borderRadius: "50%", top: -50, left: 28 }} />
        <div style={{ position: "absolute", width: 80, height: 80, background: "white", borderRadius: "50%", top: -40, left: 110 }} />
      </div>
    </div>
  );
}

function Star({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const frame = useCurrentFrame();
  const floatY = Math.sin((frame / 70) * Math.PI * 2) * 5;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        width: size,
        height: size,
        background: color,
        clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
        opacity: 0.65,
      }}
    />
  );
}

function Bubble({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const frame = useCurrentFrame();
  const floatY = Math.sin((frame / 80) * Math.PI * 2) * 10;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + floatY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity: 0.45,
      }}
    />
  );
}

// Grass ground strip with hills at the bottom of scene
function Ground() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, overflow: "hidden" }}>
      {/* Main ground strip */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "linear-gradient(to bottom, #86efac 0%, #6BCB77 50%, #4ade80 100%)",
          borderRadius: "60px 60px 0 0",
          clipPath: "ellipse(55% 100% at 50% 100%)",
        }}
      />
      {/* Hill left */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: -80,
          width: 480,
          height: 90,
          background: "#6BCB77",
          borderRadius: "50% 50% 0 0",
          opacity: 0.7,
        }}
      />
      {/* Hill right */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: -60,
          width: 420,
          height: 70,
          background: "#4ade80",
          borderRadius: "50% 50% 0 0",
          opacity: 0.65,
        }}
      />
    </div>
  );
}

// Subtle sun in top-right corner
function Sun() {
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 80,
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: "radial-gradient(circle, #FFF176 0%, #FFD93D 60%, transparent 100%)",
        opacity: 0.3,
      }}
    />
  );
}

// Full-screen background with gradient + decorative elements.
// Accepts either sectionType (v1) or phaseType (v2).
export function SceneBackground({ sectionType, phaseType }: SceneBackgroundProps) {
  const gradient = phaseType
    ? PHASE_GRADIENTS[phaseType]
    : sectionType
    ? SECTION_GRADIENTS[sectionType]
    : SECTION_GRADIENTS.intro;

  return (
    <div style={{ position: "absolute", inset: 0, background: gradient, overflow: "hidden" }}>
      <Sun />
      <Cloud x={40} y={100} scale={1.2} />
      <Cloud x={1550} y={60} scale={0.9} />
      <Cloud x={860} y={20} scale={0.75} />
      <Star x={80} y={300} size={34} color="#FFD93D" />
      <Star x={160} y={500} size={26} color="#C77DFF" />
      <Star x={1780} y={250} size={30} color="#FFD93D" />
      <Star x={1700} y={450} size={24} color="#FF9F1C" />
      <Star x={1820} y={600} size={28} color="#6BCB77" />
      <Star x={100} y={720} size={22} color="#4D96FF" />
      <Star x={1850} y={800} size={26} color="#FF6B6B" />
      <Star x={50} y={880} size={20} color="#FFD93D" />
      <Bubble x={1750} y={700} size={72} color="rgba(77,150,255,0.4)" />
      <Bubble x={60} y={400} size={60} color="rgba(108,203,119,0.4)" />
      <Bubble x={1830} y={350} size={48} color="rgba(255,217,61,0.4)" />
      <Ground />
    </div>
  );
}
