# CODEX TASK: Implement Full Blog System for CungConTuHoc

## Context
You are implementing a complete blog system for an educational platform targeting Vietnamese parents teaching children at home. The project uses Next.js 16 + React 19 + TypeScript, Prisma/PostgreSQL, Redis/BullMQ, Resend email, and Cloudflare R2 storage.

**Study these files before starting — mandatory:**
- `README.md` — project overview and existing features
- `prisma/schema.prisma` — current DB schema (you will add blog models here)
- `src/modules/billing/` or `src/modules/reports/` — follow the same service/repository pattern
- `src/app/api/reports/` — follow the same API route pattern
- `src/app/admin/` — follow the same admin page/auth pattern
- `src/worker/index.ts` — BullMQ worker and how to enqueue jobs
- `src/app/globals.css` — design tokens, fonts, color variables
- `vercel.json` — cron configuration pattern

---

## PHASE 1 — Database Schema & Migration

The blog models are ALREADY ADDED to `prisma/schema.prisma` (3 enums + 8 models at the bottom). Your job is only to:

1. Run the migration:
   ```
   pnpm db:migrate --name add-blog-system
   ```
   If asked about shadow database interactivity, use: `npx prisma migrate dev --name add-blog-system --skip-seed`

2. Generate Prisma client:
   ```
   pnpm db:generate
   ```

3. Verify:
   ```
   pnpm type-check
   ```
   Fix any errors before continuing.

---

## PHASE 2 — Blog Module (`src/modules/blog/`)

Install dependencies first:
```
pnpm add remark remark-html remark-gfm reading-time slugify
```

### `src/modules/blog/blog-types.ts`
Define all TypeScript types. Do NOT import from Prisma — define them independently as string unions and interfaces:

```typescript
export type BlogPostStatus = 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
export type BlogPostType = 'ARTICLE' | 'TIP' | 'NEWS' | 'GUIDE' | 'RESEARCH' | 'STORY'
export type AgeGroup = 'UNDER_3' | 'AGE_3_5' | 'AGE_6_8' | 'AGE_9_12' | 'ALL_AGES'

export interface BlogAuthorSummary { displayName: string; avatarUrl: string | null; slug: string; role: string }
export interface BlogCategorySummary { nameVi: string; slug: string; emoji: string | null; color: string | null }
export interface BlogTagSummary { slug: string; nameVi: string }

export interface BlogPostCardDTO {
  id: string; slug: string; type: BlogPostType; titleVi: string; excerptVi: string
  coverImageUrl: string | null; publishedAt: Date | null; readingTimeMin: number
  viewCount: number; likeCount: number; ageGroup: AgeGroup
  author: BlogAuthorSummary; category: BlogCategorySummary; tags: BlogTagSummary[]
}

export interface BlogPostFullDTO extends BlogPostCardDTO {
  contentHtml: string; metaTitleVi: string | null; metaDescVi: string | null
  ogImageUrl: string | null; structuredData: unknown | null
  isFeatured: boolean; isPinned: boolean; coAuthorIds: string[]
  relatedPosts: BlogPostCardDTO[]
}

export interface BlogListParams {
  page?: number; limit?: number; category?: string; tag?: string
  author?: string; ageGroup?: AgeGroup; type?: BlogPostType
  featured?: boolean; sort?: 'latest' | 'popular' | 'trending'
}

export interface BlogListResult {
  posts: BlogPostCardDTO[]; total: number; totalPages: number; page: number
}

export interface CreateBlogPostInput {
  slug: string; type: BlogPostType; titleVi: string; titleEn?: string
  excerptVi: string; contentMarkdown: string; categoryId: string; authorId: string
  ageGroup: AgeGroup; tagIds: string[]; coverImageUrl?: string
  metaTitleVi?: string; metaDescVi?: string; scheduledAt?: Date; status: BlogPostStatus
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> { id: string }
```

### `src/modules/blog/blog-markdown.ts`
Use `remark` + `remark-gfm` + `remark-html`. Export:
- `renderMarkdown(markdown: string): Promise<string>` — returns HTML
- `calculateReadingTime(text: string): number` — word count ÷ 200, min 1
- `extractToc(markdown: string): { id: string; text: string; level: number }[]` — parse `## Heading` lines, slugify id

