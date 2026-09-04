# Slice: qtest
# Agent: qtest
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
61/100 — Large Vitest surface (111 files / ~637 cases) plus HTTP P0/integrity/security scripts exist, but PR CI does not run the Playwright suite, 174/210 API routes have no colocated tests, and nightly is structurally miswired.

## Quality score
47/100 — Docs count files as tests; `pnpm test:e2e` is smoke not Playwright; several “e2e” specs mock APIs/HTML; smoke still asserts hidden `/pricing` copy; visual snapshots are win32-only; no coverage gate in CI.

## What is actually implemented
- Vitest include is `src/**/*.test.ts` + `src/**/*.test.tsx` only (`vitest.config.ts:7`). Counted: **111 files**, **637** `it()`/`test()` calls (+3 `it.each` blocks; `src/proxy.test.ts:6-16` expands to 3 URL cases). No `it.skip` / `it.todo` in `src/`.
- Unit/integration concentration: `src/app/api` 36 files / 135 cases; `src/modules/*` services (learning, billing, reports, adaptive, admin, platform); `src/lib` auth/rate-limit/csrf; a few jsdom component tests (`src/components/*.test.tsx` with `@vitest-environment jsdom`).
- Playwright `testDir` is `./tests/e2e` (`playwright.config.ts:12`). **21 spec files**, **~59 `test()` cases** (plus 6 viewport-generated video-layout cases). Extra orphan `__tests__/e2e/curriculum.spec.ts` (14 tests) is **outside** `testDir`.
- Default `pnpm test:e2e` is **not** Playwright. It is `node scripts/e2e-smoke.mjs` (`package.json:14`): HTTP GET `/`, `/pricing`, `/auth/login`, `/api/health`, optional caregiver invite if ready (`scripts/e2e-smoke.mjs:330-336`).
- Real P0 journey is HTTP-script `scripts/e2e-p0-journey.mjs` (`package.json:18`): signup → child → optional course checkout → watch/complete idempotency → weekly report generate/send-email (`scripts/e2e-p0-journey.mjs:169-446`).
- Additional Node e2e scripts (not Playwright): `e2e-full-local.mjs`, `e2e-security-abuse.mjs`, `e2e-data-integrity.mjs`, `e2e-auth-session-lifecycle.mjs`, `e2e-auth-session-https.mjs`, `e2e-auth-timing.mjs`, `e2e-staging-providers.mjs`, `e2e-obs-alert-drills.mjs`.
- `pnpm release:check` = `lint && type-check && test && test:e2e && security:baseline && perf:sanity` (`package.json:51`). Does **not** include Playwright, P0, integrity, security-abuse, or coverage.
- PR/main CI `.github/workflows/release-check.yml`: postgres:16 + redis:7 services (`:26-48`), migrate+seed (`:104-107`), `pnpm release:check` (`:113`), then `pnpm test:e2e:p0` (`:115-118`) and **only one** Playwright file via `pnpm test:e2e:video-layout` (`:120-121`).
- Nightly `.github/workflows/nightly-local-full.yml`: cron `0 2 * * *` (`:4-5`), runs `pnpm test:local:full` (`:46-50`). No GH postgres/redis services.
- `security:baseline` is `pnpm audit` JSON + severity threshold (default fail on prod `high+`) (`scripts/security-baseline.mjs:13-14,71-129`). Not SAST, not the security e2e script.
- `perf:sanity` p95-benches `/` and `/pricing` vs 1200ms (`scripts/perf-sanity.mjs:7,138-143`).
- Deploy: `deploy.yml` auto-runs after successful Release Check on `main` (`deploy.yml:14-32`). SSH fallback is manual `workflow_dispatch` only (`deploy-digitalocean-ssh.yml:3-14`). Jules workflows are webhook dispatchers, not test gates.

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
| --- | --- | --- | --- |
| ~110 Vitest unit/integration tests | `docs/codebase-summary.md:15,273` | 111 **files**, **637** cases | Doc-lie |
| ~19 Playwright e2e specs | `docs/codebase-summary.md:15,274` | 21 specs in `tests/e2e/` (~59 cases); `__tests__/e2e/curriculum.spec.ts` unused | Partial |
| `pnpm test:e2e` is E2E tests | `README.md:170`; `docs/QUICK-START.md:275` | Smoke HTTP script; Playwright is `pnpm test:e2e:pw` (`package.json:14-16`) | Doc-lie |
| Quality commands include p0/full/security/integrity | `README.md:166-184` | Scripts exist; PR CI runs smoke+P0+one visual spec only | Partial |
| P0: signup → child → lesson complete idempotent → report email | archived `phase-08-...md:7-14`; `docs/implementation-plan.md:30` | Implemented in `scripts/e2e-p0-journey.mjs`; checkout may **skip** | Partial |
| CI starts Postgres/Redis and runs P0 | archived `phase-08-...md:16-20` | True for `release-check.yml`; nightly does **not** use GH services | Partial |
| `release:check` remains lightweight fast gate | archived `phase-08-...md:21` | True: no Playwright suite, no security e2e, no coverage | Done |
| Nightly runs `pnpm test:local:full` | `README.md:261` | Workflow exists; compose port/.env wiring likely fails (below) | Partial |
| Coverage statements 81.65% / gate Met | `docs/testing/backend-production-readiness-matrix.md:7-8,67`; `docs/implementation-plan.md:45` | Snapshot from 2026-02-21 with **37 files / 197 tests**. `vitest.config.ts:9-12` has reporters, **no thresholds**. No `test --coverage` in CI/scripts | Doc-lie |
| `pnpm test:e2e:security` in local-full | `README.md:259-260`; matrix `:9` | In `test-local-full.mjs:89-98`; **not** in PR CI; nightly opt-in env not set for staging/obs | Partial |
| Playwright key specs prove auth/purchase/teacher/gift | `docs/codebase-summary.md:274-276` | Those specs `page.route` + `route.fulfill` mock APIs (and auth-flow mocks dashboard HTML) | Doc-lie |
| `pnpm test` 37 files / 197 tests | matrix `:7` | Stale; now 111 / 637 | Doc-lie |

