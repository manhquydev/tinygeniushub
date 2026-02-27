# Phase 2: Visual Components

## Context

- [Types](./phase-01-core-types-and-data.md)
- [Mascot.tsx](../../src/components/mascot/Mascot.tsx) — animation patterns
- [lesson-wizard-flow.tsx](../../src/components/lesson-wizard/lesson-wizard-flow.tsx) — existing UI patterns

## Overview

- **Priority:** P1
- **Status:** completed
- **Effort:** 1 hour

Build web-compatible visual building blocks using Framer Motion. These are simpler, standalone components (not Remotion).

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/interactive-lesson/interactive-speech-bubble.tsx` | Animated speech bubble with text | ~70 |
| `src/components/interactive-lesson/interactive-keyword-display.tsx` | Large animated keyword with phonetic hint | ~60 |
| `src/components/interactive-lesson/interactive-keyword-cards.tsx` | Sequential example card reveals | ~80 |
| `src/components/interactive-lesson/interactive-scene-background.tsx` | Starry/gradient background (reuse lesson-wizard pattern) | ~50 |
| `src/components/interactive-lesson/interactive-celebration.tsx` | Confetti + stars burst | ~60 |
| `src/components/interactive-lesson/audio-player.tsx` | TTS playback with onEnd callback | ~70 |

## Key Insights

- Follow `motion/react-m` import pattern (same as lesson-wizard-flow)
- Use `useReducedMotion()` throughout
- `InteractiveSpeechBubble`: rounded box with tail, text fades in word-by-word or instantly
- `InteractiveKeywordDisplay`: large bold text center-screen, scale-in animation
- `InteractiveKeywordCards`: cards appear one at a time with stagger, each with bounce-in
- `InteractiveSceneBackground`: reuse `LESSON_SPACE_STARS` pattern from lesson-wizard-flow
- `InteractiveCelebration`: wrap `canvas-confetti` + star SVG burst
- `AudioPlayer`: `<audio>` element, plays on mount, fires `onEnd` when done. Expose `play()`/`pause()`.

## Implementation Steps

### 1. interactive-speech-bubble.tsx

```tsx
"use client";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";

interface InteractiveSpeechBubbleProps {
  text: string;
  visible: boolean;
  position?: "top" | "bottom";
  className?: string;
}

export function InteractiveSpeechBubble({ text, visible, position = "bottom" }: Props) {
  // Rounded rect with CSS tail
  // AnimatePresence for enter/exit
  // Scale + opacity transition
}
```

### 2. interactive-keyword-display.tsx

```tsx
interface InteractiveKeywordDisplayProps {
  keyword: string;
  subtext?: string;
  visible: boolean;
}
// Large text, scale from 0.8 to 1, fade in
// Subtext smaller below
```

### 3. interactive-keyword-cards.tsx

```tsx
interface InteractiveKeywordCardsProps {
  keywords: string[];
  activeIndex: number; // which card is currently revealed
}
// Grid of cards, each appears with staggered bounceIn
// Active card highlighted, previous cards dimmed
```

### 4. interactive-scene-background.tsx

```tsx
// Reuse LESSON_SPACE_STARS pattern from lesson-wizard-flow
// Gradient background with twinkling stars
// Export as simple wrapper div
```

### 5. interactive-celebration.tsx

```tsx
interface InteractiveCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}
// On trigger: fire canvas-confetti burst + show animated stars
// Call onComplete after animation (1.8s)
```

### 6. audio-player.tsx

```tsx
interface AudioPlayerProps {
  src?: string;
  autoPlay?: boolean;
  onEnd?: () => void;
  onError?: () => void;
}
// Render hidden <audio> element
// useEffect to play on src change if autoPlay
// Listen to "ended" event -> call onEnd
// Handle missing/invalid src gracefully (call onEnd immediately)
```

## Todo

- [x] Create `interactive-speech-bubble.tsx`
- [x] Create `interactive-keyword-display.tsx`
- [x] Create `interactive-keyword-cards.tsx`
- [x] Create `interactive-scene-background.tsx`
- [x] Create `interactive-celebration.tsx`
- [x] Create `audio-player.tsx`
- [x] Verify all compile

## Success Criteria

- All 6 components render without errors
- Animations respect `useReducedMotion`
- AudioPlayer handles missing src gracefully
