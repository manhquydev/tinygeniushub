---
phase: A
title: "Fix Duplicate Expressions"
status: pending
priority: P0
effort: 4h
dependencies: none
---

# Phase A: Fix Duplicate Expressions

## Overview

4 state pairs share identical eye+beak combos making them visually indistinguishable. Add 4 new eye variants (wide, angry, nervous, drowsy) and 2 new beak variants (open-wide, grimace) across all 5 characters.

## Context

- [Brainstorm report](../reports/brainstorm-20260226-mascot-video-readiness.md)
- Current expressions: `src/components/mascot/expressions.ts`
- Character renderers: `src/components/mascot/characters/*.tsx`

## Duplicate Pairs (Current)

| State A | State B | Shared eye+beak |
|---------|---------|-----------------|
| surprised | celebrating | star + cheer |
| angry | sad | sad + frown |
| nervous | idle | open + rest |
| bored | sleepy | sleep + rest |

## Files to Modify

- `src/components/mascot/expressions.ts` -- types, paths, mapping
- `src/components/mascot/characters/BigOwl.tsx` -- render new variants
- `src/components/mascot/characters/SmallOwl.tsx`
- `src/components/mascot/characters/DadOwl.tsx`
- `src/components/mascot/characters/SisterOwl.tsx`
- `src/components/mascot/characters/BabyOwl.tsx`

## Implementation Steps

### Step 1: Update types in expressions.ts

```ts
// Add to EyeVariant
export type EyeVariant = "open" | "smile" | "sleep" | "sad" | "star" | "wink"
  | "wide" | "angry" | "nervous" | "drowsy";

// Add to BeakVariant
export type BeakVariant = "rest" | "talking" | "cheer" | "frown"
  | "open-wide" | "grimace";
```

### Step 2: Add SVG path data for new eye variants

#### BigOwl (eyes centered at 165,110 and 235,110, r=18)

```ts
// BIG_EYE_PATHS additions:
wide: {
  // Larger circle eyes (r=21 vs 18), small pupil -- surprise/shock
  left: "M 147 110 C 147 98 183 98 183 110 C 183 122 147 122 147 110 Z",
  right: "M 217 110 C 217 98 253 98 253 110 C 253 122 217 122 217 110 Z",
},
angry: {
  // Angled eyebrows slanting inward-down + slightly narrowed eyes
  left: "M 149 108 C 155 104 175 106 181 112",   // eye curve
  leftBrow: "M 148 100 L 182 106",                // angry brow
  right: "M 219 108 C 225 104 245 106 251 112",
  rightBrow: "M 252 100 L 218 106",
},
nervous: {
  // Slightly squinted + sweat drop
  left: "M 150 112 C 157 106 173 106 180 112",
  right: "M 220 112 C 227 106 243 106 250 112",
  sweatDrop: "M 180 96 Q 183 102 180 108 Q 177 102 180 96 Z",
},
drowsy: {
  // Half-lidded -- upper arc lower than sleep (eyes peeking open)
  left: "M 149 114 C 155 110 175 110 181 114",
  right: "M 219 114 C 225 110 245 110 251 114",
  lidLeft: "M 147 112 L 183 112",   // horizontal lid line
  lidRight: "M 217 112 L 253 112",
},
```

#### SmallOwl (eyes at 186,158 and 214,158)

```ts
// SMALL_EYE_PATHS additions:
wide: {
  left: "M 178 158 C 178 150 194 150 194 158 C 194 166 178 166 178 158 Z",
  right: "M 206 158 C 206 150 222 150 222 158 C 222 166 206 166 206 158 Z",
},
angry: {
  left: "M 179 159 C 183 155 189 156 193 161",
  leftBrow: "M 178 153 L 194 157",
  right: "M 207 159 C 211 155 217 156 221 161",
  rightBrow: "M 222 153 L 206 157",
},
nervous: {
  left: "M 179 160 C 183 156 189 156 193 160",
  right: "M 207 160 C 211 156 217 156 221 160",
  sweatDrop: "M 194 150 Q 196 154 194 158 Q 192 154 194 150 Z",
},
drowsy: {
  left: "M 178.5 162 C 182 159 190 159 193.5 162",
  right: "M 206.5 162 C 210 159 218 159 221.5 162",
  lidLeft: "M 177 160 L 195 160",
  lidRight: "M 205 160 L 223 160",
},
```

#### DadOwl (eyes at 163,105 and 237,105, 1.15x BigOwl)

