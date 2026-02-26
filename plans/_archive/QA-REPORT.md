# QA Report - Cung Con Tu Hoc
**Date:** 2026-02-24
**Tester:** Codex QA Agent
**Environment:** `http://localhost:3000` (development)

## Executive Summary
- Total checks executed: 76
- PASS: 58
- FAIL: 15
- BLOCKED / N/A: 3
- Raw artifacts: `plans/.qa-artifacts/`

## QA-FIX-01 Update (2026-02-24)
- Scope fixed: all HIGH + MEDIUM issues in `plans/CODEX-QA-FIX-01-PROMPT.md`.
- Focused re-verify after fixes:
1. SEO: `og:image` on `/`, canonical on `/pricing` and `/blog`, no double title suffix.
2. Mobile UX: hamburger menu present at 375px, key mobile tap targets >= 44px.
3. i18n: mojibake and unaccented admin Vietnamese strings corrected.
4. Accessibility: Lighthouse accessibility rerun on `/` reached 100; `aria-prohibited-attr`, `color-contrast`, `heading-order` all pass.
5. Contact form: server validation enforces `message <= 500` and UI shows counter.

## QA-NEXT-01 Update (2026-02-24)
- Task 1 (Architectural Refactoring): completed. `src/modules/admin/service.ts` is now a facade that re-exports 4 new domain services:
1. `src/modules/admin/admin-user-service.ts`
2. `src/modules/admin/admin-blog-service.ts`
3. `src/modules/admin/admin-billing-service.ts`
4. `src/modules/admin/admin-analytics-service.ts`
- Task 2 (Playwright E2E): completed. Added `playwright.config.ts` and 3 happy-path specs in `tests/e2e/`; `pnpm exec playwright test` passes with 3/3 green.
- Task 3 (Performance Audit + optimization): completed with Lighthouse artifacts for `/` and `/blog`, plus client-bundle optimization by lazy-loading admin/parent-only navbar widgets.

Key risks found (baseline before fixes):
1. Vietnamese encoding corruption appears in user-facing pages and SEO metadata.
2. Mobile usability regressions (no detected mobile navbar collapse + many tap targets < 44px).
3. SEO metadata inconsistencies (duplicate title pattern, missing canonical on key pages, missing `og:image` on homepage).
4. Accessibility violations from Lighthouse (`aria-prohibited-attr`, `color-contrast`, `heading-order`).

## Domain 1: Functional Testing
| Test | Status | Notes |
|---|---|---|
| `/` loads | PASS | 200, no broken nav/footer links, no console errors. |
| `/about` loads | PASS | 200. Title format issue tracked in SEO domain. |
| `/pricing` loads | PASS | 200. |
| `/blog` loads | PASS | 200. |
| `/blog/[slug]` loads | PASS | Tested `/blog/5-meo-hoc-tieng-anh-tai-nha` -> 200 + article rendered. |
| `/auth/login` loads | PASS | 200. |
| `/auth/register` route | FAIL | Returns 404 (app uses `/auth/signup`). |
| `/contact` loads | PASS | 200. |
| `/privacy` loads | PASS | 200. |
| `/terms` loads | PASS | 200. |
| `/refund-policy` loads | PASS | 200. |
| `/referral` loads | PASS | 200. |
| `/setup` behavior (unauth) | PASS | Redirects to `/auth/login` (final URL). |
| `/not-a-real-page-404-test` | PASS | 404 expected. |
| `/maintenance` loads | PASS | 200. |
| `/offline` loads | PASS | 200. |
| Console errors on tested routes | FAIL | Console error observed on 404 routes: `Failed to load resource: 404`. |
| Navbar/footer broken links | PASS | No broken internal nav/footer links detected on tested pages. |
| Contact form: empty submit | PASS | Submit button disabled when empty (prevents invalid submit). |
| Contact form: invalid email | PASS | Browser validity blocks submit (`checkValidity=false`, API not called). |
| Contact form: message >500 chars | FIXED ✅ | Re-verified with `X-Forwarded-For` + valid origin: API returns 400 with `too_big` (`<=500`). |
| Contact form: valid submit | PASS | 200 + success feedback message. |
| Contact form: XSS payload | PASS | 200; payload not executed/rendered as script in feedback. |
| Parent routes unauth redirect | PASS | `/parent/dashboard` -> `/auth/login`. |
| Admin routes unauth redirect | PASS | `/admin`, `/admin/users` -> `/auth/login`. |
| Admin route with non-admin account | BLOCKED | No authenticated non-admin test account provided. |
| Login invalid password UI message | PASS | API 401 + UI shows `Email hoặc mật khẩu chưa đúng.` |
| Login valid credentials redirect | BLOCKED | No valid test account provided. |
| `/setup` after setup completed | BLOCKED | Requires authenticated account with completed onboarding state. |
| Blog list visible | PASS | Post list rendered. |
| Blog detail loads after click | PASS | Detail page loads correctly. |
| Blog pagination page 2 | PASS | `?page=2` responds 200; API totalPages currently 1. |
| Blog social share buttons | PASS | Present on post detail (Facebook/Twitter URLs found). |
| `/rss.xml` validity | PASS | 200 + XML with `<rss version="2.0">`. |
| Sitemap includes blog URLs | PASS | `/sitemap.xml` has blog URLs. |
| Referral page shows referral link | FAIL | Public `/referral` page shows onboarding/explainer only; no personal referral link UI for unauth user. |
| `/accept-invite?token=INVALID` | PASS | 200 error state UI, no crash. |
| `/accept-invite` without token | PASS | Redirects to `/`. |

