# Consistency Hardening Phase 2 (2026-02-21)

## Goal
Continue project completion with strict consistency across frontend, backend, and database behavior.

## Skills Applied
1. `planning`
2. `backend-development`
3. `databases`
4. `web-testing`
5. `research`
6. `frontend-development`
7. `ui-styling`

## Workstreams

### WS1 - Rate-Limit Trust Boundary Hardening (P0)
Status: Completed

Scope:
1. Harden request IP extraction with trusted proxy controls.
2. Add environment-based knobs for deployment topology.
3. Add unit tests for proxy chain parsing and fallback behavior.

Outputs:
1. `src/lib/rate-limit.ts`
2. `src/lib/env.ts`
3. `src/lib/__tests__/rate-limit.test.ts`
4. `.env.example`
5. `README.md`

### WS1.5 - Video Learning Flow Enforcement & API Optimization (P0)
Status: Completed

Scope:
1. Add explicit lesson watch endpoint before completion.
2. Enforce backend guard: video lessons require completed watch event.
3. Optimize `today mission` query to avoid loading full lesson catalog per request.
4. Wire frontend lesson flow to follow watch -> activity -> completion sequence.
5. Update e2e journey to include watch step.

Outputs:
1. `src/app/api/lessons/[lessonId]/watch/route.ts`
2. `src/modules/learning/video-watch-service.ts`
3. `src/modules/learning/completion-service.ts`
4. `src/modules/content/service.ts`
5. `src/components/lesson-completion-card.tsx`
6. `src/components/kid-mission-panel.tsx`
7. `src/app/kid/today/page.tsx`
8. `scripts/e2e-p0-journey.mjs`
9. `src/modules/learning/__tests__/video-watch-service.test.ts`
10. `README.md`

### WS1.6 - Watch Session Hardening (P0)
Status: In Progress

Scope:
1. Introduce signed watch-session endpoint for video lessons.
2. Bind watch progress to lesson/child/parent context via server-verified token.
3. Replace direct `watchedSeconds` trust with heartbeat-based credit calculation.
4. Enforce anti-replay basics: TTL + signature + context match.
5. Align frontend and e2e flow with session-first watch protocol.

Outputs:
1. `src/app/api/lessons/[lessonId]/watch/session/route.ts`
2. `src/app/api/lessons/[lessonId]/watch/heartbeat/route.ts`
3. `src/modules/learning/video-watch-service.ts`
4. `src/lib/redis-client.ts`
5. `src/components/lesson-completion-card.tsx`
6. `scripts/e2e-p0-journey.mjs`
7. `src/modules/learning/__tests__/video-watch-service.test.ts`
8. `README.md`
9. `src/lib/env.ts`
10. `.env.example`

### WS2 - Media Upload Reconciliation Lifecycle (P0)
Status: Planned (next)

Scope:
1. Add upload completion API to verify object existence after signed upload.
2. Add DB state to track `PENDING` vs `UPLOADED` evidence media.
3. Add cleanup logic for stale `PENDING` records.

Implementation notes:
1. Introduce status/timestamp fields on `EvidenceMedia`.
2. Use storage provider adapter method for object existence check.
3. Wire frontend upload panel to call completion endpoint after PUT.

### WS3 - Frontend-Backend Contract Locking (P1)
Status: Planned

Scope:
1. Add typed API response contracts for mission, children, and admin data.
2. Ensure page-to-page deep-link state is deterministic (`childId`, filters).
3. Add regression tests for child context transitions.

### WS4 - Release Evidence Update (P1)
Status: Planned

Scope:
1. Add checklist for env parity and storage reconciliation checks.
2. Include new tests in quality gate evidence artifacts.

### WS5 - Kid Animation System Integration (P1)
Status: In Progress (implementation completed, rollout extension pending)

Scope:
1. Evaluate animation stack for React/Next kid learning UX (runtime vs asset animation).
2. Integrate lightweight animation runtime with reduced-motion compliance.
3. Apply animation to mission list transition and lesson progression states.
4. Keep animation GPU-friendly (`transform`/`opacity`) and avoid layout-heavy effects.
5. Prepare phased path for optional mascot animation via Rive/dotLottie.

Outputs:
1. `src/components/animation/kid-motion-provider.tsx`
2. `src/components/animation/kid-motion-variants.ts`
3. `src/components/kid-mission-panel.tsx`
4. `src/components/lesson-completion-card.tsx`
5. `src/app/globals.css`
6. `package.json`

## Verification Commands
1. `pnpm lint`
2. `pnpm type-check`
3. `pnpm test`
4. `pnpm build`
5. `pnpm test:e2e:p0`

## Current Verification Status
1. `pnpm lint` - pass
2. `pnpm type-check` - pass
3. `pnpm test` - pass
4. `pnpm build` - pass
5. `pnpm test:e2e:p0` - pass
