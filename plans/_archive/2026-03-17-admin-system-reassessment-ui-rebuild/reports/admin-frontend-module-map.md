# Admin Frontend Module Map

Date: 2026-03-17
Scope: `src/app/(main)/admin/**`, `src/components/admin*.tsx`, `src/components/admin/**`, `src/app/globals.css` (admin classes)

## 1) Key FE Modules (layout/page/component + LOC)

### Layout / shell
| File | LOC | Notes |
|---|---:|---|
| `src/app/(main)/admin/layout.tsx` | 41 | Auth gate + mobile top nav + desktop sidebar offset |
| `src/components/admin-shell-nav.tsx` | 377 | Main nav logic (grouping, active state, mobile/desktop variants) |
| `src/app/globals.css` | n/a | Admin utility classes (`.admin-controls`, `.admin-table*`, `.admin-lesson-list`) |

### Heavy pages / clients under app-admin
| File | LOC | Notes |
|---|---:|---|
| `src/app/(main)/admin/courses/[id]/admin-course-detail-client.tsx` | 539 | Course detail client UI + interactions |
| `src/app/(main)/admin/courses/admin-courses-client.tsx` | 407 | Course listing/admin actions |
| `src/app/(main)/admin/blog/posts/page.tsx` | 239 | Blog posts listing/filter UI |
| `src/app/(main)/admin/blog/analytics/page.tsx` | 231 | Analytics view |
| `src/app/(main)/admin/blog/page.tsx` | 210 | Blog dashboard |

### Heavy shared admin components
| File | LOC | Notes |
|---|---:|---|
| `src/components/admin-content-panel.tsx` | 1447 | Track/level/unit/lesson/activity CRUD + upload flow |
| `src/components/admin-users-management.tsx` | 1145 | Search/filter/detail/subscription/email/notes/bulk actions |
| `src/components/admin-operations-panel.tsx` | 697 | Payments/webhooks/lesson trial ops |
| `src/components/admin-blog-post-form.tsx` | 492 | Blog editor + publish flow |
| `src/components/admin-staff-panel.tsx` | 417 | Staff CRUD |
| `src/components/admin-organizations-panel.tsx` | 377 | Org/member management |
| `src/components/admin-security-panel.tsx` | 369 | Security controls |
| `src/components/admin-announcement-panel.tsx` | 262 | Announcement CRUD |
| `src/components/admin-coupon-panel.tsx` | 236 | Coupon CRUD |
| `src/components/admin-gift-code-panel.tsx` | 214 | Gift code management |

## 2) Files > 200 LOC (needs modularization by guideline)

1. `src/components/admin-content-panel.tsx` (1447)
2. `src/components/admin-users-management.tsx` (1145)
3. `src/components/admin-operations-panel.tsx` (697)
4. `src/app/(main)/admin/courses/[id]/admin-course-detail-client.tsx` (539)
5. `src/components/admin-blog-post-form.tsx` (492)
6. `src/components/admin-staff-panel.tsx` (417)
7. `src/app/(main)/admin/courses/admin-courses-client.tsx` (407)
8. `src/components/admin-organizations-panel.tsx` (377)
9. `src/components/admin-shell-nav.tsx` (377)
10. `src/components/admin-security-panel.tsx` (369)
11. `src/components/admin-announcement-panel.tsx` (262)
12. `src/app/(main)/admin/blog/posts/page.tsx` (239)
13. `src/components/admin-coupon-panel.tsx` (236)
14. `src/app/(main)/admin/blog/analytics/page.tsx` (231)
15. `src/components/admin-gift-code-panel.tsx` (214)
16. `src/app/(main)/admin/blog/page.tsx` (210)

## 3) Current coupling / risk map

- UI shell and business logic mostly separated already: page imports components; data fetch in page/service. Good for safe shell refactor.
- Styling mixed:
  - Tailwind utility inline in many pages/components.
  - Global css admin classes in `globals.css` used by multiple panels.
- Nav complexity concentrated in `admin-shell-nav.tsx` (desktop + mobile + groups + role gates), high leverage and high blast radius.
- Big monolith components handle many concerns at once (form state + fetch + table + mutation + feedback), hard to iterate UI quickly.

## 4) Smallest safe write-scope for this session (UI shell rebuild, low regression)

### Must-touch (low risk / high impact)
1. `src/app/(main)/admin/layout.tsx`
2. `src/components/admin-shell-nav.tsx`
3. `src/app/globals.css` (only add/adjust admin-shell visual primitives)

### Optional touch (still safe)
4. `src/app/(main)/admin/overview/page.tsx`
5. `src/app/(main)/admin/analytics/page.tsx`
6. `src/app/(main)/admin/operations/page.tsx`
7. `src/app/(main)/admin/blog/page.tsx`

### Avoid in first refactor pass
- `admin-content-panel.tsx`, `admin-users-management.tsx`, `admin-operations-panel.tsx` deep logic internals.
- API routes/services (`src/app/api/admin/**`, `src/modules/admin/**`).

## 5) Suggested split backlog after shell pass

- `admin-content-panel.tsx`: split by domain section
  - `admin-content-track-section.tsx`
  - `admin-content-level-section.tsx`
  - `admin-content-unit-section.tsx`
  - `admin-content-lesson-section.tsx`
  - `admin-content-activity-section.tsx`
- `admin-users-management.tsx`: split
  - list/filter toolbar
  - detail drawer/panel
  - subscription action panel
  - notes panel
  - bulk action panel
- `admin-operations-panel.tsx`: split payments/webhooks/lessons operations.

## Unresolved questions

1. Có cần giữ exact dark sidebar style hiện tại hay đổi sang hybrid topbar + contextual sidebar?
2. Ưu tiên mobile admin ở mức nào (full parity hay chỉ read-only + critical actions)?
3. Blog admin có cần visual language riêng, hay ép chung 100% với shell mới?
4. Có chốt sprint sau để tách 3 file siêu lớn (`admin-content`, `admin-users`, `admin-operations`) không?
