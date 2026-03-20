---
title: "Interactive Lesson System"
description: "Replace passive video lessons with interactive step-by-step lesson flow using mascot + audio + activities"
status: complete
priority: P1
effort: 5.5h
branch: main
tags: [interactive, lesson, mascot, audio, education]
created: 2026-02-27
---

# Interactive Lesson System

## Summary

Replace video-based lesson delivery with a fully interactive step machine: Hook > Concept > Demonstrate > Activity > Reinforce > Celebrate. Reuses existing `ActivityRenderer` and `Mascot` components. Uses Framer Motion for animations, pre-generated TTS for audio.

## Brainstorm Reference

- [Brainstorm Report](../reports/brainstorm-260227-interactive-lesson-no-video.md)

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Core Types & Data](./phase-01-core-types-and-data.md) | 30m | complete |
| 2 | [Visual Components](./phase-02-visual-components.md) | 1h | complete |
| 3 | [Step Components](./phase-03-step-components.md) | 1.5h | complete |
| 4 | [Flow Orchestrator](./phase-04-flow-orchestrator.md) | 1h | complete |
| 5 | [Integration](./phase-05-integration.md) | 1h | complete |
| 6 | [Demo & Preview](./phase-06-demo-and-preview.md) | 30m | complete |

## Key Constraints

- All new files in `src/components/interactive-lesson/`
- Files under 200 lines, kebab-case naming
- Use `motion/react` (Framer Motion v12) — same as mascot system
- Reuse `ActivityRenderer` and `Mascot` AS-IS
- All UI text in Vietnamese
- Audio: placeholder URLs, actual TTS generation is separate

## Architecture

```
InteractiveLessonFlow (orchestrator)
  ├── LessonStepHook        → Mascot greeting + start button
  ├── LessonStepConcept     → Keyword display + speech bubble + audio
  ├── LessonStepDemonstrate → Example cards + mascot reactions + audio
  ├── LessonStepActivity    → Wraps existing ActivityRenderer
  ├── LessonStepReinforce   → Re-show concept + retry activity
  └── LessonStepCelebrate   → Confetti + mascot celebrating
```

## Dependencies

- `Mascot` component (existing)
- `ActivityRenderer` component (existing)
- `canvas-confetti` (existing)
- `motion/react` (existing)
- `synth` from `lib/audio-utils` (existing)

## Post-Implementation Enhancements

- **TTS Audio**: Generated 30/42 lesson MP3 files via Gemini TTS (`gemini-2.5-flash-preview-tts`, Aoede voice). 12 files pending quota reset (so-1-5, hinh-tron-vuong).
- **TTS-UI Sync**: Implemented audio-driven card sequencing in demonstrate step. Cards appear when per-keyword audio plays (Duolingo pattern). Fallback to 1.5s timer when no keyword audio.
- **AudioPlayer**: Added to ALL step components (hook, concept, demonstrate, activity, reinforce, celebrate) with autoPlay and replay support.
- **Speaker Button**: Concept step has Volume2 replay button with pulse animation.
- **Pending**: 15 per-keyword MP3 files + 12 lesson MP3 files pending Gemini TTS quota reset. Run `scripts/generate-lesson-audio.py` and `scripts/generate-keyword-audio.py` when quota resets.
