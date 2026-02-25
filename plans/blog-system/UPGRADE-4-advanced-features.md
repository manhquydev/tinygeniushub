# CODEX UPGRADE: Blog — Advanced Features (Analytics, Search, Performance)

## Context
This prompt implements 4 advanced blog features:
1. **Reading Progress Bar** — visual indicator of scroll position in articles
2. **Full-Text Search with Debounce & Highlight** — enhanced search page with keyword highlighting
3. **Related Posts by AI Tagging** — auto-populate relatedPosts based on shared tags/category
4. **Blog Analytics Dashboard** — admin page with charts for views/likes/subscribers over time

---

## FEATURE 1 — Reading Progress Bar

Create: `src/components/blog/blog-reading-progress.tsx`

```typescript
'use client'
import { useEffect, useState } from 'react'

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
    }
    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 100,
        height: 3, width: `${progress}%`,
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
        transition: 'width 0.1s linear',
        pointerEvents: 'none',
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  )
}
```

Integrate into `src/app/(main)/blog/[slug]/page.tsx`:
```typescript
import { BlogReadingProgress } from '@/components/blog/blog-reading-progress'
// At the very top of the page JSX (before any content):
<BlogReadingProgress />
```

---

## FEATURE 2 — Enhanced Search with Keyword Highlighting

Open `src/app/(main)/blog/search/page.tsx`.

Add a highlight utility function:
```typescript
function highlightQuery(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:#fef08a;padding:0 2px;border-radius:2px;">$1</mark>')
}
```

In the BlogCard for search results, show highlighted title/excerpt:
```typescript
// Instead of plain text BlogCard, render a custom search-result card:
<article>
  <h3 dangerouslySetInnerHTML={{ __html: highlightQuery(post.titleVi, query) }} />
  <p dangerouslySetInnerHTML={{ __html: highlightQuery(post.excerptVi, query) }} />
  // ... other card elements
</article>
```

Also enhance `/api/blog/search/route.ts`:
- Add `limit` param (default 20, max 50)
- Return total count alongside results: `{ results, total, query }`
- Extend search to also match tag slugs: `OR: [{ titleVi: ... }, { excerptVi: ... }, { tags: { some: { tag: { nameVi: { contains: query, mode: 'insensitive' } } } } }]`

Show result count: "Tim thay {total} ket qua cho '{query}'"

---

## FEATURE 3 — Auto Related Posts Population

Create: `src/modules/blog/related-posts-service.ts`

```typescript
import { prisma } from '@/lib/db'

/**
 * Auto-populates BlogPostRelation for a post based on shared tags and category.
 * Call this after creating/publishing a post.
 * Finds up to 5 most related posts (by shared tags count, then same category).
 */
export async function refreshRelatedPosts(postId: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: { tags: true },
  })
  if (!post) return

  const tagIds = post.tags.map(t => t.tagId)

  // Score posts by shared tags count
  const candidates = await prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: 'PUBLISHED',
      OR: [
        // Same category
        { categoryId: post.categoryId },
        // Shares at least one tag
        ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    include: { tags: { select: { tagId: true } } },
    take: 20,
    orderBy: { viewCount: 'desc' },
  })

  // Score: 2 points per shared tag, 1 point for same category
  const scored = candidates.map(c => {
    const sharedTags = c.tags.filter(t => tagIds.includes(t.tagId)).length
    const sameCategory = c.categoryId === post.categoryId ? 1 : 0
    return { id: c.id, score: sharedTags * 2 + sameCategory }
  })
  scored.sort((a, b) => b.score - a.score)
  const top5 = scored.slice(0, 5)

  // Update BlogPostRelation
  await prisma.$transaction([
    prisma.blogPostRelation.deleteMany({ where: { sourcePostId: postId } }),
    ...(top5.length > 0
      ? [prisma.blogPostRelation.createMany({
          data: top5.map(r => ({ sourcePostId: postId, relatedPostId: r.id })),
          skipDuplicates: true,
        })]
      : []),
  ])
}
```

