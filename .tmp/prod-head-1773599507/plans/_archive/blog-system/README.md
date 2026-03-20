# Blog System — Codex Execution Plan

## Status
- [x] Schema updated (prisma/schema.prisma)  
- [ ] Phase 1: Migration
- [ ] Phase 2: Module
- [ ] Phase 3: API Routes
- [ ] Phase 4: Frontend
- [ ] Phase 5: Admin CMS
- [ ] Phase 6: Seed + Cron
- [ ] Phase 7: SEO + Polish

## Execution Order

Feed each file to Codex in order. After each phase, run `pnpm type-check` before proceeding.

| Order | File | Task |
|---|---|---|
| 1 | [BLOG-1-schema-migration.md](./BLOG-1-schema-migration.md) | Run migration + generate Prisma client |
| 2 | [BLOG-2-module.md](./BLOG-2-module.md) | Blog service, repository, types, SEO, newsletter |
| 3 | [BLOG-3-api-routes.md](./BLOG-3-api-routes.md) | 13 API endpoints (public + admin) |
| 4 | [BLOG-4-frontend.md](./BLOG-4-frontend.md) | Blog pages + 5 components |
| 5 | [BLOG-5-admin-cms.md](./BLOG-5-admin-cms.md) | Admin blog dashboard, CRUD, newsletter management |
| 6 | [BLOG-6-seed-cron.md](./BLOG-6-seed-cron.md) | Seed 8 categories, sample posts, weekly cron |
| 7 | [BLOG-7-seo-polish.md](./BLOG-7-seo-polish.md) | Sitemap, robots.txt, OG image, nav links, prose styles |

## Key Design Decisions

- **Architecture**: Modular monolith at `src/modules/blog/`
- **Rendering**: ISR (revalidate=600 on list, 3600 on detail)
- **Zero breaking changes**: All existing models untouched
- **DB**: PostgreSQL via Prisma (8 new models, 3 new enums)
- **Content**: Vietnamese parents & children education focus
- **Newsletter**: BullMQ job queue + Resend email

## Migration Command
```bash
pnpm db:migrate --name add-blog-system
```
