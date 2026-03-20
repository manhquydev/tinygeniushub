# Admin System Review
**Date:** 2026-02-25
**Scope:** `src/app/admin/**`, `src/app/api/admin/**`, `src/components/admin-*`, `src/modules/admin/**`, `src/lib/auth/admin.ts`, `src/lib/security/admin-rate-limit.ts`

---

## 1. Summary

The admin system is substantially complete for an MVP. It covers user management, content CMS, blog, organizations, billing, security controls, analytics, gift codes, coupons, announcements, feature flags, and action logging. Auth is consistently enforced. Security middleware (CSRF + rate-limiting) is applied broadly but not uniformly. A few notable gaps exist in mutation rate-limiting coverage, nav structure, and minor logic issues.

---

## 2. Frontend Completeness

### Pages (all under `src/app/(main)/admin/`)
| Route | Page | Status |
|---|---|---|
| `/admin` | `page.tsx` | Exists (likely redirect) |
| `/admin/overview` | `overview/page.tsx` | Complete - stats, subscriptions, webhooks, referrals |
| `/admin/analytics` | `analytics/page.tsx` | Complete - streak distribution, top lessons, retention metrics |
| `/admin/users` | `users/page.tsx` | Complete via `AdminUserSearch` component |
| `/admin/courses` | `courses/page.tsx`, `[id]/page.tsx` | Complete - list + detail views |
| `/admin/blog` | `blog/page.tsx` | Exists |
| `/admin/blog/posts` | `blog/posts/page.tsx`, `[id]/edit/page.tsx`, `new/page.tsx` | Complete |
| `/admin/blog/categories` | Exists | Complete |
| `/admin/blog/authors` | Exists | Complete |
| `/admin/blog/newsletter` | Exists | Complete |
| `/admin/blog/analytics` | Exists | Complete |
| `/admin/blog/comments` | Exists | Complete |
| `/admin/content` | `content/page.tsx` | Exists |
| `/admin/organizations` | `organizations/page.tsx` | Complete |
| `/admin/gift-codes` | `gift-codes/page.tsx` | Complete |
| `/admin/security` | `security/page.tsx` | Complete - rate-limit policies + feature flags |
| `/admin/operations` | `operations/page.tsx` | Complete - payments, webhooks, trial flags, announcements, coupons |
| `/admin/log` | `log/page.tsx` | Exists |

### Navigation Issues (`src/components/admin-shell-nav.tsx`)
- **Nav has duplicate blog icon**: All blog sub-items (`/admin/blog/*`) use `PenSquare` icon - should use distinct icons (e.g., `Tag` for categories, `Users` for authors, `Mail` for newsletter, `BarChart2` for analytics, `MessageCircle` for comments).
- **Flat nav list**: Blog section has 6 sub-items at the same level as top-level items. No grouping/collapsible sections. With 17 items total this becomes unwieldy on mobile.
- **Typos in labels**: `"Phan tich"` should be `"Phân tích"`, `"Binh luan"` should be `"Bình luận"` (missing diacritics).
- **Missing "Khoá học" sub-items**: No direct nav link to course detail pages.

---

## 3. Backend API Completeness

### Route Inventory (50 handler files found)
All major CRUD operations are present. Summary of coverage:

**Users & Access**
- `GET /api/admin/users/search` - user search by email
- `GET|POST /api/admin/users/[parentId]` - GET detail only (no PATCH/DELETE)
- `GET|POST /api/admin/users/[parentId]/notes` - CRM notes
- `POST /api/admin/users/bulk` - suspend/activate/notify
- `POST /api/admin/impersonate` - start impersonation
- `POST /api/admin/impersonate/stop` - end impersonation

**Courses**
- `GET|POST /api/admin/courses` - list/create
- `GET|PATCH|DELETE /api/admin/courses/[id]` - CRUD
- `POST /api/admin/courses/[id]/publish` - publish toggle
- `GET|POST /api/admin/courses/[id]/lessons` - lesson ordering
- `GET /api/admin/courses/[id]/enrollments` - read enrollments

**Content CMS**
- Tracks, levels, units, lessons, activities - all CRUD present

**Blog**
- Posts, categories, authors, comments moderation, newsletter subscribers, analytics - all present

