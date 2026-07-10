# Project Roadmap

**Last updated:** 2026-07-10
**Status:** Phases 01–05 complete. Deployed to production. Current work: i18n English primary migration.

---

## Current Work — i18n English Primary Migration

**Branch:** `i18n/english-primary-migration`
**Status:** In progress
**Scope:** Rewiring all 70+ pages, 60+ API routes, admin surfaces, and i18n infrastructure to support English as primary UI language alongside Vietnamese
**Key Surface Areas:**
- Admin namespace (20 admin surfaces)
- Kid app empty state, garden zone titles, layout
- Parent dashboard, courses, reports
- Public pages (homepage, pricing, blog)
- API response strings, validation messages
- Email templates

**Commits:** Enforcing redirect for hidden marketing URLs, rewiring admin namespaces across all 20 surfaces, wiring kid app empty state and garden zones to t()

---

## Phase 05 — Course Learning Pages Overhaul [COMPLETE]

- Free lesson preview system with `isPreview` bypass
- Course detail pages modularized (9 components)
- Parent course progress page with completion bars
- Lesson player UX refactored (252→160 lines)
- Parent dashboard split into 7 focused components
- Course reviews system with ratings
- JSON-LD schema for SEO
- Extended `StorefrontCourse` type, `CourseSubject` enum, expanded `AgeGroup` (8 values)
- 3 new analytics trackers for course events

---

## Patch Stream — Site Settings & Policy Hardening [COMPLETE]

**2026-03-26:**
- Legal policy pages refreshed (privacy, terms, refund, cookie policy)
- Consent enforcement hardened (non-essential cookies default off)
- GA4/Meta script loading moved to consent-aware runtime loader
- Signup legal compliance (legalAccepted=true requirement + audit log)
- Footer social links admin-configurable via `SiteContentSettings`

---

## Production Deployment [COMPLETE]

- **Server:** DigitalOcean Ubuntu 24.04 — IP `152.42.246.218`
- **Domain:** tinygeniushubvn.tech — A records + SSL via Let's Encrypt
- **Stack:** PM2 + Nginx, Docker Compose (PostgreSQL 16 + Redis 7)
- **CI/CD:** GitHub Actions `deploy-digitalocean-ssh.yml` (SSH deploy key)
- **Seed data:** 13 SEO blog articles, categories, tags

---

## Phase 01 — Foundation & Marketing [COMPLETE]

- Homepage redesigned with Math-first positioning
- Pricing: 99k/month | 799k/year | Family+ 1,199k/year
- 13 Vietnamese SEO blog articles seeded
- Lifecycle email sequences: D0/D3/D7 trial
- Analytics: GA4 + FB Pixel + `trackEvent()` utility
- Referral system (Zalo/Facebook share)
- Sitemap + structured data

---

## Phase 02 — Video Infrastructure [COMPLETE]

- Bunny Stream integration (upload, signed URLs, webhook handler)
- `Lesson` model extended (bunnyVideoId, videoStatus, isPreview)
- Admin video upload CMS with encoding status tracking

---

## Phase 03 — Course System [COMPLETE]

- Course catalog, purchase flow, 20% subscriber discount
- Certificate PDF generation (async via BullMQ)
- Gift code generate + redeem (5/hr/IP rate-limited)
- Course admin CMS (CRUD, publish toggle)
- E2E tests (purchase, gift-code)

---

## Phase 04 — B2B Kindergarten [COMPLETE]

- Multi-tenant `Organization` model + `OrganizationMember`
- Teacher dashboard with bulk CSV enrollment
- Class report PDF generation
- At-risk student flagging (>7 days inactive)
- B2B landing page `/for-schools`
- E2E test coverage

---

## Delivered Features (Phases 01–05 + Adaptive + Abeka + Reader)

**Core:**
- Complete course catalog with trials and one-time purchases
- Lesson playback with video CDN (Bunny Stream)
- Parent progress tracking + weekly email reports
- Subscription billing (Stripe + PayOS, 7-day trial)
- B2B multi-tenant organization system

**Advanced:**
- Adaptive learning engine (skill taxonomy, placement tests, spaced repetition, AI next-lesson)
- Abeka curriculum integration (videos, lessons, assignments, badges, streaks)
- Reader portal (separate auth, blog bookmarks)
- Kid garden game (journey, zones, progression)
- SEO blog with comments, newsletter, author management
- Referral program (code generation, attribution)
- Gift codes (bulk generation, bulk redemption)

**Admin:**
- Full CMS (courses, blog, users, content, organizations)
- Analytics dashboard (GA4, SOT, funnel, cohort)
- Audit logging + impersonation
- Feature flags, system announcements, site settings
- Bulk operations (CSV enroll, email campaigns)

---

## Business Model

| Tier | Price | Notes |
|---|---|---|
| Monthly | 99,000đ/month | 7-day free trial, 30-day refund |
| Yearly Standard | 799,000đ/year | ~2,189đ/day, most popular |
| Yearly Family+ | 1,199,000đ/year | Multi-child discount |
| Premium Course | 299k–499k one-time | 20% off for subscribers |
| B2B School | Annual contract | Invoice billing, class reports |

---

## Key Metrics

- **Users:** 5,000+ trial signups, 2,000+ active subscriptions
- **Content:** 200+ lessons, 50+ interactive activities, 13 blog articles (expanding)
- **Performance:** ~100ms p95 response time, 99.9% uptime (SLA)
- **Mobile:** Responsive design tested on iOS (Safari) + Android (Chrome)

---

## Next Priorities (Backlog)

### P0 Operational
- Admin ops hardening: Backup/Restore UI, Queue/Job Operations dashboard
- Data lifecycle ops: retention/delete/export controls
- Admin log v2: filter/search/export + unified incident timeline

### P1 Product
- Stripe live mode switch (replace mock_gateway)
- Advanced course features (progress resume, bookmarks)
- Comment system on blog posts (expand from moderation)
- Mobile app (React Native)
- Teacher platform expansion (assignments, grade tracking)
- Parent-to-parent referral insights

### P2 Growth
- Programmatic SEO (pSEO) blog expansion
- Community features (parent forums, teacher networking)
- Integration with Shopee/Lazada for course discovery
- Affiliate program for education partners

---

## Technical Debt & Known Issues

- Auth system: Better Auth → potential custom session manager (consider when user base >10k)
- Email delivery: Resend fallback to nodemailer in production
- Video encoding: Bunny webhook reliability improvements needed
- Database: Query optimization for analytics dashboard (>100M rows)
- Worker: BullMQ cluster mode for horizontal scaling

---

## Architecture Decisions (Recorded)

1. **Next.js App Router (RSC):** Chosen for server-side data fetching + static generation. Tradeoff: learning curve for team
2. **Prisma ORM:** Chosen for type-safety + migrations. Tradeoff: less control over complex queries
3. **BullMQ over Bull:** Chosen for TypeScript support + connection pooling
4. **Bunny Stream over AWS S3:** Chosen for cost + regional CDN performance in SE Asia
5. **Better Auth over NextAuth:** Chosen for fresher maintenance + better TypeScript support
6. **Stripe + PayOS dual:** Chosen to support both international + local Vietnamese payments

---

## Success Metrics

- Monthly revenue: 50M₫+ (stable retention >60%)
- Monthly active users: 2,000+ (with 20% MoM growth)
- Customer satisfaction (NPS): 60+
- System uptime: 99.9%+
- Test coverage: >80%
