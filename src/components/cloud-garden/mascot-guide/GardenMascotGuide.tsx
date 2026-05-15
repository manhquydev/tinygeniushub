"use client";

/**
 * GardenMascotGuide — Mascot wrapper with speech bubble for garden screens.
 *
 * Uses the existing <Mascot> system (BigOwl/SmallOwl/etc.) and adds:
 *  - Context-aware dialogue via useGardenDialogue hook
 *  - Cloud SpeechBubble that appears/disappears smoothly
 *  - Mascot taps open a new line of dialogue
 *
 * DESIGN: Does NOT modify Mascot.tsx — this is purely a wrapper layer.
 */

import { useState, useCallback } from "react";
import { Mascot } from "@/components/mascot";
import { SpeechBubble } from "../shared/SpeechBubble";
import { useGardenDialogue, type GardenContext } from "./use-garden-dialogue";
import "../cloud-garden.css";

interface GardenMascotGuideProps {
  context: GardenContext;
  streak?: number;
  lessonsDone?: number;
  lessonsTotal?: number;
  className?: string;
}

export function GardenMascotGuide({
  context,
  streak = 0,
  lessonsDone = 0,
  lessonsTotal = 5,
  className,
}: GardenMascotGuideProps) {
  const [tapCount, setTapCount] = useState(0);
  const [showBubble, setShowBubble] = useState(true);

  // Re-derive dialogue on tap by cycling (changing lessonsDone equiv)
  const { dialogue, mascotState } = useGardenDialogue({
    context,
    streak,
    lessonsDone: lessonsDone + tapCount,
    lessonsTotal,
  });

  const handleMascotTap = useCallback(() => {
    // Toggle hide/show + cycle to next dialogue
    setShowBubble(false);
    setTimeout(() => {
      setTapCount((c) => c + 1);
      setShowBubble(true);
    }, 200);
  }, []);

  return (
    <div
      className={`cg-mascot-guide ${className ?? ""}`.trim()}
      aria-label={`Guide character: ${dialogue}`}
    >
      {/* Dialogue bubble above mascot */}
      <SpeechBubble text={dialogue} visible={showBubble} position="left" />

      {/* Mascot (existing component, variant="small" = Cu Con) */}
      <button
        onClick={handleMascotTap}
        aria-label="Tap the guide to hear a suggestion"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          touchAction: "manipulation",
        }}
      >
        <Mascot
          variant="small"
          state={mascotState}
          size={160}
          motionLevel="soft"
          pauseWhenOffscreen
          showBaseGlow={false}
        />
      </button>
    </div>
  );
}