**Operations**
- Coupons, gift codes, announcements, bulk-enroll via CSV, video upload (Bunny CDN)

**Security / Platform**
- Rate-limit policy management, edge export, feature flags

### Missing / Incomplete Routes
- **No `PATCH /api/admin/users/[parentId]`**: No way to manually update a user's `displayName`, `email`, or `suspended` field individually. Suspend/unsuspend only works via bulk action.
- **No `DELETE` routes for content** (lessons, activities, units, levels): No soft/hard delete via API. Content can be created but not removed.
- **No `GET /api/admin/users` paginated list**: Search-only model - no full paginated list for browsing all users. Acceptable for MVP but limits bulk operations.
- **No `GET /api/admin/organizations/[id]` detail route**: `GET /api/admin/organizations` lists all; `[id]` only has PATCH/DELETE-like operations visible via members route but no standalone org detail GET.
- **`/api/admin/log` POST allows arbitrary action string**: `body.action ?? ""` passes empty string to `createAdminActionLog` - the service schema requires `min(1)` so this would throw a Zod error rather than fail gracefully.

---

## 4. Security Analysis

### Authentication
- Admin guard: `requireAdminFromRequest` (API) / `requireAdminParent` (pages) consistently applied everywhere - no gaps found.
- Authorization model: email-allowlist via `ADMIN_EMAILS` env var. Simple but effective for MVP. No role-based granularity (single admin tier only).
- Impersonation: Logs action, requires CSRF + rate-limit, reverses cleanly.

### CSRF Protection (`assertTrustedOrigin`)
Applied on all state-mutating routes (POST/PATCH/DELETE). **34 out of 34 mutation-capable files** found with CSRF check. Good coverage.

### Rate Limiting (`enforceAdminMutationRateLimit`)
Only applied on **8 files** out of ~34 mutation routes:
- `users/bulk`, `bulk-enroll`, `impersonate`, `impersonate/stop`, `export/payments`, `export/users`, `lessons/[lessonId]/trial-flag`, `security/rate-limits`

**Missing rate-limit on high-risk mutations:**
- `POST /api/admin/courses` - course creation
- `POST /api/admin/courses/[id]/publish` - publishing
- `POST /api/admin/coupons` - coupon creation (financial impact)
- `POST /api/admin/gift-codes` - gift code generation (financial impact)
- `POST /api/admin/announcements` - broadcast announcements
- `PATCH /api/admin/feature-flags/[key]` - feature flag changes
- `POST /api/admin/videos/upload` - Bunny CDN video creation
- All blog mutation routes (POST/PATCH on posts, categories, authors)

While admin routes are behind auth, missing rate limits allows an attacker who compromises an admin session to issue rapid-fire mutations.

### Input Validation
All routes with body parsing use Zod schemas. Good. A few notes:
- `POST /api/admin/log` uses `(await request.json()) as {...}` type assertion without Zod validation before passing to the service (service validates internally via `adminActionLogCreateSchema`, so this is safe but inconsistent style).
- `PATCH /api/admin/security/rate-limits` passes raw `request.json()` input directly to `updateAdminRateLimitPolicies` - validation is deferred to the service. Acceptable but the route should document this pattern.

### Sensitive Data Exposure
- `getAdminParentDetail` returns `rawPayload` from payment records (line 434 of `admin-user-service.ts`). This could contain raw webhook payloads with PII or provider-specific data. The field is used to extract `planCode` and `eventType` only, but the full `rawPayload` is included in the subscription history map object returned to the client. **Recommendation: strip `rawPayload` before returning to client or only extract needed fields.**

### Impersonation Security
- `requireAdminFromRequest` is called _after_ setting the cookie in `impersonate/stop`. The admin check could fail (e.g., impersonating a non-admin), leaving a stale cookie. Low risk but order should be: verify admin first, then clear cookie.
- Actually reading the code: in `stop`, admin is verified before `clearImpersonationCookie` - this is correct order.

---

## 5. Consistency Analysis

### Pattern Consistency
- Most routes: `assertTrustedOrigin` -> `rateLimit check` -> `requireAdmin` -> `Zod parse` -> service call -> `ok()`
- Blog routes use `NextResponse.json()` instead of the project's `ok()` helper - inconsistent but not broken.
- `handleRouteError` called with optional `routeId` in blog routes, without it in other routes. Minor inconsistency.

