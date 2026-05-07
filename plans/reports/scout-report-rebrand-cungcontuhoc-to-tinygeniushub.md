# Scout Report: Rebrand "Cùng Con Tự Học" → "TinyGenius Hub"

**Date:** 2026-05-07  
**Scope:** Entire codebase (`/home/manhquy/Documents/cungcontuhoc`)  
**Search matches:** ~891 `cungcontuhoc` + ~343 `Cùng Con Tự Học` + ~57 `Cung Con Tu Hoc`

---

## ⚠️ IMPORTANT: New Domain Name Needed

This project currently uses `cungcontuhoc.io.vn` as its domain. The rebrand requires a **new domain name** (e.g., `tinygeniushub.io.vn` or `tinygeniushub.vn`). Similarly, the email domain `cungcontuhoc.vn` is used in test seed data — this may be a separate domain or same as production.

**Decision needed:** What is the new domain? (used in `## SUGGESTED REPLACEMENT` throughout)

Assuming: **`tinygeniushub.io.vn`** as the new domain unless otherwise decided.

---

## 1. CRITICAL — Infrastructure / Config / Deploy

| # | File | Line(s) | Type | Current Value | Suggested Replacement | Notes |
|---|------|---------|------|---------------|----------------------|-------|
| 1 | `package.json` | 2 | package name | `"name": "cungcontuhoc"` | `"name": "tinygeniushub"` | npm package name |
| 2 | `package.json` | 199 | repo URL | `github.com/manhquydev/cungcontuhoc` | `github.com/manhquydev/tinygeniushub` | Or new org |
| 3 | `package.json` | 207,209 | issues/homepage | `github.com/manhquydev/cungcontuhoc` | `github.com/manhquydev/tinygeniushub` | |
| 4 | `src/lib/env.ts` | 101 | default value | `OBSERVABILITY_SERVICE_NAME: "cungcontuhoc-web"` | `"tinygeniushub-web"` | OpenTelemetry service name |
| 5 | `src/lib/env.ts` | 132 | default value | `DATABASE_URL fallback: ...cungcontuhoc?schema=public` | `...tinygeniushub?schema=public` | Dev default connection string |
| 6 | `.env.example` | 1 | env var | `DATABASE_URL=postgresql://.../cungcontuhoc?...` | `postgresql://.../tinygeniushub?...` | |
| 7 | `.env.example` | 47 | env var | `BACKUP_POSTGRES_DATABASE=cungcontuhoc` | `BACKUP_POSTGRES_DATABASE=tinygeniushub` | |
| 8 | `.env.example` | 63 | env var | `OBSERVABILITY_SERVICE_NAME=cungcontuhoc-web` | `OBSERVABILITY_SERVICE_NAME=tinygeniushub-web` | |
| 9 | `docker-compose.yml` | 6,12 | docker | `POSTGRES_DB: cungcontuhoc` | `POSTGRES_DB: tinygeniushub` | DB container name |
| 10 | `docker-compose.yml` | 53,111 | docker | `DATABASE_URL=.../cungcontuhoc?...` | `.../tinygeniushub?...` | 2 occurrences |
| 11 | `ecosystem.config.js` | 1 (comment) | pm2 | `Cùng Con Tự Học` | `TinyGenius Hub` | Header comment |
| 12 | `ecosystem.config.js` | 13,34,35,36 | pm2 | app name `cungcontuhoc-web` + log paths | `tinygeniushub-web` | PM2 process name + log files |
| 13 | `ecosystem.config.js` | 53,72,73,74 | pm2 | app name `cungcontuhoc-worker` + log paths | `tinygeniushub-worker` | |
| 14 | `ecosystem.config.js` | 16,17,56,57,95 | pm2 | `cwd: '/var/www/cungcontuhoc'` | `cwd: '/var/www/tinygeniushub'` | Server paths |
| 15 | `ecosystem.config.js` | 92,94 | pm2 | deploy host `cungcontuhoc.io.vn`, repo | `tinygeniushub.io.vn`, new repo | Production deploy config |
| 16 | `.github/workflows/deploy.yml` | 23 | CI/CD | `concurrency group: deploy-production-cungcontuhoc` | `deploy-production-tinygeniushub` | |
| 17 | `.github/workflows/deploy.yml` | 61-62 | CI/CD | `PROD_APP_DIR: /var/www/cungcontuhoc`, `PROD_PUBLIC_BASE_URL: https://cungcontuhoc.io.vn` | `/var/www/tinygeniushub`, `https://tinygeniushub.io.vn` | |
| 18 | `.github/workflows/deploy.yml` | 120-121 | CI/CD | `pm2 describe cungcontuhoc-web/worker` | `pm2 describe tinygeniushub-web/worker` | |
| 19 | `.github/workflows/deploy-digitalocean-ssh.yml` | 17 | CI/CD | `group: deploy-production-cungcontuhoc` | `deploy-production-tinygeniushub` | |
| 20 | `.github/workflows/deploy-digitalocean-ssh.yml` | 29 | CI/CD | `APP_DIR: /var/www/cungcontuhoc` | `/var/www/tinygeniushub` | |
| 21 | `.github/workflows/deploy-digitalocean-ssh.yml` | 94 | CI/CD | PM2 process names `cungcontuhoc-web/worker` | `tinygeniushub-web/worker` | Multiple occurrences |
| 22 | `.github/workflows/release-check.yml` | 19,30,36 | CI/CD | `DATABASE_URL: .../cungcontuhoc?...`, `POSTGRES_DB: cungcontuhoc` | `.../tinygeniushub?...` | |
| 23 | `.github/workflows/nightly-local-full.yml` | 18,48 | CI/CD | `DATABASE_URL: .../cungcontuhoc?...`, seed email `@cungcontuhoc.vn` | `.../tinygeniushub?...`, `@tinygeniushub.vn` | |

