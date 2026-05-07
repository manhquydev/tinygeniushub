# Phase 2: Domain & URLs in Source Code

## Context Links
- Scout report: lines 49–81
- 27+ files with hardcoded domain `cungcontuhoc.io.vn`

## Overview
- **Priority**: P0 (Critical)
- **Status**: completed (2026-05-08)
- **Effort**: ~2h
- Replace all `cungcontuhoc.io.vn` → `tinygeniushubvn.tech` in source code.
- **Important**: `https://` prefix always used; do not add trailing slash unless already present.

## Replace Pattern
```
Find:    cungcontuhoc.io.vn
Replace: tinygeniushubvn.tech
```
Use regex-aware search/replace to catch all variants: with/without protocol, with/without paths.

## Files to Modify

| # | File | Pattern to Replace |
|---|------|-------------------|
| 1 | `src/app/layout.tsx:26` | `new URL("https://cungcontuhoc.io.vn")` |
| 2 | `src/lib/email/project-email-template-builder.ts:39-40` | `CANONICAL_APP_BASE_URL` constant |
| 3 | `src/lib/seo/course-jsonld.ts:1,13,67` | `BASE_URL`, org `name`, jsonld refs |
| 4 | `src/modules/sharing/share-link-builder.ts:6` | `const BASE_URL = "https://cungcontuhoc.io.vn"` |
| 5 | `src/modules/courses/pilot-attribution.ts:5` | `const OWNED_DOMAIN_SUFFIX = "cungcontuhoc.io.vn"` |
| 6 | `src/modules/courses/certificate-service.ts:118` | `siteUrl = "cungcontuhoc.io.vn"` |
| 7 | `src/modules/organizations/class-report-service.ts:109-110` | `page.drawText("cungcontuhoc.io.vn", ...)` |
| 8 | `src/components/courses/course-breadcrumb.tsx:5` | `const BASE_URL = "https://cungcontuhoc.io.vn"` |
| 9 | `src/components/try-garden/share-buttons.tsx:22` | Share URL |
| 10 | `src/app/rss.xml/route.ts:8` | site URL fallback |
| 11 | `src/app/(main)/page.tsx` | Multiple canonical/OG/JSON-LD URLs (lines 18,23,46,53,66,82,83,85,94,106) |
| 12 | `src/app/(main)/courses/page.tsx:27` | `canonical: "https://cungcontuhoc.io.vn/courses"` |
| 13 | `src/app/(main)/courses/[slug]/page.tsx:72,79` | canonical URLs |
| 14 | `src/app/(main)/pricing/page.tsx:11,16` | canonical/OG URLs |
| 15 | `src/app/(main)/try-garden/page.tsx:15,43` | canonical/OG URLs |
| 16 | `src/app/(main)/for-schools/page.tsx:9,13` | canonical/OG URLs |
| 17 | `src/app/(main)/about/page.tsx:8` | canonical URL |
| 18 | `src/app/(main)/contact/page.tsx:9,26` | canonical + email display |
| 19 | `src/app/(main)/privacy/page.tsx:7,91` | canonical + email |
| 20 | `src/app/(main)/terms/page.tsx:7,100` | canonical + email |
| 21 | `src/app/(main)/refund-policy/page.tsx:7,41` | canonical + email |
| 22 | `src/app/(main)/cookie-policy/page.tsx:9,82` | canonical + email |
| 23 | `src/app/(main)/referral/page.tsx:12` | canonical URL |
| 24 | `src/app/(main)/waitlist/page.tsx:11` | canonical URL |
| 25 | `src/app/(main)/blog/[slug]/opengraph-image.tsx:35-36,65` | Blog label text (domain-adjacent) |
| 26 | `src/app/maintenance/page.tsx:67` | Zalo link — **REMOVE** (Phase 4) |

## Implementation Strategy

**Option A — Bulk regex (recommended for this phase):**
```bash
# Find all files with the domain
rg -l "cungcontuhoc\.io\.vn" src/

# Then use sed or a script to replace in all:
find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/cungcontuhoc\.io\.vn/tinygeniushubvn\.tech/g' {} +
```

**Option B — Per-file manual (safer, for critical files):**
Manually edit each file in the table above, verifying context is correct.

**Recommended**: Use Option A for the bulk `.ts/.tsx` files, then manually verify the 5 most critical files (layout.tsx, project-email-template-builder.ts, course-jsonld.ts, share-link-builder.ts, pilot-attribution.ts).

## Edge Cases

1. **`OWNED_DOMAIN_SUFFIX`** in `pilot-attribution.ts` — This is used as a domain suffix check (no `https://`). Ensure the new value `tinygeniushubvn.tech` works correctly.
2. **Certificate service** — `siteUrl` string may not have protocol. Verify after change.
3. **PDF `drawText`** in `class-report-service.ts` — The drawn text includes the old domain. Update exact string.
4. **JSON-LD `sameAs`** in `page.tsx` — Includes Zalo link (`zalo.me/cungcontuhoc`). This gets removed in Phase 4.

## Acceptance Criteria
- [x] `rg "cungcontuhoc\.io\.vn" src/` returns 0 results
- [x] `pnpm build` succeeds (no broken URL references)
- [x] Quick visual check: homepage renders with new domain in `<head>` metadata
- [x] `OWNED_DOMAIN_SUFFIX` constant verified functional

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Bulk replace catches `cungcontuhoc` in variable names | Use `.io.vn` suffix to target only domain strings |
| Missed RSC/server component URL | Build + check runtime metadata output |
| Pilot attribution domain check breaks | Manual review of `pilot-attribution.ts` after replace |

## Next Steps
- Phase 3 (Emails) — many files overlap (e.g., contact page has both domain + email)
- Phase 5 (Brand text) — page titles also contain "Cùng Con Tự Học"
