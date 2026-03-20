# QA Report: Interactive Lesson Preview E2E Tests
**Date:** 2026-02-27
**Page:** `/interactive-lesson-preview`
**Lesson tested:** Âm /a/ và /m/ (first lesson, `demoLessonAmA`)

---

## Test Results Overview

| Metric | Value |
|--------|-------|
| Total tests | 16 |
| Passed | **16** |
| Failed | 0 |
| Skipped | 0 |
| Total duration | ~2.7 min |

All 16 tests pass.

---

## Coverage: Steps Verified

| Step | What was verified | Result |
|------|-----------------|--------|
| Selector page | Heading visible, first lesson selected with ▶ indicator | PASS |
| Hook | Opens on click, speech bubble "Chào con!", "Bắt đầu" button, lesson title in header | PASS |
| Concept | Subtext visible, speaker replay button (`title="Nghe lại"`), speech bubble "Đây là âm A" | PASS |
| Demonstrate | First keyword card "ant" appears, all cards (ant, apple, map) revealed sequentially | PASS |
| Activity | Quiz prompt "Từ nào có âm /a/?" visible, all options (apple, egg, ice, owl) visible | PASS |
| Celebrate | "Giỏi lắm!" speech bubble, "Tiếp tục ngay..." progress hint | PASS |
| Full flow | No critical JS errors end-to-end | PASS |

---

## Screenshots Saved

All 16 screenshots at:
`D:/project/cungcontuhoc/test-results/interactive-lesson-screenshots/`

Key screenshots:
- `01-page-loaded.png` — selector page
- `04-hook-batdau-button.png` — Hook step with pulsing button
- `08-concept-speech-bubble.png` — Concept step with keyword and speaker
- `11-demonstrate-all-cards.png` — all 3 keyword cards visible
- `13-activity-all-options.png` — quiz with 4 options
- `14-celebrate-speech-bubble.png` — celebrate step
- `16-full-flow-complete.png` — completed flow

---

## Test File

`D:/project/cungcontuhoc/tests/e2e/interactive-lesson-preview.spec.ts`

---

## Key Implementation Notes

**Audio mocking:** All `.mp3` requests intercepted with empty 200 response. The `AudioPlayer` component handles this via a 2s error fallback before calling `onEnd`. This drives step timing:
- Hook: audio error (2s) + `autoAdvanceMs` (2.5s) = ~4.5s auto-advance
- Concept: audio error (2s) + 500ms delay = ~2.5s → "Tiếp tục" appears
- Demonstrate: intro audio error (2s) + 3 keyword audio errors (2s each) = ~8s to show all cards

**Selector issues fixed:**
- `"Bắt đầu"` button required `exact: true` to avoid matching `"Bắt đầu: Âm /a/ và /m/"`
- Hook auto-advance race condition fixed with try/catch on `clickLessonBatDau`
- Keyword `/a/` text split across `<span>` elements — used subtext selector instead
- Demonstrate step has no speech bubble — used keyword card text as step indicator
- Activity step has no speech bubble — used `ActivityRenderer` quiz prompt text

**Demonstrate step:** The `LessonStepDemonstrate` component does NOT render a speech bubble (`speech` field in step data is unused by this component). Tests assert keyword card appearance instead.

**Activity step:** The `LessonStepActivity` component does NOT render a speech bubble. Tests assert quiz prompt from `ActivityRenderer`.

---

## Performance Metrics

| Step navigation | Approx. time |
|----------------|-------------|
| Selector → Hook | ~1.9s |
| Hook → Concept | ~4.5s (audio error + autoAdvance) |
| Concept → Demonstrate | ~2.5s (audio error + Tiếp tục click) |
| Demonstrate → Activity | ~10s (3 keyword audio errors + Tiếp tục click) |
| Activity → Celebrate | ~2s (click correct answer + 1.2s delay) |

---

## Recommendations

1. **Speech field unused in Demonstrate and Activity steps** — the `speech` property on those step types is defined in data but never rendered. Either render it (e.g. speech bubble) or remove from type to reduce confusion.
2. **Long test runtime (~2.7min)** — due to 2s audio error fallback per audio file. Consider adding a test-mode flag to skip audio delays, or mock audio to fire `onEnd` immediately via a proper WAV stub file.
3. **Demonstrate step has no visual speech element** — consider adding a brief speech bubble for the "Nghe nào!" prompt to improve child UX and make step easily testable.

---

## Unresolved Questions

- None.