## Findings
### Critical
- [Nightly compose cannot talk to published DB ports / missing `.env`] `.github/workflows/nightly-local-full.yml:18-19,46-50` — `DATABASE_URL` is `127.0.0.1:5432` and `REDIS_URL` `127.0.0.1:6379`. `docker-compose.yml:12,29` publishes **5433** and **6380** by default. `scripts/test-local-full.mjs:36` runs `docker compose up -d` with `env_file: .env` (`docker-compose.yml:48-49`) while `.gitignore:35` ignores `.env*`. Nightly checkout has no `.env`. Impact: claimed nightly full regression is very likely red or a no-op against the wrong ports. Suggested fix: nightly-only compose overlay (postgres/redis only, host 5432/6379), generate `.env` in CI, do not start `web`/`worker` from compose when host `pnpm` already runs the app.

### High
- [PR gate `test:e2e` is smoke, not Playwright] `package.json:14,51`; `release-check.yml:112-121` — `release:check` never runs `pnpm test:e2e:pw`. CI Playwright is only `lesson-player-video-layout-visual.spec.ts`. Impact: UI regressions in auth, courses, kid flow, i18n, gift-code, teacher, contact never block merge. Suggested fix: either rename smoke and add a real Playwright job, or stop calling smoke “e2e” in README.
- [Smoke asserts dead `/pricing` copy] `scripts/e2e-smoke.mjs:331` expects status 200 + `"Transparent price list for each course"`. `src/app/(main)/pricing/page.tsx:4` `redirect("/courses")`. Guest Playwright already asserts redirect (`tests/e2e/guest-navigation.spec.ts:30-35`). String is **not** in `src/` (only `locales/en/translation.json`). Fetch follows redirects, so this is a stale content assertion on `/courses`. Impact: fast gate either fails or passes on accidental substring. Suggested fix: assert redirect 307/308 Location `/courses` (or drop `/pricing` from smoke). Same stale path in `perf-sanity.mjs:139-143`.
- [P0 paid conversion is optional] `scripts/e2e-p0-journey.mjs:241-273` — if checkout returns `COURSE_PRICE_NOT_AVAILABLE`, journey logs skip and continues to trial lessons. Impact: CI can go green with zero enrollment/payment. Suggested fix: fail when no priced published course exists after seed.
- [Playwright “journeys” mock the backend] `tests/e2e/auth-flow.spec.ts:7-42` fulfills login + **fake dashboard HTML**; `course-purchase-flow.spec.ts:25-47`; `gift-code-redeem.spec.ts` route.fulfill; `teacher-bulk-enroll.spec.ts:27-33`. Impact: they do not prove Better Auth cookies, PayOS/Stripe, or org APIs. Suggested fix: treat them as UI contract tests; keep live proof in Node scripts or un-mocked Playwright.
- [Coverage gate is not enforced] `vitest.config.ts:9-12`; no coverage script in `package.json:6-91`; matrix `:67` claims Met 81.65%. Impact: coverage can collapse without CI signal. Suggested fix: add `vitest run --coverage` with thresholds on `src/modules` + `src/app/api` or drop the claim.
- [Visual snapshots are win32 artifacts on Linux CI] snapshots `tests/e2e/lesson-player-video-layout-visual.spec.ts-snapshots/*-win32.png` and `courses-visual-regression.spec.ts-snapshots/*-win32.png`. CI is `ubuntu-latest` (`release-check.yml:16`). Playwright suffixes platform. Impact: video-layout job on Linux looks for `*-linux.png` or diffs vs Windows baselines. Suggested fix: linux snapshots, or `snapshotPathTemplate` without `{platform}`.

