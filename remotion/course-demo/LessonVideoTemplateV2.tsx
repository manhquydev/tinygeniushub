import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { MascotScene } from "../compositions/MascotScene";
import { SceneBackground } from "./SceneBackground";
import { TopBarV2 } from "./TopBar";
import { BottomPrompt } from "./BottomPrompt";
import { ConfettiBurst } from "./ConfettiBurst";
import { StarBurst } from "./StarBurst";
import { SpeechBubble } from "./SpeechBubble";
import { KeywordDisplay } from "./KeywordDisplay";
import { KeywordCards } from "./KeywordCards";
import { YourTurnCue } from "./YourTurnCue";
import { SoundProxy } from "./SoundProxy";
import { CorrectBadge } from "./CorrectBadge";
import { SceneTransition } from "./SceneTransition";
import type { LessonVideoDataV2, LessonPhase } from "./lesson-phase-types";
import type { MascotSequenceStep, MascotState } from "../../src/components/mascot/types";

// Convert a single LessonPhase's mascot config to MascotSequenceStep array.
// Long phases (>=150f) with midState get a mid-phase expression change.
function phaseToSequence(phase: LessonPhase): MascotSequenceStep[] {
  const totalDurationMs = Math.round(phase.durationFrames * (1000 / 30));
  if (phase.durationFrames >= 150 && phase.mascot.midState) {
    const halfMs = Math.round(totalDurationMs / 2);
    return [
      { state: phase.mascot.state, gesture: phase.mascot.gesture, actionProp: phase.mascot.actionProp, duration: halfMs },
      { state: phase.mascot.midState as MascotState, gesture: phase.mascot.gesture, actionProp: phase.mascot.actionProp, duration: halfMs },
    ];
  }
  return [{ state: phase.mascot.state, gesture: phase.mascot.gesture, actionProp: phase.mascot.actionProp, duration: totalDurationMs }];
}

// Idle breathing wrapper — subtle scaleY pulse on every mascot
function MascotWithBreathing({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin((frame / 30) * Math.PI * 2) * 0.015;
  return (
    <div style={{ transform: `scaleY(${breathe})`, transformOrigin: "bottom center" }}>
      {children}
    </div>
  );
}

// Mascot + speech bubble together in one container.
// Bubble is absolutely positioned above the mascot center.
function MascotWithBubble({
  phase, sequence, mascotVariant, size,
}: {
  phase: LessonPhase;
  sequence: MascotSequenceStep[];
  mascotVariant: LessonVideoDataV2["mascotVariant"];
  size: number;
}) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {phase.speech && (
        <div style={{ position: "absolute", top: -90, zIndex: 2, whiteSpace: "nowrap" }}>
          <SpeechBubble text={phase.speech} delay={8} />
        </div>
      )}
      <MascotWithBreathing>
        <MascotScene sequence={sequence} variant={mascotVariant} size={size} />
      </MascotWithBreathing>
    </div>
  );
}

// Shared layout wrapper for phases with TopBar
function PhaseLayout({ children, phaseType, lessonTitle, phases, phaseIndex }: {
  children: React.ReactNode;
  phaseType: LessonPhase["type"];
  lessonTitle: string;
  phases: LessonPhase[];
  phaseIndex: number;
}) {
  const phaseTypes = phases.map((p) => p.type);
  return (
    <AbsoluteFill>
      <SceneBackground phaseType={phaseType} />
      <TopBarV2 lessonTitle={lessonTitle} phases={phaseTypes} currentPhaseIndex={phaseIndex} />
      <div style={{ position: "absolute", top: 80, bottom: 0, left: 0, right: 0 }}>
        {children}
      </div>
    </AbsoluteFill>
  );
}

interface PhaseViewProps {
  phase: LessonPhase;
  phaseIndex: number;
  allPhases: LessonPhase[];
  lessonTitle: string;
  mascotVariant: LessonVideoDataV2["mascotVariant"];
}