```ts
// DAD_EYE_PATHS additions:
wide: {
  left: "M 144 105 C 144 92 184 92 184 105 C 184 118 144 118 144 105 Z",
  right: "M 216 105 C 216 92 256 92 256 105 C 256 118 216 118 216 105 Z",
},
angry: {
  left: "M 146 103 C 153 98 173 100 182 107",
  leftBrow: "M 145 94 L 183 101",
  right: "M 218 103 C 225 98 245 100 254 107",
  rightBrow: "M 255 94 L 217 101",
},
nervous: {
  left: "M 147 107 C 155 100 173 100 181 107",
  right: "M 219 107 C 227 100 245 100 253 107",
  sweatDrop: "M 182 90 Q 185 97 182 104 Q 179 97 182 90 Z",
},
drowsy: {
  left: "M 146 109 C 153 105 173 105 182 109",
  right: "M 218 109 C 225 105 245 105 254 109",
  lidLeft: "M 144 107 L 184 107",
  lidRight: "M 216 107 L 256 107",
},
```

#### SisterOwl (eyes at 184,152 and 216,152, 0.75x)

```ts
// SISTER_EYE_PATHS additions:
wide: {
  left: "M 175 152 C 175 145 193 145 193 152 C 193 159 175 159 175 152 Z",
  right: "M 207 152 C 207 145 225 145 225 152 C 225 159 207 159 207 152 Z",
},
angry: {
  left: "M 176 154 C 180 150 188 151 192 155",
  leftBrow: "M 175 147 L 192 151",
  right: "M 208 154 C 212 150 220 151 224 155",
  rightBrow: "M 225 147 L 208 151",
},
nervous: {
  left: "M 176 154 C 180 150 188 150 192 154",
  right: "M 208 154 C 212 150 220 150 224 154",
  sweatDrop: "M 192 143 Q 194 147 192 151 Q 190 147 192 143 Z",
},
drowsy: {
  left: "M 175.5 156 C 179 153 189 153 192.5 156",
  right: "M 207.5 156 C 211 153 221 153 224.5 156",
  lidLeft: "M 174 154 L 194 154",
  lidRight: "M 206 154 L 226 154",
},
```

#### BabyOwl (eyes at 190,183 and 210,183, 0.45x chibi)

```ts
// BABY_EYE_PATHS additions:
wide: {
  left: "M 183 183 C 183 177 197 177 197 183 C 197 189 183 189 183 183 Z",
  right: "M 203 183 C 203 177 217 177 217 183 C 217 189 203 189 203 183 Z",
},
angry: {
  left: "M 184 185 C 187 182 193 183 196 186",
  leftBrow: "M 183 179 L 197 182",
  right: "M 204 185 C 207 182 213 183 216 186",
  rightBrow: "M 217 179 L 203 182",
},
nervous: {
  left: "M 184 185 C 187 182 193 182 196 185",
  right: "M 204 185 C 207 182 213 182 216 185",
  sweatDrop: "M 197 176 Q 198 179 197 182 Q 196 179 197 176 Z",
},
drowsy: {
  left: "M 183.5 187 C 186 185 194 185 196.5 187",
  right: "M 203.5 187 C 206 185 214 185 216.5 187",
  lidLeft: "M 182 185 L 198 185",
  lidRight: "M 202 185 L 218 185",
},
```

### Step 3: Add new beak paths for all characters

```ts
// BIG_BEAK_PATHS additions:
"open-wide": "M 192 125 Q 200 118 208 125 C 207 146 193 146 192 125 Z",
"grimace": "M 193 128 L 196 126 L 200 128 L 204 126 L 207 128 C 205 134 195 134 193 128 Z",

// SMALL_BEAK_PATHS additions:
"open-wide": "M 196 168 L 204 168 L 200 178 Z",
"grimace": "M 196.5 170 L 198.5 168.5 L 200 170 L 201.5 168.5 L 203.5 170 L 200 173 Z",

// DAD_BEAK_PATHS additions:
"open-wide": "M 191 121 Q 200 113 209 121 C 207 143 193 143 191 121 Z",
"grimace": "M 192 124 L 195 122 L 200 124 L 205 122 L 208 124 C 206 131 194 131 192 124 Z",

// SISTER_BEAK_PATHS additions:
"open-wide": "M 196 162 L 204 162 L 200 172 Z",
"grimace": "M 196.5 164 L 198.5 162.5 L 200 164 L 201.5 162.5 L 203.5 164 L 200 167 Z",

// BABY_BEAK_PATHS additions:
"open-wide": "M 197 191 L 203 191 L 200 197 Z",
"grimace": "M 197.5 193 L 199 191.5 L 200 193 L 201 191.5 L 202.5 193 L 200 195 Z",
```

