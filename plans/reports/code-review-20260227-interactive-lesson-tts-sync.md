# Code Review: Interactive Lesson TTS-UI Sync

**Date:** 2026-02-27
**Scope:** TTS-audio synchronization, AudioPlayer integration, KeywordWithAudio type, demo lesson data

---

## Scope

- Files reviewed: 8 source files (~600 LOC)
- Review focus: TTS-UI sync correctness, memory leaks, missing deps, edge cases, phase state machine

---

## Overall Assessment

The implementation is solid and well-structured. Audio-driven card sequencing works correctly in the happy path. A few correctness and robustness issues identified — none are critical/breaking, but two High-priority bugs could cause subtle double-fire or stale-closure issues.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `handleKeywordAudioEnd` captures stale `activeIndex` via closure

**File:** `lesson-step-demonstrate.tsx` lines 49-58

```tsx
const handleKeywordAudioEnd = () => {
  const nextIdx = activeIndex + 1;  // ← captured at render time
  ...
};
```

`handleKeywordAudioEnd` is passed as `onEnd` prop to `<AudioPlayer>`. The `AudioPlayer` stores the callback in a closure inside `useEffect` (dep array `[src, autoPlay]`). If `activeIndex` changes between renders but `src` did NOT change (same audio URL for two consecutive keywords), the old `onEnd` closure captured from the previous render fires — advancing from the wrong index.

In practice this only bites if two consecutive keywords share the same `audioUrl`. The `key={`kw-${activeIndex}`}` trick forces remount and avoids this for most cases. However, the `onEnd` inside `AudioPlayer`'s `useEffect` still references the prop at the time of effect execution, not at call time, because `onEnd` is excluded from deps (eslint-disable line 87).

**Risk:** If `onEnd` identity changes between renders without remounting the `AudioPlayer`, the stale `onEnd` fires. This is guarded by the `key` prop in demonstrate — but only there. Other components (`hook`, `concept`, `activity`) pass `onEnd` without `key` so if they ever share a URL across step changes (unlikely but possible), this could double-fire.

**Fix:** Either include `onEnd` in `AudioPlayer`'s effect deps (with a `useCallback`/ref stabilizer) or use a ref to always call the latest `onEnd`:

```tsx
// In AudioPlayer useEffect — replace handleEnded with:
const onEndRef = useRef(onEnd);
useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
// then: const handleEnded = () => onEndRef.current?.();
```

---

### H2 — `LessonStepActivity` / `LessonStepReinforce`: `setTimeout` callbacks not cleared on unmount

**Files:** `lesson-step-activity.tsx` lines 54, 61 / `lesson-step-reinforce.tsx` lines 54, 61

```tsx
setTimeout(() => onNext(), 1200);         // no ref, no cleanup
setTimeout(() => { setDisabled(false); setMascotState(...) }, 1200);
```

Both components schedule `setTimeout` calls in event handlers (`handleAnswer`) without storing the timer IDs. If the component unmounts before the timeout fires (e.g. parent navigates away), the callbacks still fire and call:
- `setState` on unmounted components → React warning in dev
- `onNext()` / `onActivityResult()` on stale parent context → potential logic corruption

**Fix:** Use `useRef` to track timer IDs and clear in `useEffect` cleanup:

```tsx
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In handleAnswer:
timerRef.current = setTimeout(() => onNext(), 1200);

// In useEffect cleanup:
useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
```

---

## Medium Priority Improvements

### M1 — `AudioPlayer`: `onEnd` / `onError` not in effect deps but can go stale

**File:** `audio-player.tsx` line 87-88

The `eslint-disable react-hooks/exhaustive-deps` comment suppresses the warning intentionally. This is a pragmatic choice to avoid re-triggering audio on every render (correct reasoning). However, the current implementation captures `onEnd` at effect execution time — if the parent re-renders and changes `onEnd` identity between the src-change and the audio `ended` event, the old callback fires.

The `key` approach in `demonstrate` mitigates this for the keyword sequence. Other callers should ideally stabilize their `onEnd` callbacks with `useCallback` to make the behavior deterministic.

**Fix (low-effort):** Document the contract explicitly in `AudioPlayer` interface:
```tsx
/**
 * IMPORTANT: onEnd identity should be stable (useCallback) across renders
 * to avoid stale closure bugs. src change remounts audio and re-captures onEnd.
 */
```

---

### M2 — `LessonStepDemonstrate`: `canContinue` logic inconsistency

**File:** `lesson-step-demonstrate.tsx` line 75

```tsx
const canContinue = phase === "done" || (allCardsShown && !step.audioUrl);
```

The second condition `allCardsShown && !step.audioUrl` is meant for the no-audio legacy case. But if `hasAudioSync=true` and `step.audioUrl` is absent (only `keywordsWithAudio`), `phase` starts as `"keywords"` immediately (line 30), and the continue button won't show until `phase === "done"`. This is correct behavior.

However, if `hasAudioSync=false` AND `step.audioUrl` is absent, `phase` starts as `"keywords"`, the timer fallback runs, but `canContinue` waits for `phase === "done"` (set in the timer effect, line 65). The second OR condition `allCardsShown && !step.audioUrl` would also make it visible, but `allCardsShown` is only set to true via the timer path after phase="done" is already set. So the second condition is redundant.

