# Codebase Summary

**Last updated:** 2026-09-05 — kernel on `main` (PR #12). Inventories below lag; ADR `docs/decisions/260904-1102-platform-kernel.md` wins. Live modules: `ls src/modules`.

---

## Quick Facts

- **Project:** TinyGenius Hub — Vietnamese EdTech for ages 2–6 (Math + English Phonics)
- **Production URL:** https://www.tinygeniushubvn.tech
- **Current Branch:** `main` — kernel tickets through PR #25. i18n leftover-mix residual in this change.
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Prisma + PostgreSQL 16 + Redis + BullMQ
- **Deployment:** DigitalOcean Ubuntu 24.04 (PM2 + Nginx) + Docker Compose (postgres, redis, web, worker)
- **CDN:** Bunny Stream (video), Cloudflare R2 (media storage)
- **Tests:** `pnpm test` / `pnpm test:e2e` (do not trust hand counts here)

---

## Production Deployment

- **Server:** DigitalOcean Ubuntu 24.04, IP `152.42.246.218`
- **Domain:** tinygeniushubvn.tech — A records, SSL via Let's Encrypt
- **Runtime:** PM2 process manager + Nginx reverse proxy
- **Services:** Docker Compose — PostgreSQL 16, Redis 7, web (port 3000), worker
- **CI/CD:** `.github/workflows/release-check.yml`, `codeql.yml`, `deploy.yml` (default prod). Dependabot config: `.github/dependabot.yml`. SSH fallback: `deploy-digitalocean-ssh.yml`.

---

## Route Structure (App Router)

### Route Groups
- `(main)` — public + authenticated pages
- `(kid-app)` — `/kid/*` — child-facing app
- `(curriculum)` — `/parent/curriculum/*` and `/student/*`
- `(admin-login)` — standalone admin login shell

### Page Groups (70+)
**Public:** `/`, `/pricing`, `/about`, `/contact`. `/for-schools` redirects to `/courses`.
**Auth:** `/auth/(login|signup|forgot-password|reset-password)`
**Courses:** `/courses`, `/courses/[slug]`, `/courses/[slug]/lessons`
**Blog:** `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/search`
**Parent:** `/parent/dashboard`, `/parent/dashboard/[childId]/skills`, `/parent/(children|reports|billing|courses)`
**Admin:** `/admin/(overview|courses|content|users|staff|organizations|gift-codes|analytics|security|operations|skills|impersonation|site-settings|log)`
**Admin Blog:** `/admin/blog/(posts|authors|categories|comments|analytics)`
**Teacher:** `/teacher/(dashboard|bulk-enroll)`
**Reader:** `/reader/(login|signup|bookmarks)`
**Kid App:** `/kid`, `/kid/today`, `/kid/courses`, `/kid/garden/[zone]`
**Curriculum:** `/parent/curriculum/browser`, `/parent/curriculum/planner`, `/student/map`, `/student/daily`
**Vietnamese:** `/gioi-thieu`, `/lien-he`, etc. (vi locale equivalents)

---

## API Routes (60+)

**Auth:** canonical `/api/auth/signup|login|logout` (`/api/auth/[...all]` blocked)
**Lessons:** `/api/lessons/[lessonId]/*` — watch-session, heartbeat, activities
**Children:** `/api/children/[childId]/*` — CRUD, skill-map, learning-trajectory, placement-status
**Adaptive:** `/api/adaptive/*` — placement-test, next-lesson, review-queue
**Admin:** `/api/admin/*` — full admin CRUD (users, content, courses, blog, feature-flags, security, exports)
**Blog:** `/api/blog/*` — posts, tags, comments
**Organizations:** `/api/organizations/[orgId]/*` — members, progress, class-report, skill-heatmap
**Courses:** `/api/courses/*` — catalog, checkout, enrollment, completion, certificates
**Billing:** `/api/billing/webhooks/{mock,stripe,payos}`, `/api/billing/checkout`
**Caregivers:** `/api/caregivers/*` — invite, accept
**Referrals:** `/api/referrals/*` — claim, track
**Reports:** `/api/reports/*` — weekly-report, progress
**Notifications:** `/api/notifications/*`
**Certificates:** `/api/certificates/[enrollmentId]`
**Cron:** `/api/cron/{weekly-reports,streak-alerts,cleanup-pending-media,publish-scheduled-posts}` (`vercel.json`)
**Health:** `/api/health`

**Middleware:** `src/proxy.ts` (not `middleware.ts`) — A/B test cookies, attribution tracking, consent management

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Public + authenticated pages
│   │   ├── admin/                # Admin CMS (blog, courses, users, analytics, security, log)
│   │   ├── courses/              # Course catalog + detail
│   │   ├── for-schools/          # redirects to /courses
│   │   ├── gift-code/            # Gift code redemption
│   │   ├── parent/               # Parent dashboard + children + reports
│   │   ├── referral/             # Referral program
│   │   └── (auth|pricing|blog)   # Public pages
│   ├── (kid-app)/                # Child-facing app
│   │   └── kid/                  # `/kid/*` routes
│   ├── (curriculum)/             # Curriculum browser + student map
│   │   ├── parent/curriculum/    # Parent curriculum browser/planner
│   │   └── student/              # Student learning map + daily
│   ├── (admin-login)/            # Standalone admin login shell
│   ├── api/                      # API routes
│   │   ├── admin/                # Admin-only API
│   │   ├── auth/                 # Auth endpoints
│   │   ├── courses/              # Course API
│   │   ├── lessons/              # Lesson API
│   │   ├── children/             # Child profile API
│   │   ├── adaptive/             # Adaptive engine API
│   │   ├── blog/                 # Blog API
│   │   ├── organizations/        # B2B org API
│   │   ├── billing/webhooks/     # Payment webhooks
│   │   ├── caregivers/           # Caregiver API
│   │   ├── referrals/            # Referral API
│   │   ├── reports/              # Reports API
│   │   ├── notifications/        # Notifications API
│   │   ├── certificates/         # Certificate API
│   │   ├── cron/                 # Cron job endpoints
│   │   └── health                # Health check
│   ├── teacher/                  # Teacher dashboard
│   └── reader/                   # Reader portal (separate auth)
├── components/                   # Shared UI components
│   ├── admin/                    # Admin-specific components
│   ├── analytics/                # Analytics charts/dashboards
│   ├── blog/                     # Blog UI
│   ├── courses/                  # Course components
│   ├── curriculum/               # Curriculum browser
│   ├── garden/                   # Garden game UI (journey, zones)
│   ├── lesson-player/            # Lesson playback UI
│   ├── kid-app/                  # Kid-facing components
│   ├── parent/                   # Parent-facing components
│   ├── skills/                   # Skills visualization
│   ├── auth-form/                # Auth components
│   ├── language-switcher/        # i18n switcher
│   └── ui/                       # shadcn/ui base components
├── modules/                      # Domain logic (`ls src/modules`; not a frozen count)
│   ├── adaptive/                 # Placement tests, skill taxonomy, spaced repetition, next-lesson sequencing
│   ├── admin/                    # Admin services (analytics, GA4, SOT, funnel, cohort)
│   ├── billing/                  # Stripe + PayOS, subscriptions, renewals
│   ├── blog/                     # Blog CMS, comments (newsletter dropped PR #10)
│   ├── content/                  # Curriculum content service
│   ├── courses/                  # Course catalog plugin (not access SoT)
│   ├── entitlement/              # Household tickets — access source of truth
│   ├── garden/                   # Kid garden game (journey/zone progression)
│   ├── identity/                 # Parent household identity
│   ├── learning/                 # Lesson session tracking (video watch, heartbeat, completion)
│   ├── organizations/            # B2B/schools, bulk enrollment, class skill heatmap
│   ├── platform/                 # Audit logging, security, access guard, push notifications, R2 storage
│   ├── progress/                 # Learning progress, evidence media, retention
│   ├── reader/                   # Separate reader portal (auth + bookmarks)
│   ├── referral/                 # Referral program (claim, track)
│   ├── reports/                  # Weekly learning reports, Resend email
│   ├── caregivers/
│   └── sharing/
├── worker/                       # BullMQ workers + queue definitions
│   ├── jobs/                     # Individual job processors
│   └── queue.ts                  # Queue + enqueue helpers
├── lib/                          # Utilities
│   ├── db.ts, prisma.ts          # DB clients
│   ├── auth/                     # Better Auth config + helpers
│   ├── redis*.ts                 # Redis clients
│   ├── email/                    # Resend helpers
│   ├── analytics/                # GA4, FB Pixel, trackEvent()
│   ├── observability/            # Structured logging
│   ├── ab-test.ts                # A/B testing
│   ├── feature-flags.ts          # Feature flags
│   ├── security/                 # Security utilities
│   ├── seo/                      # SEO helpers
│   ├── bunny-stream-client.ts    # Bunny CDN signed URLs
│   └── env.ts                    # Validated env vars
```

Repo root (not under `src/`): `locales/en|vi/translation.json`, `prisma/schema.prisma`.

---

## Key Modules

| Module | Purpose | Key Services |
|---|---|---|
| **adaptive** | Skill taxonomy, placement tests, spaced repetition, next-lesson AI | placement-test-service, skill-service, review-queue-service |
| **admin** | Analytics, user mgmt, GA4, funnel/cohort analysis | admin-analytics-service, admin-user-service, admin-billing-service |
| **billing** | Stripe + PayOS, subscriptions, renewals | billing-service, plan-config |
| **blog** | Blog CMS, comment moderation (newsletter killed PR #10) | blog-service, comment-service |
| **content** | Curriculum content definitions, activity types | content-service |
| **courses** | Course catalog plugin, checkout, gift codes, certificates | course-service, checkout-service, gift-code-service, certificate-service |
| **entitlement** | Household tickets (access SoT) | `src/modules/entitlement` |
| **garden** | Kid garden game — journey progression, zone unlocking | garden-service |
| **identity** | Parent household identity | `src/modules/identity` |
| **learning** | Lesson session tracking, video watch, completion | `src/modules/learning` |
| **organizations** | B2B, bulk enrollment, class skill heatmap | organization-service, bulk-enroll-service, class-report-service |
| **platform** | Audit logging, R2 storage, push notifications, security | platform-service, storage-adapter |
| **progress** | Learning progress retention, evidence media upload | progress-service, evidence-media-service |
| **reader** | Separate reader portal — auth + bookmarks | reader-service, reader-bookmark-service |
| **referral** | Referral code generation, attribution tracking | referral-service |
| **reports** | Weekly reports, email delivery | reports-service |

---

## Prisma Schema

**50+ Models, 27 Enums**

**Domains:**
- **Auth/Identity:** ParentAccount, Session, User, AuthSession, Account, Verification, AdminAccount, ReaderAccount
- **Subscriptions:** Subscription, PaymentRecord, WebhookEvent, PackageSubscription
- **Child Learning:** ChildProfile, ProgressState, LessonCompletion, LessonProgress, Evidence, EvidenceMedia, RewardGrant, WeeklyReport, ChildCourseJourney
- **Curriculum:** Track→Level→Unit→Lesson→Activity (cascade chain), CourseLesson, CourseEnrollment, ChildCourseJourneyTier
- **Adaptive:** Skill (self-ref tree), ChildSkillState, SkillAttempt, ReviewQueue, PlacementTest, PlacementTestAttempt
- **Abeka Curriculum:** AbekaVideo, AbekaGrade, AbekaLesson, AbekaLearningJourney, AbekaAssignment, AbekaWatchProgress, AbekaBadge, AbekaStreak, AbekaSkillNode
- **Blog:** BlogPost, BlogCategory, BlogTag, BlogAuthor, BlogComment, BlogPostVersion, BlogBookmark
- **Courses:** Course, CourseReview, GiftCode, CurriculumPackage
- **Entitlement:** Entitlement (parent-scoped tickets)
- **Organizations:** Organization, OrganizationMember
- **Garden:** (Game progression data)
- **Admin/Platform:** AuditLog, FeatureFlag, CouponCode, SystemAnnouncement, SiteContentSettings
- **Referral:** ReferralCode, ReferralAttribution

---

## BullMQ Workers

| Queue | Jobs |
|---|---|
| weekly-reports | generate-weekly-reports |
| portfolio-retention | purge-expired-media |
| weekly-report-emails | dispatch-weekly-report-emails |
| blog-comment-emails | verify-blog-comment |
| blog-comment-reply-emails | notify-comment-reply |
| lifecycle-emails | send-lifecycle-email, dispatch-pending-lifecycle-emails |
| transactional-emails | send-transactional-email |
| certificates | generate-certificate |
| bulk-enroll | bulk-enroll |

---

## i18n (next-intl)

**Locales:** `en` default (`src/i18n/locales.ts`) + `vi` catalog.
**Config:** Cookie-based locale switching via `next-intl`
**Translation files:** `locales/en/translation.json`, `locales/vi/translation.json`
**Leftover mix:** PR #23 `feat/i18n-locale-parity` merged 2026-09-05. Cookie `tgh_locale` drives named UI; homepage H1 still uses `generated.*`.

---

## Environment Variables (Production)

```
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Video
BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_CDN_HOSTNAME, BUNNY_WEBHOOK_SECRET

# Storage
CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME

# Email
RESEND_API_KEY

# Payments
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRETS, PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY

# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID, NEXT_PUBLIC_FB_PIXEL_ID

# Auth
BETTER_AUTH_SECRET, BETTER_AUTH_URL

# Redis
REDIS_URL

# Feature flags
FEATURE_FLAGS_ENABLED=true
```

---

## Testing

**Unit/Integration:** `pnpm test`
**E2E:** `pnpm test:e2e` (owners under `tests/e2e/`)
**Key test files:**
- `auth-flow.spec.ts`, `learning-flow-integration.spec.ts`, `course-purchase-flow.spec.ts`, `gift-code-redeem.spec.ts`, `teacher-bulk-enroll.spec.ts`, `language-switching.spec.ts`

---

## Infrastructure

**Docker Compose (dev/staging):**
- postgres:16-alpine
- redis:7-alpine
- web (Node.js, port 3000)
- worker (BullMQ processor)

**Vercel (preview):** `vercel.json` has 4 cron routes.
**VPS (production):** DigitalOcean Ubuntu 24.04, PM2 + Nginx, Docker Compose

**CI/CD:** `release-check.yml` + `codeql.yml` + `deploy.yml`; Dependabot `.github/dependabot.yml`

---

## External Services

- **Video CDN:** Bunny Stream (signed embed URLs)
- **Media Storage:** Cloudflare R2
- **Email:** Resend API
- **Payments:** Stripe + PayOS
- **Auth:** Better Auth (signed cookies)
- **Analytics:** Google Analytics 4, Meta Pixel
