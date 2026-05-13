"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { ParentGateDialog } from "@/components/parent-gate-dialog";
import { InteractiveSceneBackground } from "./interactive-scene-background";
import { useInteractiveLessonState } from "./use-interactive-lesson-state";
import type { InteractiveLessonData } from "./interactive-lesson-types";

// Step components — implemented in phases 1–3
import { LessonStepHook } from "./lesson-step-hook";
import { LessonStepConcept } from "./lesson-step-concept";
import { LessonStepDemonstrate } from "./lesson-step-demonstrate";
import { LessonStepActivity } from "./lesson-step-activity";
import { LessonStepReinforce } from "./lesson-step-reinforce";
import { LessonStepCelebrate } from "./lesson-step-celebrate";

interface InteractiveLessonFlowProps {
  lessonData: InteractiveLessonData;
  childId: string;
  lessonId: string;
  onCompleted?: (lessonId: string) => void;
  onClose: () => void;
  previewMode?: boolean;
}

// Slide-left animation variants for step transitions
const SWIPE_VARIANTS = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" as const } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2, ease: "easeIn" as const } },
};

export function InteractiveLessonFlow({
  lessonData,
  childId,
  lessonId,
  onCompleted,
  onClose,
  previewMode = false,
}: InteractiveLessonFlowProps) {
  const [exitGateOpen, setExitGateOpen] = useState(false);

  const state = useInteractiveLessonState(lessonData.steps);
  const { currentStep, needsReinforce, totalCorrect, totalWrong, advanceStep, handleActivityResult } = state;

  // Call completion API then fire onCompleted callback
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
            minutesLearned: 3,
            checklist: ["interactive_done"],
            useExtendedRetention: true,
          }),
        });
      } catch {
        // Non-blocking — completion tracking failure should not block UX
      }
    }

    onCompleted?.(lessonId);
  }, [previewMode, lessonId, childId, totalCorrect, totalWrong, onCompleted]);

  // Resolve which step component to render
  function renderStep() {
    // If child needs reinforcement after a wrong answer, show reinforce step
    if (needsReinforce) {
      const reinforceStep = lessonData.steps.find((s) => s.type === "reinforce");
      // Get activity data from the activity step to reuse in reinforce
      const activityStep = lessonData.steps.find((s) => s.type === "activity");
      const stepWithActivity = reinforceStep
        ? { ...reinforceStep, activity: reinforceStep.activity ?? activityStep?.activity }
        : activityStep;
      if (stepWithActivity) {
        return (
          <LessonStepReinforce
            step={stepWithActivity}
            lessonData={lessonData}
            onNext={advanceStep}
            onActivityResult={handleActivityResult}
          />
        );
      }
    }

    switch (currentStep.type) {
      case "hook":
        return <LessonStepHook step={currentStep} lessonData={lessonData} onNext={advanceStep} />;
      case "concept":
        return <LessonStepConcept step={currentStep} lessonData={lessonData} onNext={advanceStep} />;
      case "demonstrate":
        return <LessonStepDemonstrate step={currentStep} lessonData={lessonData} onNext={advanceStep} />;
      case "activity":
        return (
          <LessonStepActivity
            step={currentStep}
            lessonData={lessonData}
            onNext={advanceStep}
            onActivityResult={handleActivityResult}
          />
        );
      case "reinforce":
        return (
          <LessonStepReinforce
            step={currentStep}
            lessonData={lessonData}
            onNext={advanceStep}
            onActivityResult={handleActivityResult}
          />
        );
      case "celebrate":
        return (
          <LessonStepCelebrate
            step={currentStep}
            lessonData={lessonData}
            onNext={handleCelebrationComplete}
          />
        );
      default:
        return null;
    }
  }

  // Use step type + index as key so AnimatePresence detects step changes
  const stepKey = needsReinforce
    ? `reinforce-retry-${state.retryCount}`
    : `${currentStep.type}-${state.currentStepIndex}`;

  return (
    <LazyMotion features={domAnimation}>
      {/* Full-screen overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
        }}
      >
        <InteractiveSceneBackground style={{ width: "100%", height: "100%" }}>
          {/* Header bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              zIndex: 10,
            }}
          >
            {/* Lesson title */}
            <span
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                opacity: 0.9,
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {lessonData.title}
            </span>

            {/* Exit button — guarded by ParentGateDialog */}
            <button
              type="button"
              onClick={() => setExitGateOpen(true)}
              aria-label="Exit lesson"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Step area */}
          <AnimatePresence mode="wait">
            <m.div
              key={stepKey}
              variants={SWIPE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              {renderStep()}
            </m.div>
          </AnimatePresence>
        </InteractiveSceneBackground>
      </div>

      {/* Parent gate — only shown when exit is requested */}
      <ParentGateDialog
        open={exitGateOpen}
        onClose={() => setExitGateOpen(false)}
        onVerified={() => {
          setExitGateOpen(false);
          onClose();
        }}
      />
    </LazyMotion>
  );
}