---

## 2. CRITICAL — Domain & URL References in Source Code

Every `https://cungcontuhoc.io.vn` → `https://tinygeniushub.io.vn`

| # | File | Line(s) | Type | Notes |
|---|------|---------|------|-------|
| 24 | `src/app/layout.tsx` | 26 | metadataBase | `new URL("https://cungcontuhoc.io.vn")` |
| 25 | `src/lib/email/project-email-template-builder.ts` | 39-40,323 | constants | `CANONICAL_APP_BASE_URL`, `CANONICAL_SUPPORT_EMAIL`, `logo-cungcontuhoc-mascot-email.png` |
| 26 | `src/lib/seo/course-jsonld.ts` | 1,13,67 | SEO | `BASE_URL`, org `name`, jsonld references |
| 27 | `src/modules/sharing/share-link-builder.ts` | 6 | domain constant | `const BASE_URL = "https://cungcontuhoc.io.vn"` |
| 28 | `src/modules/courses/pilot-attribution.ts` | 5 | domain suffix | `const OWNED_DOMAIN_SUFFIX = "cungcontuhoc.io.vn"` |
| 29 | `src/modules/courses/certificate-service.ts` | 118 | domain | `const siteUrl = "cungcontuhoc.io.vn"` |
| 30 | `src/modules/organizations/class-report-service.ts` | 109-110 | PDF domain | `page.drawText("cungcontuhoc.io.vn", ...)` |
| 31 | `src/components/courses/course-breadcrumb.tsx` | 5 | domain constant | `const BASE_URL = "https://cungcontuhoc.io.vn"` |
| 32 | `src/components/try-garden/share-buttons.tsx` | 22 | share URL | `"https://cungcontuhoc.io.vn/try-garden"` |
| 33 | `src/app/rss.xml/route.ts` | 8 | site URL | `... ?? "https://cungcontuhoc.io.vn"` |
| 34 | `src/app/(main)/page.tsx` | 18,23,46,53,66,82,83,85,94,106 | homepage | Multiple canonical/OG/JSON-LD URL references |
| 35 | `src/app/(main)/courses/page.tsx` | 27 | canonical | `canonical: "https://cungcontuhoc.io.vn/courses"` |
| 36 | `src/app/(main)/courses/[slug]/page.tsx` | 72,79 | canonical | |
| 37 | `src/app/(main)/pricing/page.tsx` | 11,16 | canonical/OG | |
| 38 | `src/app/(main)/try-garden/page.tsx` | 15,43 | canonical/OG | |
| 39 | `src/app/(main)/for-schools/page.tsx` | 9,13 | canonical/OG | |
| 40 | `src/app/(main)/about/page.tsx` | 8 | canonical | |
| 41 | `src/app/(main)/contact/page.tsx` | 9,26 | canonical, email display | |
| 42 | `src/app/(main)/privacy/page.tsx` | 7,91 | canonical, email | |
| 43 | `src/app/(main)/terms/page.tsx` | 7,100 | canonical, email | |
| 44 | `src/app/(main)/refund-policy/page.tsx` | 7,41 | canonical, email | |
| 45 | `src/app/(main)/cookie-policy/page.tsx` | 9,82 | canonical, email | |
| 46 | `src/app/(main)/referral/page.tsx` | 12 | canonical | |
| 47 | `src/app/(main)/waitlist/page.tsx` | 11 | canonical | |
| 48 | `src/app/(main)/blog/[slug]/opengraph-image.tsx` | 35-36,65 | OG image | Blog label text |
| 49 | `src/app/maintenance/page.tsx` | 67 | zalo link | Hardcoded Zalo link `zalo.me/cungcontuhoc` |