### Step 4: Update STATE_EXPRESSIONS mapping

```ts
export const STATE_EXPRESSIONS: Record<MascotState, MascotExpression> = {
  idle:        { eye: "open",    beak: "rest" },
  happy:       { eye: "smile",   beak: "cheer" },
  thinking:    { eye: "open",    beak: "talking" },
  celebrating: { eye: "star",    beak: "cheer" },      // unchanged
  sad:         { eye: "sad",     beak: "frown" },       // unchanged
  sleepy:      { eye: "sleep",   beak: "rest" },        // unchanged
  playful:     { eye: "wink",    beak: "talking" },
  proud:       { eye: "open",    beak: "cheer" },
  love:        { eye: "smile",   beak: "cheer" },
  surprised:   { eye: "wide",    beak: "open-wide" },   // CHANGED
  excited:     { eye: "wink",    beak: "cheer" },
  nervous:     { eye: "nervous", beak: "rest" },         // CHANGED
  angry:       { eye: "angry",   beak: "grimace" },      // CHANGED
  bored:       { eye: "drowsy",  beak: "rest" },         // CHANGED
};
```

### Step 5: Update character renderers

Each character file (BigOwl, SmallOwl, DadOwl, SisterOwl, BabyOwl) needs new rendering branches in the eye section. Pattern for each:

```tsx
// Add after existing eye === "star" block:

{expression.eye === "wide" ? (
  <>
    <path d={XXX_EYE_PATHS.wide.left} fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
    <circle cx={leftEyeX + pupilOffset} cy={eyeY} r={smallPupilR} fill="#1e1b4b" />
    <circle cx={leftHighlightX + pupilOffset} cy={highlightY} r={highlightR} fill="#ffffff" />
    <path d={XXX_EYE_PATHS.wide.right} fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
    <circle cx={rightEyeX + pupilOffset} cy={eyeY} r={smallPupilR} fill="#1e1b4b" />
    <circle cx={rightHighlightX + pupilOffset} cy={highlightY} r={highlightR} fill="#ffffff" />
  </>
) : null}

{expression.eye === "angry" ? (
  <>
    <path d={XXX_EYE_PATHS.angry.left} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.angry.leftBrow} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.angry.right} stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.angry.rightBrow} stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
  </>
) : null}

{expression.eye === "nervous" ? (
  <>
    <path d={XXX_EYE_PATHS.nervous.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.nervous.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.nervous.sweatDrop} fill="#60a5fa" opacity="0.7" />
  </>
) : null}

{expression.eye === "drowsy" ? (
  <>
    <path d={XXX_EYE_PATHS.drowsy.left} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.drowsy.lidLeft} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.drowsy.right} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <path d={XXX_EYE_PATHS.drowsy.lidRight} stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
  </>
) : null}
```

Also update the fallback branch condition to include new variants that use path-based rendering.

### Step 6: Update BeakVariant Record types

Change `Record<BeakVariant, string>` to include new keys. Since we expanded the union, the existing Records will error until we add the new paths -- this is intentional for type safety.

## Todo

- [ ] Add `wide`, `angry`, `nervous`, `drowsy` to EyeVariant type
- [ ] Add `open-wide`, `grimace` to BeakVariant type
- [ ] Add BIG_EYE_PATHS for 4 new variants
- [ ] Add SMALL_EYE_PATHS for 4 new variants
- [ ] Add DAD_EYE_PATHS for 4 new variants
- [ ] Add SISTER_EYE_PATHS for 4 new variants
- [ ] Add BABY_EYE_PATHS for 4 new variants
- [ ] Add new beak paths for all 5 characters
- [ ] Update STATE_EXPRESSIONS mapping
- [ ] Update BigOwl.tsx renderer for new eye/beak variants
- [ ] Update SmallOwl.tsx renderer
- [ ] Update DadOwl.tsx renderer
- [ ] Update SisterOwl.tsx renderer
- [ ] Update BabyOwl.tsx renderer
- [ ] Verify all 14 states produce visually distinct faces
- [ ] Run build to confirm no type errors

## Success Criteria

- All 14 states visually distinguishable on every character
- No TypeScript errors
- Existing states unchanged in appearance
- New eye variants have proper per-character scaling/positioning
