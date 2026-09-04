# Slice: qfe
# Agent: qfe
# Model: grok-4.6 + --advisor

## Verdict
mixed

## Completeness score
58/100 — Parent/kid/admin shells exist and course preview/player work, but Abeka curriculum UI is mock, garden zones/daily-challenge/kid-courses are stubs or missing, and /pricing + /for-schools are redirects.

## Quality score
54/100 — next-intl cookie wiring is real on chrome/marketing/parent shells, but kid/teacher/reader/player copy is machine-English, WCAG 2.1 AA is unmet, and several interactive surfaces no-op.

## What is actually implemented
- App Router surfaces exist: 90 `page.tsx` files across `(main)`, `(kid-app)`, `(curriculum)`, `(admin-login)`, plus root utilities (`src/app/**/page.tsx` inventory).
- Root chrome: `NextIntlClientProvider`, `html lang={locale}`, cookie consent, consent-gated analytics (`src/app/layout.tsx:61-70`).
- `(main)` shell: nav, footer i18n, impersonation banner, reader top bar (`src/app/(main)/layout.tsx:60-84`).
- Public live pages: `/`, `/about`, `/contact`, `/courses`, `/blog*`, legal, `/try-garden`, `/gift-code`, `/referral`, `/waitlist`. Homepage body is client `UnifiedScrollJourney` with `useTranslations("generated")` (`src/components/homepage/cloud-garden-home.tsx:12-14`, `src/components/homepage/unified-scroll-journey.tsx:6`).
- Auth: `/auth/login|signup|forgot-password|reset-password` use `translate("auth.*")` (`src/app/(main)/auth/login/page.tsx:24-31`).
- Parent area is RSC + onboarding gate (`src/app/(main)/parent/layout.tsx:10-18`). Dashboard metrics/hero/empty children copy via next-intl (`src/app/(main)/parent/dashboard/page.tsx:18-97`, `src/components/parent/dashboard-children-section.tsx:19-46`).
- Admin CMS routes claimed in summary exist under `(main)/admin` with i18n headers (`src/app/(main)/admin/layout.tsx:16-48`). Login isolated in `(admin-login)` (`src/app/(admin-login)/admin/login/page.tsx`).
- Teacher `/teacher/dashboard` and `/teacher/bulk-enroll` exist as RSC/client pages (`src/app/(main)/teacher/dashboard/page.tsx:11-154`).
- Reader `/reader/login|signup|bookmarks` exist (`src/app/(main)/reader/login/page.tsx:11-18`).
- Kid: `/kid` redirects to garden; `/kid/garden` is `KidSharedGardenDashboard` with empty-seed state (`src/app/(kid-app)/kid/garden/page.tsx:24-58`, `src/components/kid-shared-garden/KidSharedGardenDashboard.tsx:352-372`); `/kid/courses/[slug]` mounts `KidSkyGardenScene` (`src/app/(kid-app)/kid/courses/[slug]/page.tsx:168-185`); `/kid/today` empty-state i18n + sky-garden flag (`src/app/(kid-app)/kid/today/page.tsx:65-135`).
- Course storefront preview modal with loading/auth/unavailable states (`src/components/courses/course-lesson-preview-modal.tsx:314-404`).
- Enrolled parent player: video + mark-complete + parent script panel (`src/app/(main)/courses/[slug]/lessons/page.tsx:21-27`, `src/components/courses/course-lessons-player.tsx:145-156`).
- Kid lesson player: `LessonPlayerScene` via `LessonStartCard` (intro/video/quiz/completion) (`src/components/lesson-wizard/lesson-start-card.tsx:292-306`, `src/components/lesson-player/LessonPlayerScene.tsx:96-114`).
- i18n catalogs: EN/VI both 5190 keys, 0 empty, 0 key-drift (`locales/en/translation.json`, `locales/vi/translation.json`). Default locale `en`, cookie `tgh_locale` (`src/i18n/locales.ts:1-3`, `src/i18n/request.ts:6-13`). Language switcher + e2e on home (`src/components/language-switcher.tsx:24-44`, `tests/e2e/language-switching.spec.ts:15-49`).
- Reduced-motion handling in garden/homepage/player CSS/components (`src/components/cloud-garden/cloud-garden.css:715`, `src/components/lesson-player/LessonPlayerScene.tsx:112`).
- Analytics scripts injected async after consent (`src/components/legal/analytics-by-consent.tsx:41-132` [INFERENCE from scout + layout:69]).

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
| UI copy is Vietnamese by policy | `README.md:227` | `defaultLocale = "en"`; runtime UI rewritten to English | Doc-lie |
| Vietnamese primary + English migration; all 70+ pages | `docs/project-overview-pdr.md:161-164` | Cookie locale is real; default is EN; teacher/reader/curriculum/player unwired | Partial |
| Cookie-based locale via next-intl middleware | `docs/codebase-summary.md:229-230` | Cookie via `src/i18n/request.ts`; `src/proxy.ts` has no locale; no `middleware.ts` | Doc-lie |
| English-primary migration rewiring all 70+ pages | `docs/codebase-summary.md:11,234` | Chrome + marketing + parent/admin shells wired; product bodies often hardcoded EN | Partial |
| Pricing page with 30-day refund | `docs/project-overview-pdr.md:82`, `docs/codebase-summary.md:38` | `redirect("/courses")` (`src/app/(main)/pricing/page.tsx:3-4`) | Missing |
| B2B landing `/for-schools` | `docs/project-overview-pdr.md:107`, `docs/codebase-summary.md:38` | `redirect("/courses")` (`src/app/(main)/for-schools/page.tsx:3-4`) | Missing |
| Vietnamese aliases are vi locale equivalents | `docs/codebase-summary.md:49` | Path aliases 301 + `redirect()` to English paths (`src/app/(main)/gioi-thieu/page.tsx:5-6`) | Partial |
| WCAG 2.1 AA | `docs/project-overview-pdr.md:197` | No skip-link; unlabeled inputs; kid HUD icon-only at 48px | Missing |
| Garden: journey/zone unlock, daily challenge, mascot | `docs/project-overview-pdr.md:138-143` | Plot dashboard live; zone route no-ops; daily challenge 0 matches | Partial |
| `/kid`, `/kid/today`, `/kid/courses`, `/kid/garden/[zone]` | `docs/codebase-summary.md:47` | `/kid` and `/kid/courses` redirect; zone clicks unwired | Partial |
| Lesson player with parent script | `docs/project-overview-pdr.md:109-113` | Parent enrolled player only; kid player has no script | Partial |
| Free lesson preview | `docs/project-overview-pdr.md:110` | Course-detail modal exists; try-garden unlocked zones `console.log` | Partial |
| Abeka curriculum browser/planner/student map | `docs/codebase-summary.md:48`, PDR Abeka ✓ | Pages exist; mock Emma/Jack data; demo-child; no auth | Partial |
| Admin blog newsletter | `docs/codebase-summary.md:44` | No `/admin/blog/newsletter` page | Missing |
| Teacher/reader as top-level `src/app/teacher`, `src/app/reader` | `docs/codebase-summary.md:113-114` | Live under `(main)`; URLs still `/teacher/*` `/reader/*` | Doc-lie |
| `src/components/garden/` + garden-service | `docs/codebase-summary.md:120,179` | No `components/garden/`; module is `journey-service` | Doc-lie |
| Child limit 3 default / 5 Family+ | `README.md:13` | UI hardcodes `childLimit = 1` (`src/app/(main)/parent/dashboard/page.tsx:42`, `parent/children/page.tsx:45`) | Doc-lie |
| Dark mode (future) | `docs/project-overview-pdr.md:196` | No product theme toggle; only token leftovers | Missing |
| Placement test on signup (30 questions) | `docs/project-overview-pdr.md:118` | API under `/api/adaptive/placement/*`; no parent/kid UI page | Missing |
| i18n.config.ts / IntlProvider | `docs/code-standards.md:305-309` | Real: `NextIntlClientProvider` + `src/i18n/locales.ts` | Doc-lie |