---

## 3. CRITICAL — Email Addresses (all `@cungcontuhoc.io.vn` or `@cungcontuhoc.vn`)

| # | File | Line(s) | Current Email | Suggested |
|---|------|---------|---------------|-----------|
| 50 | `src/lib/email/project-email-template-builder.ts` | 40 | `support@cungcontuhoc.io.vn` | `support@tinygeniushub.io.vn` |
| 51 | `src/app/(main)/contact/page.tsx` | 26 | `support@cungcontuhoc.io.vn` | |
| 52 | `src/app/(main)/terms/page.tsx` | 100 | `support@cungcontuhoc.io.vn` | |
| 53 | `src/app/(main)/page.tsx` | 94 | `support@cungcontuhoc.io.vn` | |
| 54 | `src/app/(main)/privacy/page.tsx` | 91 | `privacy@cungcontuhoc.io.vn` | `privacy@tinygeniushub.io.vn` |
| 55 | `src/app/(main)/refund-policy/page.tsx` | 41 | `billing@cungcontuhoc.io.vn` | `billing@tinygeniushub.io.vn` |
| 56 | `src/app/(main)/cookie-policy/page.tsx` | 82 | `privacy@cungcontuhoc.io.vn` | |
| 57 | `src/app/api/webhooks/package-subscription/route.ts` | 444 | `support@cungcontuhoc.io.vn` (fallback) | |
| 58 | `src/components/admin-login-form.tsx` | 69 | placeholder `admin@cungcontuhoc.vn` | `admin@tinygeniushub.vn` |
| 59 | `.env.example` | 70 | `SEED_PARENT_EMAIL=demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushub.vn` |
| 60 | `docker-compose.yml` | 75 | `SEED_PARENT_EMAIL: demo.parent@cungcontuhoc.vn` | |
| 61 | `.github/workflows/nightly-local-full.yml` | 48 | `E2E_ADMIN_EMAIL: demo.admin@cungcontuhoc.vn` | `demo.admin@tinygeniushub.vn` |

### Test email addresses (in test/e2e files):

