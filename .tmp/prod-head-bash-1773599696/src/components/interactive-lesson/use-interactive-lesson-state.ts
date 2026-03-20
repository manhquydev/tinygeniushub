import { useCallback, useState } from "react";
import type { InteractiveLessonStep } from "./interactive-lesson-types";

interface InteractiveLessonState {
  currentStepIndex: number;
  retryCount: number;
  needsReinforce: boolean;
  isComplete: boolean;
  totalCorrect: number;
  totalWrong: number;
}

export function useInteractiveLessonState(steps: InteractiveLessonStep[]) {
  const [state, setState] = useState<InteractiveLessonState>({
    currentStepIndex: 0,
    retryCount: 0,
    needsReinforce: false,
    isComplete: false,
    totalCorrect: 0,
    totalWrong: 0,
  });

  const advanceStep = useCallback(() => {
    setState((prev) => {
      // Skip "reinforce" steps when advancing normally (reinforce only shows via needsReinforce)
      let nextIndex = prev.currentStepIndex + 1;
      while (nextIndex < steps.length && steps[nextIndex]?.type === "reinforce") {
        nextIndex++;
      }
      if (nextIndex >= steps.length) {
        return { ...prev, isComplete: true };
      }
      return { ...prev, currentStepIndex: nextIndex, needsReinforce: false, retryCount: 0 };
    });
  }, [steps]);

  const handleActivityResult = useCallback((correct: boolean) => {
    setState((prev) => {
      if (correct) {
        return { ...prev, totalCorrect: prev.totalCorrect + 1, needsReinforce: false, retryCount: 0 };
      }
      const newRetryCount = prev.retryCount + 1;
      return {
        ...prev,
        totalWrong: prev.totalWrong + 1,
        retryCount: newRetryCount,
        needsReinforce: newRetryCount < 3,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      currentStepIndex: 0,
      retryCount: 0,
      needsReinforce: false,
      isComplete: false,
      totalCorrect: 0,
      totalWrong: 0,
    });
  }, []);

  const currentStep = steps[state.currentStepIndex] ?? steps[steps.length - 1];

  return { ...state, currentStep, advanceStep, handleActivityResult, reset };
}
