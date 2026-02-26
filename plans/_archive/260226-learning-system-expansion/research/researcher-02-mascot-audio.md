# Researcher-02: Mascot Audio & Visual Effects
Date: 2026-02-26

---

## Topic 1: Web Audio API for Game Sound Effects

### Programmatic Tone — No Audio Files Needed for MVP

```ts
// Singleton context to avoid "too many AudioContexts" warning
let ctx: AudioContext | null = null;
function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq: number, type: OscillatorType = 'sine', dur = 0.3, vol = 0.4) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur); // fade-out
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

// Usage
playTone(880, 'sine', 0.25);       // correct answer — high, clean
playTone(200, 'sawtooth', 0.4);    // wrong answer — low, buzzy
```

### Key Points
- `AudioContext` must be created inside a user-gesture handler (browser autoplay policy).
- Singleton pattern avoids hitting the 6-context browser limit.
- `OscillatorNode` → `GainNode` → `destination` is the minimal graph.
- Envelope shaping (`linearRampToValueAtTime`) prevents click artifacts.
- **No audio files needed for MVP** — fully programmatic. Add real `.mp3` later via `fetch` + `decodeAudioData`.

### File Format Verdict (for future real sounds)
| Format | Compatibility | Size | Verdict |
|--------|-------------|------|---------|
| `.mp3` | Universal | Small | Best for short effects |
| `.ogg` | No Safari | Smaller | Skip unless dual-format |
| `.wav` | Universal | Large | Avoid — no compression |

**Recommendation:** `.mp3` only. ~20–50 KB per short effect. For MVP, use programmatic tones.

**Source:** [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## Topic 2: CSS/Framer-Motion Particle Confetti

### Recommendation: `canvas-confetti` (~3 KB gzip)

Lightest path. No CSS keyframe complexity. Single function call.

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

```tsx
import confetti from 'canvas-confetti';

// Burst from mascot position (pass element ref or screen coords)
function burstConfetti(originX = 0.5, originY = 0.6) {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { x: originX, y: originY },
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7'],
    disableForReducedMotion: true, // accessibility
  });
}
```

### Framer Motion Integration

Trigger after answer animation completes:
```tsx
<motion.div
  animate={isCorrect ? { scale: [1, 1.3, 1] } : { x: [-8, 8, -8, 0] }}
  onAnimationComplete={() => isCorrect && burstConfetti()}
>
  <MascotComponent />
</motion.div>
```

### Pure CSS Alternative (not recommended)
- Requires 30–50 `<span>` DOM nodes with randomized `@keyframes`.
- Complex, brittle, worse performance than canvas — skip unless zero-dep is hard requirement.

**Sources:**
- [canvas-confetti npm](https://www.npmjs.com/package/canvas-confetti)
- [react-canvas-confetti GitHub](https://github.com/ulitcos/react-canvas-confetti)

---

## Topic 3: Rive Animation — Architecture Prep

### `@rive-app/react-canvas` Usage

```bash
npm install @rive-app/react-canvas
```

```tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

function Mascot({ state }: { state: 'idle' | 'happy' | 'sad' }) {
  const { rive, RiveComponent } = useRive({
    src: '/mascot.riv',
    stateMachines: 'MascotSM',
    autoplay: true,
  });

  const happyInput = useStateMachineInput(rive, 'MascotSM', 'isHappy');
  const sadInput   = useStateMachineInput(rive, 'MascotSM', 'isSad');

  useEffect(() => {
    if (!happyInput || !sadInput) return;
    happyInput.value = state === 'happy';
    sadInput.value   = state === 'sad';
  }, [state, happyInput, sadInput]);

  return <RiveComponent style={{ width: 200, height: 200 }} />;
}
```

### State Machine Design (in Rive Editor)
Define Boolean inputs in Rive editor: `isHappy`, `isSad`, `isThinking`.
States: `Idle` → `Happy` (on `isHappy=true`) → `Idle`, etc.
Logic stays in `.riv` file — React only passes boolean triggers.

### Abstraction Layer (Rive-Ready Architecture)

```tsx
// src/components/mascot/mascot-controller.tsx
type MascotState = 'idle' | 'happy' | 'sad' | 'thinking';

interface MascotControllerProps {
  state: MascotState;
  size?: number;
}

// Wraps Rive OR a fallback emoji/CSS mascot during dev
function MascotController({ state, size = 200 }: MascotControllerProps) {
  const RIVE_READY = false; // flip to true when .riv file exists
  if (!RIVE_READY) return <FallbackMascot state={state} size={size} />;
  return <RiveMascot state={state} size={size} />;
}
```

This lets the team ship a CSS/emoji mascot now and swap in Rive with one flag.

### Rive vs Lottie Summary
| Metric | Rive | Lottie |
|--------|------|--------|
| File size (complex) | ~18 KB | ~180 KB |
| Runtime size | ~78 KB WASM | ~50 KB JS |
| Multi-state support | Native State Machine | Manual JS |
| GPU usage (benchmark) | 2.6 MB | 150–190 MB |
| React DX | `useStateMachineInput` hook | play/pause only |

**Recommendation:** Rive is the right long-term choice for an interactive mascot with multiple states. Use the abstraction layer above to decouple implementation timing.

**Sources:**
- [Rive React Docs](https://rive.app/docs/runtimes/react/react)
- [Rive vs Lottie — Callstack](https://www.callstack.com/blog/lottie-vs-rive-optimizing-mobile-app-animation)
- [Interactive Mascot with Rive — dev.to](https://dev.to/uianimation/how-react-developers-can-add-an-interactive-mascot-to-their-app-using-rive-1f20)

---

## MVP Recommendation Summary

| Feature | MVP Approach | Future |
|---------|-------------|--------|
| Sound effects | Programmatic tones (Web Audio API) | `.mp3` via `decodeAudioData` |
| Confetti | `canvas-confetti` 3KB | Same |
| Mascot animation | CSS/emoji with `MascotController` abstraction | Swap in Rive `.riv` |

---

## Unresolved Questions
1. Will a `.riv` file be produced by a designer, or does the dev team need to create it in the Rive editor?
2. Target browser list — if IE11/old Safari excluded, `AudioContext` (no webkit prefix) is safe.
3. Should confetti colors match brand palette defined in design system?
