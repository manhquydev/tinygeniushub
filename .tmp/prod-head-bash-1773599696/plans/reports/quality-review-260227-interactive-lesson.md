# Quality Review: Interactive Lesson System
**Date:** 2026-02-27
**Reviewer:** QA (independent)
**Scope:** Audio overlap, timer safety, state management, audio file refs, accessibility/child UX

---

## Code Review Summary

### Scope
- Files reviewed: 9 component files + 7 data files
- Lines of code analyzed: ~900 LOC
- Review focus: Audio overlap/race conditions, timer cleanup, state management, file references, child UX

### Overall Assessment

The interactive lesson system is **well-structured** with generally good timer cleanup patterns. Most timers use `useEffect` cleanup returns. However, there are several real-world race conditions and UX issues a child would encounter, primarily around **audio overlap** when tapping keyword cards during step narration and **stale closure bugs** in the demonstrate step.

---

## CRITICAL Issues

### CRIT-1: Keyword card audio overlaps step narration audio (audio overlap)
**Files:** `interactive-keyword-cards.tsx:38-66`, `lesson-step-demonstrate.tsx:140-147`
**Severity:** CRITICAL
**Description:** In the demonstrate step, two independent audio systems run simultaneously:
1. `AudioPlayer` component playing per-keyword MP3 (managed by React state)
2. `InteractiveKeywordCards` maintains its own `audioElRef` (a raw `Audio` object)

When a child taps a keyword card while the step's per-keyword `AudioPlayer` is still playing, both play simultaneously. The card's audio element (`audioElRef.current`) is never paused when the step advances or unmounts. This raw Audio element persists across renders (ref is never cleaned up).

**Fix:**
```tsx
// In InteractiveKeywordCards: add cleanup on unmount
useEffect(() => {
  return () => {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
  };
}, []);

// In lesson-step-demonstrate.tsx: pass a "disabled" prop to InteractiveKeywordCards
// when phase !== "done", so card taps don't trigger audio during narration
<InteractiveKeywordCards
  keywords={keywords}
  activeIndex={activeIndex}
  keywordsWithAudio={kwa}
  disabled={phase !== "done"} // add this prop
/>
```

---

### CRIT-2: Stale closure in `handleKeywordAudioEnd` — demonstrate step gets stuck
**File:** `lesson-step-demonstrate.tsx:51-58`
**Severity:** CRITICAL
**Description:** `handleKeywordAudioEnd` closes over `activeIndex` but is NOT in a `useCallback` with `activeIndex` as a dependency. The `AudioPlayer` uses `onEndRef` to always call the latest `onEnd`, but the function passed as `onEnd` is recreated on every render (inline lambda `onEnd={handleKeywordAudioEnd}`). However, `handleKeywordAudioEnd` itself captures `activeIndex` from the render closure at the time it was defined. If React batches or if the AudioPlayer `onEndRef` update races with the audio `ended` event, `activeIndex` may be stale.

More concretely: `handleKeywordAudioEnd` at line 51 is defined as a plain function (not memoized), so it captures a fresh `activeIndex` on each render. The `onEndRef.current` in AudioPlayer is updated via `useEffect(() => { onEndRef.current = onEnd; })` without deps — this runs after every render. If the `ended` event fires between the render and the effect, the old stale version is called.

**Fix:**
```tsx
const handleKeywordAudioEnd = useCallback(() => {
  setActiveIndex(prev => {
    const nextIdx = prev + 1;
    if (nextIdx >= keywords.length) {
      setAllCardsShown(true);
      setPhase("done");
      return prev;
    }
    synth.playPop();
    return nextIdx;
  });
}, [keywords.length]);
```
Use functional updater form to avoid stale closure on `activeIndex`.

---

## HIGH Priority Findings

### HIGH-1: `LessonStepActivity` — child can answer before narration finishes, no guard
**File:** `lesson-step-activity.tsx:103`, `lesson-step-activity.tsx:50-68`
**Severity:** HIGH
**Description:** `AudioPlayer` is rendered with `autoPlay` but there is no state gate blocking the `ActivityRenderer` until audio ends. A child can tap an answer option immediately when the step mounts, while the narration "Con thử nhé!" is still speaking. The `disabled` prop only activates after first answer. There's no `audioPlaying` state.

**Fix:**
```tsx
const [audioEnded, setAudioEnded] = useState(!step.audioUrl);
// Pass disabled={disabled || !audioEnded} to ActivityRenderer
// <AudioPlayer src={step.audioUrl} autoPlay onEnd={() => setAudioEnded(true)} />
```