| # | File | Current Email | Suggested |
|---|------|---------------|-----------|
| 62 | `tests/e2e/kid-course-lesson-flow.spec.ts` | `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushub.vn` |
| 63 | `tests/e2e/kid-garden-mobile-ui.spec.ts` | `demo.parent@cungcontuhoc.vn` | |
| 64 | `tests/e2e/lesson-player-video-layout-visual.spec.ts` | `demo.parent@cungcontuhoc.vn` | |
| 65 | `tests/e2e/kid-course-mobile-ui.spec.ts` | `demo.parent@cungcontuhoc.vn` | |
| 66 | `tests/e2e/admin-manual-reconcile.spec.ts` | `e2e.admin@cungcontuhoc.vn`, `*@cungcontuhoc.vn` | `@tinygeniushub.vn` |
| 67 | `tests/e2e/admin-footer-social-links.spec.ts` | `*@cungcontuhoc.vn` | `@tinygeniushub.vn` |
| 68 | `scripts/publish-and-enroll.mjs` | `demo.parent@cungcontuhoc.vn` | |
| 69 | `scripts/e2e-smoke.mjs` | `demo.parent@cungcontuhoc.io.vn` | `@tinygeniushub.io.vn` |
| 70 | `scripts/e2e-full-local.mjs` | `demo.admin@cungcontuhoc.io.vn` | |
| 71 | `scripts/e2e-security-abuse.mjs` | `demo.admin@cungcontuhoc.io.vn` | |
| 72 | `scripts/e2e-staging-providers.mjs` | `demo.admin@cungcontuhoc.io.vn` | |
| 73 | `scripts/e2e-auth-timing.mjs` | `demo.admin@cungcontuhoc.io.vn` | |
| 74 | `scripts/test-local-full.mjs` | `demo.admin@cungcontuhoc.io.vn` | |
| 75 | `scripts/nginx-ssl-setup.sh` | `admin@cungcontuhoc.io.vn` | |

---

## 4. CRITICAL — Social Media URLs (Facebook, YouTube, TikTok, Zalo)

| # | File | Current Value | Suggested |
|---|------|---------------|-----------|
| 76 | `src/modules/platform/footer-social-links.ts` | `facebook.com/cungcontuhoc`, `youtube.com/@cungcontuhoc`, `tiktok.com/@cungcontuhoc`, `zalo.me/cungcontuhoc` | Update or remove (need new handles) |
| 77 | `src/components/admin/site-settings/admin-social-links-editor.tsx` | Same placeholder URLs | |
| 78 | `src/app/(main)/page.tsx` | `facebook.com/cungcontuhoc`, `zalo.me/cungcontuhoc` (JSON-LD sameAs) | |
| 79 | `src/components/site-footer.tsx` | aria-labels reference `Cùng Con Tự Học` | `TinyGenius Hub` |
| 80 | `src/app/maintenance/page.tsx` | `href="https://zalo.me/cungcontuhoc"` | |
| 81 | `.playwright-mcp/page-*` yml files | Social URLs in snapshots (~5 files) | Can ignore or update |

---

## 5. HIGH — User-Facing Text ("Cùng Con Tự Học" as Brand Name)

All occurrences of `"Cùng Con Tự Học"` → `"TinyGenius Hub"` in UI, email, and copy.

### Homepage & Layout

| # | File | Lines | Context |
|---|------|-------|---------|
| 82 | `src/app/(main)/page.tsx` | 8,21,31,36,45,62,74,81,105 | Page title, OG title/image, JSON-LD name |
| 83 | `src/components/app-nav-client.tsx` | 201,206 | aria-label, logo alt text |
| 84 | `src/components/site-footer.tsx` | 53,76,90,104,125,179 | aria-labels, copyright text |
| 85 | `src/components/homepage/section-product-demo.tsx` | 90 | Mock email "From" field |
| 86 | `src/components/homepage/section-testimonials.tsx` | 13 | Testimonial text mentioning brand |
| 87 | `src/app/not-found.tsx` | 41 | 404 page text |
| 88 | `src/components/homepage/section-hero.tsx` | 46 | Hero section span text "Cung Con Tu Hoc" |

### Auth & Account

