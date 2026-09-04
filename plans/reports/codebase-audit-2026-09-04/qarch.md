# Slice: qarch
# Agent: qarch
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
60/100 — Core MVP domains exist as a modular monolith, but docs list the wrong module set, Abeka/curriculum never landed as a module, and claimed queues/route discipline are stale.

## Quality score
46/100 — No module-level import cycles, but 200-line rule is ignored, app/lib bypass domain services, two Prisma clients, and several god files/modules.

## What is actually implemented
- 17 domain folders under `src/modules/`: `adaptive`, `admin`, `billing`, `blog`, `caregivers`, `content`, `courses`, `garden`, `identity`, `learning`, `organizations`, `platform`, `progress`, `reader`, `referral`, `reports`, `sharing`.
- Hub-and-spoke imports: most modules depend on `platform` (errors/audit/notifications/security). No module-level cycles (static graph of `from "@/modules/<x>"` in non-test module files).
- Cross-domain edges that do exist: `learning → adaptive, courses, garden, platform`; `courses → billing, platform`; `blog → reader, platform`; `organizations → adaptive, platform`; `reports → adaptive`.
- App Router is the HTTP surface: `src/app/api/*` has 36 route trees (including `abeka`, `curriculum`, `teacher`, `waitlist`, `integrations`) vs 17 modules.
- Worker is a separate process with 9 BullMQ queues in `src/worker/queue.ts:10-44` and 9 processors wired in `src/worker/index.ts:13-21`.
- Prisma schema is a single shared DB: **96 models / 28 enums** in `prisma/schema.prisma` (counted via `^model ` / `^enum `).
- Auth is Better Auth on `User` + `AuthSession` (`src/lib/auth/better-auth.ts:89-97`) while `identity` still dual-writes `ParentAccount` + `User` + credential `Account` (`src/modules/identity/service.ts:45-112`).
- Proxy middleware exists at `src/proxy.ts` (A/B cookies, attribution, consent). No `getServerSideProps` anywhere under `src/`.
- File-size rule is documented (`AGENTS.md` / `.claude/workflows/development-rules.md:8` / `docs/code-standards.md:14`) and not enforced (`eslint.config.mjs` has no import or size boundaries).

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
|---|---|---|---|
| Technical modules: identity, content, learning, progress, billing, reports, admin, referral, platform (9) | `README.md:23-33` | 17 folders; missing from README: adaptive, blog, caregivers, courses, garden, organizations, reader, sharing | Partial |
| 14 self-contained modules (adaptive…reports, no identity/sharing/caregivers) | `docs/codebase-summary.md:128-143`, `docs/code-standards.md:22` | 17 modules; identity/sharing/caregivers exist | Doc-lie |
| Core modules still the original 9 | `docs/handover/handover-master-agent-ready.md:226-235` | Handover list is the MVP subset; later domains bolted on | Partial |
| Keep route handlers thin; logic in domain services | handover `10.4`, `docs/code-standards.md` | 43 app files are Prisma-only (no `@/modules/` import); fat routes e.g. `src/app/api/admin/payments/[id]/reconcile/route.ts` (497 lines), `src/app/api/curriculum/complete/route.ts` (376) | Partial |
| 10 BullMQ queues including `blog-newsletter` | `docs/system-architecture.md:137-150`, `docs/codebase-summary.md:211-223` | 9 queues; newsletter worker/queue deleted (plan `260710-1047` wave-1). No `blog-newsletter` in `src/worker/` | Doc-lie |
| Prisma 50+ models, 27 enums | `docs/codebase-summary.md:191-193` | 96 models, 28 enums | Partial |
| Abeka curriculum as first-class schema domain | `docs/codebase-summary.md:200`, schema `Abeka*` models | 19 Abeka-related models; **no** `src/modules/abeka`. Logic in `src/lib/abeka/*` + fat `src/app/api/abeka/*` and `src/app/api/curriculum/*` | Missing |
| Pages-router `getServerSideProps` in request flow | `docs/system-architecture.md:78` | Zero `getServerSideProps` in `src/` | Doc-lie |
| Redis as session store | `docs/system-architecture.md:466-467` | Sessions are DB `AuthSession` via Better Auth; Redis used for queues/rate-limit | Doc-lie |
| Vercel 5 crons including newsletter-digest | `docs/system-architecture.md:360-367` | `vercel.json` has 4 crons; no newsletter-digest | Doc-lie |
| Teacher + Reader clients in system diagram | `docs/system-architecture.md:15-16` | Reader module + `/reader` routes exist; teacher routes exist with **no** `src/modules/teacher` | Partial |
| File ≤200 lines | `docs/code-standards.md:14`, development-rules | `src/`: 167/1035 ts/tsx files >200; modules: 38 prod files >200 | Doc-lie |
| Example import `@/modules/courses/service` | `docs/code-standards.md:15,32-36` | File is `course-service.ts`; no module `service.ts` / `index.ts` barrel | Doc-lie |
| Evidence upload `POST /api/progress/media` | `docs/system-architecture.md:294` | Progress media lives in `src/modules/progress/evidence-media-service.ts`; public API is `/api/evidence/media/upload-url` (README) | Partial |