### HIGH-2: `lesson-step-celebrate.tsx` — `onNext` called in `useEffect` with unstable reference risk
**File:** `lesson-step-celebrate.tsx:27-38`
**Severity:** HIGH
**Description:** `onNext` is `handleCelebrationComplete` from `interactive-lesson-flow.tsx`, which is a `useCallback` with dependencies. It is included in the `useEffect` deps array (`[autoAdvanceMs, onNext]`). If `onNext` reference changes before the 3000ms timer fires (e.g. parent re-render), the effect will rerun — clearing the old timer and setting a NEW 3000ms timer. This effectively restarts the auto-advance clock on every parent render, potentially never advancing.

**Fix:**
```tsx
// Use a ref for onNext to avoid re-running effect
const onNextRef = useRef(onNext);
useEffect(() => { onNextRef.current = onNext; });

useEffect(() => {
  synth.playYay();
  const celebTimer = setTimeout(() => setCelebrationTriggered(true), 200);
  const advanceTimer = setTimeout(() => onNextRef.current(), autoAdvanceMs);
  return () => {
    clearTimeout(celebTimer);
    clearTimeout(advanceTimer);
  };
}, [autoAdvanceMs]); // remove onNext from deps
```

### HIGH-3: `InteractiveKeywordCards` — raw Audio element never stopped on step unmount
**File:** `interactive-keyword-cards.tsx:38-66`
**Severity:** HIGH
**Description:** `audioElRef.current` (created at line 51 as `new Audio()`) is never paused when the component unmounts. If a child taps a card and then the lesson advances (via another mechanism) mid-playback, the keyword audio continues playing in background with no way to stop it.

**Fix:** Add unmount cleanup (same as CRIT-1 fix above).

### HIGH-4: `lesson-step-hook.tsx` — auto-advance fires after manual "Bắt đầu" tap
**File:** `lesson-step-hook.tsx:31-35`
**Severity:** HIGH
**Description:** The auto-advance timer is set when `audioEnded` becomes true. If a child taps "Bắt đầu" before `autoAdvanceMs` fires, `onNext()` is called manually at line 39. The pending timer from line 33 still fires and calls `onNext()` again after the delay — causing a double-advance (skipping one step).

**Reproduction:** Audio ends → `audioEnded=true` → timer set for `autoAdvanceMs` → child taps "Bắt đầu" → `onNext()` called → step changes → parent's step component unmounts BUT the effect cleanup runs on old render, which clears the timer... Actually, looking more carefully: the `useEffect` cleanup IS returned at line 35, so when `audioEnded` or `step` changes the old timer is cleared. However, if `audioEnded` becomes true AND `step.autoAdvanceMs` is set, the timer is created. If child clicks "Bắt đầu" AFTER the timer starts (within `autoAdvanceMs` window), the step component unmounts via `AnimatePresence`. Unmount triggers cleanup correctly.

**Reassessment:** This is actually safe due to unmount cleanup. Downgrading to MEDIUM. (See MEDIUM-1.)

---

## MEDIUM Priority Improvements

### MEDIUM-1: Hook step auto-advance + manual button both callable — minor gap
**File:** `lesson-step-hook.tsx:31-35`
**Severity:** MEDIUM
**Description:** (Revised from HIGH-4) The timer cleanup on unmount handles the race. However, there's a narrow window: if `AnimatePresence` mode="wait" keeps the exiting component mounted during the exit animation (0.2s), the timer could still fire during exit. Not breaking but could cause flicker.

### MEDIUM-2: `lesson-step-reinforce.tsx` — `timerRef` cleared in wrong cleanup
**File:** `lesson-step-reinforce.tsx:32-38`
**Severity:** MEDIUM
**Description:** The `useEffect` at line 32 has a cleanup that clears both `timer` (showActivity) and `timerRef.current` (handleAnswer). This is correct on unmount. But `timerRef.current` is also a timeout set in `handleAnswer` — if a child answers and then the lesson advances before that timeout fires, the cleanup won't run because the cleanup only runs on unmount or re-run of the effect (which deps are `[]`). So if a correct answer is given and `timerRef.current = setTimeout(() => onNext(), 1000)` is set, but the parent immediately navigates (e.g. parent state change), `onNext()` could be called on an unmounted component. This is safe in practice because React ignores setState on unmounted components but may produce a warning.

