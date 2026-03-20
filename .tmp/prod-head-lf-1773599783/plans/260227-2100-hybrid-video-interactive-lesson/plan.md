---
title: "Hybrid Video + Interactive Lesson Player"
description: "Combine pre-rendered video segments with interactive React activities in a single lesson flow"
status: pending
priority: P1
effort: 16h
branch: main
tags: [lesson, video, interactive, hybrid, remotion]
created: 2026-02-27
---

# Hybrid Video + Interactive Lesson Player

## Summary

Combine Remotion-rendered video segments (hook, concept, demonstrate) with existing interactive React components (activity, reinforce, celebrate) into a single lesson player. Video provides high production quality for teaching; interactive provides real engagement for practice.

**Flow:** `[Video: hook+concept+demonstrate] -> [Interactive: activity] -> [Interactive: reinforce if needed] -> [Interactive: celebrate]`

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | Types & Data Schema | pending | 1h |
| 2 | Video Player Component | pending | 3h |
| 3 | Transition Component | pending | 1h |
| 4 | Hybrid Lesson Orchestrator | pending | 4h |
| 5 | Video Splitting Pipeline | pending | 3h |
| 6 | Preview Page | pending | 2h |
| 7 | Production Workflow Doc | pending | 1h |
| 8 | Testing & Polish | pending | 1h |

## Key Dependencies

- Existing interactive step components (reused as-is)
- Remotion video pipeline (extended to output per-phase segments)
- ffmpeg (for video splitting alternative)
- Existing mascot SVG system (shared)

## Architecture Overview

```
HybridLessonFlow (orchestrator)
├── HybridLessonState (hook: useHybridLessonState)
│   manages: currentSegmentIndex, segment type routing, scores
│
├── VideoSegmentPlayer (for type: "video" segments)
│   - <video> element with preloading
│   - onEnded -> advance to next segment
│   - Reuses single <video> element (mobile autoplay compat)
│
├── TransitionOverlay (crossfade + "Đến lượt con!" audio cue)
│   - 300ms crossfade between video->interactive
│
├── [Existing] LessonStepActivity (for type: "interactive" segments)
├── [Existing] LessonStepReinforce
├── [Existing] LessonStepCelebrate
│
└── ReplayButton ("Xem lại" on activity screens)
    - Replays concept video segment
```