## Findings
### Critical
- [Abeka curriculum UI is mock and unauthenticated] `src/app/(curriculum)/parent/curriculum/page.tsx:34-54,172-175` — hardcoded Emma/Jack progress, not Prisma. Browser/planner also `// Mock data` (`browser/page.tsx:14`, `planner/page.tsx:17`). Student map/daily default `childId="demo-child"` (`student/map/page.tsx:43`, `student/daily/page.tsx:40`). Layout is `"use client"` with no `requireParent` (`(curriculum)/layout.tsx:1-32`). Impact: claimed B2B/Abeka parent UI is a demo, not product. Suggested fix: gate with parent auth, load real child/curriculum data, or unpublish routes.

- [Kid garden zone lesson select and back are no-ops] `src/app/(kid-app)/kid/garden/[zone]/page.tsx:77-84` — `onSelectLesson={undefined}`, `onBack={undefined}`, `streak={0}`. `LessonCard` calls `onSelect?.(lessonId)` (`LessonCard.tsx:67`). Back button still renders (`LessonBranch.tsx:88-89`). Impact: claimed zone gameplay is a dead screen. Suggested fix: wire select to lesson player and back to `/kid/garden`, or remove the route until wired.

### High
- [README/PDR Vietnamese-primary UI is false] `src/i18n/locales.ts:1` vs `README.md:227`, `docs/project-overview-pdr.md:161-164` — default EN; catalogs dual; leftover VI almost gone from runtime source. Teacher/reader/curriculum/lesson-player have 0 i18n imports. Impact: VN parents/kids see English/machine-EN; locale cookie does not switch those surfaces. Suggested fix: either restore VI-primary policy or finish t() coverage on kid/teacher/reader/player and update docs.

