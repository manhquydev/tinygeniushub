# TTS Audio + UI Animation Sync — Research Report
Date: 2026-02-27

---

## Summary

Syncing keyword card reveals to TTS narration in a children's edu app. Evaluated 4 options. **Recommendation: Option C (separate audio per keyword)** for simplicity and perfect sync, with Option A (timestamps) as a future upgrade path.

---

## Option Analysis

### Option A — Pre-computed word-level timestamps
**Gemini TTS does NOT return word-level timestamps.** The `gemini-2.5-flash` audio endpoint returns raw PCM/WAV data only — no timing metadata, no word boundary events. This rules out native Gemini timestamp support.

Workaround: run a forced-alignment tool (e.g. Gentle, WhisperX, or Google Cloud Speech-to-Text with `enable_word_time_offsets`) against the generated audio to get timestamps post-hoc. This requires a secondary API call or local processing step during content authoring.

**Verdict:** Feasible but requires extra tooling. Best for large-scale production. Overkill for current stage.

### Option B — Duration-based even split
Audio duration / N keywords = offset per card. Fails because children's TTS speech is uneven — words like "ant" (0.3s) vs "apple" (0.5s) + natural pauses make equal splits inaccurate by 200–500ms, which is noticeable to children.

**Verdict:** Reject. Too inaccurate for child-facing UX.

### Option C — Separate audio per keyword (RECOMMENDED)
One short MP3 per keyword. Play clip → card reveals → wait `ended` event → play next clip. Perfect sync by construction. No alignment needed.

- Files: `step-3-ant.mp3`, `step-3-apple.mp3`, `step-3-map.mp3` + optional `step-3-intro.mp3` ("Nghe nào!")
- Total overhead: ~3 extra files per demonstrate step. For 7 lessons × avg 3 keywords = ~21 extra files. Manageable.
- Gap between clips: ~50–100ms natural pause, fine for children (actually feels like deliberate pacing).
- Works with existing `AudioPlayer` — just sequence them.

**Verdict:** Best fit for current scale. Implement now.

### Option D — Web Speech API
`SpeechSynthesisUtterance` fires `onboundary` events per word. Works in Chrome but unreliable in Safari/Firefox. Vietnamese TTS quality is poor in browsers. Not viable for production Vietnamese content.

**Verdict:** Reject for production. OK only as no-audio fallback for demo/test.

---

## How Existing Apps Solve This

- **Duolingo** uses pre-recorded per-word audio clips for their word-tap exercises — exactly Option C.
- **Khan Academy Kids** uses scripted per-scene audio (one audio per visual beat), equivalent to Option C.
- **Epic! Books** uses word-level timestamps from Amazon Polly (which does return timestamps) — Option A variant.

Industry consensus: Option C for simplicity; Option A only when you control the TTS pipeline end-to-end with a provider that supports word timing (AWS Polly, Azure Cognitive Speech, ElevenLabs).

---

## Recommended Data Structure

Extend `InteractiveLessonStep` to support per-keyword audio:

```ts
// In interactive-lesson-types.ts
export interface KeywordWithAudio {
  word: string;
  audioUrl?: string; // per-keyword clip; falls back to fixed timer if absent
}

export interface InteractiveLessonStep {
  // ...existing fields...
  keywords?: string[];           // keep for backward compat
  keywordsWithAudio?: KeywordWithAudio[]; // new: use when available
}
```

Lesson data example:
```ts
{
  type: "demonstrate",
  keywords: ["ant", "apple", "map"],            // backward compat display
  keywordsWithAudio: [
    { word: "ant",   audioUrl: "/audio/lessons/am-a/kw-ant.mp3" },
    { word: "apple", audioUrl: "/audio/lessons/am-a/kw-apple.mp3" },
    { word: "map",   audioUrl: "/audio/lessons/am-a/kw-map.mp3" },
  ],
  audioUrl: "/audio/lessons/am-a/step-3-intro.mp3", // plays first: "Nghe nào!"
}
```

---

## Implementation Plan

### Files to modify