| 89 | `src/lib/auth/better-auth.ts` | 61,71 | Password reset email body & subject |
| 90 | `src/modules/identity/parent-email-verification-service.ts` | 82,91 | Email verification body & subject |
| 91 | `src/app/api/auth/verify-email/route.test.ts` | 26,40,49,57,68 | Test URLs all reference old domain |
| 92 | `src/components/admin-login-form.tsx` | 50 | Admin login page heading |
| 93 | `src/app/(admin-login)/admin/login/page.tsx` | 6 | Admin page title |

### Lifecycle & Marketing Email Copy

| 94 | `src/modules/platform/lifecycle-email-copy-builder.ts` | 34,38,47,66,87,106,129,150,173 | Welcome email, team signatures (8+ occurrences) |
| 95 | `src/modules/platform/lifecycle-email-service.ts` | 80 | Unsubscribe notice |
| 96 | `src/lib/email/project-email-template-builder.ts` | 23,161,360,378,382 | Email template footer, brand label, alt text |
| 97 | `src/lib/email/caregiver-invite-email.ts` | 27 | Invite email subject |
| 98 | `src/worker/jobs/verify-blog-comment-email.ts` | 19,22 | Blog comment verification email |

### Transactional Emails

| 99 | `src/app/api/webhooks/package-subscription/route.ts` | 387,392,456,461 | Payment success/failure emails |
| 100 | `src/app/api/contact/route.ts` | 31,53,63 | Contact form notification/confirmation |
| 101 | `src/app/api/waitlist/route.ts` | 39,44 | Waitlist confirmation email |
| 102 | `src/app/api/email/marketing/unsubscribe/route.ts` | 26 | Unsubscribe page heading |
| 103 | `src/app/api/blog/comments/unsubscribe/route.ts` | 24 | Comment unsubscribe page heading |
| 104 | `src/app/api/reports/[reportId]/pdf/route.ts` | 298 | PDF report brand header |
| 105 | `src/modules/reports/weekly-report-service.ts` | 189 | Report recommendation text |

### Page Titles & Meta Descriptions

| 106 | `src/app/(main)/try-garden/page.tsx` | 8,11,16 | Title, keywords, OG siteName |
| 107 | `src/app/(main)/courses/page.tsx` | 25 | `title: "Khóa học cho bé - Cùng Con Tự Học"` |
| 108 | `src/app/(main)/courses/[slug]/page.tsx` | 70,82 | Course list/detail titles |
| 109 | `src/app/(main)/pricing/page.tsx` | 14 | `"Bảng giá khóa học — Cùng Con Tự Học"` |
| 110 | `src/app/(main)/for-schools/page.tsx` | 6,11 | |
| 111 | `src/app/(main)/teacher/dashboard/page.tsx` | 8 | |
| 112 | `src/app/(main)/parent/billing/page.tsx` | 9 | |
| 113 | `src/app/(main)/gift-code/page.tsx` | 5,6 | |
| 114 | `src/app/(main)/referral/page.tsx` | 11 | |
| 115 | `src/app/(main)/waitlist/page.tsx` | 8 | |
| 116 | `src/app/(main)/about/page.tsx` | 7,17,43,67 | About page content |
| 117 | `src/app/(main)/contact/page.tsx` | 8 | |
| 118 | `src/app/(main)/privacy/page.tsx` | 6,15,91,92 | Privacy policy |
| 119 | `src/app/(main)/terms/page.tsx` | 6,15 | Terms page |
| 120 | `src/app/(main)/refund-policy/page.tsx` | 6 | |
| 121 | `src/app/(main)/cookie-policy/page.tsx` | 8,17 | |
| 122 | `src/app/(main)/feed.xml/route.ts` | 55,57 | RSS feed title/description |
| 123 | `src/app/(main)/blog/head.tsx` | 6 | RSS head |
| 124 | `src/app/(main)/blog/[slug]/opengraph-image.tsx` | 35-36,65 | OG image |
| 125 | `src/components/gift-code-form.tsx` | 49 | Activation success message |

