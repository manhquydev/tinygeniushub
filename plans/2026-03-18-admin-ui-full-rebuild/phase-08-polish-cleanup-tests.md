# Phase 8: Visual Polish + CSS Cleanup + Tests

## Context Links
- globals.css: `src/app/globals.css` (~172 admin CSS class selectors to clean)
- Existing tests: `pnpm test` (vitest), `pnpm test:e2e:pw` (playwright)
- Visual regression snapshots: `tests/e2e/courses-visual-regression.spec.ts-snapshots/`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Description:** Final pass: audit visual consistency across all 13 modules, delete all obsolete admin CSS from globals.css, run full test suite, fix any regressions.

## Key Insights
- globals.css has ~172 admin-specific CSS selectors to audit
- Delete only classes confirmed not used by any component after rebuild
- Some CSS classes may be shared with non-admin pages (e.g., `card`, `page-stack`, `muted-text`) — DO NOT delete shared classes
- Playwright visual regression tests exist for courses — update snapshots after rebuild
- Must verify mobile responsive on all pages

## Requirements
### Functional
- All 13 admin modules render correctly on desktop and mobile
- Dark sidebar / light content consistent across all pages
- No orphaned CSS classes in globals.css
- All existing tests pass

### Non-functional
- Lighthouse accessibility score maintained or improved
- No layout shifts or jank during navigation
- Consistent spacing, typography, colors across all modules

## Related Code Files
### Modify
- `src/app/globals.css` — delete obsolete admin CSS class selectors
- Visual regression snapshot files — update after rebuild

### Delete
- No files deleted — only CSS class blocks removed from globals.css

## Implementation Steps

1. **Audit admin CSS classes**
   - List all `.admin-*` class selectors in globals.css
   - For each, grep codebase to check if still referenced
   - Mark as: keep (still used) or delete (no references after rebuild)
   - Shared classes (`card`, `page-stack`, `muted-text`, `metrics`, `metric`, `list-grid`, `list-item`) — KEEP

2. **Delete obsolete admin CSS** (batch by category)
   - Shell classes: `admin-shell-*`, `admin-sidebar-*`, `admin-nav-*`, `admin-mobile-nav-*`
   - Page header: `admin-page-header`, `admin-page-*`
   - Module grid: `admin-module-*`, `admin-health-*`
   - Controls: `admin-controls`, `admin-table-wrap`, `admin-table`
   - Other: `admin-lesson-list`, `admin-workspace`, `admin-logout-*`

3. **Visual consistency audit**
   - Open each admin page in browser
   - Check: card spacing, font sizes, badge colors, table alignment
   - Check: dark sidebar text contrast, active nav highlight
   - Check: mobile responsive (sidebar sheet, stacked layouts)
   - Fix any inconsistencies (spacing, colors, borders)

4. **Cross-module navigation test**
   - Click through all sidebar nav items
   - Verify active state updates correctly
   - Verify Blog submenu works
   - Verify role-based items hidden for Staff Admin

5. **Run unit tests**
   ```bash
   pnpm test
   ```
   - Fix any failures caused by import path changes or component renames

6. **Run type check**
   ```bash
   pnpm type-check
   ```

7. **Run lint**
   ```bash
   pnpm lint
   ```

8. **Run e2e tests**
   ```bash
   pnpm test:e2e:pw
   ```
   - Update visual regression snapshots if needed (expected after UI rebuild)
   - Fix any selector-based test failures (CSS class → data-slot attribute changes)

9. **Run full build**
   ```bash
   pnpm build
   ```

10. **Final globals.css line count check**
    - Verify significant reduction from removing ~170 admin class blocks
    - Ensure no broken references remain

## Todo List
- [ ] Audit all admin CSS classes for usage
- [ ] Delete orphaned admin shell CSS classes
- [ ] Delete orphaned admin page/module/health CSS classes
- [ ] Delete orphaned admin table/control CSS classes
- [ ] Visual audit: all 13 modules on desktop
- [ ] Visual audit: all 13 modules on mobile
- [ ] Fix spacing/color inconsistencies
- [ ] Run `pnpm test` — all pass
- [ ] Run `pnpm type-check` — zero errors
- [ ] Run `pnpm lint` — clean
- [ ] Run `pnpm test:e2e:pw` — update snapshots, all pass
- [ ] Run `pnpm build` — success
- [ ] Verify non-admin pages unaffected

## Success Criteria
- All 13 modules visually consistent Dark Pro style
- Mobile responsive on all pages
- globals.css reduced by ~150+ admin class blocks
- `pnpm test` passes
- `pnpm type-check` passes
- `pnpm lint` clean
- `pnpm build` succeeds
- `pnpm test:e2e:pw` passes (with updated snapshots)
- Non-admin pages render unchanged

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Delete CSS class still in use | Medium | Medium | Grep every class before deletion |
| Shared class accidentally deleted | Low | High | Whitelist known shared classes |
| E2E test selectors broken | High | Medium | Update selectors to use data-slot or new class names |
| Visual regression snapshot mismatch | Expected | Low | Update snapshots (expected after full rebuild) |

## Next Steps
- Project complete — update `docs/project-changelog.md` and `docs/development-roadmap.md`
- Consider: Admin dark mode toggle (currently forced light content)
- Consider: Build impersonation UI (gap module)
- Consider: Build skills mapping UI (gap module)
