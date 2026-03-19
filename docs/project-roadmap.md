# Project Roadmap

**Last updated:** 2026-03-19
**Status:** All phases complete — deployed to production.

---

## Phase 05 — Course Learning Pages Overhaul [COMPLETE]

- Free lesson preview system with `isPreview` bypass authentication
- Course detail pages modularized into 9 reusable components (hero, curriculum, difference, FAQ, fit checklist, timeline, sticky header)
- Parent course progress page with completion bars and "Học tiếp" CTA
- Lesson player UX refactored with sidebar and parent script panel (reduced 252→160 lines)
- Parent dashboard split from 449 lines into 7 focused components
- Course reviews system with ratings and review form
- Breadcrumb navigation and course card components
- JSON-LD schema generation for SEO
- 3 new analytics trackers for course storefront events
- Extended `StorefrontCourse` type with `ageGroup`, `reviewCount`, `reviewAverageRating`, `enrollmentCount`
- `CourseSubject` enum and expanded `AgeGroup` enum (8 values) in Prisma schema
- New `CourseReview` model in database

---

## Patch Stream - 2026-03-17 [COMPLETE]

- Added `SiteContentSettings` data model for admin-managed footer social links.
- Added admin endpoint: `GET/PATCH /api/admin/site-settings/footer-social-links`.
- Added Admin Operations tab: **Footer social** for updating social URL targets without code edits.
- Footer social links now resolve from server settings with fallback defaults when no settings row exists.
- Removed process-level cache for footer social links to avoid stale values after admin updates.
- Added regression coverage: service tests, route tests, and Playwright E2E for admin update -> homepage reflection.

---

## Production Deployment [COMPLETE]

- **Server:** DigitalOcean Ubuntu 24.04 — IP `152.42.246.218`
- **Domain:** [cungcontuhoc.io.vn](https://cungcontuhoc.io.vn) — A records + SSL via Let's Encrypt
- **Stack:** PM2 + Nginx reverse proxy, Docker Compose (PostgreSQL 16 + Redis 7)
- **CI/CD:** GitHub Actions `deploy-digitalocean-ssh.yml` (SSH deploy key)
- **Seed data:** 13 SEO blog articles, categories, tags

---

## Phase 01 — Foundation & Marketing [COMPLETE]

- Homepage redesigned with Math-first positioning (SEO/CRO optimized)
- Pricing: 99k/month | 799k/year | Family+ 1,199k/year
- 13 Vietnamese SEO blog articles seeded
- Lifecycle email sequences: D0/D3/D7 trial with course upsell in D7
- Sitemap covers `/`, `/pricing`, `/about`, `/blog`, `/courses`, all blog posts
- Referral system with Zalo/Facebook share links
- Analytics: `trackEvent()` for `purchase`, `trial_start`, `complete_registration`

## Phase 02 — Video Infrastructure [COMPLETE]

- Bunny Stream integration: upload proxy, signed URL generation, webhook handler
- `Lesson` model extended: `bunnyVideoId`, `videoStatus`, `videoDuration`, `isPreview`
- Admin video upload CMS with encoding status tracking

## Phase 03 — Course System [COMPLETE]

- Prisma models: `Course`, `CourseLesson`, `CourseEnrollment`, `GiftCode`
- Course purchase flow (mock_gateway + Stripe-ready)
- 20% subscriber discount at checkout
- Certificate PDF generation (pdf-lib, async via BullMQ)
- Course admin CMS: list, create, edit, publish toggle, delete
- Gift code generate + redeem endpoints (rate-limited 5/hr/IP)
- E2E tests: `course-purchase-flow.spec.ts`, `gift-code-redeem.spec.ts`

## Phase 04 — B2B Kindergarten [COMPLETE]

- Organization multi-tenant model (`Organization`, `OrganizationMember`)
- Teacher dashboard with bulk CSV enrollment
- Class report PDF generation
- At-risk student flagging (>7 days inactive)
- B2B landing page `/for-schools`
- E2E tests: `teacher-bulk-enroll.spec.ts`

---

## Business Model

| Tier | Price | Notes |
|---|---|---|
| Monthly | 99,000đ/month | 7-day free trial |
| Yearly Standard | 799,000đ/year | ~2,189đ/day |
| Yearly Family+ | 1,199,000đ/year | Multi-child |
| Premium Course | 299k–499k one-time | 20% off for subscribers |
| B2B School | Annual contract | Invoice billing |

---

## Next Priorities (backlog)

- Admin-configurable content settings expansion (footer links done; next: contact info, legal links, app badges)
- Stripe live mode switch (replace mock_gateway)
- Comment system on blog posts
- Advanced course features (progress resume, bookmarks)
- Mobile app (React Native)
