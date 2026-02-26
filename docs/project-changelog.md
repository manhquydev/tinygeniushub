# Project Changelog

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
