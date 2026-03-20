# Phase 4: Unified Flow Component

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 8h
- **Depends on:** Phase 3

Build `UnifiedLessonFlow` component that replaces all 3 players, modularized into <200 line files.

## Context Links
- [lesson-wizard-flow.tsx](../../src/components/lesson-wizard/lesson-wizard-flow.tsx) — 919 lines, the main target to decompose
- [hybrid-lesson-flow.tsx](../../src/components/hybrid-lesson/hybrid-lesson-flow.tsx) — 223 lines
- [interactive-lesson-flow.tsx](../../src/components/interactive-lesson/interactive-lesson-flow.tsx) — 228 lines

## Key Insights
- Wizard has: space background (stars/nebula), mascot with gaze tracking, quiz with multiple activity types, evidence upload, confetti celebrations
- Hybrid has: InteractiveSceneBackground, video player, transition overlay, replay button
- Interactive has: same InteractiveSceneBackground, step components
- UnifiedLessonFlow must support ALL visual treatments depending on mode
- VIDEO_ONLY mode keeps wizard's space background aesthetic
- HYBRID/INTERACTIVE modes keep InteractiveSceneBackground

## Architecture

### Component tree:
```
UnifiedLessonFlow (orchestrator, <200 lines)
├── UnifiedLessonHeader (exit button, title, time pill)
├── per-phase rendering:
│   ├── UnifiedLessonIntroStep (objective + start button, mascot)
│   ├── UnifiedLessonVideoOnlyPlayer (iframe + heartbeat progress, for VIDEO_ONLY)
│   ├── VideoSegmentPlayer (reuse from hybrid, for HYBRID)
│   ├── HybridTransitionOverlay (reuse from hybrid)
│   ├── LessonStepHook/Concept/Demonstrate (reuse from interactive)
│   ├── LessonStepActivity (reuse from interactive)
│   ├── LessonStepReinforce (reuse from interactive)
│   ├── LessonStepCelebrate (reuse from interactive)
│   ├── UnifiedLessonQuizStep (VIDEO_ONLY quiz with ActivityRenderer)
│   ├── UnifiedLessonUploadStep (evidence upload)
│   └── UnifiedLessonDoneStep (celebration screen)
├── HybridReplayButton (reuse from hybrid, shown in HYBRID mode)
└── ParentGateDialog (shared)
```

### Background logic:
- VIDEO_ONLY: wizard space background (stars, nebulae) — extract to `unified-lesson-space-background.tsx`
- HYBRID/INTERACTIVE: `InteractiveSceneBackground` (reuse as-is)

## Related Code Files

### Create
- `src/components/unified-lesson/unified-lesson-flow.tsx` — main orchestrator (<200 lines)
- `src/components/unified-lesson/unified-lesson-header.tsx` — header bar with exit/title (~60 lines)
- `src/components/unified-lesson/unified-lesson-intro-step.tsx` — intro/objective screen (~80 lines)
- `src/components/unified-lesson/unified-lesson-video-only-player.tsx` — iframe video + progress bar + heartbeat (~120 lines)
- `src/components/unified-lesson/unified-lesson-quiz-step.tsx` — quiz step with ActivityRenderer (~150 lines)
- `src/components/unified-lesson/unified-lesson-upload-step.tsx` — evidence upload (~60 lines)
- `src/components/unified-lesson/unified-lesson-done-step.tsx` — celebration/done screen (~80 lines)
- `src/components/unified-lesson/unified-lesson-space-background.tsx` — space stars/nebula extracted from wizard (~60 lines)
- `src/components/unified-lesson/unified-lesson-mascot-controller.tsx` — mascot state/gaze logic extracted (~80 lines)
- `src/components/unified-lesson/index.ts` — barrel export

