"use client";
import { useEffect, useState } from "react";
import type { MascotAnimationMode, MascotSequenceStep } from "@/components/mascot/types";

export function useMascotTimeline(
  sequence: MascotSequenceStep[] | undefined,
  mode: MascotAnimationMode,
) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (mode !== "sequence" || !sequence?.length) return;
    if (stepIndex >= sequence.length) {
      setIsComplete(true);
      return;
    }
    const step = sequence[stepIndex];
    if (!step) return;
    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, step.duration);
    return () => clearTimeout(timer);
  }, [mode, sequence, stepIndex]);

  // Reset when sequence changes
  useEffect(() => {
    setStepIndex(0);
    setIsComplete(false);
  }, [sequence]);

  if (mode !== "sequence" || !sequence?.length) {
    return { currentStep: null, stepIndex: 0, isComplete: false };
  }

  const currentStep = sequence[Math.min(stepIndex, sequence.length - 1)];
  return { currentStep, stepIndex, isComplete };
}
