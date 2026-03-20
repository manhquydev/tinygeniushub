# Phase 04 — Mascot Enhancement: New States + Combo Streak

**Context:** [plan.md](./plan.md) | [researcher-02 report](./research/researcher-02-mascot-audio.md)

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** ~2.5h
- **Description:** Add 5 new mascot emotional states, combo streak animation (3+ correct in row), and Rive-ready abstraction layer for future migration.

## Key Insights

### Current State
- `MascotState` union: `idle | happy | thinking | celebrating | sad | sleepy | playful | proud | love` (9 states)
- Eye variants: `open | smile | sleep | sad | star | wink` (6)
- Beak variants: `rest | talking | cheer | frown` (4)
- **Audio**: `synth.playTing()`, `playBzz()`, `playYay()`, `playPop()` already implemented in `audio-utils.ts`
- **Confetti**: `canvas-confetti` already imported in `lesson-wizard-flow.tsx`
- `STATE_EXPRESSIONS` in `expressions.ts` maps state → `{eye, beak}`

### 5 New States to Add

| State | Eye | Beak | Use case |
|-------|-----|------|----------|
| `surprised` | `star` | `cheer` (wide open) | Unexpected correct after wrong attempts |
| `excited` | `wink` + bounce | `cheer` | Combo streak building |
| `nervous` | `open` (trembling) | `rest` | Before submitting answer |
| `angry` | `sad` + furrowed | `frown` | 3 wrong in a row |
| `bored` | `sleep` | `rest` | Long inactivity (>30s no interaction) |

### Combo Streak System
- Track consecutive correct answers in `lesson-wizard-flow.tsx`
- Streak thresholds: 3 = `excited`, 5 = `celebrating` + confetti burst
- Already has `confetti` from `canvas-confetti` — need to wire to streak events
- Audio: `synth.playYay()` on streak-5, `synth.playTing()` on each correct

### Rive-Ready Architecture (Research finding)
Build `MascotController` abstraction with `RIVE_READY` flag:
```ts
// When RIVE_READY=false: renders current SVG owl
// When RIVE_READY=true: renders Rive animation
// Zero component refactoring needed when migrating
```

### New Eye SVG Paths (for BigOwl)
- `surprised` → use existing `star` eye (already defined in `BIG_EYE_PATHS`)
- `excited` → use `smile` (same as happy)
- `nervous` → use `open` with shake animation (CSS keyframe)
- `angry` → use `sad` path (invert to frown brow via transform)
- `bored` → use `sleep` path

Most new states reuse existing eye/beak variants — only need CSS animation variants.

## Requirements

### MascotState expansion
- Add 5 new states to TypeScript union
- Add expressions mapping for each new state
- Add narrative context triggers (when to show each state)

### Combo streak
- Track in `lesson-wizard-flow.tsx`: `consecutiveCorrect` counter
- On correct: increment, play `playTing()`
- On wrong: reset to 0, play `playBzz()`
- At 3: set mascot to `excited`
- At 5: set mascot to `celebrating`, fire confetti, play `playYay()`

### Inactivity detection
- `bored` state after 30s no interaction in activity screen
- Reset on any touch/click

## Architecture

```
types.ts          → expand MascotState union (+5 states)
expressions.ts    → add STATE_EXPRESSIONS entries for 5 new states
BigOwl.tsx        → add CSS animation classes for nervous shake, bored yawn
lesson-wizard-flow.tsx → add streak counter + mascot state triggers
mascot-controller.tsx  → NEW: abstraction wrapper (Rive-ready)
```

## Related Code Files

**Modify:**
- `src/components/mascot/types.ts` — add 5 states to MascotState
- `src/components/mascot/expressions.ts` — add STATE_EXPRESSIONS entries
- `src/components/mascot/BigOwl.tsx` — add animation CSS for new states
- `src/components/lesson-wizard/lesson-wizard-flow.tsx` — streak counter

**Create:**
- `src/components/mascot/mascot-controller.tsx` — Rive-ready wrapper (~60 lines)

## Implementation Steps