function PhaseView({ phase, phaseIndex, allPhases, lessonTitle, mascotVariant }: PhaseViewProps) {
  const frame = useCurrentFrame();
  const sequence = phaseToSequence(phase);

  // HOOK: mascot center + speech bubble above, sound proxy fixed position
  if (phase.type === "hook") {
    return (
      <AbsoluteFill>
        <SceneBackground phaseType="hook" />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row", alignItems: "center", padding: "0 80px", gap: 60 }}>
          <div style={{ flex: "0 0 50%", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <MascotWithBubble phase={phase} sequence={sequence} mascotVariant={mascotVariant} size={560} />
          </div>
          <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", gap: 32 }} />
        </div>
        {phase.soundProxy && (
          <div style={{ position: "absolute", top: 120, right: 120 }}>
            <SoundProxy type={phase.soundProxy} x={0} y={0} />
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // CONCEPT: TopBar + mascot left + large keyword right
  if (phase.type === "concept") {
    return (
      <PhaseLayout phaseType="concept" lessonTitle={lessonTitle} phases={allPhases} phaseIndex={phaseIndex}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100%", padding: "0 80px", gap: 40 }}>
          <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <MascotWithBubble phase={phase} sequence={sequence} mascotVariant={mascotVariant} size={520} />
          </div>
          <div style={{ flex: "1 1 50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {phase.keyword && <KeywordDisplay keyword={phase.keyword} subtext={phase.subtext} delay={6} />}
          </div>
        </div>
      </PhaseLayout>
    );
  }

  // DEMONSTRATE: TopBar + mascot left + keyword cards right
  if (phase.type === "demonstrate") {
    return (
      <PhaseLayout phaseType="demonstrate" lessonTitle={lessonTitle} phases={allPhases} phaseIndex={phaseIndex}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100%", padding: "0 80px", gap: 40 }}>
          <div style={{ flex: "0 0 30%", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <MascotWithBreathing>
              <MascotScene sequence={sequence} variant={mascotVariant} size={520} />
            </MascotWithBreathing>
          </div>
          <div style={{ flex: "1 1 60%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
            {phase.keyword && <KeywordDisplay keyword={phase.keyword} subtext={phase.subtext} delay={6} />}
            {phase.keywords && <KeywordCards keywords={phase.keywords} startFrame={12} />}
          </div>
        </div>
        {phase.soundProxy && (
          <div style={{ position: "absolute", top: 160, left: "50%" }}>
            <SoundProxy type={phase.soundProxy} x={0} y={0} />
          </div>
        )}
      </PhaseLayout>
    );
  }

  // YOUR-TURN: TopBar + mascot left + answer cards right
  if (phase.type === "your-turn") {
    return (
      <PhaseLayout phaseType="your-turn" lessonTitle={lessonTitle} phases={allPhases} phaseIndex={phaseIndex}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: "100%", padding: "0 80px", gap: 40 }}>
          <div style={{ flex: "0 0 35%", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <MascotWithBubble phase={phase} sequence={sequence} mascotVariant={mascotVariant} size={480} />
          </div>
          <div style={{ flex: "1 1 55%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
            {phase.answerOptions && phase.correctIndex !== undefined && (
              <YourTurnCue options={phase.answerOptions} correctIndex={phase.correctIndex} />
            )}
          </div>
        </div>
        <BottomPrompt text="Please choose the correct answer!" />
        {phase.soundProxy && (
          <div style={{ position: "absolute", top: 160, left: "50%" }}>
            <SoundProxy type={phase.soundProxy} x={0} y={0} />
          </div>
        )}
      </PhaseLayout>
    );
  }

  // REINFORCE: TopBar + keyword center + mascot right nodding
  if (phase.type === "reinforce") {
    return (
      <PhaseLayout phaseType="reinforce" lessonTitle={lessonTitle} phases={allPhases} phaseIndex={phaseIndex}>
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", height: "100%", padding: "0 80px", gap: 40 }}>
          <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <MascotWithBreathing>
              <MascotScene sequence={sequence} variant={mascotVariant} size={480} />
            </MascotWithBreathing>
          </div>
          <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
            {phase.keyword && <KeywordDisplay keyword={phase.keyword} subtext={phase.subtext} delay={6} />}
          </div>
        </div>
        {phase.soundProxy && (
          <div style={{ position: "absolute", top: 200, left: "40%" }}>
            <SoundProxy type={phase.soundProxy} x={0} y={0} />
          </div>
        )}
      </PhaseLayout>
    );
  }

  // CELEBRATE: full screen, mascot center, delayed confetti/stars
  if (phase.type === "celebrate") {
    return (
      <AbsoluteFill>
        <SceneBackground phaseType="celebrate" />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <MascotWithBubble phase={phase} sequence={sequence} mascotVariant={mascotVariant} size={560} />
        </div>
        <CorrectBadge />
        <Sequence from={12} durationInFrames={phase.durationFrames - 12}>
          <ConfettiBurst count={30} />
          <StarBurst x={1200} y={400} count={9} />
        </Sequence>
        {phase.soundProxy && (
          <div style={{ position: "absolute", top: 100, left: "50%" }}>
            <SoundProxy type={phase.soundProxy} x={0} y={0} />
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // RECAP: keyword left + mascot right waving + speech bubble
  if (phase.type === "recap") {
    return (
      <AbsoluteFill>
        <SceneBackground phaseType="recap" />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row", alignItems: "center", padding: "0 80px", gap: 60 }}>
          <div style={{ flex: "0 0 40%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {phase.keyword && <KeywordDisplay keyword={phase.keyword} delay={4} />}
          </div>
          <div style={{ flex: "1 1 50%", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <MascotWithBubble phase={phase} sequence={sequence} mascotVariant={mascotVariant} size={500} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return null;
}

// Full v2 lesson video template — assembles 7 phases as Remotion Sequences.
export function LessonVideoTemplateV2({ lesson }: { lesson: LessonVideoDataV2 }) {
  let frameOffset = 0;
  const offsets = lesson.phases.map((phase) => {
    const offset = frameOffset;
    frameOffset += phase.durationFrames;
    return offset;
  });

  return (
    <AbsoluteFill>
      {lesson.phases.map((phase, i) => (
        <Sequence key={phase.type + i} from={offsets[i]} durationInFrames={phase.durationFrames}>
          <SceneTransition durationFrames={phase.durationFrames}>
            <PhaseView
              phase={phase}
              phaseIndex={i}
              allPhases={lesson.phases}
              lessonTitle={lesson.title}
              mascotVariant={lesson.mascotVariant}
            />
          </SceneTransition>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