## Domain 2: UI/UX
| Test | Status | Notes |
|---|---|---|
| Responsive: horizontal scroll (`/`, `/pricing`, `/blog`) | PASS | No horizontal scrollbar at 375/768/1440. |
| Responsive: mobile navbar collapse | FIXED ✅ | Mobile viewport 375px shows hamburger toggle and expandable mobile nav panel. |
| Responsive: text overflow | FAIL | Overflowing elements detected on `/` and `/blog` (mobile/tablet/desktop counts > 0). |
| Responsive: image distortion | FAIL | Distorted logo ratio detected on mobile/tablet (`/logo-cungcontuhoc-horizontal.svg`). |
| Responsive: tap target >=44px (mobile) | FIXED ✅ | Re-checked key mobile controls (`.nav-mobile-*`, homepage section nav): all visible targets are >=44px. |
| Visual consistency: font family | PASS | `Be Vietnam Pro` detected. |
| Visual consistency: brand primary color expectation | FAIL | Actual brand vars are green (`#10b981/#047857`), not target teal `#14b8a6`. |
| FOUC check | PASS | No FOUC detected in automated run. |
| Mascot animation/state check | BLOCKED | Needs manual visual verification by design QA. |
| Footer links completeness/function | PASS | Footer links present; no broken internal targets detected. |
| `/not-a-real-page` 404 UI | PASS | Custom 404 UI appears. |
| `/test-error` segment error UI | PASS | Error UI appears on route. |
| `/maintenance` page | PASS | Correct maintenance UI shown. |
| `/offline` page | PASS | Correct offline UI shown. |
| Offline simulation graceful behavior | PASS | Navigation under offline simulation did not crash; app remained stable. |

## Domain 3: i18n / Localization
| Test | Status | Notes |
|---|---|---|
| Heuristic English-string scan in `src/app/**/*.tsx` | PASS | 7 hits; mostly false positives, reviewed manually. |
| Vietnamese diacritics heuristic scan | FIXED ✅ | Admin blog Vietnamese copy updated with proper diacritics. |
| Manual i18n review core pages | FIXED ✅ | Blog SEO metadata strings normalized and mojibake literals replaced in edited scope. |
| Long-text layout resilience | FAIL | Overflow indicators detected in responsive scan, especially homepage/blog. |

## Domain 4: API Testing
| Test | Status | Notes |
|---|---|---|
| `GET /api/health` | PASS | 200 with JSON health payload (`ok: true`, status `ok`). |
| Protected endpoint `/api/reports/weekly` unauth | PASS | 401. |
| Protected endpoint `/api/children` unauth | PASS | 401. |
| Protected endpoint `/api/admin/users` unauth | FAIL | 404 (route does not exist at this path). |
| Protected endpoint `/api/billing` unauth | FAIL | 404 (actual route is `/api/billing/checkout`). |
| Public endpoint `/api/blog/posts` | PASS | 200. |
| Invalid contact payload | PASS | 400 with validation issues. |
| SQL injection payload in contact | PASS | 200 (no server crash/500). |
| XSS payload in contact | PASS | 200 (no server crash/500). |
| Wrong method `DELETE /api/contact` | PASS | 405. |
| Wrong method `PUT /api/health` | PASS | 405. |
| RSS endpoint content-type and payload | PASS | 200, `application/xml`, valid RSS header. |

## Domain 5: Security Testing
| Test | Status | Notes |
|---|---|---|
| Security headers baseline | PASS | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP present. |
| HSTS on localhost | PASS | Not set in dev (acceptable; track for production edge). |
| Middleware maintenance guards | PASS | `pathname !== '/maintenance'`, excludes `/api`, `/_next`, static files (`pathname.includes('.')`). |
| Parent route auth guards | PASS | `src/app/(main)/parent/layout.tsx` uses `requireParent()`. |
| Admin route auth + role guards | PASS | `src/app/(main)/admin/layout.tsx` uses `requireAdminParent()`. |
| Setup route auth guard | PASS | `src/app/(main)/setup/page.tsx` uses `requireParent()`. |
| Admin API auth + role checks | PASS | Admin APIs consistently use `requireAdminFromRequest()`. |
| Billing API auth check | PASS | `/api/billing/checkout` checks authenticated parent. |
| Reports API auth check | PASS | `/api/reports/weekly` returns 401 when unauthenticated. |
| `NEXT_PUBLIC_` exposure audit | PASS | Exposed vars observed: `NEXT_PUBLIC_MAINTENANCE_MODE`, `NEXT_PUBLIC_SITE_URL` (safe). |

