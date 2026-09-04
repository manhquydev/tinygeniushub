# Slice: learning-system-completeness
# Agent: clearn
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
48/100 — Core lesson watch/complete/player is real; PDR “delivered” adaptive, Abeka, garden-challenge, and curriculum planner/map are backend-or-mock only, not a closed product loop.

## Quality score
62/100 — Watch/heartbeat/evidence path is auth’d, TTL’d, and unit-tested; Abeka/curriculum APIs lack auth, adaptive is not wired into today-lessons, and several parent/kid surfaces ship hardcoded mock data.

## Slice status (claimed vs code)

| Slice | Status | Evidence |
|---|---|---|
| Adaptive: placement test | Partial | Backend CAT + APIs exist; no UI consumer; signup flag is hardcoded; runtime `maxItems=15` not “30 questions”. |
| Adaptive: skill tree | Partial | Prisma self-ref `Skill` + taxonomy/map services; parent skill map UI is mock; Abeka skill-tree API missing. |
| Adaptive: spaced repetition | Partial | SM-2 `ReviewQueue` implemented; lesson complete does not call `scheduleReview`. |
| Adaptive: next-lesson | Partial | Rule engine exists; `/api/lessons/today` ignores it (`source: "courses"`). Not AI. |
| Garden: zones | Partial | `/kid/garden/[zone]` + 5 zone keys; art/music/story have no track mapping in content. |
| Garden: rewards | Partial | `RewardGrant` on lesson complete + journey tier unlock; no garden-specific reward UX. |
| Garden: daily challenge | Missing | No `DailyChallenge` model, API, or kid-garden usage. |
| Abeka curriculum | Partial | Schema + import + APIs; parent/student curriculum pages use mock data; skill nodes unused in `src/`. |
| Lesson player (video + interactive) | Done | `LessonPlayerScene` video + `ActivityPanel`/`ActivityRenderer`; wired from lesson wizard. |
| Progress / evidence media | Done | Upload URL + confirm + UI panel on completion. |
| Watch session TTL / heartbeat | Done | HMAC session, Redis TTL, heartbeat credit, tests. |
| Kid `/kid/*` vs parent learning views | Partial | Kid UI exists but `requireParent()`; no child auth. Parent skill map mock. |
| Curriculum browser / planner / student map | Scaffold | Pages exist; mock data; student map fetches nonexistent APIs. |

