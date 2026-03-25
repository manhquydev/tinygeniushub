# Project Changelog

## [0.4.5] - 2026-03-26

### Added
- Google Drive backup scripts (via `rclone`):
  - `pnpm backup:gdrive:upload`
  - `pnpm backup:gdrive:list`
  - `pnpm backup:gdrive:download`
- New env keys for Drive archive routing:
  - `BACKUP_GDRIVE_ENABLED`
  - `BACKUP_GDRIVE_REMOTE`
  - `BACKUP_GDRIVE_PREFIX`

### Changed
- `pnpm backup:create` now supports `--gdrive` to auto-upload fresh dumps to Google Drive.
- Backup runbook now includes cross-VPS migration flow from Google Drive archive (`list -> download -> verify -> restore`).

## [0.4.4] - 2026-03-25

### Added
- **Offsite backup upload command**: `pnpm backup:offsite:upload`.
- **R2 offsite upload script**: `scripts/ops/upload-postgres-backup-offsite.mjs` (uploads `.dump`, `.sha256`, `.json`).
- **Offsite env template keys** for backup-only credentials and prefix routing.

### Changed
- `pnpm backup:create` now supports `--offsite` to run local artifact creation and offsite upload in one flow.
- Backup runbook now resolves ops decisions:
  - offsite target is `R2-first`
  - restore cadence is monthly full drill + weekly lightweight verification
  - immutable retention enabled now via R2 Bucket Lock (backup prefix scope)
- README backup command list now includes offsite upload flow.

## [0.4.3] - 2026-03-25

### Added
- **Backup/restore foundation scripts**:
  - `pnpm backup:create`
  - `pnpm backup:verify`
  - `pnpm backup:restore`
- **SUPER_ADMIN bootstrap command**: `pnpm admin:seed-super`.
- **Deployment runbook**: `docs/deployment/backup-restore-runbook.md`.
- **DB migration safeguard**: partial unique index to enforce single `SUPER_ADMIN` record.

### Changed
- Admin staff APIs now block creating/promoting another `SUPER_ADMIN` when one exists.
- Admin staff APIs now block removing/deactivating the last active `SUPER_ADMIN`.
- `prisma/scripts/seed-admin.ts` now auto-enforces single `SUPER_ADMIN` (demotes extras to `SUPPORT_AGENT`).

### Tests
- Added regression tests:
  - `src/app/api/admin/staff/route.test.ts`
  - `src/app/api/admin/staff/[id]/route.test.ts`

## [0.4.2] - 2026-03-25

### Changed
- **Admin auth role validation aligned with current role model** — `requireAdminSession()` now validates against `SUPER_ADMIN | CONTENT_EDITOR | SUPPORT_AGENT`.
- **Admin log access stabilized** — `/api/admin/log` now enforces `SUPER_ADMIN` access consistently for read/write.
- **Admin navigation/catalog updated** — `/admin/log` visibility aligned to `SUPER_ADMIN` scope.

### Tests
- Added route regression suite: `src/app/api/admin/log/route.test.ts` (GET limit clamp/default, auth error mapping, POST rate-limit, validation, success path).

### Reports
- Added admin gap assessment and phase plan: `plans/reports/admin-module-gap-review-2026-03-25.md`.

## [0.4.1] - 2026-03-24

### Added
- **Unified SoT analytics backend** — new admin service to aggregate SQL audit-log funnel metrics and GA4 7-day snapshot in one payload.
- **GA4 server reporting integration** — service-account based GA4 Data API pull for sessions, active users, and top events.
- **Admin analytics SoT section** — `/admin/analytics` now includes a dedicated "SoT: GA4 + SQL Audit" panel with conversion reconciliation.
- **SoT API route** — `GET /api/admin/analytics/sot` for admin-authenticated dashboard data fetch.
- **Tooling decision report** — `reports/analytics/analytics-analyst-260324-dashboard-tool-decision.md` documenting why internal admin is the primary dashboard tool.

### Changed
- Environment schema now supports optional GA4 reporting credentials: `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_CLIENT_EMAIL`, `GA4_SERVICE_ACCOUNT_PRIVATE_KEY`.
- Courses preview qualification now uses dual confidence thresholds for Phase 2: `secure >= 20s (high)` and `embed >= 30s (medium)` with visibility/focus gating.
- Added production guard `GA4_SOT_REQUIRED` and deploy-time runtime env injection for GA4 SoT secrets via GitHub Actions.