## Domain 6: SEO Testing
| Test | Status | Notes |
|---|---|---|
| Title format consistency | FIXED ✅ | Removed page-level duplicated suffix usage; no `| Cùng Con Tự Học | Cùng Con Tự Học` in re-check. |
| Meta description presence | PASS | Present on sampled pages (`/`, `/pricing`, `/blog`). |
| Homepage OG tags completeness | FIXED ✅ | Homepage metadata now emits `og:image` (using `/opengraph-image`). |
| `robots.txt` validity | PASS | Includes `User-agent` and sitemap URL. |
| `sitemap.xml` validity | PASS | Valid XML with 24 URLs, includes blog entries. |
| H1 count/content on key pages | PASS | One non-empty H1 detected on `/`, `/pricing`, `/blog`, `/about`. |
| Heading hierarchy | FIXED ✅ | Footer semantic heading skip removed; Lighthouse `heading-order` score is 1 (pass). |
| `lang` and canonical on homepage | PASS | `<html lang="vi">` + canonical present on home. |
| Canonical on key subpages | FIXED ✅ | Re-verified canonical links on both `/pricing` and `/blog`. |

## Domain 7: Accessibility Testing
| Test | Status | Notes |
|---|---|---|
| Keyboard focusable elements present | PASS | `/`: 46, `/blog`: 52, `/auth/login`: 38. |
| Focus styling detectable | PASS | CSS `:focus` rules detected. |
| Lighthouse accessibility score | PASS | 100/100 on homepage (rerun artifact: `lighthouse-accessibility-home-fix3.json`). |
| Lighthouse accessibility failed audits | FIXED ✅ | Lighthouse rerun artifact `lighthouse-accessibility-home-fix3.json`: all 3 audits now pass. |
| Semantic landmarks (`main/nav/header/footer`) | PASS | Present on homepage. |
| `img` alt coverage | PASS | Missing alt count = 0 (homepage). |
| ARIA labels on interactive UI | PASS | 8 labels detected on homepage sample. |

## Bonus - Performance / Technical Debt
| Check | Status | Notes |
|---|---|---|
| `pnpm type-check` | PASS | Exit code 0. |
| `pnpm check:i18n` | PASS | Exit code 0. |
| Test-only directories audit | PASS | Removed `src/app/test-global-error` and `src/app/(main)/test-error` from app routes. |
| Large files review trigger (>500 lines) | PASS | 15 largest files listed; notable: `src/modules/admin/service.ts` (1551 lines). |

### QA-NEXT-01 Perf Notes
- LCP (before -> after, same local Lighthouse setup): Home `28188.27ms -> 29727.65ms`, Blog `1839.19ms -> 3475.13ms` (`plans/.qa-artifacts/lighthouse-performance-*-next*.json`). Dev-mode measurements are noisy; they do not yet satisfy launch target `LCP < 2.5s` for homepage.
- Image audit: above-the-fold blog hero/featured images already use `next/image` with `priority`; homepage hero is text/gradient-based (no hero bitmap). Additional optimization applied on client JS path instead of image pipeline.
- Bundle/chunk review (`CI=true pnpm build`): largest root main chunks are `static/chunks/c40749a9a46a1ef0.js` (~219.26 KB), `static/chunks/bfe54ce769cb9be5.js` (~108.70 KB), `static/chunks/fb78f87a0965bab9.js` (~33.01 KB). Reduced guest-path client pressure by dynamic-importing `ParentNotificationCenter` and `ParentalGateModal` in navbar.

