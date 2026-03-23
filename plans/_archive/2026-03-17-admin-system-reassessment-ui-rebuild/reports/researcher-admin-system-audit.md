# Admin System Audit - 2026-03-17

## Snapshot
- API admin routes: 65 endpoints under `src/app/api/admin/**`.
- Admin pages: 22 `page.tsx` files under `src/app/(main)/admin/**`.
- Admin UI components: 23 files under `src/components/admin*`.
- Critical oversized UI files:
  - `src/components/admin-content-panel.tsx` (1447 lines)
  - `src/components/admin-users-management.tsx` (1145 lines)
  - `src/components/admin-operations-panel.tsx` (697 lines)

## Coverage by domain
- `auth`: 3 API routes, login UI present, session guard present.
- `overview + analytics`: API + page + service present.
- `users`: 6 API routes + large management panel + service.
- `courses/content/skills/lessons`: API breadth high, UI exists, editing flows present.
- `payments/webhooks/export`: API complete, operations UI exists.
- `security/feature-flags`: API + page + panel present.
- `blog CMS`: routes/pages/forms/analytics mostly complete.
- `organizations/staff/log/gift-codes`: routes/pages/components present.

## Major gaps
- UI consistency gap:
  - Mixed styling systems (global utility classes + undefined legacy class names).
  - `admin-card`, `admin-table-wrapper`, `admin-card-title`, `admin-detail-*` used but missing in `globals.css`.
- Maintainability gap:
  - 3 monolith components exceed safe context size and ownership boundaries.
- Test gap:
  - Only one E2E admin test (`tests/e2e/admin-manual-reconcile.spec.ts`) for a broad admin surface.
  - Service tests exist (`src/modules/admin/__tests__/service.test.ts`) but UI flow coverage is thin.

## Risk ranking
1. High: UI regression from inconsistent CSS contract.
2. High: slow delivery and defect risk from monolith admin components.
3. Medium: insufficient end-to-end admin validation for critical operations.
4. Medium: mobile admin experience constrained by horizontal nav and dense tables.

## Recommended execution order
1. Rebuild admin shell + style primitives.
2. Normalize page headers/surfaces for core admin pages.
3. Patch missing legacy class definitions or migrate those components to shared primitives.
4. Split monolith panels into submodules.
5. Add targeted E2E/admin smoke tests.

## Unresolved questions
- None.
