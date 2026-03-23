# Phase 2: DadOwl Component

**Priority:** High | **Status:** pending | **Effort:** M
**Depends on:** Phase 1
**Can parallel with:** Phase 3, Phase 4

## Overview

Create `DadOwl.tsx` — largest owl (1.15x BigOwl). Emerald green with round spectacles.

## Files to Create

- `src/components/mascot/characters/DadOwl.tsx`

## Context

- [BigOwl.tsx reference](../../src/components/mascot/characters/BigOwl.tsx) — base pattern to follow
- [Brainstorm spec](../reports/brainstorm-20260226-owl-family-character-design.md#1-cú-bố-dad-owl--bố-cú)

## Design Spec

| Property | Value |
|----------|-------|
| Body fill | `#065f46` (emerald-800) |
| Body shadow | `#064e3b` at 0.15 opacity |
| Chest highlight | `#34d399` at 0.25 opacity |
| Wing stroke | `#34d399` (emerald-400), strokeWidth 7 |
| Eye white | r=20 (larger than BigOwl's 18) |
| Pupil | `#1e1b4b`, r=8 |
| Beak fill | `#f59e0b`, stroke `#d97706` |
| Blush (love/playful) | `#fda4af` at 0.35 |
| Belly patch | `#a7f3d0` at 0.2 opacity, oval shape |

### Unique: Round Spectacles

```svg
<!-- Spectacles — always rendered -->
<circle cx="163" cy="105" r="20" fill="none" stroke="#854d0e" strokeWidth="2" />
<circle cx="237" cy="105" r="20" fill="none" stroke="#854d0e" strokeWidth="2" />
<path d="M 183 105 Q 200 98 217 105" fill="none" stroke="#854d0e" strokeWidth="1.5" />
<!-- Arms going to ears -->
<path d="M 143 105 L 130 85" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" />
<path d="M 257 105 L 270 85" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" />
```

## SVG Geometry

Body shape — scaled up from BigOwl (~1.15x):
```
Shadow: M 120,192 C 120,68 148,42 200,42 C 252,42 280,68 280,192 C 280,240 120,240 120,192 Z
Body:   M 120,189 C 120,65 148,39 200,39 C 252,39 280,65 280,189 C 280,237 120,237 120,189 Z
Chest:  M 140,189 C 140,112 260,112 260,189 C 260,230 140,230 140,189 Z
Belly:  ellipse cx=200 cy=195 rx=30 ry=22, fill=#a7f3d0 opacity=0.2
```

Wings — wider, slightly thicker:
```
Left:  M 120,120 C 98,158 110,200 140,208
Right: M 280,120 C 302,158 290,200 260,208
stroke=#34d399 strokeWidth=7
```

Eye positions: left (163, 105), right (237, 105) — wider apart than BigOwl.

## Implementation Steps

1. Copy BigOwl.tsx structure
2. Update all SVG paths with DadOwl geometry
3. Replace color constants (navy → emerald)
4. Use `DAD_EYE_PATHS` and `DAD_BEAK_PATHS` from expressions
5. Add spectacles SVG (always rendered, before accessory)
6. Adjust pupilOffset to `±2.8` (slightly wider gaze)
7. Wing animation rotation values: increase by ~15% (bigger body = bigger gesture)

## Interface

```ts
interface DadOwlProps {
  state: MascotState;
  expression: MascotExpression;
  gazeDirection: MascotGazeDirection;
  reducedMotion: boolean;
  motionLevel: MascotMotionLevel;
  accessory?: ReactNode;
}
```

## Success Criteria

- [ ] DadOwl renders at 1.15x BigOwl size
- [ ] Spectacles always visible, positioned correctly on eyes
- [ ] All 14 states animate correctly
- [ ] Emerald palette applied consistently
- [ ] Belly patch visible
- [ ] Wing animations proportionally larger
