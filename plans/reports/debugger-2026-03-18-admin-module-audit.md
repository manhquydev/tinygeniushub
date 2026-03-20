# Admin Module Audit — 2026-03-18

**Scope:** 5 partial admin modules + 2 missing-UI modules (impersonation, skills mapping)

---

## 1. Courses Module

**UI:** `src/app/(main)/admin/courses/`
**API:** `src/app/api/admin/courses/`

### UI Status: ✅ Working

- `page.tsx` — server component, queries `prisma.course.findMany` with `_count` on enrollments/lessons, passes to client.
- `admin-courses-client.tsx` — full CRUD table: create, edit (PATCH), toggle publish, delete. All import refs resolve. Uses only `Link` + `Button` (no missing imports). Button import exists but unused (native `<button>` used instead — cosmetic, not a bug).
- `courses/[id]/page.tsx` + `admin-course-detail-client.tsx` — detail view with lessons tab and enrollments lazy-load. All refs resolve (`ArrowLeft`, `ArrowUp`, `ArrowDown`, `Trash2`, `Plus`, `Search`, `BookOpen`, `Users` — all from lucide-react).

### API Status: ✅ Working

| Route | Methods | Notes |
|---|---|---|
| `/api/admin/courses` | GET, POST | Auth-gated, Zod-validated, proper error handling |
| `/api/admin/courses/[id]` | GET, PATCH, DELETE | DELETE requires `SUPER_ADMIN` |
| `/api/admin/courses/[id]/publish` | POST | Toggle isPublished |
| `/api/admin/courses/[id]/lessons` | GET, POST, DELETE, PATCH | Lesson assignment + reorder |
| `/api/admin/courses/[id]/enrollments` | GET | Lazy-loaded enrollment list |
| `/api/admin/lessons` | GET | Used for lesson search picker |

### Issues

- **Minor:** `admin-courses-client.tsx:5` imports `Button` from `@/components/ui/button` but never uses it. Dead import. Not a runtime error.
- **Missing feature:** No pagination on course list (fetches all courses). Low risk now, potential perf issue at scale.
- **Enrollment stat:** `_count.enrollments` shown in list but full enrollment data only accessible via detail page. Expected behavior, not a bug.

---

## 2. Operations Module

**UI:** `src/app/(main)/admin/operations/page.tsx`
**API:** `src/app/api/admin/payments/`, `src/app/api/admin/webhooks/`

### UI Status: ✅ Working

- `page.tsx` imports resolve: `AdminExportData` ✅, `AdminOperationsTabs` ✅, `AdminPageHeader` ✅, `getAdminOverview` ✅.
- `admin-operations-tabs.tsx` imports resolve: `AdminOperationsPanel` ✅, `AdminAnnouncementPanel` ✅, `AdminCouponPanel` ✅, `AdminFooterSocialLinksPanel` ✅.
- `admin-operations-panel.tsx` sub-module imports all resolve: `admin-operations-types.ts`, `admin-operations-constants.ts`, `admin-operations-payments-section.tsx`, `admin-operations-trials-section.tsx`, `admin-operations-webhooks-section.tsx`, `use-admin-operations-controller.ts` — all present.

### API Status: ✅ Working

| Route | Methods | Notes |
|---|---|---|
| `/api/admin/payments` | GET | Delegates to `listPaymentRecordsAdmin` |
| `/api/admin/payments/[id]/reconcile` | POST | Payment reconciliation |
| `/api/admin/webhooks` | GET | Webhook event listing |
| `/api/admin/export/payments` | GET | CSV/JSON export |

### Issues

- **Potential runtime bug — `page.tsx:47`:** `payment.processedAt.toISOString()` called without null check. The `PaymentRecord.processedAt` field in schema is `DateTime @default(now())` (non-nullable), so this is safe. However, the analytic service `admin-analytics-service.ts` queries `prisma.paymentRecord.findMany` with `select: { processedAt: true }` and only 8 records — the mapping in `page.tsx` calls `.toISOString()` directly. Safe as-is per schema.
- `WebhookEvent.processedAt` is nullable (`DateTime?`), correctly guarded at `page.tsx:60`: `event.processedAt ? event.processedAt.toISOString() : null`. ✅
- Operations page hardcodes `take: 30` for `lessonTrialRows` — limited to 30 lessons for trial toggle. No UI pagination. **Issue:** admin cannot toggle trial flag on lessons beyond position 30.

