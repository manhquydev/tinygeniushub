# Brainstorm: Video Redesign — Child-Friendly 7-Phase Arc

**Date:** 2026-02-27
**Status:** agreed
**Context:** Current lesson videos too basic for ages 5-8. Redesign with research-backed engagement patterns.

---

## Problem Statement

Current video output: flat gradient bg, static card with full sentences, mascot disconnected from content, hard cuts between sections, no visual feedback cues. Research shows children 5-8 need: keyword-only display (≥72px), speech bubbles, processing pauses, "your turn" cues, rule-of-3 reinforcement, sound visual proxies.

## Agreed Decisions

- **Redesign scope:** Full — all components
- **Structure:** 7-phase 30-second arc (900 frames @ 30fps)
- **Video length:** 30 seconds per lesson
- **Mascot role:** Primary teacher (40-50% screen, speech bubble, reacts to content)

---

## 7-Phase Arc Spec (900 frames total)

| Phase | Frames | Duration | Visual |
|-------|--------|----------|--------|
| 1. Hook | 0–89 | 3s | Mascot slides in from left, waves, speech bubble "Chào con!" |
| 2. Concept Intro | 90–209 | 4s | Keyword bounces in large (96-120px), mascot points at it |
| 3. Demonstrate | 210–419 | 7s | Mascot explains, 2-3 keyword cards appear sequentially, ♪ notes float |
| 4. Your Turn | 420–539 | 4s | Mascot arm extends, pulsing glow border on answer zone, "..." dots |
| 5. Reinforce | 540–719 | 6s | Keyword replays with highlight sweep, mascot nods, concept shown 2nd/3rd time |
| 6. Celebrate | 720–839 | 4s | Confetti + stars + ✓ badge, mascot jumps, "Giỏi lắm!" speech bubble |
| 7. Recap | 840–899 | 2s | Key word stays on screen, mascot waves bye, fade out |

---

## New Component Architecture

### Data Layer Changes

```ts
// Replace VideoSection with 7-phase model
interface LessonPhase {
  type: "hook" | "concept" | "demonstrate" | "your-turn" | "reinforce" | "celebrate" | "recap";
  durationFrames: number; // in frames, not ms
  mascot: {
    state: MascotState;
    gesture?: MascotGesture;
    actionProp?: MascotActionProp;
    enterFrom?: "left" | "right" | "bottom"; // slide direction
  };
  speech?: string; // speech bubble text (max 4 words)
  keyword?: string; // large keyword display
  subtext?: string; // small supporting text
  answerOptions?: string[]; // for "your-turn" phase
  correctIndex?: number; // which option is correct
}

interface LessonVideoDataV2 {
  id: string;
  title: string;
  mascotVariant: MascotVariant;
  phases: LessonPhase[];
}
```

### New Visual Components (create/replace in `remotion/course-demo/`)

#### 1. `SpeechBubble.tsx`
- White rounded rect, tail pointing to mascot
- Max 4 words, 48px bold
- Spring bounce-in (damping:6, stiffness:80)
- Tail: SVG triangle attached to bubble bottom-left
- Border: 3px `#333`, border-radius: 24px
- Position: above/beside mascot head

#### 2. `KeywordDisplay.tsx`
- Single keyword, 96-120px bold
- Bounce-in: spring scale 0→1.3→1 (20 frames)
- Vowels: `#FF6B6B`, consonants: `#4D96FF`
- Subtle glow pulse: `box-shadow 0 0 20px currentColor`, 30f cycle
- Position: center-right of screen

#### 3. `KeywordCard.tsx` (for demonstrate phase)
- Small rounded card (200x120px) with keyword inside
- Staggered entry: each card 6-frame offset
- White bg, colored border matching content type
- For demonstrate: 2-3 cards appear sequentially

#### 4. `YourTurnCue.tsx`
- Pulsing glow border around answer zone
- `box-shadow: 0 0 0 4px rgba(255,200,0,0.8)`, pulse 30f cycle
- "..." thinking dots appear one-by-one (dot1@0f, dot2@12f, dot3@24f)
- Mascot arm extends forward (use "pointing" gesture)

#### 5. `SoundProxy.tsx`
- Musical notes ♪: float upward translateY -80px, opacity fade, 40f
- Exclamation !: scale 0→1.3→1.0, 10f
- Thinking dots ...: sequential appear
- Letter glow: scale 1→1.1→1, yellow highlight, 15f
- Configurable: `type: "music" | "surprise" | "thinking" | "glow"`

#### 6. `SceneTransition.tsx`
- Wraps each phase `<Sequence>` with fade-in/out
- First 12 frames: opacity 0→1
- Last 12 frames: opacity 1→0
- Optional: slide direction matching mascot enterFrom

