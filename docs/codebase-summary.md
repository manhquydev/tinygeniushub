# Codebase Summary

**Last updated:** 2026-02-25 — Phases 01–04 complete. Deployed to production at https://cungcontuhoc.io.vn.

---

## Production Deployment

- **Server:** DigitalOcean Ubuntu 24.04, IP `152.42.246.218`
- **Domain:** cungcontuhoc.io.vn — A records set, SSL via Let's Encrypt
- **Runtime:** PM2 process manager + Nginx reverse proxy
- **Services:** Docker Compose — PostgreSQL 16 + Redis 7
- **CI/CD:** `.github/workflows/deploy-digitalocean-ssh.yml` (GitHub Actions SSH deploy key)
- **Seed data:** 13 blog articles, categories, tags

---

## Phase 04 — B2B Kindergarten (complete)

### Multi-tenant Organization System
- Prisma models: `Organization`, `OrganizationMember`, `OrgRole` enum (`TEACHER_ADMIN`, `STUDENT_PARENT`)
- `organization-service.ts` — CRUD, `isTeacherAdmin()`, `getOrgStudentProgress()`
- `bulk-enroll-service.ts` — CSV parse + BullMQ-queued bulk student enrollment
- `class-report-service.ts` — pdf-lib A4 class progress PDF for teachers
- API routes: `/api/organizations/[orgId]/members|progress|bulk-enroll|class-report`
- Admin API: `/api/admin/organizations/` — super-admin CRUD + member management

### Teacher Dashboard
- `/teacher/dashboard` — client-side dashboard with `orgId` from `useSearchParams`
- `teacher-progress-grid.tsx` — sortable table, at-risk badge (>7 days inactive), search
- `teacher-bulk-enroll.tsx` — CSV paste/upload, 10-row preview, POST to bulk-enroll API
- `teacher-dashboard.css` — standalone CSS module

### B2B Landing Page
- `/for-schools` — hero, 3 benefit cards, pricing tiers (trial/small/large), demo CTA
- `guestLinks` in `app-nav-client.tsx` includes "Cho trường học" → `/for-schools`

---

## Phase 03 — Course System (complete)

### Course Infrastructure
- Prisma models: `Course`, `CourseLesson`, `CourseEnrollment`, `GiftCode`
- `course-service.ts` — catalog, enrollment, completion, lesson access control
- `course-checkout-service.ts` — one-time payment; active subscribers get 20% discount
- `gift-code-service.ts` — 8-char bulk code generation + idempotent redemption
- `certificate-service.ts` — pdf-lib A4 landscape PDF certificate on completion

### BullMQ Workers
- `generate-certificate.ts` — job worker for certificate generation
- `bulk-enroll-processor.ts` — job worker for CSV bulk enrollment

### Course API Routes
- `GET/POST /api/courses` — catalog
- `GET /api/courses/[slug]` — detail + curriculum
- `POST /api/courses/[slug]/checkout` — initiate purchase
- `GET /api/courses/[slug]/enrollment` — enrollment status
- `POST /api/courses/[slug]/complete` — mark complete + trigger certificate
- `POST /api/gift-codes/redeem` — redeem code (5/hr/IP rate limit)
- `GET /api/certificates/[enrollmentId]` — on-demand certificate PDF
- `GET/POST /api/admin/courses` — admin CRUD
- `PATCH/DELETE /api/admin/courses/[id]` — update/delete
- `POST /api/admin/courses/[id]/publish` — toggle publish
- `GET/POST /api/admin/courses/[id]/lessons` — lesson management
- `GET/POST /api/admin/gift-codes` — admin gift code management

### Course Frontend
- `/courses` — catalog page (server component)
- `/courses/[slug]` — detail + curriculum (server component)
- `/gift-code` — redemption page with `gift-code-form.tsx` client component
- `course-checkout-button.tsx` — client component, POST checkout + redirect

### Admin Course CMS
- `/admin/courses` — server page + `admin-courses-client.tsx` client component
- Full CRUD: create/edit inline form, publish toggle, delete with confirm
- Admin nav updated: "Khoá học" entry with `GraduationCap` icon

---

## Phase 02 — Video Infrastructure (complete)

### Bunny Stream Integration
- `bunny-stream-client.ts` — `bunnyCreateVideo`, `bunnyGetVideo`, `bunnyDeleteVideo`, `bunnySignedEmbedUrl` (HMAC-SHA256)
- `/api/admin/videos/upload` — creates Bunny video, links to lesson
- `/api/webhooks/bunny` — encoding webhook → updates `Lesson.videoStatus`
- `/api/lessons/[lessonId]/video-token` — returns signed embed URL for authenticated parent
- Prisma `Lesson` model extended: `bunnyVideoId`, `videoStatus`, `isPreview`
- Env vars: `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_CDN_HOSTNAME`, `BUNNY_WEBHOOK_SECRET`

---

## Phase 01 — Foundation & Marketing (complete)

### Pricing Update
- `plan-config.ts`: `YEARLY_STANDARD` = 799,000đ, `YEARLY_FAMILY_PLUS` = 1,199,000đ
- Pricing page shows new prices + course upsell section