### Naming Conventions
- Service modules properly split: `admin-analytics-service.ts`, `admin-billing-service.ts`, `admin-user-service.ts`, `admin-blog-service.ts` - all re-exported via `service.ts`. Good modular structure.
- API routes follow RESTful conventions consistently.
- Frontend components follow `admin-{feature}-panel.tsx` pattern consistently.

### Duplicate/Redundant Code
- `AdminOverviewPage` (`/admin/overview/page.tsx`) and `AdminAnalyticsPage` (`/admin/analytics/page.tsx`) both call the same three service functions (`getAdminOverview`, `getAdminLearningAnalytics`, `getAdminRetentionAnalytics`). Overview page shows subset of analytics data. Could be unified or shared via a server-side data layer.
- `getSubscriptionBadgeClass` helper function is duplicated in `admin-overview/page.tsx` and `admin-user-search.tsx` (with slight differences in applied properties). Should be extracted to a shared utility.

---

## 6. Logic Correctness

### Business Logic Issues

**`admin-user-service.ts` - `getAdminParentDetail`**
- Two separate Prisma queries fetch payment records: `paymentHistory` (lines 401-417) and `subscriptionHistoryRaw` (lines 418-444). Both query `prisma.paymentRecord.findMany` for the same `parentId`. The first takes 10, the second takes all (no `take` limit). These could be combined into one query with appropriate projection, reducing DB round-trips.
- The `subscriptionHistoryRaw` variable has no pagination limit - for users with many payments this could return large datasets.

**`admin-analytics-service.ts` - `getAdminRetentionAnalytics`**
- `churned30d` counts subscriptions with status `CANCELED_AT_PERIOD_END` updated in 30 days. This is a reasonable proxy but conflates users who canceled but are still in grace period with true churn. The label in UI says "Gói đăng ký bị hủy" (subscriptions canceled) which is accurate, but the metric description says "rời bỏ" (churn) which may mislead.
- `retentionRate` = activeSubscriptions / totalSubscriptions. Includes never-active subscriptions in denominator - inflates denominator, deflates rate.

**`admin-billing-service.ts` - `validateCoupon`**
- Coupon validation and `usedCount` increment are in a single transaction - correct, race-condition-safe using optimistic lock pattern (`updateMany` with `usedCount: { lt: maxUses }`). Good.

**`admin-blog-service.ts` - `defaultFeatureFlags`**
- `ensureDefaultFeatureFlags` is called on every `getAllFeatureFlags()` and `updateFeatureFlag()` invocation - runs N upsert transactions per request. Should be called once at startup or behind a cache/mutex.

**`admin-user-service.ts` - `executeAdminBulkUsersAction`**
- Vietnamese string on line 187 appears garbled (`"Phụ huynh vui lòng kiểm tra cập nhật mới..."`) - this is likely a UTF-8 encoding issue in the source file display but the actual bytes may be correct. Verify file encoding.
- Bulk SUSPEND/ACTIVATE uses `updateMany` (efficient, atomic). But `SEND_NOTIFICATION` loops sequentially with `createNotificationForParent` per user (N+1 pattern for up to 100 users). Should batch or use queue.

### Data Integrity
- `POST /api/admin/videos/upload`: Updates `lesson.bunnyVideoId` and sets `videoStatus = "uploading"` immediately. If the Bunny API call succeeds but the DB update fails, the video will exist on Bunny without a linked lesson (orphaned video). Should use a transaction or handle rollback.
- `POST /api/admin/bulk-enroll`: CSV parsing limit is 500 rows, 2MB file size - reasonable. No check that `orgId` actually exists before `processBulkEnrollRows` (depends on service to throw).

---

## 7. Database / Schema Notes

The admin module queries many core tables: `ParentAccount`, `ChildProfile`, `Subscription`, `PaymentRecord`, `WebhookEvent`, `LessonCompletion`, `ProgressState`, `ReferralCode`, `ReferralAttribution`, `AdminActionLog`, `AdminNote`, `SystemAnnouncement`, `FeatureFlag`, `CouponCode`, `GiftCode`, `CourseEnrollment`, `BlogPost`, `BlogCategory`, `BlogNewsletterSubscriber`, `BlogReadHistory`, `CaregiverInvite`, `Organization`.