## What is actually implemented
- Placement CAT engine (MEDIUM start, ±2 consecutive answers) `src/modules/adaptive/placement-test-engine.ts:2-5,93-92`.
- Placement start/answer/complete + 30-day cooldown `src/modules/adaptive/placement-test-service.ts:18,57-79,85-107,113-198`.
- Placement APIs: `src/app/api/adaptive/placement/start/route.ts:17-47`, `.../answer/route.ts`, `.../result/route.ts`, `src/app/api/children/[childId]/placement-status/route.ts:12-34`.
- Seed bank 30 MATH + 30 PHONICS items; tests run `maxItems: 15` `prisma/seeds/placement-test-seed.ts:3,338-342,756-757,800-801`.
- Skill DAG (`parentId` + `SkillPrerequisite`) `prisma/schema.prisma:1182-1218`; CRUD/tree `src/modules/adaptive/skill-taxonomy-service.ts:1-50`.
- Parent skill-map API (auth + ownership) `src/app/api/children/[childId]/skill-map/route.ts:15-35`.
- SM-2 review scheduling `src/modules/adaptive/spaced-repetition-service.ts:27-105`.
- Next-lesson: due reviews → ready skills → uncompleted lesson `src/modules/adaptive/content-sequencing-engine.ts:29-85`.
- Activity completion → attempt + SM-2 `src/modules/adaptive/activity-completion-handler.ts:33-55` via `POST /api/adaptive/complete-activity` `src/app/api/adaptive/complete-activity/route.ts:26-58`.
- Feature flags `ADAPTIVE_ENGINE_ENABLED` + per-child `adaptiveEnabled` `src/lib/feature-flags.ts:8-49`; toggle UI `src/components/skills/adaptive-learning-toggle.tsx:23-40`.
- Lesson complete: idempotent completion, evidence row, `RewardGrant`, streak, optional skill attempts (no review schedule) `src/modules/learning/completion-service.ts:183-246,305-325`.
- Today lessons: enrolled-course mission, not adaptive `src/app/api/lessons/today/route.ts:4-25`.
- Watch session HMAC + Redis TTL `WATCH_SESSION_TTL_SECONDS` default 7200 `src/lib/env.ts:79`; `src/modules/learning/video-watch-service.ts:15-19,320-400`.
- Heartbeat + complete watch APIs with CSRF/rate-limit `src/app/api/lessons/[lessonId]/watch/session/route.ts:11-61`, `.../heartbeat/route.ts:11-61`.
- Lesson player: video + heartbeat + quiz activities + evidence `src/components/lesson-player/LessonPlayerScene.tsx:144-311,647-650`; `.../panels/VideoPlayerPanel.tsx:20-45`; `.../panels/ActivityPanel.tsx:48-46`.
- Evidence upload signed URL + confirm `src/modules/progress/evidence-media-service.ts:13-67`; `src/app/api/evidence/media/upload-url/route.ts:11-56`; UI `src/components/evidence-upload-panel.tsx:42-72`.
- Kid garden dashboard (parent session) `src/app/(kid-app)/kid/garden/page.tsx:24-57`; `/kid` redirects to garden `src/app/(kid-app)/kid/page.tsx:3-4`.
- Garden zones math/phonics/art/music/story `src/app/(kid-app)/kid/garden/[zone]/page.tsx:22-63`; lessons from `getTodayMission` `src/components/cloud-garden/use-garden-lessons.ts:21-83`.
- Course-journey “plant/sync/tiers” `src/modules/garden/journey-service.ts:727-874`; auth’d `GET /api/garden/journeys` `src/app/api/garden/journeys/route.ts:7-24`.
- Abeka Prisma models (video/grade/lesson/journey/assignment/watch/badge/streak/skill node) `prisma/schema.prisma:1495-1813`.
- Abeka access-control lib `src/lib/abeka/access/access-control.ts:37-66,182-479`.
- Abeka APIs under `src/app/api/abeka/**` and `src/app/api/curriculum/{streak,badges,complete}`.
- Parent dashboard uses real `lessonCompletion` counts `src/app/(main)/parent/dashboard/page.tsx:22-29`.
- Learning trajectory API (8-week) `src/app/api/children/[childId]/learning-trajectory/route.ts:13-31`.

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
|---|---|---|---|
| Placement test on signup (30 questions) | PDR Adaptive Learning Engine; codebase-summary Adaptive APIs | Seed has 30 items/domain; attempt stops at `maxItems=15`. Child create always returns `placement_required: true` with no test run `src/app/api/children/route.ts:67`. No UI calls `/api/adaptive/placement/*` (grep: API files only). | Partial / Doc-lie |
| Skill taxonomy (self-referencing tree) | PDR; codebase-summary Prisma Adaptive | Schema + taxonomy/map services exist. Parent UI: “UI mock version… data will be replaced with the real API” `src/components/skills/skill-progress-map-client.tsx:176-214`. | Partial |
| Spaced repetition review queue | PDR; codebase-summary | SM-2 + `ReviewQueue` + GET API. Lesson complete only `recordSkillAttempt`, not `scheduleReview` `completion-service.ts:305-325`. Review-queue API does not check child ownership `review-queue/route.ts:14-20`. | Partial |
| AI next-lesson sequencing | PDR “AI next-lesson sequencing” | Heuristic engine, not LLM `content-sequencing-engine.ts:1-8`. Today API unused import of adaptive flag; always `source: "courses"` `lessons/today/route.ts:4-25`. Next-lesson API does not verify parent owns child `next-lesson/route.ts:19-36`. | Partial / Doc-lie |
| Garden zones + rewards + daily challenge | PDR Garden Game ✓ | Zones UI + journey tiers + `RewardGrant`. No daily-challenge code. Zone page hardcodes `streak={0}` `[zone]/page.tsx:77-84`. | Partial / Missing (challenge) |
| Abeka video library, grade progression, assignments, watch, badges, streaks, skill node mapping | PDR Abeka ✓; codebase-summary Abeka models | Models + some APIs + import scripts. `AbekaSkillNode` unused in `src/` (grep empty). Curriculum pages: `// Mock data for development` browser `browser/page.tsx:14-15`, planner `planner/page.tsx:17`, parent index `curriculum/page.tsx:34`. | Partial / Doc-lie |
| Lesson player video + interactive | PDR Phase 05; README trial lesson | Implemented and used. | Done |
| Progress / evidence media | README evidence upload; codebase-summary progress module | Implemented with auth, size limits, tests, UI. | Done |
| Watch session TTL / heartbeat | README `WATCH_SESSION_TTL_SECONDS`; Core Endpoints | Implemented + tests. | Done |
| Kid app `/kid/*` vs parent learning views | codebase-summary Kid App + Parent skills | Kid pages exist but `requireParent()` `kid/garden/page.tsx:25`. No child login. Parent skills page is mock. | Partial |
| Curriculum browser / planner / student map | codebase-summary Curriculum routes | Routes exist. Browser/planner mock. Student map defaults `childId="demo-child"` `student/map/page.tsx:43`. Client fetches `/api/curriculum/skill-tree`, `/daily-plan`, `/kisu-context` `components/curriculum/shared/api.ts:29-134` — those routes **do not exist** (only streak/badges/complete). Curriculum e2e hits `/login` and `/abeka/planner` which are not app routes `__tests__/e2e/curriculum.spec.ts:25-59`. | Scaffold / Doc-lie |

