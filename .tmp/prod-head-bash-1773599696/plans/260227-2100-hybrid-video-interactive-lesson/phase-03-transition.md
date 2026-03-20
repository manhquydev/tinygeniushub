---
phase: 3
status: pending
priority: P2
effort: 1h
---

# Phase 3: Transition Component

## Context

- 300ms crossfade when switching from video to interactive
- Audio cue "Den luot con!" plays during transition
- Visual: video fades out, interactive fades in with slight scale-up

## Files to Create

- `src/components/hybrid-lesson/hybrid-transition-overlay.tsx`

## Implementation

### HybridTransitionOverlay (~80 lines)

```
Props:
  isActive: boolean
  audioUrl?: string
  onComplete: () => void

Behavior:
  - When isActive becomes true:
    1. Play transition audio (reuse existing AudioPlayer)
    2. Show centered text "Den luot con!" with bounce animation
    3. After 800ms total (300ms fade + 500ms text display), call onComplete
  - Uses motion/react for animations (consistent with existing codebase)
  - Semi-transparent overlay with radial gradient

Animation sequence:
  0ms   - Start fade-in overlay
  100ms - "Den luot con!" text bounces in
  500ms - Text holds
  800ms - Fade out, onComplete fires
```

## Todo

- [ ] Create `hybrid-transition-overlay.tsx`
- [ ] Add transition audio file to public assets

## Success Criteria

- Smooth crossfade between video and interactive
- Audio cue plays during transition
- Child-friendly visual (large text, bouncy animation)