No direct schema issues found from query analysis. Admin queries use appropriate `select` projections (no `SELECT *` pattern).

Missing indexes (speculative - would need schema file to confirm):
- `ParentAccount.email` for `ILIKE` search - full table scan risk at scale.
- `LessonCompletion.completedAt` for range queries used in analytics.
- `AdminActionLog.createdAt` for ordered log retrieval.

---

## 8. Actionable Recommendations

### High Priority
1. **Strip `rawPayload` from `subscriptionHistory` response** in `getAdminParentDetail` - prevents potential PII leakage to admin UI.
2. **Add rate-limiting to financial mutations**: `POST /api/admin/coupons`, `POST /api/admin/gift-codes` at minimum.
3. **Fix `POST /api/admin/log` empty action bug**: `body.action ?? ""` passes empty string, triggers Zod `min(1)` error in service. Should default to a sentinel or return 400.
4. **Cache `ensureDefaultFeatureFlags`**: Avoid N upsert transactions per feature-flag read/write. Use a module-level Set or Redis flag.

### Medium Priority
5. **Add `PATCH /api/admin/users/[parentId]`** for individual user updates (suspend/unsuspend, note about account).
6. **Deduplicate payment queries** in `getAdminParentDetail` - merge `paymentHistory` and `subscriptionHistoryRaw` into one query.
7. **Fix bulk notification N+1**: Use queue (BullMQ already present) for `SEND_NOTIFICATION` bulk action.
8. **Add `take` limit to `subscriptionHistoryRaw`** in `getAdminParentDetail` to prevent unbounded result sets.
9. **Video upload atomicity**: Wrap Bunny API call + DB update in try/catch with cleanup if DB update fails.

### Low Priority
10. **Fix nav label typos**: `"Phan tich"` -> `"Phân tích"`, `"Binh luan"` -> `"Bình luận"`.
11. **Deduplicate `getSubscriptionBadgeClass`**: Extract to `src/lib/subscription-badge.ts`.
12. **Standardize response format**: Blog routes use `NextResponse.json()`, others use `ok()`. Unify to project helper.
13. **Add content delete routes**: `DELETE /api/admin/content/lessons/[id]`, etc.
14. **Nav UX**: Group blog sub-items under a collapsible section; use distinct icons per sub-item.
15. **Clarify churn metric**: Rename `churned30d` display label from "rời bỏ" to "hủy gói" or add tooltip explaining the metric is `CANCELED_AT_PERIOD_END` transitions, not active churn.

---

## 9. Security Checklist Summary

| Control | Status |
|---|---|
| Admin auth on all API routes | PASS |
| Admin auth on all pages (layout guard) | PASS |
| CSRF on all mutations | PASS |
| Rate-limit on high-risk mutations | PARTIAL (8/34) |
| Zod input validation | PASS (some routes defer to service) |
| Action logging (audit trail) | PARTIAL (impersonate, bulk actions logged; content mutations not) |
| No sensitive data leak in responses | FAIL (rawPayload in subscription history) |
| Impersonation reversible with log | PASS |
| Admin email-allowlist (ADMIN_EMAILS env) | PASS |

---

## Unresolved Questions

1. Does `src/app/(main)/admin/page.tsx` redirect to `/admin/overview` or render content? Not read - behavior unknown.
2. Is `src/modules/admin/content-service.ts` referenced by content routes and what does it expose? Not fully reviewed.
3. Are there DB indexes on `ParentAccount.email`, `LessonCompletion.completedAt`, `AdminActionLog.createdAt`? Schema not reviewed in this pass.
4. What does `assertRequestAllowedBySecurityControls` do for the security/rate-limits route - is there IP allowlisting that could lock out admins?
5. Is Bunny CDN integration (`bunny-stream-client`) fully implemented or a stub? Only one admin video upload route was found.
6. The `admin-billing-service.ts` has `validateCoupon` (public-facing logic mixed into admin billing service) - should this be in a shared `billing` module instead?
7. File encoding issue on line 187 of `admin-user-service.ts` - are there other garbled Vietnamese strings in the codebase?
