# Phase 01: Theme & Contrast Fix

## Context Links
- Scout report: `plans/reports/scout-2026-03-18-admin-interface-structure.md`
- Current CSS vars: `src/app/globals.css` (lines 82-104)
- Admin layout: `src/app/(main)/admin/layout.tsx`
- Sidebar: `src/components/admin-shell-nav.tsx`

## Overview
- **Priority**: P1 (blocking -- readability issue)
- **Status**: completed
- **Description**: Black text on dark gray is unreadable. Fix CSS custom properties for proper contrast, add white content card backgrounds, ensure sidebar stays dark slate.

## Key Insights
- Current `--admin-content-bg: #0f172a` (dark navy) with `--admin-card-bg: #1e293b` (slightly lighter slate) creates low-contrast nesting
- Text vars already exist (`--admin-text-primary: #f1f5f9`, `--admin-text-secondary: #94a3b8`) and are correct for dark mode
- Problem is card-to-background contrast, not text color itself
- Some components hard-code colors (e.g., sidebar uses `#94a3b8`, `#f8fafc` directly)

## Requirements
### Functional
- Content area readable with clear card/background separation
- Sidebar stays dark (slate-900+)
- Header distinguishable from content area
- All admin pages inherit consistent theme

### Non-functional
- Zero hardcoded colors outside globals.css admin vars
- All admin components use CSS var references only

## Related Code Files

### Files to Modify
- `src/app/globals.css` -- update `--admin-*` custom property values
- `src/components/admin-shell-nav.tsx` -- replace hardcoded hex with CSS vars
- `src/app/(main)/admin/layout.tsx` -- verify header/content use vars
- `src/components/admin/ui/admin-section-card.tsx` -- ensure card contrast
- `src/components/admin/ui/admin-stat-card.tsx` -- ensure card contrast
- `src/components/admin/ui/admin-data-table.tsx` -- text contrast check
- `src/components/admin/ui/admin-page-header.tsx` -- text contrast check

### Files to Create
- None

## Implementation Steps

1. **Update CSS custom properties** in `globals.css`:
   ```
   --admin-content-bg: #111827      (gray-900, slightly lighter than sidebar)
   --admin-card-bg: #1f2937         (gray-800, clearly distinct from content-bg)
   --admin-card-border: #374151     (gray-700, visible but subtle)
   --admin-sidebar-bg: #0f172a      (slate-900, darkest element)
   --admin-header-bg: #111827       (match content-bg for seamless feel)
   --admin-sidebar-accent: #1e293b  (slate-800, hover states)
   ```
   Key change: increase luminance gap between sidebar < content < card.

2. **Add new utility vars** for elevated surfaces:
   ```
   --admin-card-bg-elevated: #283040  (for hover/active cards)
   --admin-input-bg: #1e293b          (form inputs)
   --admin-input-border: #4b5563      (gray-600, higher contrast)
   ```

3. **Replace hardcoded hex in admin-shell-nav.tsx**:
   - `#1e293b` -> `var(--admin-sidebar-accent)`
   - `#94a3b8` -> `var(--admin-text-secondary)`
   - `#f8fafc` -> `var(--admin-text-primary)`
   - `--sidebar-border: "#1e293b"` -> `var(--admin-sidebar-accent)`

4. **Audit all admin UI components** for hardcoded colors:
   - Search `src/components/admin/` for hex patterns `#[0-9a-f]{6}`
   - Replace with appropriate `--admin-*` var references

5. **Verify header contrast** in `layout.tsx`:
   - Header bg already uses `var(--admin-header-bg)` -- verify updated value renders well
   - Check border-b separates header from content

6. **Test dark-on-dark readability**:
   - Run `npm run dev`, navigate all 14 admin routes
   - Verify text is readable at all viewport sizes

## Todo List
- [x] Update `--admin-*` CSS custom properties in globals.css
- [x] Add `--admin-card-bg-elevated`, `--admin-input-bg`, `--admin-input-border`
- [x] Replace all hardcoded hex in admin-shell-nav.tsx
- [x] Audit and fix hardcoded colors in admin UI components
- [x] Verify header/content/card visual hierarchy
- [ ] Visual smoke test all admin routes (manual, requires dev server)

## Success Criteria
- Card backgrounds clearly distinguishable from page background
- All text passes WCAG AA contrast ratio (4.5:1 for normal text)
- No hardcoded hex colors remain in admin component files
- Sidebar is visually darkest element, cards are lightest surface

## Risk Assessment
- **Low**: CSS var changes are global; a typo could break all admin pages. Mitigate: test each route after changes.
- **Low**: Some shadcn components internally use Tailwind theme vars (`bg-card`, `text-muted-foreground`). May need overrides in admin scope.

## Security Considerations
- None (CSS-only changes)
