"use client";

import { useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Volume2 } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { InteractiveSpeechBubble } from "./interactive-speech-bubble";
import { InteractiveKeywordDisplay } from "./interactive-keyword-display";
import { AudioPlayer, type AudioPlayerRef } from "./audio-player";
import { synth } from "@/lib/audio-utils";
import type { InteractiveLessonStep, InteractiveLessonData } from "./interactive-lesson-types";

interface StepProps {
  step: InteractiveLessonStep;
  lessonData: InteractiveLessonData;
  onNext: () => void;
  onActivityResult?: (correct: boolean) => void;
}

// Concept step: mascot + keyword display + speech bubble + audio + speaker replay button
// Auto-advances after audio ends + autoAdvanceMs delay, or shows "Continue" button
export function LessonStepConcept({ step, onNext }: StepProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [audioEnded, setAudioEnded] = useState(false);
  const [canAdvance, setCanAdvance] = useState(false);
  const [speakerPulsing, setSpeakerPulsing] = useState(false);
  const audioRef = useRef<AudioPlayerRef | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!audioEnded) return;
    // If autoAdvanceMs is set AND there's real audio, auto-advance
    if (step.autoAdvanceMs !== undefined && step.audioUrl) {
      const timer = setTimeout(() => onNext(), step.autoAdvanceMs);
      return () => clearTimeout(timer);
    }
    // Otherwise show continue button after short delay
    const timer = setTimeout(() => setCanAdvance(true), 500);
    return () => clearTimeout(timer);
  }, [audioEnded, step.autoAdvanceMs, step.audioUrl, onNext]);

  // Pulse speaker button briefly when audio starts to attract child's attention
  useEffect(() => {
    if (!step.audioUrl) return;
    setSpeakerPulsing(true);
    pulseTimerRef.current = setTimeout(() => setSpeakerPulsing(false), 2000);
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [step.audioUrl]);

  const handleNext = () => {
    synth.playTing();
    onNext();
  };

  const handleReplay = () => {
    audioRef.current?.replay();
    setSpeakerPulsing(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setSpeakerPulsing(false), 1200);
  };

  const showButton = canAdvance;

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
      {/* Speech bubble */}
      {step.speech ? (
        <InteractiveSpeechBubble text={step.speech} visible position="bottom" />
      ) : null}

      {/* Keyword display with speaker replay button */}
      {step.keyword ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <InteractiveKeywordDisplay
            keyword={step.keyword}
            subtext={step.subtext}
            visible
          />
          {step.audioUrl ? (
            <m.button
              onClick={handleReplay}
              animate={
                speakerPulsing
                  ? { scale: [1, 1.18, 1, 1.18, 1], boxShadow: ["0 2px 8px rgba(59,130,246,0.2)", "0 4px 20px rgba(59,130,246,0.6)", "0 2px 8px rgba(59,130,246,0.2)"] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.6, repeat: speakerPulsing ? Infinity : 0 }}
              title="Listen again"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
                flexShrink: 0,
              }}
            >
              <Volume2 size={22} />
            </m.button>
          ) : null}
        </div>
      ) : null}

      {/* Mascot */}
      <m.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={
          prefersReducedMotion
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 280, damping: 22 }
        }
      >
        <Mascot
          variant={step.mascot.variant}
          state={step.mascot.state}
          actionProp={step.mascot.actionProp ?? "none"}
          size={160}
        />
      </m.div>

      {/* Audio player */}
      <AudioPlayer ref={audioRef} src={step.audioUrl} autoPlay onEnd={() => setAudioEnded(true)} />

      {/* Continue button shown after audio + delay */}
      {showButton ? (
        <button
          onClick={handleNext}
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
          Continue
        </button>
      ) : null}
    </div>
  );
}