Call `refreshRelatedPosts(post.id)` in:
1. `src/modules/blog/blog-service.ts` → `publishPost()` function — call after status update
2. `src/app/api/admin/blog/posts/[id]/publish/route.ts` — add after publishPost call

Also add an admin button in post edit page:
- "Cap nhat bai lien quan" → POST `/api/admin/blog/posts/[id]/refresh-related`
- Create that route: admin auth + call `refreshRelatedPosts(params.id)`

---

## FEATURE 4 — Blog Analytics Dashboard

### New API: `src/app/api/admin/blog/analytics/route.ts`

Admin auth required.
Accept searchParams: `range` = '7d' | '30d' | '90d' (default 30d).

```typescript
const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

const [
  totalViews,
  totalLikes,
  totalSubscribers,
  topPosts,
  viewsByDay,
  categoryBreakdown,
] = await prisma.$transaction([
  prisma.blogPost.aggregate({ _sum: { viewCount: true }, where: { status: 'PUBLISHED' } }),
  prisma.blogPost.aggregate({ _sum: { likeCount: true }, where: { status: 'PUBLISHED' } }),
  prisma.blogNewsletterSubscriber.count({ where: { verified: true, unsubscribedAt: null } }),
  prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { titleVi: true, slug: true, viewCount: true, likeCount: true, readingTimeMin: true },
    orderBy: { viewCount: 'desc' },
    take: 10,
  }),
  prisma.blogReadHistory.groupBy({
    by: ['readAt'],
    _count: { id: true },
    where: { readAt: { gte: since } },
    orderBy: { readAt: 'asc' },
  }),
  prisma.blogPost.groupBy({
    by: ['categoryId'],
    _sum: { viewCount: true },
    where: { status: 'PUBLISHED' },
  }),
])

return NextResponse.json({ totalViews: totalViews._sum.viewCount ?? 0, totalLikes: totalLikes._sum.likeCount ?? 0, totalSubscribers, topPosts, viewsByDay, categoryBreakdown })
```

### New Admin Page: `src/app/admin/blog/analytics/page.tsx` — `'use client'`

Fetch from `/api/admin/blog/analytics?range={range}`.
Range selector: 7d / 30d / 90d tabs.

Render (use CSS only, no chart library needed):
1. **4 KPI cards**: Total Views, Total Likes, Active Subscribers, Total Published Posts
2. **Top 10 Posts table**: rank, title (link), views, likes, read time
3. **Views by day**: simple CSS bar chart — each day = a `<div>` with height proportional to count, tooltip on hover showing date + count
4. **Category breakdown**: horizontal bar chart using CSS width percentages

CSS bar chart technique:
```typescript
// views normalized to max 100% height
<div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
  {viewsByDay.map(day => {
    const height = maxViews > 0 ? (day._count.id / maxViews) * 100 : 0
    return (
      <div key={day.readAt.toISOString()} title={`${formatDate(day.readAt)}: ${day._count.id} luot xem`}
        style={{ flex: 1, height: `${height}%`, minHeight: 2, background: '#3b82f6', borderRadius: 2 }}
      />
    )
  })}
</div>
```

Add to admin nav: `/admin/blog/analytics` — "Phan tich" with BarChart2 icon (lucide-react)

---

## BONUS — Estimated Read Time in Search Results & Category Pages

The `readingTimeMin` is already stored. Display it consistently on all BlogCard variants:
- "X phut doc" with a Clock icon (lucide-react) in a subtle muted style
- Already implemented in the base BlogCard — verify it's showing correctly

---

## VALIDATION

```bash
pnpm type-check
pnpm lint
```

Test each feature:
1. `/blog/[slug]` — reading progress bar visible at top (thin gradient bar)
2. `/blog/search?q=tieng` — highlighted keywords in yellow
3. After publishing a post → related posts auto-populated
4. `/admin/blog/analytics` — KPI cards + charts visible