---

## 3. Gift Codes Module

**UI:** `src/app/(main)/admin/gift-codes/page.tsx`
**API:** `src/app/api/admin/gift-codes/`

### UI Status: ⚠️ Partial

- `page.tsx` imports `AdminGiftCodePanel` ✅.
- No `requireAdminParent()` / auth guard in `gift-codes/page.tsx` — server page does `prisma.giftCode.findMany` without calling any auth function first.
- `admin-gift-code-panel.tsx` — all UI imports resolve: `Button`, `Input`, `Label`, `Select*`, `Table*`, `Badge` — all from `@/components/ui/*` ✅.

### API Status: ✅ Working

| Route | Methods | Notes |
|---|---|---|
| `/api/admin/gift-codes` | GET, POST | Zod-validated, rate-limited, creates audit log |

### Issues

- **Security gap — `gift-codes/page.tsx:1-16`:** No `requireAdminParent()` call before DB query. All other admin pages call `requireAdminParent()` first (see courses/page.tsx:6). Gift codes page skips this — exposes gift code list to any authenticated user who hits the page directly.
- **Missing feature:** No delete/deactivate operation on individual gift codes from UI. API has no DELETE route either. Codes can be generated but not revoked.
- **Missing feature:** No "copy to clipboard" action for generated codes in the table.

---

## 4. Organizations Module

**UI:** `src/app/(main)/admin/organizations/page.tsx`
**API:** `src/app/api/admin/organizations/`

### UI Status: ⚠️ Partial

- `page.tsx` imports resolve: `listAllOrganizations` ✅, `AdminOrganizationsPanel` ✅.
- `admin-organizations-panel.tsx` — all imports resolve ✅.
- Create org form + toggle active/inactive works via API.
- "Chi tiết" (detail) expand panel shows org metadata only.

### API Status: ✅ Working

| Route | Methods | Notes |
|---|---|---|
| `/api/admin/organizations` | GET, POST | Full Zod validation |
| `/api/admin/organizations/[id]` | PATCH, DELETE | DELETE soft-deletes (sets isActive=false), SUPER_ADMIN only |
| `/api/admin/organizations/[id]/members` | POST, DELETE | Add/remove members by parentId |

### Issues

- **Missing feature — member management UI:** `admin-organizations-panel.tsx:268` hardcodes a message: _"Để quản lý thành viên, dùng API: `POST /api/admin/organizations/{id}/members`"_ — the member add/remove UI is not implemented in the panel. API exists and works, but there's no UI to add/remove members. Admin must call API manually.
- **Missing feature:** No member list view per org. `listAllOrganizations` does not include members count or list.
- `listAllOrganizations` at `organization-service.ts:126-128` does simple `findMany` with no `_count` or member includes. The panel cannot show member counts.

---

## 5. Security Module

**UI:** `src/app/(main)/admin/security/page.tsx`
**API:** `src/app/api/admin/security/`

### UI Status: ✅ Working

- `page.tsx` imports resolve: `AdminPageHeader` ✅, `AdminFeatureFlagsPanel` ✅, `AdminSecurityPanel` ✅, `getAdminSecuritySettings` ✅.
- `admin-security-panel.tsx` — all imports resolve: `Button`, `Input`, `Label`, `Select*`, `Table*`, `Textarea` — all from `@/components/ui/*` ✅.
- `admin-feature-flags-panel.tsx` — imports `Button`, `Table*` ✅.

### API Status: ✅ Working

| Route | Methods | Notes |
|---|---|---|
| `/api/admin/security/rate-limits` | GET, PATCH | SUPER_ADMIN only, security controls check |
| `/api/admin/security/edge-export` | GET | SUPER_ADMIN only, builds edge policy JSON |

### Issues

- None — module appears fully functional. Rate-limit policies, DDoS mode, blocked IP CIDRs, and feature flags all have working UI and API.

---

## 6. Impersonation (No UI)

**API:** `src/app/api/admin/impersonate/route.ts`, `src/app/api/admin/impersonate/stop/route.ts`

### UI Status: ❌ Missing

No admin UI page at `/admin/impersonate` or similar. The feature is only accessible to `SUPER_ADMIN` via direct API calls.

### API Status: ✅ Working