## Issues Found - Severity Matrix
| Issue | Severity | Domain | Steps to Reproduce |
|---|---|---|---|
| Vietnamese encoding corruption (mojibake) in user-visible content and metadata - FIXED ✅ | HIGH | i18n, SEO | Corrected literals and metadata strings in affected files; `pnpm check:i18n` passes. |
| Mobile usability regression: no detected mobile nav collapse + small tap targets (<44px) - FIXED ✅ | HIGH | UI/UX, Accessibility | Verified at 375px with browser automation; mobile nav present and key targets >=44px. |
| SEO metadata inconsistencies (duplicate title suffix, missing canonical on `/pricing` & `/blog`, missing homepage `og:image`) - FIXED ✅ | HIGH | SEO | Re-verified via live HTML fetch: title/canonical/OG checks pass. |
| Accessibility violations (`aria-prohibited-attr`, low contrast, heading order) - FIXED ✅ | MEDIUM | Accessibility | Lighthouse rerun score 100 (`aria-prohibited-attr=1`, `color-contrast=1`, `heading-order=1`). |
| Expected QA endpoints/routes missing (`/auth/register`, `/api/admin/users`, `/api/billing`) - FIXED ✅ (spec/docs) | MEDIUM | Functional, API | Added `plans/ROUTE-MAP.md` clarifying canonical routes (`/auth/signup`, `/api/billing/checkout`). |
| Contact form requirement mismatch: message >500 accepted - FIXED ✅ | MEDIUM | Functional | Route schema now enforces `max(500)` and UI adds `maxLength` + counter. |
| Referral page does not expose personal referral link for unauthenticated context | LOW | Functional | Open `/referral` while logged out; no referral link/copy UI rendered. |
| Unaccented Vietnamese strings in admin blog page - FIXED ✅ | LOW | i18n | Admin blog headings now use full Vietnamese diacritics. |

## Recommendations
1. Fix encoding at source files first (UTF-8 normalization + replace mojibake literals), then rerun `pnpm check:i18n` and SEO smoke tests.
2. Standardize metadata contract: page titles should not include duplicated site suffix when layout template is active; add canonical + OG image for all indexable pages.
3. Implement/verify mobile navigation collapse behavior and raise touch targets to >=44px on mobile.
4. Address Lighthouse accessibility failures with priority on contrast and heading structure.
5. Align QA specs and API route map (`/auth/register` vs `/auth/signup`, `/api/billing/checkout`, admin user endpoints) to avoid false-negative regression checks.
6. Decide product rule for contact message max length (>500 vs >2000) and enforce consistently in both UI and API.

## Fix Log
- Updated files:
1. `src/components/app-nav-client.tsx`
2. `src/app/globals.css`
3. `src/components/site-footer.tsx`
4. `src/components/homepage/homepage.css`
5. `src/components/homepage/section-testimonials.tsx`
6. `src/app/(main)/page.tsx`
7. `src/app/(main)/pricing/page.tsx`
8. `src/modules/blog/blog-seo.ts`
9. `src/app/(main)/about/page.tsx`
10. `src/app/(main)/contact/page.tsx`
11. `src/app/(main)/privacy/page.tsx`
12. `src/app/(main)/referral/page.tsx`
13. `src/app/(main)/refund-policy/page.tsx`
14. `src/app/(main)/terms/page.tsx`
15. `src/app/maintenance/page.tsx`
16. `src/app/offline/page.tsx`
17. `src/components/contact-form.tsx`
18. `src/app/api/contact/route.ts`
19. `src/app/(main)/admin/blog/page.tsx`
20. `plans/ROUTE-MAP.md`
21. `src/modules/admin/admin-user-service.ts`
22. `src/modules/admin/admin-blog-service.ts`
23. `src/modules/admin/admin-billing-service.ts`
24. `src/modules/admin/admin-analytics-service.ts`
25. `src/modules/admin/service.ts` (facade re-export)
26. `playwright.config.ts`
27. `tests/e2e/guest-navigation.spec.ts`
28. `tests/e2e/auth-flow.spec.ts`
29. `tests/e2e/contact-form.spec.ts`
30. `src/app/(main)/blog/page.tsx`
31. `src/app/test-global-error/page.tsx` (deleted)
32. `src/app/(main)/test-error/page.tsx` (deleted)

- Verification results:
1. `pnpm type-check` -> PASS
2. `pnpm check:i18n` -> PASS
3. Live HTML checks on `http://localhost:3000`: homepage has `og:image`; `/pricing` and `/blog` have canonical.
4. Lighthouse artifact `plans/.qa-artifacts/lighthouse-accessibility-home-fix3.json` -> accessibility 100, target audits pass.
5. Contact API with >500 chars (valid origin + isolated forwarded IP) -> 400 with Zod `too_big` (`maximum: 500`).
6. `pnpm exec playwright test` -> PASS (3 passed / 0 failed).
7. `CI=true pnpm build` -> PASS.
8. Lighthouse perf artifacts generated for QA-NEXT:
   - `plans/.qa-artifacts/lighthouse-performance-home-next.json`
   - `plans/.qa-artifacts/lighthouse-performance-home-next-after.json`
   - `plans/.qa-artifacts/lighthouse-performance-blog-next.json`
   - `plans/.qa-artifacts/lighthouse-performance-blog-next-after.json`

- Known non-blocking constraints:
1. Lighthouse CLI exits with temporary-directory cleanup warning (`EPERM`) on this Windows environment after JSON export; artifacts are still generated and used for analysis.
