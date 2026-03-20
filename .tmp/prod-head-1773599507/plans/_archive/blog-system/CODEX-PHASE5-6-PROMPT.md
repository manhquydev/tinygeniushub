# CODEX TASK: Blog System Phase 5 & 6 — Admin CMS + Seed + Cron

## Context
The blog system Phase 1-4 and Phase 7 are already implemented and passing `pnpm type-check`.
Your job is to implement Phase 5 (Admin CMS) and Phase 6 (Seed + Cron).
Zero breaking changes to existing functionality.

**Study first (mandatory):**
- `src/app/admin/` — existing admin pages, layout, auth pattern
- `src/app/admin/layout.tsx` — admin sidebar/nav structure (you will add blog nav items here)
- `src/modules/blog/blog-repository.ts` — functions available (findCategories, findAuthors, etc.)
- `src/modules/blog/blog-service.ts` — service functions
- `src/modules/blog/newsletter-service.ts` — subscriber functions
- `src/worker/index.ts` — BullMQ queue/job enqueue pattern
- `prisma/seed.ts` — existing seed pattern to follow
- `vercel.json` — cron array to update

---

## PHASE 5 — Admin CMS Pages

Find and use the **exact admin auth pattern** from existing admin pages. All pages require admin authentication.

### `src/app/admin/blog/page.tsx` — Blog Admin Dashboard
Server component with admin auth check.

Fetch in parallel using `Promise.all`:
1. `prisma.blogPost.count({ where: { status: 'PUBLISHED' } })`
2. `prisma.blogPost.count({ where: { status: 'DRAFT' } })`
3. `prisma.blogNewsletterSubscriber.count({ where: { verified: true, unsubscribedAt: null } })`
4. `prisma.blogPost.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { viewCount: 'desc' }, include: { author: true, category: true } })`

Render:
- Page heading "Blog Admin"
- 4 stat cards: Published, Drafts, Subscribers, (total viewCount via aggregate sum)
- Quick action links: "Viet bai moi" → `/admin/blog/posts/new`, "Quan ly bai viet" → `/admin/blog/posts`
- If topPost exists: "Bai viet xem nhieu nhat" card with title + viewCount
- Link to public blog: `/blog`

### `src/app/admin/blog/posts/page.tsx` — Post List
Server component with admin auth.
Read `searchParams`: `page` (default 1), `status` (optional filter), `q` (title search).

Fetch:
```typescript
const where = {
  ...(status ? { status: status as BlogPostStatus } : {}),
  ...(q ? { titleVi: { contains: q, mode: 'insensitive' as const } } : {}),
}
const [posts, total] = await prisma.$transaction([
  prisma.blogPost.findMany({ where, include: { author: true, category: true }, orderBy: { createdAt: 'desc' }, skip: (page-1)*20, take: 20 }),
  prisma.blogPost.count({ where }),
])
```

Render:
- Filter bar: status `<select>` (options: All, DRAFT, REVIEW, PUBLISHED, SCHEDULED, ARCHIVED) + text search input — both as form GET with searchParams
- Table with columns: Cover (small 60x40 image or placeholder), Title (link to edit page), Status badge (color-coded pill), Category, Author, Views, Date, Actions
- Status badge colors: DRAFT=gray, REVIEW=amber, PUBLISHED=green, SCHEDULED=blue, ARCHIVED=red/muted
- Actions: "Sua" link → `/admin/blog/posts/[id]/edit`, "Xem" link → `/blog/[slug]`
- Pagination: simple Prev/Next with page numbers, use `<Link>` with searchParams

### `src/app/admin/blog/posts/new/page.tsx` — Create Post Form
`'use client'` component.

Fetch categories + authors from API on mount using `useEffect`:
- `fetch('/api/admin/blog/categories')` 
- `fetch('/api/admin/blog/authors')`

Form state using `useState`. Form sections:

**Section 1 — Thong tin co ban:**
- `titleVi` (text, required) — `onBlur`: auto-generate slug from title using `slugify(titleVi, { lower: true, locale: 'vi' })`; import slugify from 'slugify'
- `slug` (text, required, editable) — show "Auto-tao tu tieu de" hint
- `excerptVi` (textarea, maxLength=160, required) — show char count remaining
- `type` (select: ARTICLE/TIP/NEWS/GUIDE/RESEARCH/STORY)
- `ageGroup` (select: UNDER_3/AGE_3_5/AGE_6_8/AGE_9_12/ALL_AGES)

**Section 2 — Phan loai:**
- `categoryId` (select, populated from categories fetch)
- `authorId` (select, populated from authors fetch)
- `coverImageUrl` (text input, URL)
- Tags: text input (comma-separated slugs or a simple textarea) — split by comma on submit

**Section 3 — Noi dung:**
- `contentMarkdown` (textarea, style: `min-height: 450px; font-family: monospace; width: 100%`)

**Section 4 — SEO:**
- `metaTitleVi` (text, hint "60 ky tu")
- `metaDescVi` (textarea, hint "160 ky tu")

**Section 5 — Xuat ban:**
- `status` (select: DRAFT/REVIEW/PUBLISHED/SCHEDULED)
- `scheduledAt` (datetime-local input, show only when status === 'SCHEDULED')

On submit: `fetch('/api/admin/blog/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, tagIds: [] }) })`
On success (201/200): `router.push('/admin/blog/posts')` (use `useRouter` from `next/navigation`)

### `src/app/admin/blog/posts/[id]/edit/page.tsx` — Edit Post Form
Server component to fetch post data, then render client form.

```typescript
const post = await prisma.blogPost.findUnique({
  where: { id: params.id },
  include: { tags: { include: { tag: true } }, author: true, category: true }
})
if (!post) notFound()
```

Pass post data as props to a shared `BlogPostForm` client component (or inline the form with defaultValues). The form is the same structure as new post form, but pre-populated.

Add two extra action buttons below form:
- "Xuat ban ngay" button → `fetch('/api/admin/blog/posts/[id]/publish', { method: 'POST' })` → show success message
- "Xem bai viet" link → `/blog/[slug]` (open in new tab)

### `src/app/admin/blog/categories/page.tsx` — Category Management
Server component with admin auth.
Fetch all categories: `prisma.blogCategory.findMany({ orderBy: { orderNo: 'asc' } })`

Layout:
- Table: emoji, nameVi, slug, color (colored dot), orderNo, active status, post count
- Create form (client `'use client'` inline or separate component):
  - Fields: slug, nameVi, emoji, color (text input, hex), description, orderNo
  - Submit: `POST /api/admin/blog/categories`
  - On success: reload page (`router.refresh()`)

### `src/app/admin/blog/authors/page.tsx` — Author Management
Server component with admin auth.
Fetch: `prisma.blogAuthor.findMany({ orderBy: { createdAt: 'desc' } })`

Table: displayName, role, email, active, post count
Create form: displayName, role, email, bio
Submit: `POST /api/admin/blog/authors`

### `src/app/admin/blog/newsletter/page.tsx` — Newsletter Subscribers
Server component with admin auth.
Fetch stats: verified count, unsubscribed count.
Fetch subscribers (paginate 50 per page): 
```typescript
prisma.blogNewsletterSubscriber.findMany({ 
  where: { verified: true }, 
  orderBy: { subscribedAt: 'desc' }, 
  skip: (page-1)*50, take: 50 
})
```

Render:
- Stats cards: Active subscribers, Unsubscribed
- "Export CSV" button — `'use client'` behavior:
  ```typescript
  const res = await fetch('/api/admin/blog/newsletter/subscribers')
  const { subscribers } = await res.json()
  const csv = 'Email,Name,Subscribed At\n' + subscribers.map(s => `${s.email},${s.nameVi || ''},${s.subscribedAt}`).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click()
  ```