#### 7. `CorrectBadge.tsx`
- Green "✓ Đúng rồi!" badge
- Slides from top-right, 18 frames
- Used in celebrate phase alongside confetti

### Modified Components

#### `LessonVideoTemplate.tsx` → complete rewrite
- 7-phase Sequence layout instead of 5-section
- Each phase renders: SceneBackground + mascot + phase-specific content
- Phase-specific layouts:
  - Hook: mascot center, speech bubble
  - Concept: mascot left 40%, keyword right 50%
  - Demonstrate: mascot left 30%, keyword cards center-right
  - Your Turn: mascot left pointing, answer zone right with glow
  - Reinforce: keyword center with highlight sweep, mascot right nodding
  - Celebrate: full screen effects, mascot center jumping
  - Recap: keyword stays, mascot waves, fade

#### `SceneBackground.tsx` → add phase-specific gradients
- hook: `#E8F4FD → #FFF8E1` (warm welcome)
- concept: `#F3E5F5 → #E8F5E9` (learning purple-green)
- demonstrate: `#E8F4FD → #E8F5E9` (calm focus)
- your-turn: `#FFF8E1 → #FFF3E0` (warm encouragement)
- reinforce: `#E8F5E9 → #E8F4FD` (consolidation)
- celebrate: `#FFF176 → #FF8A65` (celebration)
- recap: `#E8F4FD → #F3E5F5` (calm close)

#### `TopBar.tsx` → update to 7 dots
- 7 progress dots instead of 5
- Phase colors match gradient themes

### Keep As-Is
- `ConfettiBurst.tsx` — works well
- `StarBurst.tsx` — works well, trigger during celebrate phase
- `BottomPrompt.tsx` — keep for "your turn" instructions
- `MascotScene.tsx` — bridge layer unchanged
- `Root.tsx` — composition registration unchanged

### Remove
- `ContentCard.tsx` — replaced by KeywordDisplay + SpeechBubble
- `SectionBadge.tsx` — no longer needed (badge was section-type indicator)

---

## lesson-video-data Redesign

Each of 7 lessons needs rewrite from 5-section to 7-phase format. Example for Lesson 1:

```ts
{
  id: "lesson-01",
  title: "Âm /a/ và /m/",
  mascotVariant: "big",
  phases: [
    {
      type: "hook",
      durationFrames: 90,
      mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
      speech: "Chào con!",
    },
    {
      type: "concept",
      durationFrames: 120,
      mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
      keyword: "Aa",
      subtext: "Âm /a/",
    },
    {
      type: "demonstrate",
      durationFrames: 210,
      mascot: { state: "happy", gesture: "nodding", actionProp: "flashcard" },
      keyword: "apple",
      subtext: "/a/ - /a/ - apple",
      // could show 2-3 words: apple, ant, arm
    },
    {
      type: "your-turn",
      durationFrames: 120,
      mascot: { state: "playful", gesture: "pointing" },
      speech: "Con thử!",
      answerOptions: ["moon", "apple", "egg"],
      correctIndex: 1,
    },
    {
      type: "reinforce",
      durationFrames: 180,
      mascot: { state: "proud", gesture: "nodding" },
      keyword: "apple",
      subtext: "Bắt đầu bằng /a/",
    },
    {
      type: "celebrate",
      durationFrames: 120,
      mascot: { state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
    },
    {
      type: "recap",
      durationFrames: 60,
      mascot: { state: "happy", gesture: "waving" },
      keyword: "Aa",
      speech: "Hẹn gặp lại!",
    },
  ],
}
```

---

## Implementation Considerations

### Effort Estimate
- New components: 7 files (~80-120 lines each)
- Modified: 3 files (template, background, topbar)
- Data rewrite: 7 lessons × 7 phases
- Delete: 2 files (ContentCard, SectionBadge)
- **Total: ~12 files, medium effort**

### Risks
1. **Font rendering in Remotion**: system-ui on headless Chrome may render differently than user's browser. Vietnamese diacritics need testing.
2. **Performance**: More animated elements per frame → slower render. Current ~30s/lesson, may increase to ~45s.
3. **Speech bubble positioning**: Varies by mascot variant size. May need per-variant offset map (already exists in PROP_OFFSETS pattern).

### Success Metrics
- Video file size: 3-5 MB/lesson (acceptable)
- Render time: <60s/lesson
- Visual: keyword ≥72px, max 4 words on screen, speech bubble visible, transitions ≥15f
- Structure: all 7 phases present, "your turn" has visible cue

---

## Next Steps

1. Create implementation plan with phases
2. Implement new components
3. Rewrite lesson data for 7-phase format
4. Render and review all 7 lessons
5. Compare v2 vs v3 side by side
