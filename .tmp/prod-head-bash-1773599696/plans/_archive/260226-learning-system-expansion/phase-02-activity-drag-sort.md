# Phase 02 — Activity Types: DRAG_DROP + SORT_ORDER

**Context:** [plan.md](./plan.md) | [researcher-01 report](./research/researcher-01-video-activities.md)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** ~3h
- **Description:** Add 2 interactive activity types. `SORT_ORDER` type already has TypeScript definition + parser but no renderer. `DRAG_DROP` is completely new.

## Key Insights

### SORT_ORDER (already 80% done)
- Type defined in `activity-types.ts`: `{ items: string[], correctOrder: number[] }`
- `parseActivitySpec()` handles it
- **Missing:** renderer in `activity-renderer.tsx` (falls through to "unsupported" message)
- **Missing:** admin builder UI

### DRAG_DROP (new)
- New spec type: drag items into labeled drop zones
- Best library: **`@dnd-kit/core`** — `react-beautiful-dnd` is deprecated, broken touch
- Use `PointerSensor` + `TouchSensor` for tablet support
- Kids activity: drag word/image card → correct category box

### Admin Builder Pattern
Existing admin builders (in `admin-content-panel.tsx`) use inline JSON-like forms. Follow same pattern with spec-specific form fields.

## Requirements

### DRAG_DROP Spec
```ts
interface DragDropSpec {
  type: "DRAG_DROP";
  instruction: string;        // e.g., "Kéo số vào ô đúng"
  items: { id: string; label: string; imageUrl?: string }[];
  dropZones: { id: string; label: string; acceptsItemId: string }[];
}
```
- Items are draggable cards (text or image)
- Drop zones are labeled target areas
- Correct when all items placed in matching zone

### SORT_ORDER Spec (existing)
```ts
interface SortOrderSpec {
  type: "SORT_ORDER";
  items: string[];          // shuffled display items
  correctOrder: number[];   // indices in correct order
}
```
- Display as draggable list
- User reorders; submit to check

## Architecture

```
activity-types.ts          → add DragDropSpec + update ActivitySpec union
activity-renderer.tsx      → add DRAG_DROP + SORT_ORDER render branches
admin-content-panel.tsx    → add DRAG_DROP + SORT_ORDER builder forms
```

**Component breakdown:**

```
activity-renderer.tsx
  ├── SortOrderActivity (new — ~80 lines, extract to own file if >80 lines)
  └── DragDropActivity  (new — ~100 lines, extract to own file)
```

## Related Code Files

**Modify:**
- `src/modules/content/activity-types.ts` — add `DragDropSpec` type + parser
- `src/components/lesson-wizard/activity-renderer.tsx` — add 2 render branches
- `src/components/admin-content-panel.tsx` — add builder forms for both types

**Create:**
- `src/components/lesson-wizard/sort-order-activity.tsx` — if renderer grows >150 lines
- `src/components/lesson-wizard/drag-drop-activity.tsx` — likely needed given dnd-kit setup

## Implementation Steps

1. **Install `@dnd-kit/core` + `@dnd-kit/sortable`**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **Add `DragDropSpec` to `activity-types.ts`**
   - Add type + interface
   - Add parser branch in `parseActivitySpec()`
   - Add `"DRAG_DROP"` to `ActivityType` union
   - Update `normalizeType()` switch

3. **Create `drag-drop-activity.tsx`** (~100 lines)
   - `DraggableItem` component (useDraggable hook)
   - `DropZone` component (useDroppable hook)
   - State: `Record<itemId, zoneId>` for current placements
   - On drop: check if all items in correct zones → `onAnswer(true/false)`
   - Touch: configure `TouchSensor` with 8px tolerance, 100ms delay
   - Mascot gaze: left when dragging from left zone, right from right

4. **Create `sort-order-activity.tsx`** (~80 lines)
   - Use `@dnd-kit/sortable` with `SortableContext`
   - `SortableItem` renders each reorderable card
   - "Kiểm tra" button to submit current order vs `correctOrder`
   - Wobble animation on wrong, bounceIn on correct

5. **Update `activity-renderer.tsx`**
   - Import + render `<DragDropActivity>` and `<SortOrderActivity>`
   - Pass `onAnswer`, `disabled`, `onHoverOption` props

6. **Update `admin-content-panel.tsx`**
   - Add DRAG_DROP form: items array builder (label + optional imageUrl), drop zones builder
   - Add SORT_ORDER form: items array builder (text items), correctOrder input (comma-separated indices)
   - Add both to activity type selector dropdown

## Todo

- [ ] npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
- [ ] Add DragDropSpec to activity-types.ts + parser
- [ ] Create drag-drop-activity.tsx
- [ ] Create sort-order-activity.tsx
- [ ] Update activity-renderer.tsx with both branches
- [ ] Add admin builder forms to admin-content-panel.tsx
- [ ] Test: drag-drop on mobile (touch events), sort-order reorder + submit

## Success Criteria

- DRAG_DROP: items drag to zones, correct placement → `onAnswer(true)`
- SORT_ORDER: reorder + submit, correct sequence → `onAnswer(true)`
- Both work on touch (tablet/phone)
- Admin can create both types in CMS without editing JSON directly
- Mascot reacts (gaze tracking) during interaction

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| dnd-kit touch events on Android | Use TouchSensor + 8px activation tolerance |
| SORT_ORDER correctOrder mismatches | Parser validates array lengths match |
| activity-renderer.tsx growing too large | Extract each activity to own file (already planned) |

## Security Considerations

- `imageUrl` in DragDropSpec: validate is relative path or known CDN domain (Cloudflare R2 / Bunny CDN) to prevent open redirect / content injection

## Next Steps

→ Phase 03 (DRAWING) can run in parallel
→ Phase 04 (mascot) independent