### Homepage Redesign
- Math-first hero (`section-hero.tsx`): "15 phút/ngày", "hoàn tiền 100% trong 30 ngày"
- `section-features.tsx` — Brain icon + Toán tư duy as first feature
- `section-testimonials.tsx` — Math-focused testimonials
- `section-pricing-preview.tsx` — 799,000đ/năm, 2,189đ/ngày
- `section-faq.tsx` — 799,000đ, 30-day refund

### Analytics Tracking
- `trackEvent()` utility in `src/lib/analytics/track-event.ts`
- `purchase` event fires BEFORE `window.location.assign()` (race condition fix)
- `trial_start` + `complete_registration` on signup

### Email Lifecycle Sequences
- `lifecycle-email-service.ts` — D0/D3/D7 trial sequences (idempotent via `LifecycleEmailLog`)
- BullMQ worker: `dispatch-lifecycle-emails.ts`
- D0 fired on signup (fire-and-forget)
- D3/D7 dispatched via 1-hour cron in worker

### SEO Blog Content
- 13 Vietnamese SEO articles seeded via `prisma/seed.ts`
- Categories: tieng-anh-som, toan-tu-duy, cong-nghe-giao-duc, phat-trien-tre

### Admin Service Refactor
- `src/modules/admin/service.ts` re-exports from 4 focused modules:
  - `admin-analytics-service.ts`, `admin-billing-service.ts`, `admin-blog-service.ts`, `admin-user-service.ts`

### Deployment Infrastructure
- `.github/workflows/deploy-digitalocean-ssh.yml` — GitHub Actions SSH deploy
- `scripts/deploy/remote-deploy.sh` — remote deploy script

### Dashboard — Referral CTA
- Prominent amber-toned referral share banner on `/parent/dashboard`
- "Khoá học Premium" shortcut link added to quick-links section

---

## Project Overview

**Cùng Con Tự Học** — Vietnamese EdTech platform for children ages 2–6 (Toán tư duy + Tiếng Anh Phonics).

### Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Better Auth (`getParentFromRequest`, `requireAdminFromRequest`)
- **Queue**: BullMQ + Redis
- **Video**: Bunny Stream CDN (signed embed URLs)
- **Storage**: Cloudflare R2 (`StorageProviderAdapter`)
- **Email**: Resend API + mock fallback
- **Payments**: Stripe + mock gateway abstraction
- **Deployment**: DigitalOcean Ubuntu 24.04 (SSH + GitHub Actions)

### Business Model
- **Subscription**: 99k/month | 799k/year (7-day trial, 30-day money-back)
- **Premium Courses**: 299k–499k one-time (active subscribers get 20% off)
- **B2B**: Annual school contracts (invoice billing)
- **Growth**: Referral program (7-day bonus both sides), gift codes (Shopee/Tết)

### Key Directories
```
src/
├── app/                     # Next.js App Router pages + API routes
│   ├── (main)/              # Public + authenticated pages
│   │   ├── admin/           # Admin CMS (blog, courses, users, analytics)
│   │   ├── courses/         # Course catalog + detail
│   │   ├── for-schools/     # B2B landing page
│   │   ├── gift-code/       # Gift code redemption
│   │   ├── parent/          # Parent dashboard + children + reports
│   │   └── referral/        # Referral program page
│   ├── api/                 # API route handlers
│   │   ├── admin/           # Admin-only API (courses, blog, users, orgs, videos)
│   │   ├── auth/            # Auth endpoints (login, signup, logout)
│   │   ├── courses/         # Course API (catalog, checkout, enrollment, complete)
│   │   ├── organizations/   # B2B org API (members, progress, bulk-enroll)
│   │   └── webhooks/        # External webhooks (Bunny Stream)
│   ├── kid/                 # Kid-facing lesson UI
│   └── teacher/             # Teacher dashboard (B2B)
├── components/              # Shared UI components + homepage sections
├── modules/                 # Domain logic
│   ├── admin/               # Admin sub-services (analytics, billing, blog, users)
│   ├── billing/             # Subscription + plan config
│   ├── blog/                # Blog SEO + service
│   ├── courses/             # Course + checkout + gift-code + certificate services
│   ├── organizations/       # Org + bulk-enroll + class-report services
│   ├── platform/            # Lifecycle email service
│   ├── referral/            # Referral service
│   └── sharing/             # Share link builder
├── worker/                  # BullMQ workers + queue definitions
│   ├── jobs/                # Individual job handlers
│   └── queue.ts             # Queue exports + enqueue helpers
└── lib/                     # Utilities (auth, db, env, http, analytics)
```

### Prisma Models
`ParentAccount`, `ChildProfile`, `Subscription`, `Lesson`, `LessonCompletion`, `WeeklyReport`,
`Course`, `CourseLesson`, `CourseEnrollment`, `GiftCode`,
`Organization`, `OrganizationMember`,
`LifecycleEmailLog`,
`BlogPost`, `BlogCategory`, `BlogAuthor`, `BlogNewsletterSubscriber`,
`ContactMessage`, `WaitlistEntry`, `ReferralCode`, `ReferralUse`

### Environment Variables (production required)
```
# Video
BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_CDN_HOSTNAME, BUNNY_WEBHOOK_SECRET
# Analytics
NEXT_PUBLIC_GA4_MEASUREMENT_ID, NEXT_PUBLIC_FB_PIXEL_ID
# Payments (when going live)
BILLING_PROVIDER=stripe, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRETS
```

### Docs Index
See `docs/README.md` for full documentation index.
