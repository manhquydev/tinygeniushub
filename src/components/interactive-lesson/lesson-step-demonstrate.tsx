"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mascot } from "@/components/mascot/Mascot";
import { InteractiveKeywordCards } from "./interactive-keyword-cards";
import { AudioPlayer } from "./audio-player";
import { synth } from "@/lib/audio-utils";
import type { InteractiveLessonStep, InteractiveLessonData } from "./interactive-lesson-types";

interface StepProps {
  step: InteractiveLessonStep;
  lessonData: InteractiveLessonData;
  onNext: () => void;
  onActivityResult?: (correct: boolean) => void;
}

type DemoPhase = "intro" | "keywords" | "done";

// Demonstrate step: mascot + keyword cards synced to per-keyword audio
// Phase flow: intro audio → keyword-by-keyword (card appears when its audio plays) → done
// Fallback: if no keywordsWithAudio, uses 1.5s timer per card (legacy behavior)
export function LessonStepDemonstrate({ step, onNext }: StepProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const kwa = step.keywordsWithAudio;
  const keywords = kwa ? kwa.map((k) => k.word) : (step.keywords ?? []);
  const hasAudioSync = !!kwa && kwa.length > 0;

  const [phase, setPhase] = useState<DemoPhase>(step.audioUrl ? "intro" : "keywords");
  const [activeIndex, setActiveIndex] = useState(
    hasAudioSync && step.audioUrl ? -1 : 0
  );
  const [allCardsShown, setAllCardsShown] = useState(keywords.length === 0);

  // Audio-driven: current keyword audio URL
  const currentKeywordAudio = hasAudioSync && activeIndex >= 0 && activeIndex < kwa.length
    ? kwa[activeIndex].audioUrl
    : undefined;

  // Intro audio ended → start keywords phase
  const handleIntroEnd = () => {
    setPhase("keywords");
    if (hasAudioSync) {
      synth.playPop();
      setActiveIndex(0);
    }
  };

  // Per-keyword audio ended → advance to next keyword or done
  const handleKeywordAudioEnd = () => {
    const nextIdx = activeIndex + 1;
    if (nextIdx >= keywords.length) {
      setAllCardsShown(true);
      setPhase("done");
    } else {
      synth.playPop();
      setActiveIndex(nextIdx);
    }
  };

  // Legacy timer fallback: when no keywordsWithAudio, reveal cards every 1.5s
  useEffect(() => {
    if (hasAudioSync || phase !== "keywords" || allCardsShown || keywords.length === 0) return;
    if (activeIndex >= keywords.length - 1) {
      setAllCardsShown(true);
      setPhase("done");
      return;
    }
    const timer = setTimeout(() => {
      synth.playPop();
      setActiveIndex((prev) => prev + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeIndex, allCardsShown, keywords.length, hasAudioSync, phase]);

  const canContinue = phase === "done" || (allCardsShown && !step.audioUrl);

  const handleNext = () => {
    synth.playTing();
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
      {/* Row: mascot + keyword cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 32,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <m.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.2 }
              : { type: "spring", stiffness: 260, damping: 22 }
          }
        >
          <Mascot
            variant={step.mascot.variant}
            state={step.mascot.state}
            actionProp={step.mascot.actionProp ?? "none"}
            size={140}
          />
        </m.div>

        {keywords.length > 0 ? (
          <InteractiveKeywordCards
            keywords={keywords}
            activeIndex={activeIndex}
            keywordsWithAudio={kwa}
          />
        ) : null}
      </div>

      {/* Intro narration audio (plays in "intro" phase) */}
      {phase === "intro" ? (
        <AudioPlayer src={step.audioUrl} autoPlay onEnd={handleIntroEnd} />
      ) : null}

      {/* Per-keyword audio (plays in "keywords" phase when audio-synced) */}
      {phase === "keywords" && hasAudioSync && activeIndex >= 0 ? (
        <AudioPlayer
          key={`kw-${activeIndex}`}
          src={currentKeywordAudio}
          autoPlay
          onEnd={handleKeywordAudioEnd}
        />
      ) : null}

      {canContinue ? (
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
          Tiếp tục
        </button>
      ) : null}
    </div>
  );
}