| Route | Method | Notes |
|---|---|---|
| `/api/admin/impersonate` | POST | Body: `{ parentId }`. Sets impersonation cookie. SUPER_ADMIN only. Creates audit log. Redirects to `/parent/dashboard`. |
| `/api/admin/impersonate/stop` | POST | Clears cookie. Creates audit log. Redirects to `/admin`. |

### Data exposed

- Takes `parentId`, verifies parent exists, sets cookie with `{ parentId, actorEmail }`.
- Returns `{ redirectTo: "/parent/dashboard" }`.
- Impersonation start/stop both logged via `createAdminActionLog`.

### What needs to be built

- A UI panel (likely within Users admin page) with a "Đăng nhập thay" button per user row.
- Should only render for SUPER_ADMIN.
- On click: POST to `/api/admin/impersonate` with parentId, then `window.location = json.data.redirectTo`.
- Stop impersonation banner/button accessible from anywhere while impersonating.

---

## 7. Skills Mapping (No UI)

**API:** `src/app/api/admin/skills/`, `src/app/api/admin/lessons/[lessonId]/skills/`

### UI Status: ❌ Missing

No admin UI page at `/admin/skills` or similar. No skill tagging UI in the lesson admin panel.

### API Status: ✅ Working

| Route | Method | Notes |
|---|---|---|
| `/api/admin/skills` | GET | Returns full skill tree via `listAllSkillsAsTree()` |
| `/api/admin/skills` | POST | Create skill. Domain enum: `MATH`, `ENGLISH_PHONICS` |
| `/api/admin/skills/[id]` | GET | Skill with prerequisites |
| `/api/admin/skills/[id]` | PATCH | Update skill fields |
| `/api/admin/skills/[id]/prerequisites` | (exists) | Prerequisite management |
| `/api/admin/lessons/[lessonId]/skills` | GET | List skills tagged to lesson |
| `/api/admin/lessons/[lessonId]/skills` | POST | Tag skills to lesson (`skillIds[]`, `primarySkillId`) |
| `/api/admin/lessons/[lessonId]/skills` | DELETE | Remove skill tag from lesson |

### What needs to be built

- `/admin/skills` page: skill taxonomy tree viewer + create/edit skill form.
- Lesson detail page (in content module) should include a skill-tagging panel using `GET/POST/DELETE /api/admin/lessons/[lessonId]/skills`.

---

## Summary Table

| Module | UI | API | Critical Issues |
|---|---|---|---|
| Courses | ✅ Working | ✅ Working | Dead import (cosmetic), no pagination |
| Operations | ✅ Working | ✅ Working | lessonTrialRows capped at 30 |
| Gift Codes | ⚠️ Partial | ✅ Working | **No auth guard on page**, no delete/revoke |
| Organizations | ⚠️ Partial | ✅ Working | Member management UI missing |
| Security | ✅ Working | ✅ Working | None |
| Impersonation | ❌ Missing | ✅ Working | No UI — API-only |
| Skills Mapping | ❌ Missing | ✅ Working | No UI — API-only |

---

## Priority Fixes

1. **[HIGH] Gift codes page missing auth guard** — `src/app/(main)/admin/gift-codes/page.tsx` must call `requireAdminParent()` before DB query. One-line fix.
2. **[MEDIUM] Operations: lessonTrialRows pagination** — `take: 30` hardcoded in `operations/page.tsx:11`. Should be `take: 200` or paginated to avoid hidden lessons.
3. **[MEDIUM] Organizations: member management UI** — Add member add/remove form to `admin-organizations-panel.tsx`.
4. **[LOW] Courses: dead Button import** — `admin-courses-client.tsx:5` unused import (cosmetic).
5. **[BACKLOG] Impersonation UI** — Add impersonate button to users admin page.
6. **[BACKLOG] Skills mapping UI** — New `/admin/skills` page + lesson skill tagging panel.

---

## Resolved Questions

- **Layout-level auth:** `src/app/(main)/admin/layout.tsx` calls `getAdminSession()` and redirects to `/admin/login` if no session. This means the gift codes page IS protected at the layout level — unauthenticated users can't reach it. The missing `requireAdminParent()` call in `gift-codes/page.tsx` is therefore a defense-in-depth gap, not an open exploit. Still worth adding for consistency and to enforce role checks (any logged-in admin can see gift codes, not just those with proper role).

## Unresolved Questions

- `listPaymentRecordsAdmin` accepts `unknown` input at `admin-billing-service.ts:275` — unclear if it validates `limit`/`status` params safely; inspect that function.