1. `src/components/interactive-lesson/interactive-lesson-types.ts` — add `KeywordWithAudio` interface
2. `src/components/interactive-lesson/lesson-step-demonstrate.tsx` — replace 1.5s timer with audio-sequenced reveal
3. `src/components/interactive-lesson/audio-player.tsx` — no change needed (already has `onEnd` callback)
4. `src/components/interactive-lesson/data/demo-lesson-am-a.ts` — add `keywordsWithAudio` when audio files exist

### Core sync logic (lesson-step-demonstrate.tsx)

Replace the `setTimeout` cascade with an audio-sequenced state machine:

```tsx
// Pseudocode — replace the existing useEffect timer block

const [phase, setPhase] = useState<"intro" | "keywords" | "done">("intro");
const [activeIndex, setActiveIndex] = useState(-1); // -1 = no card shown yet

const keywordsWithAudio = step.keywordsWithAudio ?? [];
const useAudioSync = keywordsWithAudio.length > 0;

// Called when intro audio ends (or immediately if no intro)
const handleIntroEnd = () => {
  setPhase("keywords");
  setActiveIndex(0); // reveal first card
};

// Called when keyword[i] audio ends
const handleKeywordAudioEnd = (index: number) => {
  synth.playPop(); // optional pop sound after each word
  const next = index + 1;
  if (next < keywordsWithAudio.length) {
    setActiveIndex(next);
  } else {
    setPhase("done");
    setAllCardsShown(true);
  }
};
```

Render pattern:
```tsx
{/* Play intro audio first */}
{phase === "intro" && (
  <AudioPlayer src={step.audioUrl} autoPlay onEnd={handleIntroEnd} />
)}

{/* Play per-keyword audio as each card is revealed */}
{phase === "keywords" && activeIndex >= 0 && useAudioSync && (
  <AudioPlayer
    key={activeIndex} // key change forces remount = replays
    src={keywordsWithAudio[activeIndex]?.audioUrl}
    autoPlay
    onEnd={() => handleKeywordAudioEnd(activeIndex)}
  />
)}
```

Key insight: `key={activeIndex}` on AudioPlayer forces React to remount the audio element for each keyword, guaranteeing a fresh play from the start. No need for imperative `replay()`.

### Graceful degradation

If `keywordsWithAudio` is absent or a keyword has no `audioUrl`, fall back to the existing 1.5s timer. This means zero breaking changes — all existing lessons continue working.

```tsx
const useAudioSync = keywordsWithAudio.some(k => k.audioUrl);
// if !useAudioSync → keep existing setTimeout(1500) logic
```

---

## Audio File Generation

Extend `generate-voiceover.ts` or create a new script `scripts/generate-keyword-audio.ts`:

```ts
// For each keyword, call Gemini TTS with just the word
// Save to /public/audio/lessons/{lessonId}/kw-{word}.mp3
async function generateKeywordAudio(lessonId: string, keywords: string[]) {
  for (const word of keywords) {
    await generateVoiceover(word, `public/audio/lessons/${lessonId}/kw-${word}.mp3`);
  }
}
```

One Gemini TTS call per keyword — fast, cheap (single words are <0.5s audio).

---

## Migration Path

1. **Now**: Implement the fallback-aware sync logic in `lesson-step-demonstrate.tsx`. No data changes needed — existing lessons still use 1.5s timer.
2. **Short term**: Run keyword audio generation script for `am-a` lesson, add `keywordsWithAudio` to its data file, test sync.
3. **Future (optional)**: If you want a single combined audio with precise timing, switch to AWS Polly (supports `SpeechMarkType: word`) or Azure Cognitive Speech — both return word timestamps in their TTS response. Gemini does not.

---

## Unresolved Questions

1. Should the intro phrase ("Nghe nào!") be part of `step.audioUrl` or a separate field? Current plan reuses `step.audioUrl` as intro, which means it plays before any cards appear — verify this UX is correct.
2. Should `synth.playPop()` fire when the card appears (before its audio) or after? Currently fires after — may feel better before (card appears with pop, then word audio plays).
3. No Gemini TTS timestamp support confirmed as of Feb 2026 — recheck if Gemini 2.5 Pro audio API adds this in future.