- [Kid-facing copy is broken English] `src/components/kid-shared-garden/KidSharedGardenDashboard.tsx:279-361` — "Choose baby", "Purchased key", "Parents", "The baby's garden doesn't have any seeds yet". Lesson player: "Next article", "Complete the lesson" (`lesson-player-content.tsx:149`, `LessonPlayerScene.tsx:709`). Impact: ages 2–6 product unusable as Vietnamese EdTech. Suggested fix: professional VI/EN strings, not scraped `generated.*` / machine EN.

- [Parent child limit UI is 1, not 3/5] `src/app/(main)/parent/children/page.tsx:45`, `dashboard/page.tsx:42`, `children-manager.tsx:179,481` — `reachedLimit` blocks extra profiles. Impact: Family+ and default-3 claims are false in UI. Suggested fix: read plan from subscription, not a literal 1.

- [Daily challenge claimed Done, missing in src] `docs/project-overview-pdr.md:142` — grep `dailyChallenge|daily.?challenge` = 0. Impact: garden completeness overstated. Suggested fix: implement or drop the claim.

- [`/kid/courses` is a redirect, dashboard orphaned] `src/app/(kid-app)/kid/courses/page.tsx:31` — redirects to garden. `KidCoursesDashboard.tsx` unused. Sky garden hub navigates here then bounces. Impact: claimed kid course list does not exist. Suggested fix: render the dashboard or stop linking to it.

- [WCAG 2.1 AA not implemented] no skip-link in product src; kid today empty uses h2 then h1 (`kid/today/page.tsx:69-70`); admin login labels not associated (`admin-login-form.tsx:56-86` [scout]); caregiver email placeholder-only (`caregiver-manager.tsx:189-197` [scout]); kid HUD labels hidden at 48px (`globals.css` 48px HUD vs design 60px). Impact: accessibility NFR is a doc-lie. Suggested fix: skip link, labeled inputs, 44px+ targets, heading order.

- [Parent script XSS / fake markdown] `src/components/courses/lesson-parent-script-panel.tsx:55-57` — `dangerouslySetInnerHTML={{ __html: markdown }}` with comment claiming HTML. Impact: admin-authored markdown can execute script; panel also English-only "Instructions for Parents" (`:39`). Suggested fix: sanitize + real markdown render; i18n the chrome.

- [Curriculum student links 404] `student/map/page.tsx:74` href `/curriculum/student/daily`; `student/daily/page.tsx:59` href `/curriculum/student/map`. Real routes are `/student/daily` and `/student/map`. Assignment click is `console.log` (`daily/page.tsx:48-49`). Settings gear is a no-op button (`parent/curriculum/layout.tsx:90-92`).

- [Teacher dashboard metric lie] `teacher/dashboard/page.tsx:37-40,78` — filter is 7 days, label is "Active (30 days)". Column "Little" (`:96`). Hardcoded EN, no t().

### Medium
- [System pages ignore locale and mismatch lang] `global-error.tsx:23-78` — `html lang="vi"` with English copy. `not-found.tsx`, `(main)/error.tsx`, `global-loader.tsx:15,43-45` English-only. Only one `loading.tsx` and one group `error.tsx` in the tree.

- [Cookie banner close does not persist consent] `cookie-consent-banner.tsx:54-56` — close only `setVisible(false)`. Banner returns next visit. No focus trap; tiny close hit target.

- [Homepage SEO/JSON-LD always English] `src/app/layout.tsx:21-37` `openGraph.locale: "en_US"`; `page.tsx:48,66` `inLanguage: "en"`. Hidden prefetch links `display:none` (`page.tsx:171-173`). Entire visual tree client (`cloud-garden-home.tsx:1-15`).

- [Course player completion is localStorage until last lesson] `course-lessons-player.tsx:42-44,104-118` [scout] — `enrollmentId` discarded; "Video coming soon" / "Next article" (`lesson-player-content.tsx:108,149`). Kid completion XP/coins hardcoded 150/10, not `RewardGrant` (`LessonPlayerScene.tsx:754-755` [scout]).

