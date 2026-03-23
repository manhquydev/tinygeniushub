# Phase 4: BabyOwl Component

**Priority:** High | **Status:** pending | **Effort:** M
**Depends on:** Phase 1
**Can parallel with:** Phase 2, Phase 3

## Overview

Create `BabyOwl.tsx` — smallest owl (0.45x BigOwl). Orange chibi with beanie hat. Giant eyes (55% of face).

## Files to Create

- `src/components/mascot/characters/BabyOwl.tsx`

## Context

- [SmallOwl.tsx reference](../../src/components/mascot/characters/SmallOwl.tsx)
- [Brainstorm spec](../reports/brainstorm-20260226-owl-family-character-design.md#3-cú-em-baby-owl-sibling--em-cú)

## Design Spec

| Property | Value |
|----------|-------|
| Body fill | `#ea580c` (orange-600) |
| Body shadow | `#c2410c` at 0.2 opacity |
| Chest/belly | `#fed7aa` at 0.25 opacity |
| Wing stroke | `#fb923c` (orange-400), strokeWidth 3.5 |
| Eye white | r=10 (55% of head width — oversized for chibi) |
| Pupil | `#1e1b4b`, r=4.5 |
| Beak fill | `#fbbf24`, tiny triangle |
| Blush | `#fda4af` at 0.4 (stronger blush — more baby-like) |

### Unique: Beanie Hat (always rendered, slightly tilted)

```svg
<!-- Beanie hat — tilted 5° right -->
<g transform="translate(200, 172) rotate(5)">
  <!-- Hat body -->
  <path d="M -18 0 C -18 -14 -12 -22 0 -22 C 12 -22 18 -14 18 0 Z"
    fill="#fbbf24" />
  <!-- Brim/fold -->
  <path d="M -19 0 C -19 3 19 3 19 0"
    fill="#ea580c" stroke="#ea580c" strokeWidth="1" />
  <!-- Pom-pom -->
  <circle cx="2" cy="-22" r="4" fill="#fb923c" />
</g>
```

### Chibi Proportions

Head:body ratio = 1:0.8 (head BIGGER than body). This is the defining visual trait.

## SVG Geometry

Body — tiny, very round:
```
Shadow: M 180,205 C 180,172 188,165 200,165 C 212,165 220,172 220,205 C 220,216 180,216 180,205 Z
Body:   M 180,203 C 180,170 188,163 200,163 C 212,163 220,170 220,203 C 220,214 180,214 180,203 Z
Belly:  ellipse cx=200 cy=200 rx=12 ry=10 fill=#fed7aa opacity=0.25
```

Wings — tiny stubs:
```
Left:  M 179,188 C 172,192 172,202 179,205
Right: M 221,188 C 228,192 228,202 221,205
stroke=#fb923c strokeWidth=3.5
```

Eye positions: left (190, 183), right (210, 183). Giant relative to head.

## Animation Special Notes

- **Wing flap offset**: left wing 0.15s delayed from right → asymmetric flap for clumsy feel
- **Blink frequency**: faster than other owls (duration 6.0s vs 7.2-7.6s)
- **Celebrating bounce**: higher amplitude (y: [0, -18, 0]) — more exaggerated
- **Nervous shake**: wider (0.4s cycle, ±3 offset vs ±2)

## Implementation Steps

1. Create file following SmallOwl.tsx pattern
2. Apply ultra-chibi proportions (head > body)
3. Orange palette
4. Use `BABY_EYE_PATHS` and `BABY_BEAK_PATHS`
5. Giant eyes: r=10 white, r=4.5 pupil (oversized ratio)
6. Add beanie hat (rendered after body, tilted 5°)
7. Wing animation: add 0.15s delay offset to left wing
8. Faster blink cycle
9. Stronger blush opacity (0.4 vs 0.35)
10. No star badge (that's SmallOwl/Cú Con's thing)
11. PupilOffset: `±1.0` (smaller face = less movement)

## Success Criteria

- [ ] BabyOwl is clearly smallest character
- [ ] Chibi proportions visible (big head, tiny body)
- [ ] Beanie hat always visible, tilted right
- [ ] Giant eyes dominate the face
- [ ] Wing flap is asymmetric/clumsy
- [ ] Clearly distinct from SmallOwl (no star badge, different color, hat, proportions)