### Medium
- [API route test hole] 210 `route.ts` vs 36 colocated `route.test.ts` (174 without). Missing include P0 HTTP surfaces: `src/app/api/children/route.ts`, `lessons/today`, `lessons/*/complete|watch*`, `reports/generate`, `billing/checkout`, `cron/*`, `gift-codes/redeem`, `caregivers/*`. Some covered at service layer (e.g. `children-service.test.ts`) or HTTP scripts, not route contracts.
- [Module unit holes] `src/modules/content` 0 tests; `caregivers` 0; `organizations` 0; `reader` 0. Worker: only `src/worker/queue.test.ts` (2 cases).
- [Orphan curriculum e2e] `__tests__/e2e/curriculum.spec.ts:25-31` hits `/login` and `/abeka/planner` + `data-testid="weekly-planner"` — not in Playwright `testDir`. Dead inventory that inflates “e2e” if counted naively.
- [Runtime skip] `tests/e2e/parent-nav-post-login.spec.ts:6` `test.skip` when `/api/health/ready !== 200`. Playwright webServer can be up while DB/Redis down → silent skip.
- [Weak asserts] `gift-code-redeem.spec.ts:94-97` only `body` visible; `teacher-bulk-enroll.spec.ts:37` `body` visible; several `toBeTruthy()` on mocked responses (`course-purchase-flow.spec.ts:103,155-165`).
- [Flake vectors] P0 watch loop sleeps real heartbeat intervals up to 120s (`e2e-p0-journey.mjs:323-354`); auth-timing statistical thresholds (`test-local-full.mjs:75-76`); visual `maxDiffPixelRatio` (`lesson-player-video-layout-visual.spec.ts:283`); `Date.now()` unique emails everywhere; Playwright `retries: 2` on CI (`playwright.config.ts:20`) can hide flakes.
- [Grapuco gate is skippable] `release-check.yml:69-76` exits 0 if `GRAPUCO_API_KEY` unset. Warning-only quality report (`scripts/grapuco/flow-quality-gate.mjs`).
- [Nightly omits unit/lint/type-check/audit] `test-local-full.mjs:79-98` runs smoke/p0/video-layout/auth-session/integrity/full/security. No `pnpm test`, no `lint`, no `security:baseline`. Staging providers and obs drills require `E2E_RUN_*=1` (`:100-111`) — unset on nightly.
- [Release-check missing Better Auth env] `release-check.yml:18-25` sets `SESSION_SECRET` but not `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` (nightly does, `:21-22`). [INFERENCE] P0 signup/login may depend on Better Auth defaults.
- [`playwright.integration.config.ts` unused] no package.json script references it.

