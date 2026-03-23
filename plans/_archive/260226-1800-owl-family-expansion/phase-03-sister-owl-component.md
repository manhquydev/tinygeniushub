# Phase 3: SisterOwl Component

**Priority:** High | **Status:** pending | **Effort:** M
**Depends on:** Phase 1
**Can parallel with:** Phase 2, Phase 4

## Overview

Create `SisterOwl.tsx` — medium owl (0.75x BigOwl). Violet with flower bow and tall ear tufts.

## Files to Create

- `src/components/mascot/characters/SisterOwl.tsx`

## Context

- [SmallOwl.tsx reference](../../src/components/mascot/characters/SmallOwl.tsx) — closest size reference
- [Brainstorm spec](../reports/brainstorm-20260226-owl-family-character-design.md#2-cú-chị-sister-owl--chị-cú)

## Design Spec

| Property | Value |
|----------|-------|
| Body fill | `#7c3aed` (violet-600) |
| Body shadow | `#6d28d9` at 0.18 opacity |
| Chest highlight | `#a78bfa` at 0.22 opacity |
| Wing stroke | `#a78bfa` (violet-400), strokeWidth 5 |
| Eye white | r=11 |
| Pupil | `#1e1b4b`, r=5 |
| Beak fill | `#fbbf24`, triangle shape like SmallOwl |
| Blush | `#fda4af` at 0.35 |
| Ear tufts | `#7c3aed` filled, taller/pointier than SmallOwl |

### Unique: Flower Bow (always rendered)

```svg
<!-- Flower bow — top-right of head -->
<g transform="translate(218, 132)">
  <!-- Petals -->
  <circle cx="0" cy="-5" r="4" fill="#f472b6" />
  <circle cx="4.5" cy="-1" r="4" fill="#f472b6" />
  <circle cx="2.8" cy="4" r="4" fill="#f472b6" />
  <circle cx="-2.8" cy="4" r="4" fill="#f472b6" />
  <circle cx="-4.5" cy="-1" r="4" fill="#f472b6" />
  <!-- Center -->
  <circle cx="0" cy="0" r="2.5" fill="#fbbf24" />
</g>
```

### Unique: Ear Tufts

```svg
<!-- Left ear tuft -->
<path d="M 178 140 C 174 128 170 118 168 108" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" fill="none" />
<path d="M 180 140 C 178 130 175 120 174 112" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
<!-- Right ear tuft -->
<path d="M 222 140 C 226 128 230 118 232 108" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" fill="none" />
<path d="M 220 140 C 222 130 225 120 226 112" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" fill="none" />
```

## SVG Geometry

Body — between SmallOwl and BigOwl:
```
Shadow: M 165,196 C 165,140 178,128 200,128 C 222,128 235,140 235,196 C 235,220 165,220 165,196 Z
Body:   M 165,193 C 165,137 178,125 200,125 C 222,125 235,137 235,193 C 235,217 165,217 165,193 Z
Chest:  M 175,193 C 175,155 225,155 225,193 C 225,215 175,215 175,193 Z
```

Wings:
```
Left:  M 164,163 C 152,170 151,190 164,196
Right: M 236,163 C 248,170 249,190 236,196
stroke=#a78bfa strokeWidth=5
```

Eye positions: left (184, 152), right (216, 152).

## Implementation Steps

1. Create file following SmallOwl.tsx pattern
2. Scale body geometry to 0.75x BigOwl
3. Apply violet palette
4. Use `SISTER_EYE_PATHS` and `SISTER_BEAK_PATHS`
5. Add ear tufts (rendered before body for behind-head effect)
6. Add flower bow (rendered after body, always visible)
7. PupilOffset: `±1.6`
8. Wing animation: medium intensity between Big and Small

## Success Criteria

- [ ] SisterOwl renders between SmallOwl and BigOwl in size
- [ ] Flower bow always visible on top-right of head
- [ ] Ear tufts taller/pointier than SmallOwl
- [ ] Violet palette consistent
- [ ] Distinguishable silhouette from SmallOwl
