TASK: Blog System — Phase 1: Database Schema & Migration

STATUS: Schema already updated (prisma/schema.prisma has blog models added).

YOUR JOB:
1. Run the Prisma migration:
   pnpm db:migrate --name add-blog-system

2. If migration fails with "shadow database" or interactive prompt issue, use:
   npx prisma migrate dev --name add-blog-system --skip-seed

3. After successful migration, generate the client:
   pnpm db:generate

4. Verify type-check passes:
   pnpm type-check

5. If type-check fails, fix any TypeScript errors (typically missing imports or type mismatches in existing code that references Prisma types).

WHAT WAS ADDED TO prisma/schema.prisma:
- 3 new enums: BlogPostStatus, BlogPostType, AgeGroup
- 8 new models: BlogCategory, BlogTag, BlogAuthor, BlogPost, BlogPostTag, BlogPostRelation, BlogNewsletterSubscriber, BlogReadHistory

Do NOT modify any existing models. Only run the migration.