### `src/modules/blog/blog-repository.ts`
Import prisma from the project's prisma client location (check `src/lib/prisma.ts` or `src/lib/db.ts`).

Helper to map Prisma result to BlogPostCardDTO (inline helper, not exported).

Implement and export:
- `findPostBySlug(slug: string): Promise<BlogPostFullDTO | null>` — include author, category, tags.tag, relatedPosts.relatedPost (with author+category). status=PUBLISHED only.
- `findPosts(params: BlogListParams): Promise<{ posts: BlogPostCardDTO[]; total: number }>` — status=PUBLISHED, apply all filters, sort, paginate. Use `prisma.$transaction([findMany, count])`.
- `findFeaturedPosts(limit: number): Promise<BlogPostCardDTO[]>` — isFeatured=true, status=PUBLISHED, featuredUntil IS NULL OR > now().
- `findCategories(): Promise<BlogCategory[]>` — active=true, orderBy orderNo asc.
- `findTags(): Promise<BlogTag[]>` — all tags.
- `findAuthors(): Promise<BlogAuthor[]>` — active=true.
- `incrementViewCount(postId: string): Promise<void>` — prisma.blogPost.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } })
- `incrementLikeCount(postId: string): Promise<number>` — increment, return new likeCount.
- `searchPosts(query: string, limit: number): Promise<BlogPostCardDTO[]>` — status=PUBLISHED, OR titleVi contains / excerptVi contains (insensitive).
- `createPost(input: CreateBlogPostInput): Promise<BlogPostFullDTO>` — compute readingTimeMin from calculateReadingTime(contentMarkdown). Connect tags via `{ create: tagIds.map(tagId => ({ tag: { connect: { id: tagId } } })) }`.
- `updatePost(input: UpdateBlogPostInput): Promise<BlogPostFullDTO>` — update post, sync tags (deleteMany old + createMany new if tagIds provided).

### `src/modules/blog/blog-service.ts`
Import blog-repository + blog-markdown. Export a `blogService` object (or individual functions):
- `getPostBySlug(slug)` — calls repo, if contentHtml is empty renders markdown to set it.
- `listPosts(params)` — enforces defaults (page=1, limit=12), max limit=50. Returns BlogListResult with totalPages.
- `getFeaturedPosts()` — calls findFeaturedPosts(3).
- `searchPosts(query)` — validates 2–100 chars, calls repo.searchPosts(query, 20).
- `createPost(input)` — validates slug uniqueness, calls repo.createPost.
- `publishPost(id)` — prisma.blogPost.update({ data: { status: 'PUBLISHED', publishedAt: new Date() } }).

### `src/modules/blog/blog-seo.ts`
Import `{ Metadata }` from `'next'`. Export:
- `generateBlogPostMetadata(post: BlogPostFullDTO, siteUrl: string): Metadata`
- `generateBlogPostJsonLd(post: BlogPostFullDTO, siteUrl: string): string` — JSON.stringify schema.org Article object
- `generateBlogListMetadata(): Metadata`

### `src/modules/blog/newsletter-service.ts`
Import prisma, `{ createId }` from `'@paralleldrive/cuid2'` or use `cuid()`. Export `newsletterService`:
- `subscribe(email: string, opts?: { nameVi?: string }): Promise<{ token: string }>` — upsert subscriber (verified=false, generate verifyToken).
- `verifySubscription(token: string): Promise<boolean>` — find by verifyToken, set verified=true, verifyToken=null.
- `unsubscribe(token: string): Promise<void>` — find by unsubToken, set unsubscribedAt=new Date().
- `getActiveSubscribers(): Promise<{ id: string; email: string; nameVi: string | null }[]>` — verified=true AND unsubscribedAt IS NULL.

**After phase 2:** `pnpm type-check` — fix all errors.

---

## PHASE 3 — API Routes

Follow the exact pattern of existing API routes (check `src/app/api/reports/` for style).

### Public routes (no auth):

