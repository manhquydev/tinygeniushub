# Codebase Summary

## Recent Additions (Phase 01-03)

### Email Lifecycle Sequences
- D0/D3/D7 trial email sequences via BullMQ job queue
- `LifecycleEmailLog` Prisma model for tracking sent emails

### Bunny Stream Video CDN
- `bunny-stream-client.ts` — API client for Bunny Stream
- `/api/admin/videos/upload` — admin video upload endpoint
- `/api/webhooks/bunny` — webhook handler for encoding status
- New env vars: `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_CDN_HOSTNAME`, `BUNNY_WEBHOOK_SECRET`

### Course System
- Prisma models: `Course`, `CourseLesson`, `CourseEnrollment`, `GiftCode`
- `/courses` page listing and detail pages
- `/api/courses/*` REST routes (enrollment, progress, gift-code redemption)
- Gift-code service with generation and redemption logic
- Certificate PDF generation on course completion
- `/gift-code` redemption page (public)

### SEO Blog Content
- 10 Vietnamese blog articles seeded targeting parent search queries

### Admin Service Refactor
- Monolithic admin service split into focused modules:
  - `admin-analytics-service.ts`
  - `admin-billing-service.ts`
  - `admin-blog-service.ts`
  - `admin-user-service.ts`

### Pricing Page
- Premium Courses section added to `/pricing`

### Deployment Infrastructure
- `.github/workflows/deploy-digitalocean-ssh.yml` — GitHub Actions SSH deploy workflow
- `scripts/deploy/remote-deploy.sh` — remote deploy script
- `docs/deployment/digitalocean-ssh-agent-setup.md` — setup guide

---

## Project Overview

**Cung Con Tu Hoc** — Vietnamese EdTech platform for self-directed child learning.

### Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js
- **Queue**: BullMQ (Redis)
- **Storage/Video**: Bunny Stream CDN
- **Email**: Resend
- **Payments**: Stripe
- **Deployment**: DigitalOcean (SSH + GitHub Actions)

### Key Directories
```
src/
├── app/              # Next.js App Router pages + API routes
├── components/       # Shared UI components
├── modules/          # Domain modules (auth, blog, admin, courses)
│   └── admin/        # Refactored admin sub-services
scripts/deploy/       # Deployment scripts
docs/deployment/      # Deployment documentation
```

### Prisma Models (summary)
`User`, `Session`, `SubscriptionPlan`, `Course`, `CourseLesson`, `CourseEnrollment`, `GiftCode`, `LifecycleEmailLog`, `BlogPost`, `ContactMessage`, `WaitlistEntry`

### Docs Index
See `docs/README.md` for full documentation index.
