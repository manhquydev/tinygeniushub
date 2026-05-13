"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { ParentGateDialog } from "@/components/parent-gate-dialog";
import { InteractiveSceneBackground } from "@/components/interactive-lesson/interactive-scene-background";
import { LessonStepActivity } from "@/components/interactive-lesson/lesson-step-activity";
import { LessonStepReinforce } from "@/components/interactive-lesson/lesson-step-reinforce";
import { LessonStepCelebrate } from "@/components/interactive-lesson/lesson-step-celebrate";
import { VideoSegmentPlayer } from "./video-segment-player";
import { HybridTransitionOverlay } from "./hybrid-transition-overlay";
import { HybridReplayButton } from "./hybrid-replay-button";
import { useHybridLessonState } from "./use-hybrid-lesson-state";
import type { HybridLessonData, InteractiveSegment } from "./hybrid-lesson-types";

interface HybridLessonFlowProps {
  lessonData: HybridLessonData;
  childId: string;
  lessonId: string;
  onCompleted?: (lessonId: string) => void;
  onClose: () => void;
  previewMode?: boolean;
}

const SWIPE_VARIANTS = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" as const } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2, ease: "easeIn" as const } },
};

export function HybridLessonFlow({
  lessonData,
  childId,
  lessonId,
  onCompleted,
  onClose,
  previewMode = false,
}: HybridLessonFlowProps) {
  const [exitGateOpen, setExitGateOpen] = useState(false);

  const state = useHybridLessonState(lessonData.segments);
  const {
    currentSegment, phase, needsReinforce, segmentIndex,
    totalCorrect, totalWrong, retryCount,
    onVideoEnded, onTransitionComplete, advanceSegment,
    handleActivityResult, startReplay, endReplay,
  } = state;

  // Completion handler
  const handleCelebrationComplete = useCallback(async () => {
    if (!previewMode) {
      const quizTotal = totalCorrect + totalWrong;
      const quizScore = quizTotal > 0 ? totalCorrect / quizTotal : 1;
      try {
        await fetch(`/api/lessons/${lessonId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childId,
            quizScore,
            minutesLearned: 5,
            checklist: ["hybrid_done"],
            useExtendedRetention: true,
          }),
        });
      } catch { /* non-blocking */ }
    }
    onCompleted?.(lessonId);
  }, [previewMode, lessonId, childId, totalCorrect, totalWrong, onCompleted]);

  // Find next video src for preloading
  const nextVideoSrc = lessonData.segments
    .slice(segmentIndex + 1)
    .find((s) => s.type === "video")?.type === "video"
    ? (lessonData.segments.slice(segmentIndex + 1).find((s) => s.type === "video") as { src: string })?.src
    : undefined;

  function renderContent() {
    // Video or replay phase
    if (phase === "video" || phase === "replay") {
      const videoSrc = phase === "replay"
        ? lessonData.conceptVideoUrl
        : currentSegment.type === "video" ? currentSegment.src : undefined;

      if (!videoSrc) return null;

      return (
        <VideoSegmentPlayer
          src={videoSrc}
          poster={currentSegment.type === "video" ? currentSegment.poster : undefined}
          onEnded={phase === "replay" ? endReplay : onVideoEnded}
          preloadSrc={nextVideoSrc}
        />
      );
    }

    // Transition overlay
    if (phase === "transition") {
      return (
        <HybridTransitionOverlay
          isActive
          audioUrl={lessonData.transitionAudioUrl}
          onComplete={onTransitionComplete}
        />
      );
    }

    // Interactive phase
    if (currentSegment.type !== "interactive") return null;
    const seg = currentSegment as InteractiveSegment;

    // Build a minimal InteractiveLessonData for step components
    const stepLessonData = { id: lessonData.id, title: lessonData.title, mascotVariant: seg.step.mascot.variant, steps: [seg.step] };

    // Reinforce logic
    if (needsReinforce) {
      const reinforceSegment = lessonData.segments.find(
        (s) => s.type === "interactive" && s.step.type === "reinforce"
      ) as InteractiveSegment | undefined;
      const reinforceStep = reinforceSegment?.step ?? { ...seg.step, type: "reinforce" as const };
      const stepWithActivity = { ...reinforceStep, activity: reinforceStep.activity ?? seg.step.activity };

      return (
        <>
          <LessonStepReinforce
            step={stepWithActivity}
            lessonData={stepLessonData}
            onNext={advanceSegment}
            onActivityResult={handleActivityResult}
          />
          {lessonData.conceptVideoUrl && <HybridReplayButton onClick={startReplay} />}
        </>
      );
    }

    switch (seg.step.type) {
      case "activity":
        return (
          <>
            <LessonStepActivity
              step={seg.step}
              lessonData={stepLessonData}
              onNext={advanceSegment}
              onActivityResult={handleActivityResult}
            />
            {lessonData.conceptVideoUrl && <HybridReplayButton onClick={startReplay} />}
          </>
        );
      case "celebrate":
        return (
          <LessonStepCelebrate
            step={seg.step}
            lessonData={stepLessonData}
            onNext={handleCelebrationComplete}
          />
        );
      default:
        return null;
    }
  }

  const stepKey = phase === "replay"
    ? "replay"
    : needsReinforce
      ? `reinforce-${retryCount}`
      : `${phase}-${segmentIndex}`;

  return (
    <LazyMotion features={domAnimation}>
      <div style={{ position: "fixed", inset: 0, zIndex: 999 }}>
        <InteractiveSceneBackground style={{ width: "100%", height: "100%" }}>
          {/* Header */}
          <div
            style={{
              position: "absolute", top: 0, left: 0, right: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px", zIndex: 10,
            }}
          >
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 600, opacity: 0.9, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              {lessonData.title}
            </span>
            <button
              type="button"
              onClick={() => setExitGateOpen(true)}
              aria-label="Exit lesson"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: "50%",
                border: "none", background: "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", backdropFilter: "blur(4px)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <m.div
              key={stepKey}
              variants={phase === "video" || phase === "replay" ? undefined : SWIPE_VARIANTS}
              initial={phase === "video" || phase === "replay" ? { opacity: 1 } : "initial"}
              animate={phase === "video" || phase === "replay" ? { opacity: 1 } : "animate"}
              exit={phase === "video" || phase === "replay" ? { opacity: 0 } : "exit"}
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}
            >
              {renderContent()}
            </m.div>
          </AnimatePresence>
        </InteractiveSceneBackground>
      </div>

      <ParentGateDialog
        open={exitGateOpen}
        onClose={() => setExitGateOpen(false)}
        onVerified={() => { setExitGateOpen(false); onClose(); }}
      />
    </LazyMotion>
  );
}