## [0.4.0] - 2026-03-19

### Added
- **Free Lesson Preview System** — Bypass authentication for lessons with `isPreview` flag, enabling "học thử" (free trial) video playback
- **9 Course Detail Components** — Modularized course detail page: hero, curriculum, difference, FAQ, fit checklist, timeline, sticky header, breadcrumb, related courses
- **Curriculum Progress Timeline** — Client-side timeline with progress dots (emerald for preview, slate for locked), lesson preview modal
- **Parent Course Progress Page** — `/parent/courses` with per-course completion bars, "Học gần nhất" date, "Học tiếp" CTA
- **Lesson Player UX Refactor** — 252→160 lines, new sidebar with CheckCircle2 icons, lesson navigation, parent script panel, congratulation prompt
- **Parent Dashboard Modularization** — 449→84 lines split into 7 components: header, child card (with weekly progress), activity, quick links, referral banner, skills, course recommendation
- **Course Reviews System** — New `CourseReview` model, review form, rating display, review card component
- **Course Storefront Tracking** — 3 new analytics trackers: `FitCheckTrackedLink`, `OutcomeTimelineViewTracker`, `DifferenceBlockViewTracker`
- **SEO Enhancements** — JSON-LD schema generation (`course-jsonld.ts`), breadcrumb navigation, active filter display
- **StorefrontCourse Type Extension** — Added `ageGroup`, `reviewCount`, `reviewAverageRating`, `enrollmentCount`
- **Course Service** — `getRelatedCourses()` function for course recommendations
- **Database Schema** — `CourseSubject` enum, expanded `AgeGroup` enum (8 values), new `CourseReview` model

### Changed
- Course detail page fully refactored to use modular component architecture
- Parent dashboard simplified for mobile responsiveness
- Course card component rewritten with progress tracking
- `course-storefront-content.ts` updated with related course recommendations

### API Routes
- New: `GET/POST /api/courses/[slug]/reviews` — course review endpoints
- New: `GET/POST /api/admin/courses/[id]/reviews` — admin review management
- Modified: `GET /api/lessons/[lessonId]/video-token` — now bypasses auth for `isPreview` lessons

### Database
- New Prisma model: `CourseReview` (course ID, rating, author, text, timestamp)
- Schema updates: `Course.subject`, `Course.ageGroup`, `Course.reviewAverageRating`, `Course.reviewCount`
- Schema expansion: `AgeGroup` enum now 8 values, `CourseSubject` enum added

### Tests
- Visual regression tests for course detail pages: `courses-visual-regression.spec.ts`

## [0.3.1] - 2026-03-17

### Added
- **Admin-configurable footer social links** â€” New settings storage for Facebook/YouTube/TikTok/Zalo destinations in site footer.
- **Admin API for footer social links** â€” `GET/PATCH /api/admin/site-settings/footer-social-links`.
- **Admin Operations tab: Footer social** â€” UI panel to update footer social URLs from admin without code change.
- **Site content settings service** â€” safe read fallback to defaults when DB row is missing/unavailable.

### Changed
- Main layout now loads footer social links from server-side settings service.
- Footer component now reads dynamic social URLs via props instead of hardcoded values.
- Removed in-memory cache for footer social links to ensure admin updates reflect immediately across requests.

### Database
- New Prisma model: `SiteContentSettings`.
- New migration: `20260317194500_add_site_content_settings`.

### Tests
- Added `site-content-settings-service` unit tests.
- Extended `site-footer` test coverage for dynamic social link rendering.
- Added Playwright E2E flow: admin updates footer social links and homepage reflects updated targets.

## [0.3.0] - 2026-02-27

