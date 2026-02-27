"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot/Mascot";
import { InteractiveSpeechBubble } from "./interactive-speech-bubble";
import { InteractiveCelebration } from "./interactive-celebration";
import { AudioPlayer } from "./audio-player";
import { synth } from "@/lib/audio-utils";
import type { InteractiveLessonStep, InteractiveLessonData } from "./interactive-lesson-types";

interface StepProps {
  step: InteractiveLessonStep;
  lessonData: InteractiveLessonData;
  onNext: () => void;
  onActivityResult?: (correct: boolean) => void;
}

// Celebrate step: mascot celebrating, confetti, speech bubble, auto-advance after delay
export function LessonStepCelebrate({ step, onNext }: StepProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [celebrationTriggered, setCelebrationTriggered] = useState(false);

  const autoAdvanceMs = step.autoAdvanceMs ?? 3000;

  useEffect(() => {
    synth.playYay();
    // Trigger celebration after short entrance delay
    const celebTimer = setTimeout(() => setCelebrationTriggered(true), 200);
    // Auto-advance
    const advanceTimer = setTimeout(() => onNext(), autoAdvanceMs);

    return () => {
      clearTimeout(celebTimer);
      clearTimeout(advanceTimer);
    };
  }, [autoAdvanceMs, onNext]);

  return (
    <div
      style={{
        position: "relative",
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
      {/* Confetti overlay */}
      <InteractiveCelebration trigger={celebrationTriggered} />

      {/* Audio narration */}
      <AudioPlayer src={step.audioUrl} autoPlay />

      {/* Speech bubble */}
      <InteractiveSpeechBubble
        text={step.speech ?? "Giỏi lắm!"}
        visible
        position="bottom"
      />

      {/* Celebrating mascot */}
      <m.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 300, damping: 18 }
        }
      >
        <Mascot
          variant={step.mascot.variant}
          state="celebrating"
          actionProp={step.mascot.actionProp ?? "none"}
          size={200}
        />
      </m.div>

      {/* Progress hint */}
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          fontSize: 20,
          color: "#64748b",
          margin: 0,
          fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
        }}
      >
        Tiếp tục ngay...
      </m.p>
    </div>
  );
}