## Findings
### Critical
- [Unauthenticated Abeka assignment complete] `src/app/api/curriculum/complete/route.ts:22-61` — no session; any client with `assignmentId`+`childId` can mark COMPLETED, update streaks/badges. Impact: progress/gamification forge. Fix: require parent session and ownership before mutate.
- [Unauthenticated Abeka watch progress write] `src/app/api/abeka/progress/watch/route.ts:60-71` — POST only checks child exists. Impact: arbitrary watch completion. Fix: session + parent-owns-child.
- [Unauthenticated Abeka journey create] `src/app/api/abeka/plans/journeys/route.ts:19-23` — explicit `TODO: Add authentication`. Impact: create/list journeys for any childId. Fix: requireAuth + ownership.
- [Student map / daily plan call missing APIs] `src/components/curriculum/shared/api.ts:29-74` vs `src/app/api/curriculum/` (streak/badges/complete only). Impact: `/student/map` and `/student/daily` fail at runtime. Fix: implement APIs or stop shipping the pages.

### High
- [Adaptive not productized] Placement/next-lesson/review APIs have no UI callers; today lessons ignore sequencing `src/app/api/lessons/today/route.ts:4-25`. Impact: PDR adaptive engine is dead code for users. Fix: wire today/kid mission to `getNextLesson`; add placement UI after child create.
- [IDOR on adaptive reads] `src/app/api/adaptive/review-queue/route.ts:14-20`, `src/app/api/adaptive/next-lesson/route.ts:19-36` — auth required but no `child.parentId === parent.id`. Impact: any logged-in parent can read another child’s queue/next lesson. Fix: same ownership check as skill-map route.
- [Abeka video list trusts query `parentId`] `src/app/api/abeka/videos/accessible/route.ts:40-75` — parentId from query, not session. Impact: enumerate videos by guessing parent/child IDs. Fix: bind to session parent.
- [Parent skill map is mock while API is real] `src/components/skills/skill-progress-map-client.tsx:176-214` vs `skill-map/route.ts`. Impact: parents see fake mastery. Fix: fetch `/api/children/:id/skill-map`.
- [Lesson complete skips spaced repetition] `completion-service.ts:305-325` vs `handleActivityCompletion` which does schedule review. Impact: review queue stays empty in the real lesson path. Fix: call `scheduleReview` (or handler) after skill attempts.
- [Curriculum e2e is fiction] `__tests__/e2e/curriculum.spec.ts:25-59` uses `/login`, `/abeka/planner`, `/abeka/today`. Actual routes: `/auth/login`, `/parent/curriculum/planner`, `/student/daily`. Impact: false confidence. Fix: retarget or delete.

