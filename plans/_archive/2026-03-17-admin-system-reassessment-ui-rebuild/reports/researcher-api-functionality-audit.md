# Admin API + Domain Service Audit (2026-03-17)

## Scope
- Read `README.md` first.
- Reviewed `src/app/api/admin/**` and `src/modules/admin/**`.
- Cross-checked UI coverage in `src/app/(main)/admin/**` + `src/components/admin-*`.

## Snapshot
- Admin API routes: **65**
- Admin pages: **22**
- Admin domain services: `admin-analytics-service`, `admin-auth-service`, `admin-billing-service`, `admin-blog-service`, `admin-user-service`, `admin-users-management-service`, `admin-staff-service`, `content-service`

## Module matrix
| Module | API route | Domain service | UI page/panel | Status |
|---|---:|---:|---:|---|
| Auth | ✅ (`/api/admin/auth/*`) | ✅ (`admin-auth-service`) | ✅ (`/admin/login`) | Good |
| Overview | ✅ (`/api/admin/overview`) | ✅ (`admin-analytics-service`) | ✅ (`/admin/overview`) | Good |
| Analytics | ✅ (`/api/admin/analytics*`) | ✅ (`admin-analytics-service`) | ✅ (`/admin/analytics`) | Good |
| Users | ✅ (`/api/admin/users*`) | ✅ (`admin-user-service` + `admin-users-management-service`) | ✅ (`/admin/users`) | Good |
| Staff | ✅ (`/api/admin/staff*`) | ✅ (`admin-staff-service`) | ✅ (`/admin/staff`) | Good |
| Content (track/level/unit/lesson/activity) | ✅ (`/api/admin/content/*`) | ✅ (`content-service`) | ✅ (`/admin/content`) | Good |
| Courses | ✅ (`/api/admin/courses*`) | ⚠️ (logic split, no single `admin-course-service`) | ✅ (`/admin/courses`, detail page) | Partial |
| Billing / Payments | ✅ (`/api/admin/payments*`, `/api/admin/coupons*`) | ✅ (`admin-billing-service`) | ✅ (`/admin/operations` tabs) | Good |
| Webhooks | ✅ (`/api/admin/webhooks`) | ✅ (`admin-billing-service`) | ✅ (`/admin/operations` tabs) | Good |
| Export | ✅ (`/api/admin/export/*`) | ✅ (`admin-billing-service`, `admin-user-service`) | ⚠️ (button-level UI, no dedicated export page) | Partial |
| Announcements | ✅ (`/api/admin/announcements*`) | ✅ (`admin-blog-service`) | ✅ (`/admin/operations` tabs) | Good |
| Gift codes | ✅ (`/api/admin/gift-codes`) | ⚠️ (route-heavy, no dedicated service module) | ✅ (`/admin/gift-codes`) | Partial |
| Feature flags | ✅ (`/api/admin/feature-flags*`) | ✅ (`admin-blog-service`) | ✅ (`/admin/security`) | Good |
| Security controls | ✅ (`/api/admin/security/*`) | ⚠️ (mainly `modules/platform/security-*`, not `modules/admin`) | ✅ (`/admin/security`) | Partial |
| Blog CMS | ✅ (`/api/admin/blog/*`) | ✅ (`admin-blog-service` + `modules/blog`) | ✅ (`/admin/blog/*`) | Good |
| Organizations | ✅ (`/api/admin/organizations*`) | ⚠️ (uses `modules/organizations`) | ✅ (`/admin/organizations`) | Partial |
| Operations aggregate | ⚠️ (composes many routes) | ⚠️ (cross-service composition) | ✅ (`/admin/operations`) | Partial |
| Action logs | ✅ (`/api/admin/log`) | ✅ (`admin-user-service`) | ✅ (`/admin/log`) | Good |
| Impersonation | ✅ (`/api/admin/impersonate*`) | ⚠️ (route-level + auth helper) | ❌ | Gap |
| Skills mapping | ✅ (`/api/admin/skills*`, `/api/admin/lessons/*/skills`) | ⚠️ (not under `modules/admin`) | ❌ (no dedicated admin skills UI) | Gap |
| Video upload / tus token | ✅ (`/api/admin/videos/*`) | ⚠️ (mixed route+component flow) | ✅ (`admin-content-panel` uploader) | Partial |

## Critical inconsistencies / gaps
1. **Service boundary not clean**: multiple admin modules rely on non-admin domains (`modules/platform`, `modules/organizations`, `modules/blog`) without explicit admin façade.
2. **Route-heavy modules**: gift-codes + impersonation rely more on route handlers than dedicated service layer, hard to test in isolation.
3. **UI discoverability gap**: impersonation + skills APIs have no first-class page in admin nav.
4. **Operational UX fragmented**: export lives as button action, not explicit module view/state.
5. **Large-file risk** (maintainability): many admin files exceed 200 lines, notably:
   - `src/components/admin-content-panel.tsx` (~1447)
   - `src/components/admin-users-management.tsx` (~1145)
   - `src/components/admin-operations-panel.tsx` (~697)
   - `src/modules/admin/content-service.ts` (~564)

## Immediate recommendations
- Introduce explicit admin module catalog + health states in UI shell.
- Add missing nav entries/pages for `Impersonation` and `Skills` (or hide/retire APIs if not needed).
- Move gift-code and impersonation logic into dedicated service modules for consistency + testability.
- Split oversized admin panels by concern (filters/table/actions/forms).
- Keep existing APIs, rebuild UI shell first to improve clarity with low regression risk.

## Unresolved questions
1. `skills` endpoints are production-ready or internal-only?
2. impersonation flow intentionally hidden from UI or missing feature?
3. export should stay action-only or become a dedicated admin module with history/audit?
4. target role matrix per module (`STAFF_ADMIN` vs `SUPER_ADMIN`) final spec কোথ?