### MEDIUM-3: `lesson-step-concept.tsx:58-59` — `setSpeakerPulsing` timer not tracked
**File:** `lesson-step-concept.tsx:58-59`
**Severity:** MEDIUM
**Description:** In `handleReplay`, `setTimeout(() => setSpeakerPulsing(false), 1200)` is called without storing the ref or clearing on unmount. If the component unmounts during this 1200ms window, setState on unmounted component warning occurs.

**Fix:**
```tsx
const pulsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const handleReplay = () => {
  audioRef.current?.replay();
  if (pulsTimerRef.current) clearTimeout(pulsTimerRef.current);
  setSpeakerPulsing(true);
  pulsTimerRef.current = setTimeout(() => setSpeakerPulsing(false), 1200);
};
useEffect(() => () => { if (pulsTimerRef.current) clearTimeout(pulsTimerRef.current); }, []);
```

### MEDIUM-4: `lesson-step-demonstrate.tsx` — `handleIntroEnd` / `handleKeywordAudioEnd` recreated on every render
**File:** `lesson-step-demonstrate.tsx:42-58`
**Severity:** MEDIUM
**Description:** Both handler functions are plain inline functions, not memoized. `AudioPlayer` uses `onEndRef` pattern which mitigates stale closures for `onEnd`, but `handleKeywordAudioEnd` using non-functional state update (`setActiveIndex(nextIdx)` reading `activeIndex` directly) is still a stale closure risk as noted in CRIT-2.

### MEDIUM-5: `so-1-5` and `hinh-tron-vuong` demonstrate steps have no `keywordsWithAudio`
**File:** `demo-lesson-so-1-5.ts:27-30`, `demo-lesson-hinh-tron-vuong.ts:27-30`
**Severity:** MEDIUM
**Description:** Both lessons use `keywords` without `keywordsWithAudio`. This falls back to the 1500ms timer-per-card legacy path in `lesson-step-demonstrate.tsx:63-75`. When a child taps these keyword cards, `speakWord()` (SpeechSynthesis) is called — which uses English voice (`en-US`) but the keywords are Vietnamese ("đồng hồ ○", "1 táo"). The pronunciation will be wrong/unintelligible for children.

**Recommendation:** Either add per-keyword audio MP3s for these lessons, or set `lang = "vi-VN"` in `speakWord()` when the keyword is Vietnamese.

### MEDIUM-6: `hinh-tron-vuong` activity step has no `audioUrl`
**File:** `demo-lesson-hinh-tron-vuong.ts:33-47`
**Severity:** MEDIUM
**Description:** The activity step has no `audioUrl`. `AudioPlayer` handles `!src` by firing `onEnd` via a 100ms timer (fallback). In `lesson-step-activity.tsx`, `AudioPlayer` is rendered without `onEnd` handler (line 103: `<AudioPlayer src={step.audioUrl} autoPlay />`), so the fallback timer fires but nothing happens — OK. However, this means no narration for the question, which is a child UX problem (children may not understand written Vietnamese text).

---

## LOW Priority Suggestions

### LOW-1: `InteractiveKeywordCards` — `playingIndex` visual state cleared after fixed 800ms regardless of audio length
**File:** `interactive-keyword-cards.tsx:45-46`
**Severity:** LOW
**Description:** `setTimeout(() => setPlayingIndex(null), 800)` is hardcoded. If the MP3 is longer than 800ms, the visual "playing" highlight disappears before audio ends — confusing UX.

**Fix:** Use the Audio `ended` event to clear `playingIndex`.

### LOW-2: `InteractiveKeywordCards` — no `aria-label` on keyword buttons
**File:** `interactive-keyword-cards.tsx:90-93`
**Severity:** LOW
**Description:** Buttons only have `type="button"` and visible text. No `aria-label`. Screen-reader users get "ant button" which is fine, but adding `aria-label={`Nghe từ: ${keyword}`}` improves accessibility.

### LOW-3: `lesson-step-activity.tsx` — `gazeDir` state never actually changes
**File:** `lesson-step-activity.tsx:27, 111-113`
**Severity:** LOW
**Description:** `setGazeDir` is passed to `onHoverOption` and `onHoverOptionEnd`, but `gazeDir` is only passed to `mascotGazeDirection` prop, not read for any meaningful behavior. If `KidMascotGazeDirection` enum or logic is not wired in `Mascot`, gaze tracking is dead code.