### Share & Referral

| 126 | `src/modules/sharing/share-link-builder.ts` | 37 | Share message text |
| 127 | `src/components/try-garden/share-buttons.tsx` | 22 | Share URL default |

---

## 6. HIGH — Stripe Product Names ("Cung Con Tu Hoc")

| # | File | Line | Current Value | Suggested |
|---|------|------|---------------|-----------|
| 128 | `src/modules/billing/providers/stripe-provider.ts` | 17 | `"Cung Con Tu Hoc - Family Plus (Yearly)"` | `"TinyGenius Hub - Family Plus (Yearly)"` |
| 129 | `src/modules/billing/providers/stripe-provider.ts` | 20 | `"Cung Con Tu Hoc - Standard (Yearly)"` | `"TinyGenius Hub - Standard (Yearly)"` |

---

## 7. HIGH — Logo Files (Physical Files to Rename/Create)

| # | Current Path | Action |
|---|-------------|--------|
| 130 | `public/logo-cungcontuhoc-mascot-email.png` | Rename to `logo-tinygeniushub-mascot-email.png` |
| 131 | `public/logo-cungcontuhoc-icon.svg` | Rename to `logo-tinygeniushub-icon.svg` |
| 132 | `public/logo-cungcontuhoc-horizontal.png` | Rename to `logo-tinygeniushub-horizontal.png` |
| 133 | `public/logo-cungcontuhoc-horizontal.svg` | Rename to `logo-tinygeniushub-horizontal.svg` |
| 134 | `assets/logos/cungcontuhoc-2026-02-21/` (6 SVGs) | Rename directory + files (or just create new) |
| 135 | `public/logo.png` (referenced in JSON-LD) | Verify this exists / create new |
| 136 | Code references to `logo-cungcontuhoc-mascot-email.png` in `src/lib/email/project-email-template-builder.ts:323` and `src/lib/email/__tests__/project-email-template-builder.test.ts:25` | Update string references |

---

## 8. HIGH — Test Files (URL/Domain Hardcoding)

Test files contain hardcoded URLs with `cungcontuhoc.io.vn` — ~100+ line references across:

| # | File | Count | Notes |
|---|------|-------|-------|
| 137 | `src/lib/security/__tests__/csrf.test.ts` | ~8 | All Request URLs |
| 138 | `src/lib/email/__tests__/project-email-template-builder.test.ts` | ~12 | URLs, emails, image refs |
| 139 | `src/modules/sharing/__tests__/share-link-builder.test.ts` | 1 | Domain assertion |
| 140 | `src/modules/platform/lifecycle-email-service.test.ts` | ~4 | URL mocks |
| 141 | `src/app/api/email/marketing/unsubscribe/route.test.ts` | 1 | |
| 142 | `src/app/api/blog/newsletter/verify/route.test.ts` | 3 | |
| 143 | `src/app/api/blog/newsletter/unsubscribe/route.test.ts` | 3 | |
| 144 | `src/app/api/auth/verify-email/route.test.ts` | 6 | |
| 145 | `src/app/api/billing/webhooks/mock/route.test.ts` | 1 | |
| 146 | `src/app/api/admin/site-settings/footer-social-links/route.test.ts` | 4 | Social URLs |

---

## 9. MEDIUM — Infrastructure Scripts

All contain `cungcontuhoc` in paths, process names, DB names, domains:

| # | File | Notes |
|---|------|-------|
| 147 | `scripts/health-monitor.sh` | APP_URL, LOG_FILE, FAILURE_COUNT_FILE all reference `cungcontuhoc` |
| 148 | `scripts/migrate-server.sh` | DOMAIN, server paths |
| 149 | `scripts/nginx-ssl-setup.sh` | DOMAIN, EMAIL, nginx site name |
| 150 | `scripts/deploy-initial.sh` | `APP_DIR="/srv/cungcontuhoc"` |
| 151 | `scripts/deploy-do.sh` | APP_PATH, pm2 process names |
| 152 | `scripts/deploy-production.sh` | APP_DIR, REPO_URL, SSH key path |
| 153 | `scripts/app-setup.sh` | APP_DIR, REPO_URL, clone dir |
| 154 | `scripts/daily-backup.sh` | APP_DIR, LOG_FILE, BACKUP_FILE prefix `cungcontuhoc_*` |
| 155 | `scripts/abeka-import.sh` | APP_DIR, health check URLs |
| 156 | `scripts/verify-production.sh` | APP_PATH, pm2 process name |
| 157 | `scripts/redis-setup.sh` | Header comment `Cùng Con Tự Học` |
| 158 | `scripts/pgbouncer-setup.sh` | Header comment, DB_NAME `cungcontuhoc`, DB_USER `cungcontuhoc_app` |
| 159 | `scripts/postgres-setup.sh` | DB_NAME/DB_USER |
| 160 | `scripts/vps-setup.sh` | Header comment + echo |
| 161 | `scripts/production/production-gate-check.sh` | `WORKER_PROCESS_NAME: cungcontuhoc-worker` |
| 162 | `scripts/production/check-trial-videos-remote.sh` | Path, DB name |
| 163 | `scripts/deploy/remote-deploy.sh` | PM2 process names `cungcontuhoc-web/worker` |
| 164 | `scripts/deploy/production-email-verify-hotfix.sh` | APP_DIR, BASE_URL, process names |
| 165 | `scripts/import-abeka-videos.ts` | Data path `/var/www/cungcontuhoc` |
| 166 | `scripts/ops/create-postgres-backup.mjs` | Returns DB name `cungcontuhoc` |
| 167 | `scripts/ops/restore-postgres-backup.mjs` | Returns DB name `cungcontuhoc` |

---

## 10. MEDIUM — Environment Config Files

| # | File | Content |
|---|------|---------|
| 168 | `.env.example` | DB name, backup DB, service name, seed email (see critical section for details) |
| 169 | `docker-compose.yml` | DB name, DB URLs, seed email (see critical section) |

*(Many .env.example files in `.claude/skills/` and `.opencode/skills/` dirs exist but those are skill templates — low priority, unlikely to contain project-specific branding — verified none do.)*

---

## 11. LOW — Documentation Files (docs/)

**~441 matches** across documentation. Key files (not exhaustive):

| # | File | Notes |
|---|------|-------|
| 170 | `docs/README.md` | Title |
| 171 | `docs/handover/handover-master-agent-ready.md` | Product name references |
| 172 | `docs/project-roadmap.md` | Domain reference |
| 173 | `docs/project-changelog.md` | PM2 process name references |
| 174 | `docs/DEPLOYMENT-CHECKLIST.md` | Footer "Generated for Cung Con Tu Hoc" |
| 175 | `docs/SERVER-DEPLOYMENT-PLAN.md` | Title reference |
| 176 | `docs/deployment/VPS-DEPLOYMENT-GUIDE.md` | Echo line |
| 177 | `docs/interactive-lesson-production-workflow.md` | Server path, pm2 names |
| 178 | `docs/implementation-plan.md` | Plan file references with `cungcontuhoc-mvp-rebuild` |
| 179 | `docs/design/curriculum-ui-ux-design.md` | Project name |
| 180 | `docs/review/docs-accuracy-report.md` | Project name, paths |
| 181 | `docs/review/plan-implementation-gap-analysis.md` | Project name |
| 182 | `docs/research/monetization-trends-2025-report.md` | Mentions |
| 183 | `docs/research/vietnam-market-deep-dive-2025.md` | ClaudeKit reference |
| 184 | `docs/business/profitable-directions-recommendation.md` | Platform name |
| 185 | `docs/business/asset-inventory-for-monetization.md` | Project name |
| 186 | `docs/business/competitor-monetization-analysis.md` | Prepared for |
| 187 | `docs/business/monetization-strategy-vietnam-playbook.md` | Product line |
| 188 | `docs/marketing/*` (~10 files) | All marketing docs heavily branded |
| 189 | `docs/handover/packages/2026-03-19-parent-course-clarity-package/*` | Windows paths with `cungcontuhoc` |