Minor cleanup opportunity — remove the redundant branch.

---

### M3 — `demo-lesson-am-a.ts`: `keywords` and `keywordsWithAudio` are redundant

**File:** `data/demo-lesson-am-a.ts` lines 27-34

```ts
keywords: ["ant", "apple", "map"],
keywordsWithAudio: [
  { word: "ant", audioUrl: "..." },
  ...
],
```

The `demonstrate` step has both `keywords` and `keywordsWithAudio`. In `lesson-step-demonstrate.tsx` line 27:
```tsx
const keywords = kwa ? kwa.map((k) => k.word) : (step.keywords ?? []);
```

When `kwa` is present, `step.keywords` is ignored entirely. This creates a maintenance hazard — the two arrays can drift out of sync silently.

**Fix:** Drop `keywords` from the step when `keywordsWithAudio` is populated, or add a runtime assertion / TypeScript discriminated union to prevent both being set simultaneously.

---

### M4 — `LessonStepReinforce`: activity is missing `reinforce` step in demo data

**File:** `data/demo-lesson-am-a.ts` lines 55-61

The `reinforce` step has no `activity` property. `LessonStepReinforce` returns `null` if `!step.activity` (line 36). This means the reinforce screen silently renders nothing. The lesson then stalls — there is no `onNext` call path when `step.activity` is absent in reinforce.

**Fix:** Either add an activity to the reinforce step in the demo data, or make `LessonStepReinforce` degrade gracefully (e.g. show a "Tiếp tục" button if no activity).

---

## Low Priority Suggestions

### L1 — `LessonStepCelebrate`: `synth.playYay()` called on every render cycle when `autoAdvanceMs` or `onNext` identity changes

**File:** `lesson-step-celebrate.tsx` line 28

`synth.playYay()` is inside `useEffect` with `[autoAdvanceMs, onNext]` deps. If the parent re-renders and creates a new `onNext` reference, the effect re-runs: sound plays again and `autoAdvanceMs` timer resets. Parents should wrap `onNext` in `useCallback`. This is a dependency stability issue at the call site but worth noting.

### L2 — `AudioPlayer`: no `src` → renders `null` but fallback timer fires `onEnd`

**File:** `audio-player.tsx` lines 43-49, 98

When `src` is empty, the component renders `null` (line 98) but fires `onEnd?.()` after 100ms via fallback timer. This is intentional and documented (line 43 comment). Just confirm all callers expect `onEnd` to fire even when no audio URL is provided. In `activity` and `reinforce` steps, `AudioPlayer` is called without `onEnd` — safe. In `hook`, `onEnd` sets `audioEnded=true` which then potentially triggers auto-advance. If `step.audioUrl` is absent but `step.autoAdvanceMs` is set, hook will auto-advance 100ms after mount. Likely desired but undocumented.

### L3 — Inline styles throughout all components

All components use inline `style={{}}` objects extensively. These create new object references on every render. For a children's app with animations this adds render pressure. Consider extracting to `const styles = {...}` outside the component or using CSS modules.

---

## Positive Observations

- `key={`kw-${activeIndex}`}` on per-keyword `AudioPlayer` is the correct pattern to force remount — elegantly avoids same-src re-play issues.
- `AudioPlayer` fallback timer (100ms for no-src, 2000ms for error) ensures lesson flow never stalls — good defensive design.
- Phase state machine (`intro → keywords → done`) is clean and readable.
- Legacy timer fallback with `hasAudioSync` guard properly isolates old/new code paths.
- `clearFallbackTimer` utility in `AudioPlayer` prevents double-fire on cleanup — well-implemented.
- `useImperativeHandle` replay pattern in `AudioPlayer` is clean.
- All `useEffect` timers in hook/concept/celebrate correctly return cleanup functions.

---

## Recommended Actions

1. **[High]** Fix `setTimeout` in `handleAnswer` (activity + reinforce) — store IDs in refs, clear on unmount.
2. **[High]** Add `onEndRef` pattern in `AudioPlayer` to always call latest `onEnd` regardless of effect dep suppression.
3. **[Medium]** Fix stalled lesson when `reinforce` step has no activity — add fallback "Tiếp tục" button.
4. **[Medium]** Remove redundant `keywords` array from demonstrate steps that have `keywordsWithAudio`.
5. **[Low]** Stabilize `onNext`/`onEnd` callbacks at call sites with `useCallback` to avoid effect re-firing.

---

## Metrics

- Type Coverage: Strong — `KeywordWithAudio`, `DemoPhase`, `AudioPlayerRef` all well-typed
- Linting Issues: 2 intentional `eslint-disable` comments (deps suppression in AudioPlayer) — pragmatic but documented
- Memory Leak Risk: Medium — 2 unguarded `setTimeout` calls in activity/reinforce handlers

---

## Unresolved Questions

- Should `reinforce` step always require an activity, or is a keyword-only reinforce valid? The type allows it but the component returns `null` — a silent dead end.
- Is `autoAdvanceMs` on `hook` step intended to fire even with no `audioUrl`? Current behavior: yes (100ms fallback triggers onEnd → autoAdvance). Should this be gated on `step.audioUrl` existence?
