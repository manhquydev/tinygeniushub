# Phase 5: Mascot Integration

**Priority:** High | **Status:** pending | **Effort:** L
**Depends on:** Phase 2, 3, 4

## Overview

Wire 3 new characters into Mascot.tsx renderer, ActionPropLayer, and exports.

## Files to Modify

- `src/components/mascot/Mascot.tsx`
- `src/components/mascot/props/index.tsx`
- `src/components/mascot/index.ts`
- `src/components/mascot/mascot-controller.tsx` (if needed)

## Implementation Steps

### 5.1 ActionPropLayer — Add New Targets

Update `props/index.tsx`:

```ts
interface ActionPropLayerProps {
  actionProp: MascotActionProp;
  target: "big" | "small" | "dad" | "sister" | "baby";
  reducedMotion: boolean;
}
```

Each prop component (HeartProp, MagicProp, etc.) needs position offsets for new targets. Add position maps:

| Target | Anchor offset (relative to character center) |
|--------|----------------------------------------------|
| dad | Similar to "big" but 15% larger |
| sister | Between "big" and "small" |
| baby | Smaller than "small" |

### 5.2 Mascot.tsx — Add Solo Rendering

Add imports:
```ts
import { DadOwl } from "@/components/mascot/characters/DadOwl";
import { SisterOwl } from "@/components/mascot/characters/SisterOwl";
import { BabyOwl } from "@/components/mascot/characters/BabyOwl";
```

Add rendering blocks for `variant === "dad"`, `variant === "sister"`, `variant === "baby"` following same pattern as "big"/"small":

```tsx
{variant === "dad" ? (
  <m.g animate={animate} transition={transition}>
    <DadOwl
      state={state}
      expression={STATE_EXPRESSIONS[state]}
      gazeDirection={gazeDirection}
      reducedMotion={effectiveMotionLevel === "minimal"}
      motionLevel={effectiveMotionLevel}
      accessory={<ActionPropLayer actionProp={actionProp} target="dad" ... />}
    />
  </m.g>
) : null}
```

### 5.3 Family Variant

Add `variant === "family"` — renders all 5 owls in a row:

```
Layout: DadOwl | BigOwl(Mẹ) | SisterOwl | SmallOwl(Con) | BabyOwl
```

Translate offsets for horizontal layout (viewBox may need widening for family):
```
Dad:    translate(-160, 0)
Mẹ:     translate(-80, 0)
Chị:    translate(0, 10)
Con:    translate(70, 18)
Em:     translate(130, 25)
```

**ViewBox adjustment:** Family variant uses wider viewBox `"0 0 560 280"` to fit all 5.

### 5.4 Helper Updates

- `getMarkerAnchor()`: add cases for dad, sister, baby, family
- `getZoomAnchor()`: add cases for new variants
- `resolvedTitle`: add Vietnamese names for new variants

### 5.5 Export Updates

Update `index.ts`:
```ts
export { Mascot } from "@/components/mascot/Mascot";
export type { ..., } from "@/components/mascot/types";
// Characters are internal — no need to export individually
```

## Success Criteria

- [ ] Each new variant renders solo correctly
- [ ] Family variant shows all 5 characters
- [ ] ActionProps position correctly on all characters
- [ ] State markers appear correctly
- [ ] Zoom works for new variants
- [ ] Existing "big", "small", "duo" unchanged
- [ ] TypeScript compiles clean