---

## 12. LOW — Plans Archive (`plans/_archive/`, `plans/reports/`)

~60+ files with historical references. These are archived plans from past phases. Updating them is optional — the filenames themselves contain `cungcontuhoc` and could remain as-is.

| # | Notable Plan/Report | Notes |
|---|---------------------|-------|
| 190 | `plans/_archive/2026-02-20-cungcontuhoc-mvp-rebuild/plan.md` | Plan title |
| 191 | `plans/_archive/260221-1543-marketing-homepage-redesign/plan.md` | Plan title |
| 192 | `plans/_archive/260225-0059-marketing-strategy-gtm/` | Multiple phase files |
| 193 | `plans/_archive/260225-adaptive-learning-engine/plan.md` | Description |
| 194 | `plans/_archive/260319-course-pages-redesign-seo-ux/` | Phase files |
| 195 | `plans/_archive/QA-REPORT.md` | Title |
| 196 | `plans/_archive/CODEX-*` | Description references |
| 197 | `plans/260323-2227-blog-system-completion/` | Phase files |
| 198 | `plans/20260331-clarity-integration/` | Plan + report |
| 199 | `plans/reports/researcher-*` | Several research reports |

---

## 13. LOW — Assets

| # | Path | Action |
|---|------|--------|
| 200 | `assets/logos/cungcontuhoc-2026-02-21/` (directory) | Archive or rename directory |
| 201 | 6 SVG logo files in that dir | Each contains "Cung Con Tu Hoc" text in SVG title + content |

---

## Summary Statistics

| Category | Occurrences | Priority |
|----------|------------|----------|
| Infrastructure/Config/Deploy | 23 | **CRITICAL** |
| Domain URLs in source | 27+ | **CRITICAL** |
| Email addresses | 26+ | **CRITICAL** |
| Social media handles | 6 files | **CRITICAL** |
| User-facing text (UI, email, copy) | 44+ | **HIGH** |
| Stripe product names | 2 | **HIGH** |
| Logo files (rename) | 10+ files | **HIGH** |
| Test files (hardcoded URLs) | 10 files, ~100 lines | **HIGH** |
| Infrastructure scripts | 21 | **MEDIUM** |
| Documentation | ~100+ files | **LOW** |
| Plans/reports archive | ~60+ files | **LOW** |
| **TOTAL estimated** | **~400+ files touched** | |

---

## Unresolved Questions

1. **New domain:** What is the definitive new domain? (assumed `tinygeniushub.io.vn` above)
2. **New social media handles:** What are the new Facebook/YouTube/TikTok/Zalo handles?
3. **New email domain:** Is `@tinygeniushub.io.vn` correct? Or separate `tinygeniushub.vn`?
4. **GitHub repo:** Will the repo be renamed? (affects `package.json`, deploy scripts)
5. **Database migration:** Should existing DB be renamed or use new DB with migration? (affects `DATABASE_URL`, backup scripts, Docker configs)
6. **Server paths:** Is `/var/www/tinygeniushub` the new target directory on production?
7. **Stripe product names:** Already in production? If so, what's the plan for updating them in Stripe dashboard?
8. **SEO risk:** Changing all URLs requires 301 redirects from old domain. Has a redirect plan been prepared?

**Status:** DONE  
**Summary:** Comprehensive scout found ~1,300+ individual text references across ~400+ files requiring changes from "Cùng Con Tự Học"/"cungcontuhoc" to "TinyGenius Hub"/"tinygeniushub". 23 critical infrastructure items must change for deploy to work. ~44 high-priority user-facing text items. ~100+ test file references. ~100+ low-priority doc references.
