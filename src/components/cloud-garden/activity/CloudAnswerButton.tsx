"use client";

/**
 * CloudAnswerButton — Answer choice button for the activity screen.
 *
 * Extends CloudButton primitive with answer feedback state machine:
 *   idle → selected (on tap) → correct OR incorrect (on check)
 *
 * Also triggers StarBurstCanvas when correct.
 *
 * This component handles its own visual state; parent provides
 * `answerState` from the lesson controller.
 */

import { useRef } from "react";
import { CloudButton, type CloudButtonState, type CloudButtonSubject } from "../shared/CloudButton";
import { StarBurstCanvas } from "../shared/StarBurstCanvas";
import { useState } from "react";
import "../cloud-garden.css";

interface CloudAnswerButtonProps {
  label: string | number;
  answerState: CloudButtonState;
  subject?: CloudButtonSubject;
  onClick?: () => void;
}

export function CloudAnswerButton({
  label,
  answerState,
  subject = "neutral",
  onClick,
}: CloudAnswerButtonProps) {
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  // When state changes to correct, fire star burst from button center
  const prevState = useRef<CloudButtonState>(answerState);
  if (prevState.current !== answerState) {
    prevState.current = answerState;
    if (answerState === "correct" && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  }

  return (
    <div ref={btnRef} style={{ position: "relative" }}>
      <CloudButton
        label={String(label)}
        state={answerState}
        size="md"
        subject={subject}
        onClick={answerState === "idle" || answerState === "hovered" ? onClick : undefined}
        style={{ width: "100%", fontSize: "1.2rem", fontWeight: 900 }}
      />
      {/* Star burst overlay on correct */}
      {burst && (
        <StarBurstCanvas
          x={burst.x}
          y={burst.y}
          color="gold"
          particleCount={40}
          duration={1000}
          onComplete={() => setBurst(null)}
        />
      )}
    </div>
  );
}
