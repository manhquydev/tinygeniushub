# Phase 03 — Activity Type: DRAWING Canvas

**Context:** [plan.md](./plan.md) | [researcher-01 report](./research/researcher-01-video-activities.md)

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** ~2h
- **Description:** Add DRAWING activity type — kids tap/click on pre-drawn shapes to color them. MVP scope: **color-fill only** (no free-draw), using `react-konva`.

## Key Insights

### MVP Scope Decision
- **Color-fill pre-drawn shapes** (not free-draw) — simpler, no path saving, lower complexity
- Implementation: SVG/Konva shapes rendered, click changes `fill` color
- Evaluation: task is "color all shapes" or "color the circle blue" → check fills match spec

### Why react-konva?
- Click/tap on shape → `fill` update → pure React state
- Native `onTap` for mobile, `onClick` for desktop
- Canvas output exportable as PNG (for evidence upload later)
- No large dependency: `react-konva` + `konva` ≈ 150KB (tree-shakeable)

### Alternative considered: plain Canvas API
- More control but more boilerplate for hit-testing shapes
- react-konva handles hit-testing natively

## Requirements

### DRAWING Spec
```ts
interface DrawingSpec {
  type: "DRAWING";
  instruction: string;         // e.g., "Tô màu con mèo màu cam"
  canvasWidth: number;         // default 400
  canvasHeight: number;        // default 300
  shapes: DrawingShape[];
  colorPalette: string[];      // hex colors for kid to pick from
}

interface DrawingShape {
  id: string;
  kind: "rect" | "circle" | "ellipse" | "polygon";
  props: Record<string, number>;  // x, y, width, height, radius, etc.
  initialFill: string;            // default fill color
  targetFill?: string;            // if set: correct answer validation
  label?: string;                 // accessibility
}
```

### Evaluation Modes
1. **Free coloring** (`targetFill` not set on any shape): always `onAnswer(true)` when "Xong" clicked
2. **Guided coloring** (`targetFill` set): compare current fills to targets, pass if all match

### Admin Builder
- Visual: JSON textarea for spec (MVP — no drag-drop shape builder)
- Rationale: complex visual builder is over-engineering for MVP; admin can paste JSON spec

## Architecture

```
activity-types.ts              → add DrawingSpec + DrawingShape types + parser
drawing-activity.tsx           → react-konva canvas with color picker + shapes
activity-renderer.tsx          → add DRAWING branch
admin-content-panel.tsx        → add DRAWING type + JSON textarea builder
```

## Related Code Files

**Modify:**
- `src/modules/content/activity-types.ts` — add DrawingSpec
- `src/components/lesson-wizard/activity-renderer.tsx` — add DRAWING branch
- `src/components/admin-content-panel.tsx` — add DRAWING to type selector

**Create:**
- `src/components/lesson-wizard/drawing-activity.tsx` (~150 lines)

## Implementation Steps

1. **Install `react-konva` + `konva`**
   ```bash
   npm install react-konva konva
   ```

2. **Add `DrawingSpec` to `activity-types.ts`**
   - Add `DrawingShape` interface
   - Add `DrawingSpec` interface
   - Add `"DRAWING"` to `ActivityType` union
   - Add parser (basic validation: shapes array, palette array)

3. **Create `drawing-activity.tsx`** (~150 lines)
   ```
   State:
   - selectedColor: string (from colorPalette)
   - fills: Record<shapeId, string> (current fill per shape)

   UI:
   - Color palette row: round color swatches
   - Konva Stage → Layer → shapes (rect/circle/ellipse)
   - Each shape: onClick/onTap → fills[shape.id] = selectedColor
   - "Xong" button → validate fills vs targetFills → onAnswer()
   - Mascot watches: gaze toward active shape region
   ```

4. **Update `activity-renderer.tsx`** — add `if (activity.type === "DRAWING")` branch

5. **Update `admin-content-panel.tsx`**
   - Add "Vẽ / Tô màu" to activity type dropdown
   - Show JSON textarea for spec when DRAWING selected
   - Add helper: small spec template comment/example

6. **Dynamic import** `drawing-activity.tsx` in renderer (Konva is canvas-heavy):
   ```ts
   const DrawingActivity = dynamic(() => import('./drawing-activity'), { ssr: false });
   ```

## Todo

- [ ] npm install react-konva konva
- [ ] Add DrawingSpec to activity-types.ts
- [ ] Create drawing-activity.tsx with Konva Stage
- [ ] Dynamic import in activity-renderer.tsx
- [ ] Add DRAWING branch in activity-renderer.tsx
- [ ] Add DRAWING builder to admin-content-panel.tsx
- [ ] Test: tap shape on mobile, free-color mode, guided-color mode

## Success Criteria

- Shapes render on canvas, tap/click changes fill color
- Color palette UI is tappable on mobile (min 44px touch targets)
- Free coloring mode always passes
- Guided coloring mode validates fills correctly
- Admin can paste JSON spec and preview shape count

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Konva SSR incompatibility | Dynamic import with `ssr: false` |
| Large bundle size | Only imported in drawing activity branch |
| Admin struggles with JSON spec | Add JSON spec template in UI as placeholder |
| Shape hit-testing on small mobile | Min shape size 60px in spec validation |

## Security Considerations

- DrawingSpec parsed server-side on activity load — validate numeric bounds
- No user-generated images; shapes are pure geometry (no XSS risk)

## Next Steps

→ Post-MVP: add free-draw mode with brush tool
→ Post-MVP: evidence export (canvas → PNG → upload to R2)