## Findings
### Critical
- [Abeka/curriculum is an unowned second product inside the app layer] `src/app/api/abeka/plans/journeys/route.ts:21-23,59-66` — comments say `TODO: Add authentication`; GET/POST talk to `prisma.abekaLearningJourney` / `childProfile` with only a body `childId`. Same pattern in `src/app/api/curriculum/complete/route.ts:22-61` (376-line route, no `getParentFromRequest`, writes `AbekaAssignment` / streak / badges). 19 Prisma models have no module owner. Impact: architecture hole that ships unauthenticated child-data mutation. Suggested fix: create `src/modules/abeka` (or fold into `content`/`learning`), move all Prisma + gamification there, require parent/child ownership in every handler; delete TODOs by implementing auth, not comments.

### High
- [Two PrismaClient factories] `src/lib/db.ts:7-15` vs `src/lib/prisma.ts:7-11` — both key `globalThis.prisma` only when `NODE_ENV !== "production"`. Abeka/curriculum/seeders import `@/lib/prisma` (14+ app routes); the rest of the app uses `@/lib/db` (202 files). Production web process can open two pools. Impact: connection exhaustion + split logging. Suggested fix: delete `src/lib/prisma.ts`; one client from `db.ts`.
- [200-line rule is dead] sample worst: `src/components/kid-sky-garden/KidSkyGardenScene.tsx` 1338; `src/components/kid-mission-panel.tsx` 1206; `src/modules/garden/journey-service.ts` 963; `src/components/lesson-wizard/lesson-wizard-flow.tsx` 931; `prisma/schema.prisma` 1875; `src/modules/courses/course-service.ts` 658; `src/modules/learning/video-watch-service.ts` 613. Modules: 38 prod files >200, 13 >400, 1 >800. `src/`: 167/1035 >200. Impact: unreviewable god files, high regression cost. Suggested fix: split garden journey into persist/query/tier-plan; split sky-garden scene vs FX; add a CI line-count gate for `src/modules/**` (exclude tests) rather than hoping AGENTS.md works.
- [App/lib bypass of module boundaries] 43 Prisma-only app files (pages + APIs) never import `@/modules/*`. Examples: admin blog/course pages query Prisma directly (`src/app/(main)/admin/blog/posts/page.tsx:81-94`); kid garden/courses pages query `childProfile` in the page (`src/app/(kid-app)/kid/courses/page.tsx`). `src/lib/abeka/`, `src/lib/auth/`, `src/lib/email/`, `src/lib/jules/` are shadow domains. Impact: duplicated rules, services go stale, “modular monolith” is optional. Suggested fix: pages call existing services (`blog-repository`, `course-service`, `children-service`); ban new `prisma.` in `src/app/**` except health.
- [God modules] `courses/` (20+ files, checkout/bundles/pilot/gift/certificates/webhooks); `admin/` (analytics + users + blog + content CMS); `platform/` (audit, security policy, storage, lifecycle email, footer social, notifications); `learning/completion-service.ts:5-9` orchestrates courses + adaptive + garden in one transaction path. Impact: cannot extract or test a domain without dragging four others. Suggested fix: keep `platform` as kernel; make completion emit domain events instead of importing garden/courses; split admin CMS vs admin analytics.
- [Schema ownership does not match modules] Identity owns both legacy `Session` (`prisma/schema.prisma:132-141`) and Better Auth `AuthSession` (`184-197`) plus `ParentAccount` and `User` dual rows (`identity/service.ts:46-92`). Garden has **zero** models; it mutates `ChildCourseJourney*` owned by courses (`garden/journey-service.ts:1-8,39-52`). Abeka 19 models unowned. `Notification` hangs off `User`, not `ParentAccount`. Impact: migrations and features cut across the wrong folders. Suggested fix: document an ownership table in schema comments; drop unused `Session` if Better Auth is sole session store; move journey models next to garden or merge garden into courses.

