"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot/Mascot";
import { InteractiveSpeechBubble } from "./interactive-speech-bubble";
import { AudioPlayer } from "./audio-player";
import { synth } from "@/lib/audio-utils";
import type { InteractiveLessonStep, InteractiveLessonData } from "./interactive-lesson-types";

interface StepProps {
  step: InteractiveLessonStep;
  lessonData: InteractiveLessonData;
  onNext: () => void;
  onActivityResult?: (correct: boolean) => void;
}

// Greeting step: mascot slides in, speech bubble with greeting, big pulsing "Bắt đầu" button
export function LessonStepHook({ step, onNext }: StepProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBubbleVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Auto-advance after audio ends if autoAdvanceMs is set and audio exists
  useEffect(() => {
    if (!audioEnded || !step.autoAdvanceMs || !step.audioUrl) return;
    const timer = setTimeout(() => onNext(), step.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [audioEnded, step.autoAdvanceMs, step.audioUrl, onNext]);

  const handleStart = () => {
    synth.playPop();
    onNext();
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
      {/* Speech bubble above mascot */}
      <InteractiveSpeechBubble
        text={step.speech ?? "Xin chào!"}
        visible={bubbleVisible}
        position="bottom"
      />

      {/* Mascot slides in from below */}
      <m.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 60 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 260, damping: 22, delay: 0.1 }
        }
      >
        <Mascot
          variant={step.mascot.variant}
          state={step.mascot.state}
          actionProp={step.mascot.actionProp ?? "none"}
          size={200}
        />
      </m.div>

      {/* Audio narration */}
      <AudioPlayer src={step.audioUrl} autoPlay onEnd={() => setAudioEnded(true)} />

      {/* Pulsing "Bắt đầu" button */}
      <m.button
        onClick={handleStart}
        animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          padding: "16px 48px",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Baloo 2', 'Nunito', system-ui, sans-serif",
          borderRadius: 24,
          border: "none",
          background: "linear-gradient(135deg, #22d3ee, #3b82f6)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
        }}
      >
        Bắt đầu
      </m.button>
    </div>
  );
}