### LOW-4: Keyboard tab focus styling missing on keyword cards
**File:** `interactive-keyword-cards.tsx:137`
**Severity:** LOW
**Description:** `outline: "none"` on the button with no custom `:focus-visible` replacement. Tab-navigation users (including children using keyboard navigation or switch access) get no visual focus indicator.

**Fix:** Replace `outline: "none"` with `outline: "3px solid ${borderColor}"` on focus, or use a CSS class.

### LOW-5: `lesson-step-celebrate.tsx` — `synth.playYay()` and `AudioPlayer` both play on mount
**File:** `lesson-step-celebrate.tsx:28, 58`
**Severity:** LOW
**Description:** Both the synth sound effect and the AudioPlayer narration start simultaneously on mount. On mobile, the synth may be blocked by autoplay policy (but it's likely fine). The concern is audio clutter — cheer sound + "Giỏi lắm!" narration overlap. Consider delaying one.

---

## Positive Observations

1. **AudioPlayer cleanup is solid**: `audio.pause()` on effect cleanup (line 86), fallback timer cleared on unmount (lines 96-101), `onEndRef`/`onErrorRef` pattern prevents stale closure issues.
2. **All step timers properly returned for cleanup**: Every `useEffect` with `setTimeout` returns `clearTimeout`. CRIT-1 is about a raw Audio element, not a timer.
3. **Audio file references are complete**: All `audioUrl` paths in all 7 data files map to existing MP3 files in `public/audio/lessons/`. No 404s expected for step-level audio.
4. **Keyword audio files verified**: `am-a`, `am-e`, `dien-chu-cvc`, `nghe-am-b`, `van-at` all have correct `kw-*.mp3` files matching `keywordsWithAudio` entries.
5. **Double-play prevention via `disabled` state**: Activity/reinforce steps use `disabled` guard to prevent double-answer submission.
6. **Parent gate on exit**: Child cannot accidentally exit mid-lesson without parent verification.
7. **`AnimatePresence mode="wait"`**: Prevents two step components existing simultaneously which reduces audio overlap risk at the step-transition level.
8. **Fallback for missing audio**: `AudioPlayer` fallback to `onEnd` after 2s on error (and 100ms for empty src) prevents the lesson from getting stuck.

---

## Recommended Actions

1. **(CRIT-1 + HIGH-3)** Add unmount cleanup to `InteractiveKeywordCards` raw Audio element; add `disabled` prop to block card taps during narration phases.
2. **(CRIT-2)** Rewrite `handleKeywordAudioEnd` in `lesson-step-demonstrate.tsx` using functional state updater to eliminate stale `activeIndex` closure.
3. **(HIGH-1)** Gate `ActivityRenderer` behind `audioEnded` state in `lesson-step-activity.tsx` and `lesson-step-reinforce.tsx`.
4. **(HIGH-2)** Use `onNextRef` pattern in `lesson-step-celebrate.tsx` to decouple auto-advance timer from `onNext` reference changes.
5. **(MEDIUM-3)** Track `setSpeakerPulsing` timer in a ref in `lesson-step-concept.tsx` for proper cleanup.
6. **(MEDIUM-5)** Add `vi-VN` lang fallback to `speakWord()` or add MP3 files for `so-1-5` and `hinh-tron-vuong` keyword cards.
7. **(LOW-1)** Tie `playingIndex` clearance to audio `ended` event in `InteractiveKeywordCards`.
8. **(LOW-4)** Restore focus-visible outline on keyword card buttons for keyboard/switch accessibility.

---

## Metrics

- Type Coverage: Good (TypeScript used throughout, proper interfaces)
- Test Coverage: None observed for interactive lesson components
- Linting Issues: 3 suppressed eslint-disable comments in `audio-player.tsx` (justified)
- Audio file refs: 100% valid (all referenced MP3s exist on disk)
- Missing audio: `hinh-tron-vuong` and `so-1-5` demonstrate steps have no per-keyword audio (silent fallback to SpeechSynthesis with wrong language)

---

## Unresolved Questions

1. Does `ActivityRenderer` have its own internal audio playback (e.g. for reading options aloud)? If so, that could be a 3rd concurrent audio source not reviewed here.
2. Are there plans to add per-keyword MP3s for `so-1-5` and `hinh-tron-vuong`? If not, the SpeechSynthesis lang should be changed.
3. Is `KidMascotGazeDirection` fully wired in the `Mascot` component? The gaze feature in activity steps appears unused.
