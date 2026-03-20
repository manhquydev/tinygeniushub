import type { VideoSection } from "./lesson-video-data";
import type { PhaseType } from "./lesson-phase-types";

// V1 section colors
export const SECTION_COLORS: Record<VideoSection["type"], string> = {
  intro: "#FFD93D",
  teach: "#C77DFF",
  activity: "#FF9F1C",
  celebrate: "#6BCB77",
  outro: "#26C6DA",
};

// V2 phase colors
export const PHASE_COLORS: Record<PhaseType, string> = {
  "hook": "#FFD93D",
  "concept": "#C77DFF",
  "demonstrate": "#4D96FF",
  "your-turn": "#FF9F1C",
  "reinforce": "#6BCB77",
  "celebrate": "#FF6B6B",
  "recap": "#26C6DA",
};

// --- V1 TopBar ---

interface TopBarProps {
  lessonTitle: string;
  sections: VideoSection[];
  currentSectionIndex: number;
}

export function TopBar({ lessonTitle, sections, currentSectionIndex }: TopBarProps) {
  return (
    <div
      style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 80,
        background: "rgba(255,255,255,0.88)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: 48, paddingRight: 48, zIndex: 10,
        backdropFilter: "blur(4px)",
        borderBottom: "2px solid rgba(255,255,255,0.6)",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1e3a8a", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.02em" }}>
        {lessonTitle}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {sections.map((section, idx) => {
          const isActive = idx === currentSectionIndex;
          const isCompleted = idx < currentSectionIndex;
          const dotColor = isActive ? SECTION_COLORS[section.type] : isCompleted ? "#6BCB77" : "rgba(200,200,200,0.6)";
          return (
            <div
              key={idx}
              style={{
                width: 16, height: 16, borderRadius: "50%", background: dotColor,
                boxShadow: isActive ? `0 0 0 4px ${SECTION_COLORS[section.type]}40` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- V2 TopBar for 7-phase lessons ---

interface TopBarV2Props {
  lessonTitle: string;
  phases: PhaseType[];
  currentPhaseIndex: number;
}

export function TopBarV2({ lessonTitle, phases, currentPhaseIndex }: TopBarV2Props) {
  return (
    <div
      style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 80,
        background: "rgba(255,255,255,0.88)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: 48, paddingRight: 48, zIndex: 10,
        backdropFilter: "blur(4px)",
        borderBottom: "2px solid rgba(255,255,255,0.6)",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1e3a8a", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "0.02em" }}>
        {lessonTitle}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {phases.map((phaseType, idx) => {
          const isActive = idx === currentPhaseIndex;
          const isCompleted = idx < currentPhaseIndex;
          const color = PHASE_COLORS[phaseType];
          const dotColor = isActive ? color : isCompleted ? "#6BCB77" : "rgba(200,200,200,0.6)";
          return (
            <div
              key={idx}
              style={{
                width: 16, height: 16, borderRadius: "50%", background: dotColor,
                boxShadow: isActive ? `0 0 0 4px ${color}40` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
