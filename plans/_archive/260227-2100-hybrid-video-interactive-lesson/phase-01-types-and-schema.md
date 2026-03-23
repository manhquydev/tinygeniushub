---
phase: 1
status: pending
priority: P1
effort: 1h
---

# Phase 1: Types & Data Schema

## Context

- Existing interactive types: `src/components/interactive-lesson/interactive-lesson-types.ts`
- Existing video types: `remotion/course-demo/lesson-phase-types.ts`
- Both share mascot types from `src/components/mascot/types.ts`

## Key Insight

The hybrid schema is an ordered array of segments. Each segment is either a video URL or a reference to an interactive step config. This keeps the data declarative and easy to author.

## Files to Create

- `src/components/hybrid-lesson/hybrid-lesson-types.ts`

## Implementation

### 1. Define HybridSegment union type

```typescript
// hybrid-lesson-types.ts

import type { InteractiveLessonStep, InteractiveLessonMascotConfig } from
  "@/components/interactive-lesson/interactive-lesson-types";

/** A segment that plays a pre-rendered video */
export interface VideoSegment {
  type: "video";
  /** Phase label for progress bar display */
  phaseLabel: "hook" | "concept" | "demonstrate";
  /** URL to the video file (MP4) */
  src: string;
  /** Optional poster image for initial frame */
  poster?: string;
}

/** A segment that renders an interactive React component */
export interface InteractiveSegment {
  type: "interactive";
  /** Reuses existing InteractiveLessonStep config */
  step: InteractiveLessonStep;
}

export type HybridSegment = VideoSegment | InteractiveSegment;

export interface HybridLessonData {
  id: string;
  title: string;
  /** Ordered array: typically 1 video + 3 interactive segments */
  segments: HybridSegment[];
  /** Audio cue URL for video->interactive transition */
  transitionAudioUrl?: string;
  /** Concept video URL for "Xem lai" replay button */
  conceptVideoUrl?: string;
}
```

### 2. Rationale

- `VideoSegment` is minimal: just src + label. No mascot config needed (mascot is baked into video).
- `InteractiveSegment` wraps existing `InteractiveLessonStep` — zero duplication.
- `conceptVideoUrl` is top-level because multiple interactive segments may reference it for replay.
- Single video segment for all teaching phases (hook+concept+demonstrate concatenated) is simplest. Can split into 3 if needed later (YAGNI).

## Todo

- [ ] Create `hybrid-lesson-types.ts`
- [ ] Export from `src/components/hybrid-lesson/index.ts`

## Success Criteria

- Types compile without error
- Types are importable from other components
