---
phase: 2
status: pending
priority: P1
effort: 3h
---

# Phase 2: Video Player Component

## Context

- Must handle mobile autoplay restrictions (user gesture required for first play)
- Subsequent videos should reuse same `<video>` element to avoid re-triggering autoplay gate
- Preload next video segment while current plays

## Files to Create

- `src/components/hybrid-lesson/video-segment-player.tsx` — video player with preloading
- `src/components/hybrid-lesson/use-video-preloader.ts` — preload hook

## Implementation

### 1. VideoSegmentPlayer component (~120 lines)

```
Props:
  src: string
  poster?: string
  onEnded: () => void
  onTapToStart?: () => void  // for mobile first-play
  preloadSrc?: string         // next video to preload

Behavior:
  - Single <video> element, reused across segment switches
  - On src change: update video.src, call video.load(), then video.play()
  - onEnded fires parent callback
  - If autoplay blocked (first play), show large "play" overlay button
  - Preload: create hidden <link rel="preload"> or second <video> with preload="auto"
```

### 2. useVideoPreloader hook (~40 lines)

```
Input: url string | null
Output: { isReady: boolean }

Behavior:
  - Creates a hidden <video> element, sets src, listens for "canplaythrough"
  - Cleans up on unmount
  - Returns isReady when video is buffered enough to play
```

### 3. Mobile considerations

- First video needs user tap — show friendly "Bat dau!" (Start!) button overlay
- After first tap, subsequent `video.play()` calls succeed without gesture
- Reuse same `<video>` DOM element (change `src` property, don't remount)
- Use `ref` to persist the element across segment changes

## Todo

- [ ] Create `video-segment-player.tsx`
- [ ] Create `use-video-preloader.ts`
- [ ] Test on mobile Safari (autoplay gate)
- [ ] Test preloading works (network tab shows prefetch)

## Success Criteria

- Video plays on desktop without tap
- Video plays on mobile after first tap, no tap needed for subsequent segments
- Next segment preloads during current playback
