"use client";

import { useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot/Mascot";
import { InteractiveKeywordDisplay } from "./interactive-keyword-display";
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

// Reinforce step: briefly shows keyword, then same activity again
// Correct -> onNext(). Wrong handled by parent retry logic; encourage via speech
export function LessonStepReinforce({ step, onNext, onActivityResult }: StepProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [showActivity, setShowActivity] = useState(false);
  const [mascotState, setMascotState] = useState(step.mascot.state);
  const [disabled, setDisabled] = useState(false);
  const [audioEnded, setAudioEnded] = useState(!step.audioUrl);
  const [gazeDir, setGazeDir] = useState<KidMascotGazeDirection>("center");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show keyword briefly then reveal activity
  useEffect(() => {
    const timer = setTimeout(() => setShowActivity(true), 1500);
    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!step.activity) return null;

  const activity = {
    id: "interactive-activity-reinforce",
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
      timerRef.current = setTimeout(() => onNext(), 1000);
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
        gap: 20,
        flex: 1,
        padding: "32px 24px",
        fontFamily: "'Baloo 2', 'Nunito', 'Comic Sans MS', system-ui, sans-serif",
      }}
    >
      {/* Keyword hint shown briefly */}
      {step.keyword ? (
        <m.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={
            showActivity
              ? prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }
              : prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
          }
          transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.4 }}
        >
          <InteractiveKeywordDisplay keyword={step.keyword} subtext={step.subtext} visible />
        </m.div>
      ) : null}

      {/* Audio narration */}
      <AudioPlayer src={step.audioUrl} autoPlay onEnd={() => setAudioEnded(true)} />

      {/* Mascot */}
      <m.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 22 }}
      >
        <Mascot
          variant={step.mascot.variant}
          state={mascotState}
          actionProp={step.mascot.actionProp ?? "none"}
          gazeDirection={gazeDir}
          size={120}
        />
      </m.div>

      {/* Activity shown after keyword hint */}
      {showActivity ? (
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
      ) : null}
    </div>
  );
}
