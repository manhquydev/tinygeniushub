import { useCallback, useState } from "react";
import type { HybridSegment } from "./hybrid-lesson-types";

type HybridPhase = "video" | "transition" | "interactive" | "replay";

interface HybridLessonState {
  segmentIndex: number;
  phase: HybridPhase;
  retryCount: number;
  needsReinforce: boolean;
  totalCorrect: number;
  totalWrong: number;
  isComplete: boolean;
}

export function useHybridLessonState(segments: HybridSegment[]) {
  const [state, setState] = useState<HybridLessonState>({
    segmentIndex: 0,
    phase: segments[0]?.type === "video" ? "video" : "interactive",
    retryCount: 0,
    needsReinforce: false,
    totalCorrect: 0,
    totalWrong: 0,
    isComplete: false,
  });

  const currentSegment = segments[state.segmentIndex] ?? segments[segments.length - 1];

  // Called when a video segment finishes playing
  const onVideoEnded = useCallback(() => {
    setState((prev) => {
      const nextIdx = prev.segmentIndex + 1;
      if (nextIdx >= segments.length) {
        return { ...prev, isComplete: true };
      }
      const nextSeg = segments[nextIdx];
      // If next is interactive, show transition overlay first
      if (nextSeg?.type === "interactive") {
        return { ...prev, phase: "transition" };
      }
      // Next is another video
      return { ...prev, segmentIndex: nextIdx, phase: "video" };
    });
  }, [segments]);

  // Called when transition overlay finishes
  const onTransitionComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      segmentIndex: prev.segmentIndex + 1,
      phase: "interactive",
    }));
  }, []);

  // Advance to next interactive segment (skip reinforce if not needed)
  const advanceSegment = useCallback(() => {
    setState((prev) => {
      let nextIdx = prev.segmentIndex + 1;
      // Skip reinforce segments when advancing normally
      while (
        nextIdx < segments.length &&
        segments[nextIdx]?.type === "interactive" &&
        (segments[nextIdx] as { type: "interactive"; step: { type: string } }).step.type === "reinforce"
      ) {
        nextIdx++;
      }
      if (nextIdx >= segments.length) {
        return { ...prev, isComplete: true };
      }
      const nextSeg = segments[nextIdx];
      return {
        ...prev,
        segmentIndex: nextIdx,
        phase: nextSeg?.type === "video" ? "video" : "interactive",
        needsReinforce: false,
        retryCount: 0,
      };
    });
  }, [segments]);

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

  // Replay concept video
  const startReplay = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "replay" }));
  }, []);

  const endReplay = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "interactive" }));
  }, []);

  const reset = useCallback(() => {
    setState({
      segmentIndex: 0,
      phase: segments[0]?.type === "video" ? "video" : "interactive",
      retryCount: 0,
      needsReinforce: false,
      totalCorrect: 0,
      totalWrong: 0,
      isComplete: false,
    });
  }, [segments]);

  return {
    ...state,
    currentSegment,
    onVideoEnded,
    onTransitionComplete,
    advanceSegment,
    handleActivityResult,
    startReplay,
    endReplay,
    reset,
  };
}