### Reuse (no changes needed)
- `src/components/hybrid-lesson/video-segment-player.tsx`
- `src/components/hybrid-lesson/hybrid-transition-overlay.tsx`
- `src/components/hybrid-lesson/hybrid-replay-button.tsx`
- `src/components/interactive-lesson/lesson-step-hook.tsx`
- `src/components/interactive-lesson/lesson-step-concept.tsx`
- `src/components/interactive-lesson/lesson-step-demonstrate.tsx`
- `src/components/interactive-lesson/lesson-step-activity.tsx`
- `src/components/interactive-lesson/lesson-step-reinforce.tsx`
- `src/components/interactive-lesson/lesson-step-celebrate.tsx`
- `src/components/interactive-lesson/interactive-scene-background.tsx`
- `src/components/lesson-wizard/activity-renderer.tsx`
- `src/components/evidence-upload-panel.tsx`
- `src/components/parent-gate-dialog.tsx`
- `src/components/animation/kid-mascot.tsx`
- `src/lib/audio-utils.ts` (synth.playPop, playTing, playBzz, playYay)

## Implementation Steps

1. Create `unified-lesson-space-background.tsx`
   - Extract `LESSON_SPACE_STARS` constant and star/nebula JSX from wizard lines 50-60, 627-645

2. Create `unified-lesson-header.tsx`
   - Consolidate header from wizard (lines 648-666) and hybrid/interactive (inline styles)
   - Props: title, estimatedMinutes, onExitRequest

3. Create `unified-lesson-intro-step.tsx`
   - Extract intro panel from wizard lines 670-706
   - Props: title, objective, mascotState, onStart

4. Create `unified-lesson-video-only-player.tsx`
   - Extract video step from wizard lines 709-759
   - Integrate `useWatchSession` hook
   - Props: videoSource, lessonId, childId, onComplete

5. Create `unified-lesson-quiz-step.tsx`
   - Extract quiz step from wizard lines 762-843
   - Uses ActivityRenderer for real activities, falls back to LESSON_QUIZ_CHOICES
   - Props: lessonId, activities, onActivityAnswer, mascotState, etc.

6. Create `unified-lesson-upload-step.tsx`
   - Extract upload from wizard lines 845-873
   - Props: childId, lessonId, onFinish

7. Create `unified-lesson-done-step.tsx`
   - Extract done panel from wizard lines 875-906
   - Props: onClose

8. Create `unified-lesson-mascot-controller.tsx`
   - Extract mascot state logic (timers, gaze, boredom detection) from wizard
   - Hook: `useMascotController()` returns mascotState, mascotGaze, handlers

9. Create `unified-lesson-flow.tsx` (main orchestrator)
   - Accept `UnifiedLessonFlowProps`: childId, lessonId, lessonData (from API), onClose, onCompleted, previewMode
   - Call `useUnifiedLessonState(lessonData)`
   - Call `useWatchSession(...)` if VIDEO_ONLY
   - Call `useMascotController()` for mascot states
   - Render correct background based on mode
   - Render correct phase component based on state.phase
   - Wire up completion API call
   - AnimatePresence for transitions

10. Create `index.ts` barrel export

## TODO

- [ ] Extract space background from wizard
- [ ] Create header component
- [ ] Create intro step
- [ ] Create video-only player with heartbeat
- [ ] Create quiz step with ActivityRenderer
- [ ] Create upload step
- [ ] Create done step
- [ ] Create mascot controller hook
- [ ] Create main unified-lesson-flow orchestrator
- [ ] Create index.ts barrel export
- [ ] Verify all files <200 lines
- [ ] Test VIDEO_ONLY mode matches wizard behavior exactly
- [ ] Test HYBRID mode matches hybrid behavior exactly
- [ ] Test INTERACTIVE mode matches interactive behavior exactly

## Success Criteria
- All 3 modes render correctly
- Space background for VIDEO_ONLY, scene background for HYBRID/INTERACTIVE
- Mascot gaze, confetti, sound effects all work
- Every file <200 lines
- No visual regressions from existing players

## Risk Assessment
- **Risk:** Wizard has 919 lines of tightly coupled state+UI — Mitigation: systematic extraction, test each piece
- **Risk:** Animation/transition differences between modes — Mitigation: keep mode-specific animation variants
- **Risk:** Evidence upload flow might break — Mitigation: keep as optional step, same dynamic import pattern
