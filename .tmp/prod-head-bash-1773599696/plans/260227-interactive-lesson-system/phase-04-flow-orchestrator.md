# Phase 4: Flow Orchestrator

## Context

- [Step Components](./phase-03-step-components.md)
- [lesson-wizard-flow.tsx](../../src/components/lesson-wizard/lesson-wizard-flow.tsx) — state machine pattern

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 1 hour

Build the main `InteractiveLessonFlow` component — a step machine that orchestrates the 6 step components.

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/interactive-lesson/interactive-lesson-flow.tsx` | Main orchestrator | ~180 |
| `src/components/interactive-lesson/use-interactive-lesson-state.ts` | State management hook | ~120 |

## Architecture

```
InteractiveLessonFlow
  ├── State: { currentStepIndex, retryCount, score, audioPlaying }
  ├── Step resolution: steps[currentStepIndex] -> render correct step component
  ├── Reinforce logic: if activity wrong & retryCount < 3 -> insert reinforce step
  ├── Completion: after celebrate step -> call onCompleted callback
  └── Audio sync: AudioPlayer per step, onEnd triggers auto-advance timer
```

## Implementation Steps

### 1. use-interactive-lesson-state.ts

Custom hook managing lesson flow state:

```ts
interface InteractiveLessonState {
  currentStepIndex: number;
  retryCount: number;
  needsReinforce: boolean;
  isComplete: boolean;
  totalCorrect: number;
  totalWrong: number;
}

function useInteractiveLessonState(steps: InteractiveLessonStep[]) {
  // State machine:
  // - advanceStep(): move to next step in sequence
  // - handleActivityResult(correct): update score, set needsReinforce if wrong
  // - skipToStep(type): jump to specific step type
  // - reset(): restart lesson

  // Reinforce logic:
  // After activity step, if result is wrong and retryCount < 3:
  //   -> set needsReinforce = true
  //   -> next step renders reinforce instead of celebrate
  // After reinforce activity, if correct or retryCount >= 3:
  //   -> advance to celebrate
}
```

### 2. interactive-lesson-flow.tsx

Main component:

```tsx
interface InteractiveLessonFlowProps {
  lessonData: InteractiveLessonData;
  childId: string;
  lessonId: string;
  onCompleted?: (lessonId: string) => void;
  onClose: () => void;
}

export function InteractiveLessonFlow({ lessonData, childId, lessonId, onCompleted, onClose }: Props) {
  const state = useInteractiveLessonState(lessonData.steps);
  const prefersReducedMotion = useReducedMotion();

  // Resolve current step
  const currentStep = lessonData.steps[state.currentStepIndex];

  // If needsReinforce, override to show reinforce step
  // If celebrate step reached, call completion API

  // Render:
  // - InteractiveSceneBackground (always visible)
  // - Header with exit button + lesson title (same pattern as lesson-wizard)
  // - AnimatePresence for step transitions
  // - Current step component based on currentStep.type
  // - ParentGateDialog for exit confirmation
}
```

### Key Behaviors

1. **Step transitions**: `AnimatePresence mode="wait"` with slide animation
2. **Audio sync**: Each step component manages its own AudioPlayer; calls `onNext` when ready
3. **Reinforce insertion**: State hook detects wrong answer at activity step, redirects to reinforce step before celebrate
4. **Completion API call**: Same pattern as lesson-wizard-flow `markCompleted()`:
   ```ts
   await fetch(`/api/lessons/${lessonId}/complete`, {
     method: "POST",
     body: JSON.stringify({ childId, quizScore, minutesLearned, checklist: ["interactive_done"], useExtendedRetention: true }),
   });
   ```
5. **Exit gate**: Reuse `ParentGateDialog` component

### State Flow Diagram

```
hook -> concept -> demonstrate -> activity
                                     |
                              correct? ──yes──> celebrate -> onCompleted
                                     |
                              wrong (retry<3)? ──> reinforce -> activity (retry)
                                     |
                              wrong (retry>=3)? ──> celebrate (auto-pass)
```

## Todo

- [x] Create `use-interactive-lesson-state.ts`
- [x] Create `interactive-lesson-flow.tsx`
- [x] Wire up completion API call
- [x] Wire up ParentGateDialog exit flow
- [x] Verify compile

## Success Criteria

- Full lesson flow works: hook > concept > demonstrate > activity > celebrate
- Reinforce step triggers on wrong answers
- Max 3 retries before auto-advance
- Completion API called on celebrate
- Exit gate prevents accidental close
