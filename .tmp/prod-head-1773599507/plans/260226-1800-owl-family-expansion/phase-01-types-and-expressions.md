# Phase 1: Types & Expressions

**Priority:** High | **Status:** pending | **Effort:** S

## Overview

Extend type system and add SVG path data for 3 new character sizes.

## Files to Modify

- `src/components/mascot/types.ts`
- `src/components/mascot/expressions.ts`

## Implementation Steps

### 1.1 Update `types.ts`

```ts
// Extend MascotVariant
export type MascotVariant = "big" | "small" | "duo" | "dad" | "sister" | "baby" | "family";

// Extend ActionPropLayer target
// (in props/index.tsx later, but type here)
```

Add to `MascotProps`:
```ts
// Add optional states for family variant
dadState?: MascotState;
sisterState?: MascotState;
babyState?: MascotState;
dadActionProp?: MascotActionProp;
sisterActionProp?: MascotActionProp;
babyActionProp?: MascotActionProp;
dadGazeDirection?: MascotGazeDirection;
sisterGazeDirection?: MascotGazeDirection;
babyGazeDirection?: MascotGazeDirection;
```

### 1.2 Add Expression Paths in `expressions.ts`

**Dad Owl** — 1.15x BigOwl scale, centered at (200, ~105). Slightly larger head.

```ts
export const DAD_EYE_PATHS = {
  smile: {
    left: "M 144 108 C 153 95 175 95 184 108",
    right: "M 216 108 C 225 95 247 95 256 108",
  },
  sleep: {
    left: "M 146 107 C 156 112 172 112 182 107",
    right: "M 218 107 C 228 112 244 112 254 107",
  },
  sad: {
    left: "M 146 107 C 156 96 172 96 182 107",
    right: "M 218 107 C 228 96 244 96 254 107",
  },
};

export const DAD_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 193 121 Q 200 115 207 121 C 205 135 195 135 193 121 Z",
  talking: "M 193 121 Q 200 115 207 121 C 206 139 194 139 193 121 Z",
  cheer: "M 192.5 120 Q 200 112 207.5 120 C 206 141 194 141 192.5 120 Z",
  frown: "M 193 123 Q 200 128 207 123 C 205 133 195 133 193 123 Z",
};
```

**Sister Owl** — 0.75x BigOwl scale. Body centered ~200, y~155. Eyes at y~152.

```ts
export const SISTER_EYE_PATHS = {
  smile: {
    left: "M 175 155 C 180 147 188 147 193 155",
    right: "M 207 155 C 212 147 220 147 225 155",
  },
  sleep: {
    left: "M 175.5 154 C 179 156 188 156 191.5 154",
    right: "M 208.5 154 C 212 156 220 156 224.5 154",
  },
  sad: {
    left: "M 175.5 154 C 180 148 188 148 191.5 154",
    right: "M 208.5 154 C 212 148 220 148 224.5 154",
  },
};

export const SISTER_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 196.5 162 L 203.5 162 L 200 167 Z",
  talking: "M 196.5 162.5 L 203.5 162.5 L 200 170 Z",
  cheer: "M 196 162 L 204 162 L 200 171 Z",
  frown: "M 196.5 163.5 L 203.5 163.5 L 200 166.5 Z",
};
```

**Baby Owl** — 0.45x BigOwl = smallest. Ultra chibi. Body centered ~200, y~185. Giant eyes.

```ts
export const BABY_EYE_PATHS = {
  smile: {
    left: "M 183 186 C 187 180 193 180 197 186",
    right: "M 203 186 C 207 180 213 180 217 186",
  },
  sleep: {
    left: "M 183.5 185 C 186 187 194 187 196.5 185",
    right: "M 203.5 185 C 206 187 214 187 216.5 185",
  },
  sad: {
    left: "M 183.5 185 C 187 181 193 181 196.5 185",
    right: "M 203.5 185 C 207 181 213 181 216.5 185",
  },
};

export const BABY_BEAK_PATHS: Record<BeakVariant, string> = {
  rest: "M 197.5 191 L 202.5 191 L 200 194 Z",
  talking: "M 197.5 191.5 L 202.5 191.5 L 200 196 Z",
  cheer: "M 197 191 L 203 191 L 200 196.5 Z",
  frown: "M 197.5 192 L 202.5 192 L 200 194 Z",
};
```

> **Note:** These path values are starting points. Fine-tune visually during implementation. The key is maintaining consistent expression system across all 5 characters.

## Success Criteria

- [ ] `MascotVariant` includes `"dad" | "sister" | "baby" | "family"`
- [ ] All 4 path sets (eye + beak) exported for each new character
- [ ] TypeScript compiles clean
- [ ] No breaking changes to existing BigOwl/SmallOwl paths