- Table: email, nameVi, subscribedAt formatted date, verified badge

### Update Admin Navigation
Find the admin sidebar/nav component (check `src/app/admin/layout.tsx` or `src/components/admin/`).
Add Blog section with these nav items — use `PenSquare` icon from `lucide-react`:
```
/admin/blog              — "Blog" (with PenSquare icon)
/admin/blog/posts        — "Bai viet"  
/admin/blog/categories   — "Danh muc"
/admin/blog/authors      — "Tac gia"
/admin/blog/newsletter   — "Newsletter"
```

**After Phase 5:** `pnpm type-check` — fix all errors before continuing.

---

## PHASE 6 — Seed Data & Cron

### 6a. Blog Seed Data
Open `prisma/seed.ts` (the main seed file). Add `seedBlog()` function and call it from the main seed function at the end.

```typescript
async function seedBlog() {
  console.log('Seeding blog data...')

  // 8 Categories
  const categories = [
    { slug: 'phat-trien-tre',       nameVi: 'Phat Trien Tre Em',      emoji: '🌱', color: '#10b981', orderNo: 1 },
    { slug: 'phuong-phap-hoc',      nameVi: 'Phuong Phap Hoc Tap',    emoji: '📚', color: '#3b82f6', orderNo: 2 },
    { slug: 'tieng-anh-som',        nameVi: 'Tieng Anh Cho Tre',      emoji: '🌏', color: '#8b5cf6', orderNo: 3 },
    { slug: 'toan-tu-duy',          nameVi: 'Toan Tu Duy',            emoji: '🔢', color: '#f59e0b', orderNo: 4 },
    { slug: 'dinh-huong-phu-huynh', nameVi: 'Huong Dan Phu Huynh',   emoji: '👪', color: '#ef4444', orderNo: 5 },
    { slug: 'cong-nghe-giao-duc',   nameVi: 'Cong Nghe Giao Duc',    emoji: '💻', color: '#06b6d4', orderNo: 6 },
    { slug: 'suc-khoe-tam-than',    nameVi: 'Suc Khoe va Can Bang',   emoji: '💙', color: '#ec4899', orderNo: 7 },
    { slug: 'thanh-tich-hoc-tap',   nameVi: 'Cau Chuyen Thanh Cong', emoji: '⭐', color: '#84cc16', orderNo: 8 },
  ]
  for (const cat of categories) {
    await prisma.blogCategory.upsert({ where: { slug: cat.slug }, update: {}, create: { ...cat, active: true } })
  }

  // 2 Authors
  await prisma.blogAuthor.upsert({
    where: { slug: 'ban-bien-tap' }, update: {},
    create: { slug: 'ban-bien-tap', displayName: 'Ban Bien Tap', role: 'Bien tap vien CungConTuHoc', active: true }
  })
  await prisma.blogAuthor.upsert({
    where: { slug: 'chuyen-gia-giao-duc' }, update: {},
    create: { slug: 'chuyen-gia-giao-duc', displayName: 'Chuyen Gia Giao Duc', role: 'Chuyen gia Tam ly Giao duc', active: true }
  })

  // 10 Tags
  const tagSlugs = ['tieng-anh','toan-hoc','phat-trien-ngon-ngu','ky-nang-song','am-nhac','doc-sach','nuoi-day-con','stem','hoc-qua-choi','tu-duy-sang-tao']
  for (const slug of tagSlugs) {
    await prisma.blogTag.upsert({ where: { slug }, update: {}, create: { slug, nameVi: slug.replace(/-/g, ' ') } })
  }

  // Fetch IDs needed for posts
  const tiengAnh = await prisma.blogCategory.findUnique({ where: { slug: 'tieng-anh-som' } })
  const toanTuDuy = await prisma.blogCategory.findUnique({ where: { slug: 'toan-tu-duy' } })
  const phuongPhap = await prisma.blogCategory.findUnique({ where: { slug: 'phuong-phap-hoc' } })
  const author = await prisma.blogAuthor.findUnique({ where: { slug: 'ban-bien-tap' } })

  if (!tiengAnh || !toanTuDuy || !phuongPhap || !author) {
    console.warn('Blog categories or author not found, skipping post seed.')
    return
  }

  // 3 Sample Posts
  const posts = [
    {
      slug: '5-meo-hoc-tieng-anh-tai-nha',
      type: 'TIP' as const, status: 'PUBLISHED' as const,
      titleVi: '5 Meo Giup Con Hoc Tieng Anh Tai Nha Hieu Qua',
      excerptVi: 'Phu huynh khong can la giao vien de giup con yeu tieng Anh. Kham pha 5 phuong phap don gian ma bat ky gia dinh nao cung co the ap dung ngay hom nay.',
      contentMarkdown: `# 5 Tips to Help Children Learn English at Home\n\n## 1. Create an English Environment\nSurround your child with English through songs, cartoons, and picture books every day.\n\n## 2. Daily Practice (10-15 minutes)\nConsistency beats intensity. Even 10 minutes a day makes a huge difference over months.\n\n## 3. Make It Fun\nUse games, songs, and interactive activities. Children learn best when they are enjoying themselves.\n\n## 4. Use Technology Wisely\nApps like CungConTuHoc provide structured, game-based learning that keeps children engaged.\n\n## 5. Be Patient and Celebrate Progress\nLanguage learning takes time. Celebrate every new word and every small step forward.\n`,
      categoryId: tiengAnh.id, ageGroup: 'AGE_6_8' as const,
      readingTimeMin: 5, isFeatured: true, isIndexed: true, isPinned: false,
      authorId: author.id, coAuthorIds: [] as string[], publishedAt: new Date(),
    },
    {
      slug: 'tre-hoc-toan-tu-duy-nhu-the-nao',
      type: 'GUIDE' as const, status: 'PUBLISHED' as const,
      titleVi: 'Tre Em Phat Trien Tu Duy Toan Hoc Nhu The Nao',
      excerptVi: 'Tu duy toan hoc khong chi la tinh toan nhanh. Day la cach giup tre phat trien kha nang giai quyet van de tu nhien nhat thong qua cuoc song hang ngay.',
      contentMarkdown: `# How Children Develop Mathematical Thinking\n\nMathematical thinking is about logic, patterns, and problem-solving — not just arithmetic.\n\n## What is Mathematical Thinking?\n- Recognizing patterns in everyday life\n- Breaking problems into manageable steps\n- Using logic to reach conclusions\n- Estimating and checking results\n\n## Age-Appropriate Activities for 6-8 Year Olds\nUse physical objects, board games, and real-life scenarios. Cooking together (measuring), shopping (counting change), and building blocks all develop mathematical intuition naturally.\n\n## The Role of Play\nChildren learn math most effectively through play. Puzzle games, strategy board games, and building activities all develop mathematical thinking without the pressure of formal study.\n`,
      categoryId: toanTuDuy.id, ageGroup: 'AGE_6_8' as const,
      readingTimeMin: 4, isFeatured: false, isIndexed: true, isPinned: false,
      authorId: author.id, coAuthorIds: [] as string[], publishedAt: new Date(Date.now() - 2*24*60*60*1000),
    },
    {
      slug: 'phuong-phap-giao-duc-som-hieu-qua-2026',
      type: 'ARTICLE' as const, status: 'PUBLISHED' as const,
      titleVi: 'Phuong Phap Giao Duc Som Hieu Qua Nhat Cho Tre 2026',
      excerptVi: 'Montessori, STEAM, hay Waldorf? Cac chuyen gia giao duc khuyen nghi phuong phap nao phu hop nhat cho tre em Viet Nam trong nam 2026?',
      contentMarkdown: `# Most Effective Early Education Methods in 2026\n\nModern early childhood education combines proven methods with new research on how children learn.\n\n## Montessori Principles\nChild-led learning, hands-on materials, and mixed-age groups remain highly effective. Key principle: follow the child's natural curiosity.\n\n## STEAM Integration\nScience, Technology, Engineering, Art, and Math integrated from early childhood builds the skills children need for the future.\n\n## Technology and Balance\nDigital tools like CungConTuHoc provide structured, adaptive learning while maintaining the critical importance of physical play and real human connection.\n\n## What Research Shows Works Best\nThe most effective early education balances structured learning with free play, and actively involves parents in the child's learning journey — exactly what CungConTuHoc aims to support.\n`,
      categoryId: phuongPhap.id, ageGroup: 'AGE_3_5' as const,
      readingTimeMin: 6, isFeatured: false, isIndexed: true, isPinned: false,
      authorId: author.id, coAuthorIds: [] as string[], publishedAt: new Date(Date.now() - 4*24*60*60*1000),
    },
  ]

  for (const post of posts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: {}, create: post })
  }

  console.log('Blog seed completed: 8 categories, 2 authors, 10 tags, 3 posts.')
}
```

At the bottom of the main seed function (in the `main()` or top-level async function), call:
```typescript
await seedBlog()
```

Run: `pnpm db:seed`

### 6b. Weekly Newsletter Cron Route
Create: `src/app/api/cron/newsletter-weekly/route.ts`

Copy the exact CRON_SECRET verification pattern from an existing cron route (e.g., `src/app/api/cron/weekly-reports/route.ts` or similar).

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'  // use actual prisma import path
import { newsletterService } from '@/modules/blog/newsletter-service'
// import queue enqueue function from worker — check src/worker/ or src/lib/queue.ts

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET (copy exact pattern from existing cron route)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch posts published in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentPosts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { gte: sevenDaysAgo } },
    select: { id: true, slug: true, titleVi: true },
    orderBy: { publishedAt: 'desc' },
    take: 10,
  })

  if (recentPosts.length === 0) {
    return NextResponse.json({ dispatched: 0, reason: 'No posts this week' })
  }

  // 3. Get active subscribers
  const subscribers = await newsletterService.getActiveSubscribers()

  if (subscribers.length === 0) {
    return NextResponse.json({ dispatched: 0, reason: 'No active subscribers' })
  }

  // 4. Enqueue BullMQ job per subscriber
  //    Copy queue enqueue pattern from existing worker code
  //    Job name: 'send-blog-newsletter'
  //    Data: { subscriberId: string, subscriberEmail: string, postIds: string[] }
  const postIds = recentPosts.map(p => p.id)
  let dispatched = 0
  for (const subscriber of subscribers) {
    try {
      // enqueue job here — follow exact pattern from existing code
      // e.g.: await emailQueue.add('send-blog-newsletter', { subscriberId: subscriber.id, subscriberEmail: subscriber.email, postIds })
      dispatched++
    } catch (err) {
      console.error('Failed to enqueue newsletter for', subscriber.email, err)
    }
  }

  return NextResponse.json({ dispatched, posts: recentPosts.length })
}
```

### 6c. Update vercel.json
Open `vercel.json`. Add to the `crons` array:
```json
{ "path": "/api/cron/newsletter-weekly", "schedule": "0 4 * * 1" }
```

---

## FINAL CHECKS

```bash
pnpm type-check
pnpm db:seed
```

Verify in browser:
```
http://localhost:3000/admin/blog              → Dashboard with stats
http://localhost:3000/admin/blog/posts        → Post list table  
http://localhost:3000/admin/blog/posts/new    → Create form
http://localhost:3000/admin/blog/categories   → Category table + form
http://localhost:3000/admin/blog/newsletter   → Subscriber list + export
http://localhost:3000/blog                    → Shows 3 seeded posts
```

## RULES
1. Zero breaking changes to existing admin pages.
2. Follow exact admin auth pattern from existing pages.
3. `pnpm type-check` must exit 0.
4. Use upsert (not create) in seed so it's idempotent.