- [Interactive/hybrid lesson UIs are preview-only] `interactive-lesson-preview/page.tsx:57-64` demo data + `alert("Complete!")`. Not used by kid garden or course player.

- [Try-garden unlocked zones do not open lessons] try-garden-client unlocked path `console.log` [scout]; `CloudWorldMap` progress constants (`CloudWorldMap.tsx:40-45` [scout]). Beanstalk is homepage demo + `alert("Sign up...")` (`BeanstalkJourneyDemo.tsx:222-224`).

- [Admin org member management is an API string] `admin-organizations-panel.tsx:267-268` — "To manage members, use the API: POST /api/admin/organizations/{id}/members".

- [Admin analytics is a large client fetch page] vs RSC overview (`admin/analytics/page.tsx` useEffect fetch [scout]). Curriculum layout forces client QueryClient for all Abeka pages (`(curriculum)/layout.tsx:1-32`).

- [Raw `<img>` instead of `next/image` on course covers, teacher logo, garden assets] e.g. `teacher/layout.tsx:43`, `KidSharedGardenDashboard.tsx:442` `alt=""`.

- [Parent empty children has no CTA] `dashboard-children-section.tsx:43-47`. Kid garden with 0 children redirects away (`kid/garden/page.tsx:36-38`).

- [Machine-EN catalog quality] `locales/en/translation.json` `generated` dump (~lines 119-4548) includes comments/code; named EN has "Introduce" for about. 16 identical long EN/VI strings include `admin.layout.roleSuperAdmin`.

### Low
- [Docs path map wrong] teacher/reader not top-level folders; `components/garden/` missing.
- [MainShell client wrapper] hydrates pathname branch only (`main-shell.tsx` [scout]).
- [generateStaticParams on auth-gated zone page] `kid/garden/[zone]/page.tsx:96-98` with `requireParent`.
- [Audio autoplay default true] `interactive-lesson/audio-player.tsx:16-19` [scout]; completion SFX not reduced-motion gated while confetti is.
- [No reader/a11y/curriculum e2e] grep `tests/` for reader/a11y = none.

## Tests covering this slice
- `tests/e2e/language-switching.spec.ts` — guest `/` defaults `lang=en`, cookie switches nav + homepage h1; courses/login keep path. Hole: teacher, reader, kid garden, player, curriculum, metadata/JSON-LD.
- `tests/e2e/kid-garden-mobile-ui.spec.ts` — mobile garden ambient/plot/sparkle. Hole: zone click, daily challenge, i18n, empty seed.
- `tests/e2e/kid-course-lesson-flow.spec.ts` / `kid-course-mobile-ui.spec.ts` — course garden path. Hole: `/kid/courses` list (redirect).
- `tests/e2e/lesson-player-video-layout-visual.spec.ts` — visual layout. Hole: parent script, i18n, completion rewards.
- `tests/e2e/interactive-lesson-preview.spec.ts` — preview page only, not production player.
- `tests/e2e/teacher-bulk-enroll.spec.ts` — bulk upload. Hole: dashboard i18n/metrics 7 vs 30.
- `tests/e2e/guest-navigation.spec.ts` / `guest-nav-cta-variant.spec.ts` — public nav. Hole: `/pricing` `/for-schools` now redirects.
- `src/components/language-switcher.test.tsx` — cookie + refresh. Hole: pages that ignore cookie.
- `src/i18n/translator.test.ts` — EN primary fallback. Hole: catalog pollution / key meaning.
- Missing: axe/a11y e2e, reader portal e2e, Abeka curriculum e2e, skip-link, empty-state CTAs.

## Production-readiness blockers
- Ship Abeka `/parent/curriculum*` and `/student/*` as real product while they render mock Emma/Jack and `demo-child` without auth.
- Ship kid garden zone (`/kid/garden/[zone]`) as playable: clicks and back do nothing.
- Ship Vietnamese EdTech default UI that is English/machine-EN on kid garden, lesson player, teacher, reader.
- Parent UI enforcing 1 child vs documented 3/5 plan limits.
- Unsanitized `dangerouslySetInnerHTML` of parent-script markdown.
- Claim WCAG 2.1 AA / Core Web Vitals green without skip-link, labeled forms, or kid tap-target compliance.

## Unresolved questions
- Is `KID_SKY_GARDEN_MVP` on in production? `/kid/today` falls back to `KidMissionPanel` when flag false (`kid/today/page.tsx:53,87-138`).
- Are `/parent/curriculum*` and `/student/*` intended internal demos, or indexed public routes?
- Should English-primary migration remain the product policy, or was README Vietnamese-UI policy never formally reversed?
- Does `childLimit = 1` match a backend cap, or only a UI bug vs Family+?

AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qfe.md