1. **Update `types.ts`**
   ```ts
   export type MascotState =
     | "idle" | "happy" | "thinking" | "celebrating" | "sad"
     | "sleepy" | "playful" | "proud" | "love"
     | "surprised" | "excited" | "nervous" | "angry" | "bored"; // NEW
   ```

2. **Update `expressions.ts`**
   Add to `STATE_EXPRESSIONS`:
   ```ts
   surprised: { eye: "star", beak: "cheer" },
   excited:   { eye: "wink", beak: "cheer" },
   nervous:   { eye: "open", beak: "rest" },
   angry:     { eye: "sad",  beak: "frown" },
   bored:     { eye: "sleep", beak: "rest" },
   ```

3. **Update `BigOwl.tsx`**
   - Add CSS keyframe for `nervous` state: subtle horizontal shake (transform: translateX ±2px, 0.3s)
   - Add CSS keyframe for `bored` state: slow eye-lid droop + occasional yawn beak open
   - Tie animations to `data-state` attribute on the SVG wrapper

4. **Create `mascot-controller.tsx`** (~60 lines)
   ```ts
   const RIVE_READY = false; // flip to true when .riv file ready

   export function MascotController(props: MascotProps) {
     if (RIVE_READY) {
       return <RiveMascot {...props} />;
     }
     return <KidMascot {...props} />; // current SVG owl
   }
   ```
   - Future: `RiveMascot` component loads `.riv` file + state machine

5. **Update `lesson-wizard-flow.tsx`** — add streak logic:
   ```ts
   const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);

   function handleActivityResult(isCorrect: boolean) {
     if (isCorrect) {
       const next = consecutiveCorrect + 1;
       setConsecutiveCorrect(next);
       synth.playTing(); // already used, confirm wiring
       if (next >= 5) {
         // trigger celebrating + confetti burst
       } else if (next >= 3) {
         // trigger excited state
       }
     } else {
       setConsecutiveCorrect(0);
       // trigger nervous or angry based on total wrongs
     }
   }
   ```

6. **Wire confetti to streak-5**
   - `canvas-confetti` already imported — call `confetti({ particleCount: 80, ... })` on streak-5
   - Fire from mascot position (use `origin: { x: 0.5, y: 0.6 }`)

7. **Inactivity detection** (simple)
   ```ts
   useEffect(() => {
     const timer = setTimeout(() => setMascotState("bored"), 30_000);
     return () => clearTimeout(timer);
   }, [lastInteractionTime]); // reset on any answer/hover
   ```

## Todo

- [ ] Add 5 states to types.ts
- [ ] Add 5 expressions to expressions.ts
- [ ] Add CSS animations to BigOwl.tsx (nervous shake, bored droop)
- [ ] Create mascot-controller.tsx (Rive-ready wrapper)
- [ ] Add consecutiveCorrect streak counter to lesson-wizard-flow.tsx
- [ ] Wire streak-3 → excited state
- [ ] Wire streak-5 → celebrating + confetti + playYay()
- [ ] Wire inactivity → bored (30s timeout)
- [ ] Test: streak 5 chain correct → confetti fires, sound plays

## Success Criteria

- All 14 mascot states render without TypeScript errors
- Streak-3 triggers `excited`, streak-5 triggers `celebrating` + confetti
- `angry` appears after 3 consecutive wrong answers
- `bored` appears after 30s inactivity
- `MascotController` renders current SVG owl (RIVE_READY=false)
- No regression on existing 9 states

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| SVG path mismatch for new states | Reuse existing eye/beak variants (no new paths needed) |
| Confetti fires on every re-render | Gate with `useRef` flag — fire once per streak milestone |
| `bored` timeout conflicts with lesson navigation | Clear timeout in useEffect cleanup |
| TypeScript errors from state union expansion | Update all switch/exhaustive checks in narrative-map.ts |

## Security Considerations

- No external data involved; pure UI state
- Audio: Web Audio API auto-suspended until user gesture — already handled in `AudioSynthesizer.init()`

## Next Steps

→ Post-MVP: commission `.riv` Rive animation file from designer
→ Post-MVP: flip `RIVE_READY = true` in `mascot-controller.tsx`
→ Post-MVP: add `speaking` state + SPEAKING activity type (AI pronunciation)
