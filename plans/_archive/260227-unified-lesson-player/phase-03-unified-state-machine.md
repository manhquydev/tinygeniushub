# Phase 3: Unified State Machine

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- **Depends on:** Phase 1 (types), can start parallel with Phase 2

Merge 3 state machines into `useUnifiedLessonState`.

## Context Links
- [use-interactive-lesson-state.ts](../../src/components/interactive-lesson/use-interactive-lesson-state.ts) — 66 lines
- [use-hybrid-lesson-state.ts](../../src/components/hybrid-lesson/use-hybrid-lesson-state.ts) — 128 lines
- [lesson-wizard-flow.tsx](../../src/components/lesson-wizard/lesson-wizard-flow.tsx) — inline state (lines 86-120)

## Key Insights

### State from each player to merge:

**LessonWizardFlow (VIDEO_ONLY):**
- step: 0(intro) | 1(video) | 2(quiz) | 3(upload) | 4(done)
- Watch session: sessionToken, heartbeat sequence, watchedSeconds, requiredWatchSeconds, watchReady
- Quiz: activities[], activityIndex, activityAnswerLocked, consecutiveCorrect, totalWrong
- Mascot: mascotState, mascotGazeDirection

**useInteractiveLessonState (INTERACTIVE):**
- currentStepIndex, retryCount, needsReinforce, isComplete, totalCorrect, totalWrong

**useHybridLessonState (HYBRID):**
- segmentIndex, phase (video|transition|interactive|replay), retryCount, needsReinforce, totalCorrect, totalWrong, isComplete

### Unified approach:
- Use `segmentIndex` as universal cursor (works for all modes)
- For VIDEO_ONLY: synthesize virtual segments from wizard steps
- `phase` field covers all transitions: intro, video, transition, interactive, quiz, upload, done, replay
- Watch session logic extracted to separate `useWatchSession` hook (keep VIDEO_ONLY heartbeat)

## Architecture

```typescript
type UnifiedPhase =
  | "intro"           // all modes
  | "video"           // VIDEO_ONLY (iframe), HYBRID (native video)
  | "transition"      // HYBRID only (overlay)
  | "interactive"     // INTERACTIVE steps, HYBRID interactive segments
  | "quiz"            // VIDEO_ONLY quiz
  | "upload"          // VIDEO_ONLY evidence upload
  | "replay"          // HYBRID replay concept video
  | "done";           // all modes

type LessonMode = "VIDEO_ONLY" | "HYBRID" | "INTERACTIVE";

interface UnifiedLessonState {
  mode: LessonMode;
  phase: UnifiedPhase;
  segmentIndex: number;
  retryCount: number;
  needsReinforce: boolean;
  totalCorrect: number;
  totalWrong: number;
  isComplete: boolean;
  // VIDEO_ONLY specific
  activityIndex: number;
  activityAnswerLocked: boolean;
}
```

### Mode detection function:
```typescript
function detectLessonMode(segments: LessonSegment[], videoSource?: string): LessonMode {
  if (segments.length === 0) return "VIDEO_ONLY";
  if (segments.some(s => s.type === "video")) return "HYBRID";
  return "INTERACTIVE";
}
```

## Related Code Files

### Create
- `src/components/unified-lesson/unified-lesson-types.ts` — types for UnifiedLessonState, LessonMode, UnifiedPhase, UnifiedLessonData
- `src/components/unified-lesson/use-unified-lesson-state.ts` — merged state machine hook (<200 lines)
- `src/components/unified-lesson/use-watch-session.ts` — extracted watch session/heartbeat logic from wizard (~80 lines)

### Reuse (no changes)
- `src/components/interactive-lesson/interactive-lesson-types.ts` — InteractiveLessonStep type reused inside stepConfig

## Implementation Steps

1. Create `src/components/unified-lesson/unified-lesson-types.ts`
   - Define UnifiedPhase, LessonMode, UnifiedLessonState
   - Define UnifiedLessonData (lesson + segments + activities)
   - Define UnifiedSegment type (union of video/interactive, matches DB LessonSegment)
   - `detectLessonMode()` function

2. Create `src/components/unified-lesson/use-watch-session.ts`
   - Extract watch session logic from lesson-wizard-flow.tsx lines 108-209
   - `useWatchSession(lessonId, childId, watchRequired)` returns:
     - startSession, sendHeartbeat, markWatched
     - watchReady, watchedSeconds, requiredWatchSeconds, watchProgressPercentage
     - loading states

3. Create `src/components/unified-lesson/use-unified-lesson-state.ts`
   - Accept `UnifiedLessonData` as input
   - Auto-detect mode via `detectLessonMode`
   - State transitions:
     - **VIDEO_ONLY:** intro -> video -> quiz -> upload -> done
     - **HYBRID:** intro -> [video -> transition -> interactive]* -> done
     - **INTERACTIVE:** intro -> [hook -> concept -> demonstrate -> activity -> celebrate] -> done
   - Expose: phase, currentSegment, advanceSegment, handleActivityResult, startReplay, endReplay, reset
   - Keep retry/reinforce logic from interactive/hybrid states
   - Keep consecutive correct streak logic from wizard

## TODO

- [ ] Create unified-lesson-types.ts with all type definitions
- [ ] Create use-watch-session.ts extracted from wizard
- [ ] Create use-unified-lesson-state.ts with merged logic
- [ ] Unit test mode detection
- [ ] Unit test phase transitions for each mode
- [ ] Verify <200 lines per file

## Success Criteria
- Mode auto-detected correctly from data shape
- VIDEO_ONLY phase flow matches current wizard behavior
- HYBRID phase flow matches current hybrid behavior
- INTERACTIVE phase flow matches current interactive behavior
- Watch session heartbeat works for VIDEO_ONLY
- Each file <200 lines

## Risk Assessment
- **Risk:** Subtle behavior differences between players — Mitigation: map every wizard feature (mascot states, timers, confetti, sound effects) to unified equivalents
- **Risk:** Inactivity detection — Mitigation: keep 30s bored mascot logic from wizard
