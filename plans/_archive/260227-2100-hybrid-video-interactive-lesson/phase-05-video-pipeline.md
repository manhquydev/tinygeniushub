---
phase: 5
status: pending
priority: P2
effort: 3h
---

# Phase 5: Video Splitting Pipeline

## Context

- Current pipeline renders full lesson as single MP4 via Remotion
- Hybrid system needs only the teaching phases (hook+concept+demonstrate) as video
- Two approaches: (A) render separate Remotion compositions per phase, (B) render full video then split with ffmpeg
- **Chosen: Option A** — render only teaching phases as a single "teaching segment" video

## Files to Modify

- `scripts/video-pipeline/compose-video.ts` — add hybrid mode
- `remotion/course-demo/lesson-phase-types.ts` — no change needed

## Files to Create

- `scripts/video-pipeline/render-hybrid-segment.ts` — renders teaching-only video
- `scripts/video-pipeline/generate-hybrid-lesson-data.ts` — outputs HybridLessonData JSON

## Implementation

### 1. render-hybrid-segment.ts (~100 lines)

```
Input: lesson data JSON (same as existing LessonVideoDataV2)
Process:
  1. Filter phases to only hook, concept, demonstrate
  2. Render via Remotion (reuse LessonVideoTemplateV2 with filtered phases)
  3. Output MP4 to out/hybrid/{lessonId}/teaching.mp4
  4. Generate poster image (first frame) to out/hybrid/{lessonId}/poster.jpg

Uses existing Remotion rendering infrastructure.
```

### 2. generate-hybrid-lesson-data.ts (~80 lines)

```
Input:
  - Video lesson data (LessonVideoDataV2) — for teaching phases metadata
  - Interactive lesson data (InteractiveLessonData) — for activity/reinforce/celebrate steps
  - Video URL (from CDN upload)

Output: HybridLessonData JSON
  {
    id, title,
    segments: [
      { type: "video", phaseLabel: "hook", src: videoUrl, poster },
      { type: "interactive", step: activityStep },
      { type: "interactive", step: celebrateStep },
    ],
    conceptVideoUrl: videoUrl,
    transitionAudioUrl: "/audio/den-luot-con.mp3"
  }

Merges video + interactive data into single hybrid schema.
```

### 3. Production workflow

```
1. Author video lesson data (phases: hook, concept, demonstrate)
2. Author interactive lesson data (steps: activity, reinforce, celebrate)
3. Run: pnpm hybrid:render --lesson {id}
   -> Renders teaching video
   -> Uploads to CDN
   -> Generates HybridLessonData JSON
4. Store JSON in DB or static file
```

## Todo

- [ ] Create `render-hybrid-segment.ts`
- [ ] Create `generate-hybrid-lesson-data.ts`
- [ ] Add `hybrid:render` script to package.json
- [ ] Test with existing lesson data
- [ ] Verify video contains only teaching phases

## Success Criteria

- Teaching-only video renders correctly (hook+concept+demonstrate only)
- HybridLessonData JSON is valid and matches schema
- Pipeline is scriptable (single command)
