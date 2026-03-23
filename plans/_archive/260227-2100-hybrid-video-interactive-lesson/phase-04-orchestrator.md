---
phase: 4
status: pending
priority: P1
effort: 4h
---

# Phase 4: Hybrid Lesson Orchestrator

## Context

- Mirrors `interactive-lesson-flow.tsx` structure but routes between video and interactive segments
- Reuses existing step components (LessonStepActivity, LessonStepReinforce, LessonStepCelebrate)
- Adds "Xem lai" (replay) button on activity screens

## Files to Create

- `src/components/hybrid-lesson/hybrid-lesson-flow.tsx` — main orchestrator (~180 lines)
- `src/components/hybrid-lesson/use-hybrid-lesson-state.ts` — state machine (~80 lines)
- `src/components/hybrid-lesson/hybrid-replay-button.tsx` — "Xem lai" button (~50 lines)
- `src/components/hybrid-lesson/index.ts` — barrel export

## Implementation

### 1. useHybridLessonState hook

```
State:
  currentSegmentIndex: number
  phase: "video" | "transition" | "interactive" | "replay"
  needsReinforce: boolean
  retryCount: number
  totalCorrect: number
  totalWrong: number
  isComplete: boolean

Actions:
  advanceSegment() — move to next segment (skip reinforce if not needed)
  startTransition() — enter transition phase
  endTransition() — enter interactive phase
  startReplay() — switch to replay mode
  endReplay() — return to interactive
  handleActivityResult(correct: boolean) — same logic as existing
```

### 2. HybridLessonFlow component

```
Structure:
  <LazyMotion>
    <div fixed-overlay>
      <InteractiveSceneBackground>  // reuse existing
        <Header: title + exit button>  // same as interactive-lesson-flow

        // Route based on current segment type + phase
        if phase === "video" || phase === "replay":
          <VideoSegmentPlayer>
        elif phase === "transition":
          <HybridTransitionOverlay>
        elif phase === "interactive":
          <AnimatePresence>
            switch segment.step.type:
              "activity" -> <LessonStepActivity> + <HybridReplayButton>
              "reinforce" -> <LessonStepReinforce>
              "celebrate" -> <LessonStepCelebrate>
          </AnimatePresence>
      </InteractiveSceneBackground>
    </div>
    <ParentGateDialog>
  </LazyMotion>

Key behaviors:
  - Video segment ends -> start transition (if next is interactive) or advance
  - Transition ends -> show interactive segment
  - Activity completes -> advance (handles reinforce via existing logic)
  - "Xem lai" button -> replay concept video, then return to activity
```

### 3. HybridReplayButton

```
Simple button: owl icon + "Xem lai"
Position: top-right of activity screen
onClick -> triggers startReplay() in state
```

### 4. Completion API

Same as existing: POST `/api/lessons/{id}/complete` with scores.

## Related Code (reuse directly)

- `src/components/interactive-lesson/interactive-scene-background.tsx`
- `src/components/interactive-lesson/lesson-step-activity.tsx`
- `src/components/interactive-lesson/lesson-step-reinforce.tsx`
- `src/components/interactive-lesson/lesson-step-celebrate.tsx`
- `src/components/parent-gate-dialog.tsx`

## Todo

- [ ] Create `use-hybrid-lesson-state.ts`
- [ ] Create `hybrid-lesson-flow.tsx`
- [ ] Create `hybrid-replay-button.tsx`
- [ ] Create `index.ts` barrel export
- [ ] Wire up completion API call
- [ ] Test full flow: video -> transition -> activity -> celebrate

## Success Criteria

- Full lesson plays through: video teaching -> interactive practice -> celebration
- "Xem lai" replays concept video and returns to activity
- Reinforce logic works (wrong answer -> reinforce -> retry)
- Exit button triggers parent gate (same as interactive)
- Completion API called on celebrate finish
