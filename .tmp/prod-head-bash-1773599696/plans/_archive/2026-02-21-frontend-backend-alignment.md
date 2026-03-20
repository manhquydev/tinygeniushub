# Frontend-Backend Alignment Plan (2026-02-21)

## Goal
Complete missing frontend surfaces so they match already-implemented backend APIs.

## Skills Used
1. `frontend-development`
2. `ui-styling`
3. `web-testing`

## Execution Plan
1. Kid mode alignment:
   - Child profile switcher on mission screen.
   - API-driven lesson refresh via `GET /api/lessons/today`.
   - Evidence upload flow via signed URL: `POST /api/evidence/media/upload-url`.
2. Parent dashboard alignment:
   - Referral claim UI using `POST /api/referrals/claim`.
3. Admin alignment:
   - Payment inspection via `GET /api/admin/payments`.
   - Webhook inspection via `GET /api/admin/webhooks`.
   - Trial-flag toggle via `PATCH /api/admin/lessons/:lessonId/trial-flag`.
4. UI integration:
   - Add reusable styles for new controls/tables/upload states.
5. Verification:
   - `pnpm type-check`
   - `pnpm test`
   - `pnpm build`

## Status
- [x] Kid mode alignment
- [x] Parent dashboard referral claim
- [x] Admin operations panel
- [x] UI style integration
- [x] `pnpm type-check`
- [x] `pnpm test`
- [x] `pnpm build`

## Notes
- Full repo `pnpm lint` currently scans `.codex/skills` local tool assets and fails on third-party scripts.
- Added `/.codex/` to `.gitignore` to keep Turbopack/Tailwind build scoped to project root assets.