### Low
- Vitest default `environment: "node"` (`vitest.config.ts:6`); component tests opt into jsdom per-file. Fine, easy to miss on new `.tsx` tests.
- Skill-kit tests under `.claude/skills` and `.opencode/skills` are excluded by Vitest include (correct).
- `src/proxy.test.ts` uses `it.each` so file-level “0 tests” greps lie; cases exist (`:6-16`).
- Jules auto-remediation / session monitor are not quality gates.

## Tests covering this slice
- `src/**/*.test.ts(x)` — unit/integration of services + some routes. Proves mocked Prisma/domain rules. Holes: 174 API routes, content/org/caregiver modules, no coverage threshold.
- `scripts/e2e-smoke.mjs` — homepage/login/health HTTP. Holes: stale `/pricing`; caregiver skipped if not ready (`:220-223`).
- `scripts/e2e-p0-journey.mjs` — live P0 HTTP. Holes: no UI; checkout skip; no webhook; no kid player; no referrals/notifications/evidence.
- `scripts/e2e-full-local.mjs` — parent/kid/admin HTML markers + security PATCH. Holes: string markers (`Parent Dashboard`, `ksg-scene`); not Playwright; not in PR CI.
- `scripts/e2e-security-abuse.mjs` — rate-limit/DDoS/IP policy. Nightly-only (if nightly works). Not PR.
- `scripts/e2e-data-integrity.mjs` — signup atomicity, completion/reward, webhook uniqueness. Not PR.
- `scripts/e2e-auth-session-lifecycle.mjs` / `e2e-auth-session-https.mjs` / `e2e-auth-timing.mjs` — session/cookie/timing. HTTPS and timing not in PR.
- `scripts/e2e-staging-providers.mjs` / `e2e-obs-alert-drills.mjs` — opt-in (`E2E_RUN_*`). Default off.
- `tests/e2e/*.spec.ts` — 21 files. Live-ish: guest-nav, language-switching, kid-course/garden (need seed), video-layout, admin-footer/reconcile, learning-flow-integration, interactive-lesson-preview (demo page). Mocked: auth-flow, course-purchase, gift-code, teacher-bulk-enroll, contact-form. **Almost none run in PR CI.**
- `__tests__/e2e/curriculum.spec.ts` — not wired; targets likely-dead routes.

## Production-readiness blockers
- Do not treat `pnpm test:e2e` / README “~19 Playwright e2e” as a merge gate: Playwright suite is not in `release:check`.
- Nightly `test:local:full` is not a reliable safety net until compose host ports and `.env` are fixed.
- P0 can pass without checkout/enrollment; paid path is not gated.
- Coverage “>=80% Met” is a 2026-02-21 snapshot, not a living gate.
- Deploy-on-green (`deploy.yml` after Release Check) ships without Playwright suite, security-abuse e2e, or integrity e2e.

## Unresolved questions
- Has `nightly-local-full` succeeded on `main` after `POSTGRES_HOST_PORT` default became 5433?
- Does current `/courses` HTML still contain `Transparent price list for each course`, accidentally keeping smoke green?
- Are video-layout snapshots intended to run only on Windows developers, with Linux CI expected to fail or skip?
- Should `pnpm test:e2e:pw` be the README quality command, or should smoke keep the `test:e2e` name?
- Is `BETTER_AUTH_SECRET` injected elsewhere in GH org vars for `release-check`, or is P0 relying on implicit defaults?
