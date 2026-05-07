# Phase 4: Social Media Links

## Context Links
- Scout report: lines 122–131
- `src/modules/platform/footer-social-links.ts` (type definition + defaults)
- `src/components/admin/site-settings/admin-social-links-editor.tsx` (admin UI)
- `src/app/(main)/page.tsx` (JSON-LD `sameAs`)
- `src/components/site-footer.tsx` (footer aria-labels)
- `src/app/maintenance/page.tsx` (Zalo link)
- `tests/e2e/admin-footer-social-links.spec.ts` (test)

## Overview
- **Priority**: P0 (Critical)
- **Status**: completed (2026-05-08)
- **Effort**: ~1h
- Update Facebook/YouTube links. **Remove TikTok and Zalo entirely** per confirmed decision.
- This requires **type changes** (removing fields from interface), not just string replacements.

## Confirmed New Values

| Platform | Old | New | Action |
|----------|-----|-----|--------|
| Facebook | `facebook.com/cungcontuhoc` | `facebook.com/tinygeniushub` | UPDATE |
| YouTube | `youtube.com/@cungcontuhoc` | `youtube.com/@TinyGeniusHubUs` | UPDATE |
| TikTok | `tiktok.com/@cungcontuhoc` | — | **REMOVE** |
| Zalo | `zalo.me/cungcontuhoc` | — | **REMOVE** |

## Files to Modify

### 1. `src/modules/platform/footer-social-links.ts`
**Current:**
```typescript
export type FooterSocialLinks = {
  facebook: string;
  youtube: string;
  tiktok: string;
  zalo: string;
};

export const DEFAULT_FOOTER_SOCIAL_LINKS: FooterSocialLinks = {
  facebook: "https://facebook.com/cungcontuhoc",
  youtube: "https://youtube.com/@cungcontuhoc",
  tiktok: "https://tiktok.com/@cungcontuhoc",
  zalo: "https://zalo.me/cungcontuhoc",
};
```

**New:**
```typescript
export type FooterSocialLinks = {
  facebook: string;
  youtube: string;
};

export const DEFAULT_FOOTER_SOCIAL_LINKS: FooterSocialLinks = {
  facebook: "https://facebook.com/tinygeniushub",
  youtube: "https://youtube.com/@TinyGeniusHubUs",
};
```

**⚠️ IMPACT ANALYSIS**: Run `gitnexus_impact` on `FooterSocialLinks` and `DEFAULT_FOOTER_SOCIAL_LINKS` before editing. All consumers referencing `tiktok` or `zalo` fields will break and need updating.

### 2. `src/components/site-footer.tsx`
- Lines 53,76,90,104,125,179 — Update `aria-label` references from `Cùng Con Tự Học` to `TinyGenius Hub`.
- **Remove** TikTok and Zalo icon link renders. Keep only Facebook + YouTube.
- Update social link hrefs to new values.

### 3. `src/app/(main)/page.tsx`
- Lines 82,83,85 — JSON-LD `sameAs` array:
  - Replace `facebook.com/cungcontuhoc` → `facebook.com/tinygeniushub`
  - Replace `youtube.com/@cungcontuhoc` → `youtube.com/@TinyGeniusHubUs`
  - **Remove** `tiktok.com/@cungcontuhoc`
  - **Remove** `zalo.me/cungcontuhoc`

### 4. `src/components/admin/site-settings/admin-social-links-editor.tsx`
- Update placeholder/default values.
- **Remove** TikTok and Zalo input fields from the form.
- Update form validation schema: remove `tiktok` and `zalo` fields.

### 5. `src/app/maintenance/page.tsx`
- Line 67: Find `href="https://zalo.me/cungcontuhoc"` — **Remove this entire link element**. (If it's a Zalo contact button, remove it or replace with a generic contact reference.)

### 6. `tests/e2e/admin-footer-social-links.spec.ts`
- Update assertions: expect only Facebook + YouTube links (no TikTok, no Zalo).
- Update expected URLs to new values.

### 7. `.playwright-mcp/page-*` yml files (~5 files)
- Snapshots may contain old social URLs. Not critical but update if tests check these.

## Implementation Steps

1. **Impact analysis first**: `gitnexus_impact({target: "FooterSocialLinks", direction: "upstream"})` and `gitnexus_impact({target: "DEFAULT_FOOTER_SOCIAL_LINKS", direction: "upstream"})` to confirm all consumers.
2. **Update type definition**: Edit `footer-social-links.ts` — remove `tiktok` and `zalo` fields, update URLs.
3. **Fix all consumers**: The TypeScript compiler will flag every file that accesses `tiktok` or `zalo` on `FooterSocialLinks`. Fix each one.
4. **Update footer component**: Remove TikTok/Zalo icon rendering, update aria-labels.
5. **Update homepage JSON-LD**: Remove TikTok/Zalo from `sameAs`.
6. **Update admin editor**: Remove form fields, update schema.
7. **Update maintenance page**: Remove Zalo link.
8. **Update test**: Fix expected assertions.
9. **Build**: `pnpm build` must succeed with 0 type errors.
10. **Type check**: `pnpm tsc --noEmit` (if available) to verify no dangling references.

## Acceptance Criteria
- [x] `FooterSocialLinks` type has only `facebook` and `youtube` fields
- [x] `DEFAULT_FOOTER_SOCIAL_LINKS` has only Facebook + YouTube with new URLs
- [x] `git grep "tiktok\.com/@cungcontuhoc"` returns 0
- [x] `git grep "zalo\.me/cungcontuhoc"` returns 0 (except plans/_archive)
- [x] Footer renders only Facebook + YouTube icons
- [x] Admin social links editor shows only 2 fields
- [x] `pnpm build` succeeds with 0 errors
- [x] E2E test `admin-footer-social-links.spec.ts` passes

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Removing type fields breaks unknown consumers | Medium | High | Run gitnexus_impact before editing. TypeScript errors will catch all consumers. |
| DB stored old social links | Medium | Medium | Check if social links are stored in DB (admin settings). If yes, they'll be overwritten on next admin save. No migration needed if admin re-saves. |
| Maintenance page Zalo link is user-facing | Low | Low | Simple removal of one line. |
