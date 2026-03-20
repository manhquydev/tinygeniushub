# Phase 3: Step Components

## Context

- [Types](./phase-01-core-types-and-data.md)
- [Visual Components](./phase-02-visual-components.md)
- [ActivityRenderer](../../src/components/lesson-wizard/activity-renderer.tsx)
- [Mascot](../../src/components/mascot/Mascot.tsx)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 1.5 hours

Build the 6 step components that compose the interactive lesson flow. Each renders one step type.

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/interactive-lesson/lesson-step-hook.tsx` | Greeting step | ~80 |
| `src/components/interactive-lesson/lesson-step-concept.tsx` | Teach keyword step | ~100 |
| `src/components/interactive-lesson/lesson-step-demonstrate.tsx` | Show examples step | ~120 |
| `src/components/interactive-lesson/lesson-step-activity.tsx` | Interactive quiz step | ~100 |
| `src/components/interactive-lesson/lesson-step-reinforce.tsx` | Retry concept step | ~100 |
| `src/components/interactive-lesson/lesson-step-celebrate.tsx` | Celebration step | ~80 |

## Shared Props Pattern

All step components receive:

```ts
interface StepProps {
  step: InteractiveLessonStep;
  lessonData: InteractiveLessonData;
  onNext: () => void;          // advance to next step
  onActivityResult?: (correct: boolean) => void; // for activity/reinforce
}
```

## Implementation Steps

### 1. lesson-step-hook.tsx

- Mascot slides in from bottom (Framer Motion)
- `InteractiveSpeechBubble` shows step.speech ("Chào con!")
- Large "Bắt đầu" button pulses
- On button click -> `onNext()`
- No audio (or optional welcome audio)

### 2. lesson-step-concept.tsx

- `Mascot` displayed at 50% viewport height, state from step.mascot
- `InteractiveKeywordDisplay` shows step.keyword large
- `InteractiveSpeechBubble` shows step.speech
- `AudioPlayer` plays step.audioUrl
- On audio end + 2s delay OR tap "Tiếp tục" button -> `onNext()`
- Track audio state: playing/ended

### 3. lesson-step-demonstrate.tsx

- `Mascot` at side, smaller
- `InteractiveKeywordCards` shows step.keywords one at a time
- Auto-reveal cards on timer (1.5s each) synced to audio
- Mascot state transitions: curious > happy > proud (as cards reveal)
- `AudioPlayer` narrates
- After all cards + audio end -> show "Tiếp tục" button -> `onNext()`

### 4. lesson-step-activity.tsx

- `Mascot` at top, watching (idle state)
- Import and render `ActivityRenderer` from lesson-wizard
- Pass step.activity as the activity row
- On correct answer -> `onActivityResult(true)` -> `onNext()` after delay
- On wrong answer -> `onActivityResult(false)`
- Mascot reacts: correct=happy, wrong=nervous
- Use same answer handling pattern from lesson-wizard-flow (sound effects, mascot state)

### 5. lesson-step-reinforce.tsx

- Similar to concept step but briefer
- `InteractiveKeywordDisplay` shows keyword again
- `InteractiveSpeechBubble` "Nhớ lại nào!"
- After brief review (audio or 3s) -> show activity again
- Render `ActivityRenderer` with same activity spec
- On correct -> `onNext()`
- On wrong (3rd attempt) -> auto-advance with encouraging message

### 6. lesson-step-celebrate.tsx

- `Mascot` celebrating state, large
- `InteractiveCelebration` fires confetti
- `InteractiveSpeechBubble` "Giỏi lắm!"
- `synth.playYay()` sound effect
- Auto-advance after `step.autoAdvanceMs` (default 3000ms)
- Call `onNext()` on auto-advance

## Key Patterns to Follow

From lesson-wizard-flow.tsx:
- `synth.playPop()`, `synth.playTing()`, `synth.playBzz()`, `synth.playYay()` for sounds
- `setMascotStateForDuration(state, ms)` pattern for temporary mascot reactions
- `AnimatePresence mode="wait"` + `swipeLeft` variants for step transitions
- `useReducedMotion()` check before animations
- `canvas-confetti` for celebration effects

## Todo

- [ ] Create `lesson-step-hook.tsx`
- [ ] Create `lesson-step-concept.tsx`
- [ ] Create `lesson-step-demonstrate.tsx`
- [ ] Create `lesson-step-activity.tsx`
- [ ] Create `lesson-step-reinforce.tsx`
- [ ] Create `lesson-step-celebrate.tsx`
- [ ] Verify all compile

## Success Criteria

- Each step component renders independently
- Activity step correctly wraps `ActivityRenderer`
- Sound effects and mascot reactions match lesson-wizard patterns
- All animations respect reduced motion preference
