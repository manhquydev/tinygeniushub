# Phase 6: Showcase & Tests

**Priority:** Medium | **Status:** pending | **Effort:** M
**Depends on:** Phase 5

## Overview

Update showcase component and tests to cover all 5 characters.

## Files to Modify

- `src/components/mascot/mascot-ecosystem-showcase.tsx`
- `src/components/mascot/Mascot.test.tsx`

## Implementation Steps

### 6.1 Update Showcase

Add new sections to ecosystem showcase:
- DadOwl solo with all states
- SisterOwl solo with all states
- BabyOwl solo with all states
- Family group variant
- Mixed duo combos: Dad+Con, Chị+Em, Bố+Mẹ

### 6.2 Update Tests

Add test cases for:
- Each new variant renders without error
- Family variant renders all 5 characters
- New characters have correct aria-labels
- State transitions work for new variants
- Snapshot updates

### 6.3 Visual QA Checklist

- [ ] All 5 characters distinguishable by color alone
- [ ] All 5 characters distinguishable by silhouette alone
- [ ] Accessories (spectacles, bow, beanie) render at all states
- [ ] Blush appears on love/playful for all characters
- [ ] Wing animations proportional to character size
- [ ] Family variant spacing looks balanced
- [ ] Reduced motion mode works for all characters
- [ ] Soft motion mode works for all characters

## Success Criteria

- [ ] Showcase page displays all characters and variants
- [ ] All existing tests still pass
- [ ] New tests pass
- [ ] Snapshots updated
- [ ] Visual inspection confirms design spec compliance
