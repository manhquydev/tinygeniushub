---
title: "Mascot Video Readiness"
description: "Fix expressions, add gestures/props, timeline mode, Remotion pipeline for video production"
status: complete
priority: P1
effort: 40h
branch: main
tags: [mascot, animation, video, remotion]
created: 2026-02-26
---

# Mascot Video Readiness

## Goal

Transform existing mascot system from web-only loop animations into video-production-ready components with distinct expressions, educational gestures, timeline sequencing, and Remotion MP4 rendering.

## Phase Summary

| Phase | Description | Effort | Priority | Status | Dependencies |
|-------|------------|--------|----------|--------|-------------|
| A | Fix duplicate expressions + new eye/beak variants | 4h | P0 | complete | none |
| B | Add gesture system (7 gestures) | 6h | P0 | complete | none |
| C | Add 6 educational action props | 5h | P1 | complete | none |
| D | Timeline/sequence animation mode | 5h | P1 | complete | A, B, C |
| E | Character personality animations | 4h | P2 | complete | A |
| F | Per-character prop positioning | 2h | P1 | complete | none |
| G | Remotion setup + compositions | 6h | P1 | complete | D |
| H | AI pipeline (TTS, Veo, Lyria) | 8h | P2 | complete | G |

## Dependency Graph

```
A (fix expressions) ──┐
B (gestures)       ────┼──→ D (timeline) ──→ G (Remotion) ──→ H (AI pipeline)
C (props)          ────┘         │
F (prop positioning) ───────────┘
E (personality) ── standalone after A
```

Phases A+B+C+F can run in parallel.

## Key Decisions

- **Hybrid video pipeline**: Remotion for SVG-to-MP4, AI (Veo/Gemini) for backgrounds/voiceover only
- **Mascot characters always SVG** -- never AI-generated, ensures consistency
- **Gesture system separate from state** -- `gesture` prop independent of `state` prop
- **Animation modes**: `loop` (default, backward-compatible web), `once`, `sequence` (video)
- **Remotion v4** for stability with motion/react v12

## Unresolved Questions

1. Video resolution: 1080p only or also 1080x1920 for TikTok?
2. Voiceover: Vietnamese only or bilingual?
3. Lesson template system: structured (intro-content-quiz-outro) or freeform?
