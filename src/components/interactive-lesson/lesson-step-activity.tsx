"use client";

import { useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot/Mascot";
import { ActivityRenderer } from "@/components/lesson-wizard/activity-renderer";
import { AudioPlayer } from "./audio-player";
import { synth } from "@/lib/audio-utils";
import type { KidMascotGazeDirection } from "@/components/animation/kid-mascot";
import type { InteractiveLessonStep, InteractiveLessonData } from "./interactive-lesson-types";

interface StepProps {
  step: InteractiveLessonStep;
  lessonData: InteractiveLessonData;
  onNext: () => void;
  onActivityResult: (correct: boolean) => void;
}

// Activity step: mascot watches, wraps ActivityRenderer
// Correct -> mascot celebrating, onActivityResult(true), advance after delay
// Wrong -> mascot nervous (sad), onActivityResult(false), re-enable for retry
export function LessonStepActivity({ step, onNext, onActivityResult }: StepProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [mascotState, setMascotState] = useState(step.mascot.state);
  const [disabled, setDisabled] = useState(false);
  const [audioEnded, setAudioEnded] = useState(!step.audioUrl); // gate activity behind narration
  const [gazeDir, setGazeDir] = useState<KidMascotGazeDirection>("center");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when step changes
  useEffect(() => {
    setMascotState(step.mascot.state);
    setDisabled(false);
    setGazeDir("center");
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step]);

  if (!step.activity) return null;

  const activity = {
    id: "interactive-activity",
    type: step.activity.type,
    prompt: step.activity.prompt,
    spec: step.activity.spec,
    passCriteria: step.activity.passCriteria,
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (disabled) return;
    setDisabled(true);

    if (isCorrect) {
      synth.playYay();
      setMascotState("celebrating");
      onActivityResult(true);
      timerRef.current = setTimeout(() => onNext(), 1200);
    } else {
      synth.playBzz();
      setMascotState("sad");
      onActivityResult(false);
      timerRef.current = setTimeout(() => {
        setDisabled(false);
        setMascotState(step.mascot.state);
      }, 1200);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        flex: 1,
        padding: "32px 24px",
        fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', system-ui, sans-serif",
      }}
    >
      {/* Mascot watching from side */}
      <m.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 260, damping: 22 }
        }
      >
        <Mascot
          variant={step.mascot.variant}
          state={mascotState}
          actionProp={step.mascot.actionProp ?? "none"}
          gazeDirection={gazeDir}
          size={120}
        />
      </m.div>

      {/* Audio narration */}
      <AudioPlayer src={step.audioUrl} autoPlay onEnd={() => setAudioEnded(true)} />

      {/* Activity renderer — gated behind audio completion */}
      <div style={{ width: "100%", maxWidth: 640 }}>
        <ActivityRenderer
          activity={activity}
          disabled={disabled || !audioEnded}
          onAnswer={handleAnswer}
          mascotGazeDirection={gazeDir}
          onHoverOption={(dir) => setGazeDir(dir)}
          onHoverOptionEnd={() => setGazeDir("center")}
        />
      </div>
    </div>
  );
}