### Added
- **Interactive Lesson System** — Full step-based lesson flow replacing passive video: Hook → Concept → Demonstrate → Activity → Reinforce → Celebrate
- **6 Step Components** — LessonStepHook, LessonStepConcept, LessonStepDemonstrate, LessonStepActivity, LessonStepReinforce, LessonStepCelebrate
- **Flow Orchestrator** — `InteractiveLessonFlow` with AnimatePresence transitions, ParentGateDialog exit guard, completion API call
- **State Machine** — `useInteractiveLessonState` hook with retry logic, reinforce skip, score tracking
- **TTS Audio Pipeline** — Gemini TTS (`gemini-2.5-flash-preview-tts`, Aoede voice) for Vietnamese kindergarten teacher voice. 30 lesson MP3 files generated.
- **TTS-UI Sync** — Audio-driven keyword card sequencing in demonstrate step (Duolingo pattern). `KeywordWithAudio` type for per-keyword audio URLs.
- **Speaker Replay Button** — Volume2 icon with pulse animation in concept step for audio replay
- **AudioPlayer Component** — `forwardRef` with `replay()` method, onEndRef pattern for stale closure safety
- **7 Demo Lesson Data Files** — am-a, am-e, dien-chu-cvc, van-at, nghe-am-b, so-1-5, hinh-tron-vuong
- **Interactive Lesson Preview Page** — `/interactive-lesson-preview` with lesson selector
- **Visual Components** — InteractiveSpeechBubble, InteractiveKeywordDisplay, InteractiveKeywordCards, InteractiveCelebration, InteractiveSceneBackground

### Changed
- All step components now integrate AudioPlayer for TTS playback (hook, concept, demonstrate, activity, reinforce, celebrate)
- Activity and reinforce steps use timerRef for proper setTimeout cleanup on unmount

## [0.2.0] - 2026-02-26

### Added
- **Adaptive Learning Engine** — Skill taxonomy (Math, English Phonics), mastery tracking, spaced repetition (ReviewQueue), placement tests, difficulty levels per activity
- **Skill Progress Map** — Parent dashboard skill visualization with mastery levels per child
- **Lesson-Skill Tagging** — Admin API to tag lessons with skills (CRUD routes)
- **Placement Tests** — Domain-based adaptive placement with item-response tracking
- **Funnel Awareness Section** — New homepage section for marketing conversion
- **Pricing Page Redesign** — Updated pricing layout with custom CSS
- **Lifecycle Email Service** — Refactored email delivery for lifecycle campaigns
- **Email Sequences** — Updated marketing email sequence documentation
- **Blog System** — Full blog with categories, tags, search, newsletter subscribe/unsubscribe, featured posts, likes
- **TUS Video Upload** — Direct video upload support via tus-js-client
- **Drawing Canvas Activity** — Konva-based drawing activity type for lessons
- **Drag & Sort Activity** — DnD-kit powered sorting activities

### Changed
- Bumped Next.js to 16.1.6, React to 19.2.3, Prisma to 6.16.0
- Migrated to Tailwind CSS v4 with `@layer base`/`@layer components` pattern
- Wrapped all vanilla CSS in Tailwind layers to resolve Preflight conflicts
- Updated pnpm overrides: rollup >=4.59.0 (CVE fix), ajv, lodash, minimatch

### Fixed
- Dynamic route slug conflict (`[id]` vs `[lessonId]`) in admin lessons API
- Duplicate teacher dashboard route (`/teacher/dashboard` vs `/(main)/teacher/dashboard`)
- ESLint errors across ~15 files (unused imports, `any` types, React Hook naming)
- Security baseline — rollup CVE GHSA-mw96-cpmx-2vgc resolved via pnpm override
- Blog seed path after plans archival (`plans/_archive/...`)

### Security
- RBAC role guards enforced across all admin routes
- CSRF origin validation on all mutation endpoints
- Admin mutation rate limiting
- Zod input validation on all API routes
- **Production incident: PostgreSQL ransomware** — DB recreated, password rotated (40-char random), ports locked to 127.0.0.1 only (postgres + redis)

### Infrastructure
- 22 Prisma migrations applied to production
- PM2 process manager verified on DigitalOcean
- GitHub Actions CI/CD fully green: Release Check → Deploy via SSH
- Production seeded: 2 tracks, 12 lessons, 12 activities, 13 blog posts

### Archived Plans
- `260225-adaptive-learning-engine` — All 5 phases complete
- `260225-0059-marketing-strategy-gtm` — All phases complete
- `260225-1017-product-marketing-roadmap` — Complete
- `260225-brainstorm-business-model` — Complete
- `2026-02-20-cungcontuhoc-mvp-rebuild` — All 12 phases complete
- `260221-1543-marketing-homepage-redesign` — All 6 phases complete
- `260226-learning-system-expansion` — All 4 phases complete