### Medium
- [No architectural guardrail] `eslint.config.mjs:12-24` is lint-style only. No `import/no-restricted-paths`, no depcruise, no cycle CI. Impact: the current acyclic graph can rot on the next feature. Suggested fix: add a cheap madge/depcruise check: `app → modules → lib`, never `modules → app`.
- [Fat billing/admin routes duplicate module logic] `src/app/api/admin/payments/[id]/reconcile/route.ts:1-17` (497 lines) inlines enrollment sync + bundle slug rules instead of `billing`/`courses` services. `src/app/api/webhooks/package-subscription/route.ts` 481 lines. Impact: webhook/admin behavior diverges from `billing/webhook-service.ts`. Suggested fix: move reconcile into `modules/billing` or `modules/admin`.
- [Dead / leftover packages and package.json junk] `docx`, `reading-time`, `@hookform/resolvers` have no imports under `src/`, `scripts/`, or `tests/` (only skill docs / lockfile). `package.json:196` `"main": ".tmp-prod-blocked-ip-vantage-test.js"` is a leftover test artifact. Remotion is a real optional pipeline (`scripts/render-course-demo.ts`) but `@remotion/*` + `remotion` sit in production `dependencies` with version skew (`@remotion/core` `1.0.0-y.46` vs `remotion` `^4.0.429`). Impact: install weight, confused entrypoint. Suggested fix: drop unused deps; point `main` at nothing or remove; move remotion to devDependencies unless the web app imports it.
- [Sharing is a stub module] `src/modules/sharing/` is one helper (`share-link-builder.ts`) used by referral page. Not in README/codebase-summary. Impact: noise in the domain list. Suggested fix: fold into `referral` or `platform`.
- [Name collision `content-service`] `src/modules/content/service.ts` (kid missions / Track→Lesson) vs `src/modules/admin/content-service.ts` (admin lesson CRUD, 564 lines). Impact: agents and humans edit the wrong file. Suggested fix: rename admin file to `admin-lesson-cms-service.ts`.
- [Worker/docs drift] architecture still lists certificates/bulk-enroll/newsletter as if the 10-queue design is current; newsletter is gone, other 9 exist. Vercel crons 4 vs claimed 5.

### Low
- [code-standards module template is fictional] claims `service.ts` + `api-handler.ts` + `index.ts`; actual files are `*-service.ts` with no barrels (good) but docs teach the wrong names.
- [Cookie policy still documents `ccth_session` as custom session] cookie is now Better Auth’s renamed `session_token` (`src/lib/auth/better-auth.ts:96-97`). Not a boundary bug; doc lag.
- [Garden tests do not cover the god file] `src/modules/garden/__tests__/journey-service.test.ts` only exercises `computeJourneyTiers` (~80 lines) against a 963-line service.

## Tests covering this slice
- `src/modules/learning/__tests__/completion-service.test.ts` — completion/streak/idempotency; does not assert module-boundary (it is allowed to import garden/courses/adaptive).
- `src/modules/garden/__tests__/journey-service.test.ts` — pure tier math only; no Prisma journey persistence, no `syncJourneyProgress` from learning.
- `src/modules/identity/__tests__/service.test.ts` — signup/login schemas/flows; does not assert ParentAccount/User dual-write invariants as architecture.
- `src/modules/{billing,admin,adaptive,reports,platform,progress,referral,sharing}/**/__tests__` — service unit tests; none are import-graph or file-size tests.
- Missing module test dirs: `organizations`, `caregivers`, `reader`, `content` (no `__tests__/`).
- Abeka/curriculum API routes: no architecture or auth tests found under `src/app/api/abeka` / `curriculum`.
- Holes: zero tests that fail when `src/app` grows new `prisma.` usage, when a module imports `src/app`, when a file exceeds 200 lines, or when `@/lib/prisma` is reintroduced.

## Production-readiness blockers
- Unauthenticated Abeka/curriculum write APIs (`/api/abeka/plans/journeys`, `/api/curriculum/complete` and siblings) — do not ship this surface as-is.
- Dual PrismaClient in the production Node process (`@/lib/db` + `@/lib/prisma`).
- File-size / god-module debt should not block a hotfix, but it should block any claim of “modular monolith ready for extraction.”

## Unresolved questions
- Is Abeka meant to replace `Track → Lesson` content, or permanently coexist? Schema and garden tests (`courseSlug: "abeka"`) imply coexistence without an owner.
- Can legacy `Session` (`schema.prisma:132-141`) be dropped, or is any runtime still writing it? No `prisma.session` / `prisma.authSession` calls found in `src/` (Better Auth adapter likely owns `AuthSession`).
- Should `ChildCourseJourney*` live in `courses` or `garden`? Today courses owns schema, garden owns 963 lines of behavior, learning calls both.
- Is `sharing` a growth domain or a one-file leftover from the viral-mechanics plan?

AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qarch.md