**`src/app/api/blog/posts/route.ts`** — GET
- Parse searchParams: page(1), limit(12 max 50), category, tag, author, ageGroup, type, featured, sort
- Return `NextResponse.json({ posts, pagination: { page, limit, total, totalPages } })`
- Header: `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=3600`

**`src/app/api/blog/posts/[slug]/route.ts`** — GET
- `blogService.getPostBySlug(params.slug)` → 404 if null
- Header: `Cache-Control: public, max-age=600, s-maxage=600, stale-while-revalidate=7200`

**`src/app/api/blog/posts/[slug]/like/route.ts`** — POST
- Find post slug → get id → `blogRepository.incrementLikeCount(post.id)` → return `{ likeCount }`

**`src/app/api/blog/posts/[slug]/view/route.ts`** — POST
- Return `{ ok: true }` immediately (don't await anything)
- Fire-and-forget: `prisma.blogReadHistory.create(...)` + `blogRepository.incrementViewCount(post.id)`

**`src/app/api/blog/featured/route.ts`** — GET
- `blogService.getFeaturedPosts()` → `{ posts }`, Cache-Control max-age=600

**`src/app/api/blog/categories/route.ts`** — GET
- `blogRepository.findCategories()` → `{ categories }`, Cache-Control max-age=3600

**`src/app/api/blog/tags/route.ts`** — GET
- `blogRepository.findTags()` → `{ tags }`, Cache-Control max-age=3600

**`src/app/api/blog/search/route.ts`** — GET
- Get `q` from searchParams. If `!q || q.length < 2` → 400 `{ error: 'Toi thieu 2 ky tu' }`
- `blogService.searchPosts(q)` → return json, no cache header

**`src/app/api/blog/newsletter/subscribe/route.ts`** — POST
- Zod validate: `{ email: z.string().email(), nameVi: z.string().optional() }`
- `newsletterService.subscribe(email, { nameVi })`
- Return `{ message: 'Vui long kiem tra email de xac nhan' }`

**`src/app/api/blog/newsletter/verify/route.ts`** — GET
- Get `token` → `newsletterService.verifySubscription(token)` → redirect to `/blog?subscribed=true`

**`src/app/api/blog/newsletter/unsubscribe/route.ts`** — GET
- Get `token` → `newsletterService.unsubscribe(token)` → redirect to `/blog?unsubscribed=true`

### Admin routes (check admin auth — copy pattern from existing `/api/admin/` routes):

**`src/app/api/admin/blog/posts/route.ts`** — GET (list all statuses) + POST (create)
- POST: Zod validate CreateBlogPostInput → `blogService.createPost(input)` → `{ post }`

**`src/app/api/admin/blog/posts/[id]/route.ts`** — PATCH (update)
- Zod validate UpdateBlogPostInput → `blogService.updatePost({ ...input, id: params.id })` → `{ post }`

**`src/app/api/admin/blog/posts/[id]/publish/route.ts`** — POST
- `blogService.publishPost(params.id)` → `{ success: true, publishedAt: new Date() }`

**`src/app/api/admin/blog/categories/route.ts`** — GET + POST
**`src/app/api/admin/blog/authors/route.ts`** — GET + POST
**`src/app/api/admin/blog/newsletter/subscribers/route.ts`** — GET (all verified subscribers)

**After phase 3:** `pnpm type-check && pnpm lint` — fix all errors.

---

## PHASE 4 — Frontend Pages & Components

Study `src/app/globals.css` for design system. Project uses Tailwind CSS v4. Use `lucide-react` for icons. Use `next/image` for all images with proper `sizes` prop.

### Components (`src/components/blog/`)

**`blog-card.tsx`** — Server component
- Props: `{ post: BlogPostCardDTO }`
- `<article>` with CSS hover lift (translateY + shadow transition via Tailwind `hover:` or inline style)
- Wrapped in `<Link href={'/blog/' + post.slug}>`
- `next/image` for cover, aspect-ratio 16/9, `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`
- Category badge (emoji + nameVi, bg=category.color, white text, rounded-full px-2 py-0.5)
- `<h2>` title, `line-clamp-2`
- `<p>` excerpt, `line-clamp-3`
- Author row: small avatar circle (or initials fallback), author displayName, `·` separator, `{readingTimeMin} phut`, formatted date
- Stats: Eye icon + viewCount, Heart icon + likeCount

**`blog-card-featured.tsx`** — Server component
- Props: `{ post: BlogPostCardDTO }`
- Large hero with `next/image` in fill mode (parent `position: relative; aspect-ratio: 16/9; overflow: hidden`)
- Dark gradient overlay via Tailwind `before:` or a `<div>` absolute overlay
- Text (white): category pill, large `<h2>` title, author + date, stats
- All inside `<Link href={'/blog/' + post.slug}>`

**`blog-newsletter-widget.tsx`** — `'use client'`
- State: `email`, `loading`, `success`
- On submit: `fetch('/api/blog/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }), headers: { 'Content-Type': 'application/json' } })`
- Success state: show checkmark + "Cam on! Hay kiem tra email cua ban."
- Design: card with gradient background (use project's primary color), headline, label, input + button, small privacy note

**`blog-toc.tsx`** — `'use client'`
- Props: `{ headings: { id: string; text: string; level: number }[] }`
- `IntersectionObserver` to highlight active section
- Click → `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`
- Active heading: accent color text + left border indicator

**`blog-share.tsx`** — `'use client'`
- Props: `{ url: string; title: string }`
- 3 buttons: Facebook share, Twitter/X share, Copy link (with "Da sao chep!" 2s feedback)
- Copy: `navigator.clipboard.writeText(url)`

### Pages

**`src/app/(main)/blog/page.tsx`**
```typescript
export const revalidate = 600
```
Fetch in parallel:
1. `blogService.getFeaturedPosts()`
2. `blogService.listPosts({ page: 1, limit: 8 })`
3. `blogRepository.findCategories()`

Layout:
1. `<BlogCardFeatured post={featured[0]} />` — hero section
2. Category pills row: horizontal scroll, each pill = `<Link href={'/blog/category/' + cat.slug}>` with emoji + nameVi, colored bg
3. Heading "Bai Viet Moi Nhat"
4. Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` with 8 BlogCards
5. `<BlogNewsletterWidget />` — full-width CTA section

Handle: if `searchParams.subscribed === 'true'` show success toast/banner.

**`src/app/(main)/blog/[slug]/page.tsx`**
```typescript
export const revalidate = 3600
export async function generateStaticParams() {
  // fetch 50 most recent published slugs from DB
}
```
- `notFound()` if post is null
- Inject JSON-LD: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: blogSeo.generateBlogPostJsonLd(post, siteUrl) }} />`
- Layout: `grid md:grid-cols-[2fr_1fr] gap-8`
- Article column: breadcrumb, `<Image priority />` cover, `<h1>` title, category badge, author info + date + reading time, `<div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />`, `<BlogShare />`
- Sidebar: `<BlogToc headings={extractToc(post.contentMarkdown)} />`, `<BlogNewsletterWidget />`
- Below grid: "Bai Viet Lien Quan" + 3 BlogCards from `post.relatedPosts`

**`src/app/(main)/blog/[slug]/opengraph-image.tsx`**
```typescript
import { ImageResponse } from 'next/og'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// gradient bg, post.titleVi large white text, author + brand
```

**`src/app/(main)/blog/category/[slug]/page.tsx`**
```typescript
export const revalidate = 1800
```
- Fetch category + paginated posts for that category
- Category header: emoji large + nameVi + description
- Grid of BlogCards

**`src/app/(main)/blog/search/page.tsx`** — `'use client'`
- Controlled `<input>` with `useEffect` + 300ms debounce → `fetch('/api/blog/search?q=' + query)`
- Show BlogCard grid on results, skeleton on loading, empty state on no results

**After phase 4:** `pnpm type-check`

---

## PHASE 5 — Admin CMS Pages

Find and follow the **exact admin auth pattern** used in existing admin pages. All admin pages must check for admin authentication.

**`src/app/admin/blog/page.tsx`** — Dashboard
- Fetch in parallel: PUBLISHED count, DRAFT count, verified subscriber count, top viewed post
- 4 stats cards + quick-action links + most-viewed post card

**`src/app/admin/blog/posts/page.tsx`** — Post List
- Table: thumbnail, title (link to edit), status badge (color-coded), category, author, views, publishedAt, actions
- Filter bar: status select + search input (use searchParams)
- Pagination: Prev/Next using searchParams

**`src/app/admin/blog/posts/new/page.tsx`** — Create Form — `'use client'`
- Sections: Basic Info (titleVi → auto-slug onBlur, excerptVi 160-char, type, ageGroup), Taxonomy (categoryId, authorId, tags comma-separated), Content (contentMarkdown textarea 400px min), SEO (metaTitleVi, metaDescVi), Publishing (status select + scheduledAt datetime if SCHEDULED)
- Submit: POST to `/api/admin/blog/posts` → redirect to `/admin/blog/posts`

**`src/app/admin/blog/posts/[id]/edit/page.tsx`** — Edit Form
- Server: fetch post by id from DB, pass as defaultValues to same form
- Include "Publish Now" button → POST to `/api/admin/blog/posts/[id]/publish`

**`src/app/admin/blog/categories/page.tsx`** — Category management
- Table + create form (slug, nameVi, emoji, color, description)

**`src/app/admin/blog/authors/page.tsx`** — Author management
- Table + create form (displayName, role, email, bio)

**`src/app/admin/blog/newsletter/page.tsx`** — Newsletter subscribers
- Stats + table (email, nameVi, verified, subscribedAt)
- "Export CSV" button: client-side, fetch all subscribers → Blob + download

**Add blog to admin navigation:**
Find the admin sidebar/nav (check `src/app/admin/layout.tsx` or `src/components/admin/`). Add:
- `/admin/blog` — "Blog" with PenSquare icon (lucide-react)
- `/admin/blog/posts` — "Bai viet"
- `/admin/blog/categories` — "Danh muc"
- `/admin/blog/newsletter` — "Newsletter"

**After phase 5:** `pnpm type-check`

---

## PHASE 6 — Seed Data & Cron

### Seed (`prisma/seed.ts` or main seed file)
Add `seedBlog()` function. Call it from main seed. Use upsert for idempotency.

**8 categories to seed:**
```
{ slug: 'phat-trien-tre',          nameVi: 'Phat Trien Tre Em',        emoji: '🌱', color: '#10b981', orderNo: 1 }
{ slug: 'phuong-phap-hoc',         nameVi: 'Phuong Phap Hoc Tap',      emoji: '📚', color: '#3b82f6', orderNo: 2 }
{ slug: 'tieng-anh-som',           nameVi: 'Tieng Anh Cho Tre',        emoji: '🌏', color: '#8b5cf6', orderNo: 3 }
{ slug: 'toan-tu-duy',             nameVi: 'Toan Tu Duy',              emoji: '🔢', color: '#f59e0b', orderNo: 4 }
{ slug: 'dinh-huong-phu-huynh',    nameVi: 'Huong Dan Phu Huynh',      emoji: '👪', color: '#ef4444', orderNo: 5 }
{ slug: 'cong-nghe-giao-duc',      nameVi: 'Cong Nghe Giao Duc',       emoji: '💻', color: '#06b6d4', orderNo: 6 }
{ slug: 'suc-khoe-tam-than',       nameVi: 'Suc Khoe va Can Bang',     emoji: '💙', color: '#ec4899', orderNo: 7 }
{ slug: 'thanh-tich-hoc-tap',      nameVi: 'Cau Chuyen Thanh Cong',   emoji: '⭐', color: '#84cc16', orderNo: 8 }
```

**2 authors + 10 tags** (slugs: tieng-anh, toan-hoc, phat-trien-ngon-ngu, ky-nang-song, am-nhac, doc-sach, nuoi-day-con, stem, hoc-qua-choi, tu-duy-sang-tao)

**3 sample blog posts:** (PUBLISHED, 1 featured) — basic English content in contentMarkdown is fine, covering tieng-anh-som, toan-tu-duy, phuong-phap-hoc categories.

Run: `pnpm db:seed`

### Weekly Newsletter Cron (`src/app/api/cron/newsletter-weekly/route.ts`)
1. Verify CRON_SECRET (copy pattern from existing cron routes)
2. Fetch posts published in last 7 days (max 10)
3. If no posts → return `{ dispatched: 0 }`
4. Get active subscribers via `newsletterService.getActiveSubscribers()`
5. Enqueue a BullMQ job per subscriber (study `src/worker/` for how to enqueue — copy existing pattern)
6. Return `{ dispatched: subscribers.length, posts: posts.length }`

**`vercel.json`** — add to crons array:
```json
{ "path": "/api/cron/newsletter-weekly", "schedule": "0 4 * * 1" }
```

**After phase 6:** `pnpm db:seed` ✓, `pnpm type-check` ✓

---

## PHASE 7 — SEO, Sitemap & Polish

### `src/app/sitemap.ts` (create or update)
Add blog posts + categories. Wrap in try/catch to avoid build failures.
- Blog homepage: priority 0.9, daily
- Each post: priority 0.8, weekly  
- Each category: priority 0.7, weekly

### `src/app/robots.ts` (create if not exists)
Allow `/`, `/blog`, `/blog/*`. Disallow `/api/`, `/admin/`.

### Public Navbar — Add Blog Link
Find main navbar component. Add `<Link href="/blog">Blog</Link>` navigation item.

### `src/app/globals.css` — Prose Styles
Add `.prose` styles if not already present:
```css
.prose h1, .prose h2, .prose h3 { font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.3 }
.prose h1 { font-size: 2rem } .prose h2 { font-size: 1.5rem } .prose h3 { font-size: 1.25rem }
.prose p { margin-bottom: 1rem; line-height: 1.8 }
.prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1rem }
.prose li { margin-bottom: 0.5rem }
.prose code { background: rgba(0,0,0,0.06); padding: 0.15rem 0.35rem; border-radius: 3px; font-size: 0.875em }
.prose pre { background: #1e293b; color: #e2e8f0; padding: 1.25rem; border-radius: 8px; overflow-x: auto; margin-bottom: 1rem }
.prose pre code { background: none; padding: 0 }
.prose blockquote { border-left: 4px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; margin: 1.5rem 0 }
.prose a { color: #3b82f6; text-decoration: underline }
.prose img { max-width: 100%; border-radius: 8px; margin: 1rem auto; display: block }
.prose table { width: 100%; border-collapse: collapse; margin-bottom: 1rem }
.prose th, .prose td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left }
.prose th { background: #f8fafc; font-weight: 600 }
```

### `next.config.ts` — Image Remotepatterns
Add R2/CDN hostnames to `images.remotePatterns`:
```js
{ protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
{ protocol: 'https', hostname: '*.r2.dev' },
```

---

## FINAL VERIFICATION (mandatory)

Run all quality checks:
```bash
pnpm type-check
pnpm lint
```

Then manually verify these URLs in the browser:
```
http://localhost:3000/blog                                   → Blog homepage
http://localhost:3000/blog/5-meo-hoc-tieng-anh-tai-nha      → Article page with TOC + share
http://localhost:3000/blog/category/tieng-anh-som            → Category page
http://localhost:3000/blog/search                            → Search page
http://localhost:3000/sitemap.xml                            → Shows blog URLs
http://localhost:3000/robots.txt                             → Correct rules
http://localhost:3000/admin/blog                             → Admin dashboard
http://localhost:3000/admin/blog/posts                       → Post list with table
http://localhost:3000/admin/blog/posts/new                   → Create form
http://localhost:3000/api/blog/posts                         → JSON response
http://localhost:3000/api/blog/featured                      → JSON featured posts
http://localhost:3000/api/blog/categories                    → JSON categories
```

**All must return 200.** Fix any errors found.

---

## CRITICAL RULES
1. **Do NOT modify existing Prisma models** — only add new ones (already done).
2. **Zero breaking changes** — all existing functionality must continue to work.
3. **Pass type-check after EACH phase** before starting the next.
4. **Follow existing code patterns** — study the existing modules before writing new code.
5. **Use 'use client' ONLY when necessary** — default to Server Components.
6. **All images via next/image** with proper `sizes` and `alt` props.
7. **All admin pages must have admin auth** following the existing pattern.
