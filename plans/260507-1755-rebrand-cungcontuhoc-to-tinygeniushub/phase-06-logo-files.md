# Phase 6: Logo Files

## Context Links
- Scout report: lines 216–226
- Logo files in `public/` and `assets/logos/`
- Code references in `src/lib/email/project-email-template-builder.ts` and its test

## Overview
- **Priority**: P1 (High)
- **Status**: completed (2026-05-08)
- **Effort**: ~1h
- Rename logo files from `logo-cungcontuhoc-*` to `logo-tinygeniushub-*`.
- Update all code references to the new filenames.
- Archive old logo directory.

## Logo Files to Rename

### In `public/`

| # | Current Path | New Path |
|---|-------------|----------|
| 1 | `public/logo-cungcontuhoc-mascot-email.png` | `public/logo-tinygeniushub-mascot-email.png` |
| 2 | `public/logo-cungcontuhoc-icon.svg` | `public/logo-tinygeniushub-icon.svg` |
| 3 | `public/logo-cungcontuhoc-horizontal.png` | `public/logo-tinygeniushub-horizontal.png` |
| 4 | `public/logo-cungcontuhoc-horizontal.svg` | `public/logo-tinygeniushub-horizontal.svg` |

### In `assets/logos/`

| # | Current Path | Action |
|---|-------------|--------|
| 5 | `assets/logos/cungcontuhoc-2026-02-21/` (directory) | Archive as-is (keep for history). Or rename to `tinygeniushub-2026-05-07/` and update SVG contents. |
| 6 | 6 SVG files inside `cungcontuhoc-2026-02-21/` | Each SVG has `Cung Con Tu Hoc` in `<title>` and text elements. If renaming dir, also update SVG title/text to `TinyGenius Hub`. |

### Reference to `public/logo.png` (verify existence)

| # | File | Reference |
|---|------|-----------|
| 7 | `src/app/(main)/page.tsx` (JSON-LD) | `"logo": "https://cungcontuhoc.io.vn/logo.png"` — Update URL domain. If `logo.png` exists, no rename needed (it's already generic). If not, create or point to a new logo. |

## Code References to Update

| # | File | Line | Current String | New String |
|---|------|------|---------------|------------|
| 8 | `src/lib/email/project-email-template-builder.ts` | 323 | `logo-cungcontuhoc-mascot-email.png` | `logo-tinygeniushub-mascot-email.png` |
| 9 | `src/lib/email/__tests__/project-email-template-builder.test.ts` | 25 | `logo-cungcontuhoc-mascot-email.png` | `logo-tinygeniushub-mascot-email.png` |

## Implementation Steps

1. **Rename public/ files**:
   ```bash
   cd public/
   mv logo-cungcontuhoc-mascot-email.png logo-tinygeniushub-mascot-email.png
   mv logo-cungcontuhoc-icon.svg logo-tinygeniushub-icon.svg
   mv logo-cungcontuhoc-horizontal.png logo-tinygeniushub-horizontal.png
   mv logo-cungcontuhoc-horizontal.svg logo-tinygeniushub-horizontal.svg
   ```
2. **Update email template reference**: Edit line 323 in `project-email-template-builder.ts`.
3. **Update test reference**: Edit line 25 in the test file.
4. **Handle assets/logos/**: Either:
   - **Option A (recommended)**: Leave `assets/logos/cungcontuhoc-2026-02-21/` as-is for historical reference. Create new `assets/logos/tinygeniushub-2026-05-07/` with updated SVGs if needed.
   - **Option B**: Rename the directory and update SVG contents.
5. **Verify logo.png**: Check if `public/logo.png` exists. If not, generate a new TinyGenius Hub logo.
6. **Update JSON-LD logo URL**: In `page.tsx`, update the domain portion of the logo URL (already handled in Phase 2, but verify the path stays `/logo.png`).
7. **Search for hidden references**:
   ```bash
   rg "logo-cungcontuhoc" --type-add 'web:*.{ts,tsx,js,jsx,html,css,md,json}' -t web
   ```
8. **Build**: `pnpm build` to verify no broken asset references.
9. **Visual check**: Load the site and verify logo renders correctly in header and email templates.

## Acceptance Criteria
- [x] No file named `*cungcontuhoc*` in `public/`
- [x] `rg "logo-cungcontuhoc" src/` returns 0 results
- [x] Email template references `logo-tinygeniushub-mascot-email.png`
- [x] `pnpm build` succeeds
- [x] Logo renders correctly on homepage (visual check)
- [x] Email preview shows new logo

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Logo file referenced by external CDN | Check if any URLs reference absolute paths with `cungcontuhoc` in logo filename. Grep for `logo-cungcontuhoc` across entire codebase. |
| SVG content still says "Cung Con Tu Hoc" | Update SVG text elements if renaming the SVG files. This is visual-only but matters for a11y and screen readers. |
| Cache serving old logo | Browser cache / CDN cache. Add version query param or clear cache after deploy. |
