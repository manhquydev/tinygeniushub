# Brainstorm: Full Interactive Lesson — No Video

**Date:** 2026-02-27
**Status:** agreed

---

## Problem Statement

Current lesson videos (MP4 30s) have correct pedagogical structure (7-phase arc) but are fully passive. Children 5-8 can't distinguish video answer cards from interactive game elements — they instinctively try to tap/click. Video is linear: no replay of specific concepts, no branching, no real engagement.

## Agreed Decisions

| Decision | Choice |
|----------|--------|
| Model | Full interactive, no video for learning |
| Approach | Rewrite from scratch (new interactive lesson renderer) |
| Scope | Both CourseLessonsPlayer AND LessonWizardFlow |
| Teach method | Auto-animated steps + tap to continue |
| Audio | Pre-generated TTS files (Gemini/Google TTS) |
| Remotion | Keep for marketing/social/YouTube promo videos |

---

## Architecture: Interactive Lesson Renderer

### Flow (replaces video)

```
Step 0: Hook
  └─ Mascot slides in, SpeechBubble "Chào con!", [Bắt đầu] button

Step 1: Concept (auto-animated + tap)
  └─ Mascot points at large keyword display
  └─ SpeechBubble shows instruction (e.g. "Âm /a/")
  └─ Audio plays TTS narration
  └─ [Tiếp tục ▶] button or auto-advance after audio ends

Step 2: Demonstrate (auto-animated + tap)
  └─ Example cards appear sequentially (e.g. "apple", "ant", "arm")
  └─ Mascot reacts: curious → happy → proud
  └─ Audio narrates each example
  └─ [Tiếp tục ▶] or auto-advance

Step 3: Your Turn — INTERACTIVE
  └─ ActivityRenderer (existing components):
     Multiple Choice / Fill Blank / Sort Order / Drag Drop
  └─ Mascot watches, reacts to answers
  └─ Wrong → mascot nervous, "Thử lại nào!" retry
  └─ Correct → Step 4

Step 4: Reinforce (if needed)
  └─ Only shown if first attempt wrong
  └─ Re-show concept briefly + second attempt
  └─ "Rule of 3" — max 3 attempts before auto-advance

Step 5: Celebrate
  └─ Confetti + Stars + Mascot celebrating
  └─ SpeechBubble "Giỏi lắm!"
  └─ Auto-advance to next lesson or return to board
```

### Component Architecture

```
src/components/interactive-lesson/
├── interactive-lesson-flow.tsx      # Main step machine (orchestrator)
├── interactive-lesson-types.ts      # Step/phase types, lesson data schema
├── lesson-step-hook.tsx             # Hook step: mascot greeting
├── lesson-step-concept.tsx          # Concept step: keyword + mascot + audio
├── lesson-step-demonstrate.tsx      # Demo step: example cards + mascot
├── lesson-step-activity.tsx         # Your Turn: wraps ActivityRenderer
├── lesson-step-reinforce.tsx        # Retry: re-show concept + 2nd attempt
├── lesson-step-celebrate.tsx        # Celebrate: confetti + mascot
├── interactive-speech-bubble.tsx    # Web version (Framer Motion, not Remotion)
├── interactive-keyword-display.tsx  # Web version with Framer Motion
├── interactive-scene-background.tsx # Web version with CSS animations
├── audio-player.tsx                 # Pre-generated TTS playback
└── interactive-lesson-data.ts       # 7 lesson scripts (concept + activity)
```

### Key Design Principles

1. **Mascot is central** — always visible, always reacting, 40-60% of viewport height
2. **One focal point per step** — either mascot+speech OR keyword OR activity cards. Never all at once.
3. **Tap to continue** — children control pace. Auto-advance only after audio finishes + 2s delay.
4. **Max 4 words per text element** — children are early readers
5. **Activity reuse** — `ActivityRenderer` + all existing activity components used AS-IS
6. **Audio-first** — TTS drives the timing. Visual elements sync to audio duration.

### Data Schema

```ts
interface InteractiveLessonStep {
  type: "hook" | "concept" | "demonstrate" | "activity" | "reinforce" | "celebrate";
  mascot: {
    variant: MascotVariant;
    state: MascotState;
    gesture?: MascotGesture;
    actionProp?: MascotActionProp;
  };
  speech?: string;        // speech bubble text
  keyword?: string;       // large keyword
  keywords?: string[];    // example cards for demonstrate
  subtext?: string;       // supporting text
  audioUrl?: string;      // pre-generated TTS audio file
  activity?: {            // for activity step
    type: string;         // matches existing ActivitySpec type
    spec: ActivitySpec;   // existing spec format
  };
  autoAdvanceMs?: number; // auto-advance delay (default: wait for tap)
}

interface InteractiveLessonData {
  id: string;
  title: string;
  mascotVariant: MascotVariant;
  steps: InteractiveLessonStep[];
}
```

### Audio Pipeline

```
1. Define narration text per step in lesson data
2. Run Gemini TTS script (existing generate-voiceover.ts pattern)
3. Output: /public/audio/lessons/{lesson-id}/step-{N}.mp3
4. Reference audioUrl in lesson data
5. AudioPlayer component: plays on step enter, dispatches onEnd event
```

### Integration Points

**LessonWizardFlow:** Replace step 1 (video watch) with interactive lesson renderer. Step 2 (activity quiz) stays but is now embedded within the interactive flow (Step 3).

**CourseLessonsPlayer:** Replace iframe video player with interactive lesson renderer. Add step tracking to localStorage (currently tracks video completion).

### What to NOT Build (YAGNI)

- ❌ Real-time lip sync — overkill for MVP
- ❌ Complex branching logic — linear flow + retry is enough
- ❌ Custom animation engine — use Framer Motion
- ❌ Sound effects library — TTS narration only for now
- ❌ Analytics per step — just track completion

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| TTS audio quality insufficient | Medium | Use Gemini TTS (vi-VN) which is high quality; fallback to Google Cloud TTS |
| Mobile touch performance | Low | Framer Motion is hardware-accelerated; mascot SVG already optimized |
| Lesson data migration | Medium | Old lesson data compatible — activity specs unchanged |
| Audio file hosting | Low | Use /public/ directory or existing CDN |

## Success Metrics

- Interactive lessons load in < 2s
- Activity completion rate ≥ 80% (vs video watch-through ~60%)
- Retry rate ≤ 2 per activity (indicates concept taught well)
- No video buffering issues (eliminated)
- Works offline-capable (no streaming dependency)

## Next Steps

1. Create implementation plan with phases
2. Build interactive-lesson components (new)
3. Generate TTS audio for 7 demo lessons
4. Integrate into LessonWizardFlow
5. Integrate into CourseLessonsPlayer
6. Test on mobile + desktop