### Medium
- [“AI” next-lesson is a sort] `content-sequencing-engine.ts:61-65` — gradeLevel then masteryScore. Docs overclaim.
- [Placement “30 questions” vs CAT cap 15] `placement-test-seed.ts:3,756-757`.
- [Kid garden is parent-session] `kid/garden/page.tsx:25-37` — no child identity; zone streak hardcoded 0 `[zone]/page.tsx:77`.
- [Garden daily challenge absent] no matches in `src/` for DailyChallenge / daily_challenge.
- [AbekaSkillNode unused] schema `prisma/schema.prisma:1778-1803`; zero `src/` references.
- [Curriculum complete schema mismatch] API requires `childId` `complete/route.ts:5-9`; UI `completeLesson(assignmentId)` only `shared/api.ts:142-148`.
- [Unused adaptive import on today API] `lessons/today/route.ts:4` imported, never called.
- [Art/music/story zones empty] zone keys exist `[zone]/page.tsx:22`; track map only ENGLISH/MATH live `use-garden-lessons.ts:22-30`.

### Low
- [Kid layout does not auth] `kid/layout.tsx:15-21` — auth only in child pages; inconsistent.
- [Adaptive toggle copy] “Learn to adapt” / “baby learns” `adaptive-learning-toggle.tsx:57-62` — EN/VI mix, not a functional bug.
- [Garden components path] docs claim `src/components/garden/`; actual `cloud-garden`, `kid-sky-garden`, `kid-shared-garden`.

## Tests covering this slice
- `src/modules/adaptive/__tests__/placement-test-engine.test.ts` — CAT select/difficulty. Hole: no HTTP/UI placement test.
- `src/modules/adaptive/__tests__/placement-test-scorer.test.ts` — scoring. Hole: no attempt persistence e2e.
- `src/modules/adaptive/__tests__/content-sequencing-engine.test.ts` — next-lesson modes. Hole: not integrated with today API.
- `src/modules/adaptive/__tests__/spaced-repetition-service.test.ts` — `computeNextReview` only. Hole: no `scheduleReview` DB tests.
- `src/modules/adaptive/__tests__/child-skill-state-service.test.ts` — mastery updates.
- `src/modules/learning/__tests__/video-watch-service.test.ts` — session/heartbeat/TTL/complete. Strongest slice tests.
- `src/modules/learning/__tests__/completion-service.test.ts` — idempotent complete + RewardGrant. Hole: adaptive fire-and-forget untested.
- `src/modules/progress/__tests__/evidence-media-service.test.ts` — upload rules/session.
- `src/modules/garden/__tests__/journey-service.test.ts` — tier unlock grouping.
- `src/lib/abeka/access/__tests__/access-control.test.ts` + `package-validator.test.ts` — package/grade mapping. Hole: no API auth tests.
- `tests/e2e/learning-flow-integration.spec.ts` — signup → Abeka course lessons → video-token/secure playback. Hole: no watch heartbeat, complete, placement, garden challenge.
- `tests/e2e/kid-garden-mobile-ui.spec.ts`, `kid-course-lesson-flow.spec.ts`, `lesson-player-video-layout-visual.spec.ts` — UI/visual. Hole: not adaptive/Abeka planner.
- `__tests__/e2e/curriculum.spec.ts` — planned Abeka flows against **wrong routes**; does not prove product.

## Production-readiness blockers
- Do not ship Abeka/curriculum as “delivered”: unauthenticated complete/watch/journey + mock parent/student UIs + missing skill-tree/daily-plan APIs.
- Do not claim adaptive engine live: no placement UI, today-lessons not sequenced, SM-2 not on lesson complete, parent skill map mock.
- Garden “daily challenge” is not implemented; remove from marketing or build it.
- Kid app is a parent-skinned garden, not a child-authenticated product.

Core MVP learning path (watch session → heartbeat → complete → evidence → reward) can ship if scoped to README, not PDR.

## Unresolved questions
- Is `ADAPTIVE_ENGINE_ENABLED` on in production FeatureFlag table? Code defaults missing flag to false `feature-flags.ts:19`.
- Are Abeka videos imported in prod, or only schema/scripts (`scripts/import-abeka-videos.ts`)? Not verified against live DB.
- Intended child auth model for `/kid/*` (PIN/parent-gate vs parent session)? Current code is parent session only.
- Whether `/student/*` is meant to be kid-facing; it currently has no `requireParent` and demo-child fallback.
- Whether curriculum e2e in `__tests__/e2e/` is even in Playwright config (likely orphan).
---
AUDIT_DONE plans/reports/codebase-audit-2026-09-04/clearn.md
