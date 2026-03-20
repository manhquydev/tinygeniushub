# Brainstorm: Unified Lesson Player — Video + Interactive

**Date:** 2026-02-27
**Status:** Agreed

---

## Problem Statement

3 parallel lesson players exist (LessonWizard production, Interactive demo, Hybrid preview). Need to unify into 1 flexible player that supports video teaching → interactive practice. Research shows video+interactive significantly outperforms passive video for 3-8 year olds.

## Decisions Made

| Decision | Choice |
|----------|--------|
| Goal | Unify all 3 players into 1 |
| Mode detection | Auto-detect from data (video-only / interactive / hybrid) |
| Video source | Remotion self-render |
| Data storage | Database (Prisma) with LessonSegment table |
| Video length | 3-5 min optimal for ages 3-8 |
| Migration | Big bang — existing lessons get 0 segments → VIDEO_ONLY mode |

## Architecture

### DB Schema Changes

```prisma
model LessonSegment {
  id         String    @id @default(cuid())
  lessonId   String
  orderNo    Int
  type       String    // "video" | "interactive"
  videoUrl   String?
  poster     String?
  phaseLabel String?   // "hook" | "concept" | "demonstrate"
  stepType   String?   // "hook" | "concept" | "demonstrate" | "activity" | "reinforce" | "celebrate"
  stepConfig Json?     // mascot config, speech, keyword, subtext, audioUrl, autoAdvanceMs
  activityId String?   // FK to existing Activity model (for quiz spec)
  lesson     Lesson    @relation(...)
  activity   Activity? @relation(...)
  @@unique([lessonId, orderNo])
  @@index([lessonId])
}

// Lesson model additions:
+  segments           LessonSegment[]
+  conceptVideoUrl    String?
+  transitionAudioUrl String?
```

### Flow Detection Logic

```
segments.length === 0 && videoSource → VIDEO_ONLY (backward compat, iframe)
segments.some(s => s.type === "video") → HYBRID (video + interactive)
segments.length > 0 && all interactive → INTERACTIVE
```

### Component Structure

```
UnifiedLessonFlow (replaces LessonWizardFlow, InteractiveLessonFlow, HybridLessonFlow)
├─ useUnifiedLessonState (merged state machine)
├─ VideoSegmentPlayer (from hybrid — reuses <video> element)
├─ VideoOnlyPlayer (iframe embed for backward compat)
├─ HybridTransitionOverlay ("Đến lượt con!")
├─ LessonStepHook / Concept / Demonstrate (from interactive — for INTERACTIVE mode)
├─ LessonStepActivity (from interactive — reused by all modes)
├─ LessonStepReinforce
├─ LessonStepCelebrate
├─ LessonIntroStep (from wizard — objective + start button)
├─ EvidenceUploadPanel (keep from wizard, optional per lesson)
├─ HybridReplayButton ("Xem lại")
└─ ParentGateDialog (shared)
```

### Lesson Flow by Mode

**VIDEO_ONLY** (backward compat):
```
Intro → Watch iframe video (heartbeat tracking) → Quiz (3 activities) → Done
```

**HYBRID** (new default):
```
Intro → Video teaching (3-5 min) → Transition → Activity → [Reinforce if wrong] → Celebrate → Done
```

**INTERACTIVE** (no video):
```
Hook → Concept → Demonstrate → Activity → [Reinforce] → Celebrate → Done
```

### Migration Strategy: Big Bang

1. Add `LessonSegment` table + new fields to `Lesson`
2. Existing lessons: 0 segments + existing `videoSource` → VIDEO_ONLY mode auto-detected
3. Replace `CourseLessonsPlayer` to use `UnifiedLessonFlow`
4. Delete old `LessonWizardFlow`, `InteractiveLessonFlow`, `HybridLessonFlow` after migration
5. New lessons created with segments → HYBRID or INTERACTIVE mode

### Data Loading

```typescript
// API: GET /api/lessons/:id/full
{
  ...lesson,
  segments: LessonSegment[] (ordered by orderNo),
  activities: Activity[] (for VIDEO_ONLY backward compat)
}
```

Unified component fetches this on mount, auto-detects mode, renders appropriate flow.

## Research Highlights (from researcher agent)

- Video+interactive >> pure video for retention (eliminates "video deficit effect")
- 3-5 min max video before interaction for ages 3-8
- Same mascot character must bridge video→exercise (narrative continuity)
- Voiced transition "Đến lượt con!" — never text-only
- First exercise always easy (confidence building)
- 60px min tap targets, audio-first instructions
- Progress shown as path/map, not percentage bar
- Stars + mascot celebration = most effective reward combo

## Risks

| Risk | Mitigation |
|------|-----------|
| LessonWizard features lost during migration | Map every wizard feature to unified equivalent before coding |
| Video heartbeat tracking regression | Keep watch session API, integrate into VideoSegmentPlayer |
| Mobile autoplay | Already solved in VideoSegmentPlayer (tap-to-play overlay) |
| 919-line wizard file complexity | Modularize into <200 line files during rewrite |
| Evidence upload flow | Keep as optional segment type or post-lesson modal |

## Effort Estimate

| Phase | Effort |
|-------|--------|
| DB schema + migration | 4h |
| Unified state machine | 6h |
| Unified flow component | 8h |
| Video-only backward compat | 4h |
| API endpoints | 4h |
| Admin CMS for segments | 8h |
| Migration script (existing lessons) | 3h |
| Testing + polish | 3h |
| **Total** | **~40h** |

## Success Metrics

1. All existing lessons play identically in unified player (zero regression)
2. New hybrid lessons play video → interactive seamlessly
3. Quiz accuracy higher in hybrid vs video-only (A/B test)
4. Mobile: 0 autoplay failures after first tap
5. Single codebase to maintain instead of 3

## Next Steps

1. Create detailed implementation plan with phases
2. Start with DB schema + migration
3. Build unified state machine
4. Build unified flow component
5. Wire up admin CMS for segment management
