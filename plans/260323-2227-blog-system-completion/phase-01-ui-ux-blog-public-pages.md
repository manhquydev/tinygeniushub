# Phase 1: UI/UX Blog Public Pages

## Context Links
- Blog index: `src/app/(main)/blog/page.tsx`
- Blog post: `src/app/(main)/blog/[slug]/page.tsx`
- Category page: `src/app/(main)/blog/category/[slug]/page.tsx`
- Blog card: `src/components/blog/blog-card.tsx`
- Featured card: `src/components/blog/blog-card-featured.tsx`
- TOC: `src/components/blog/blog-toc.tsx`
- Reading progress: `src/components/blog/blog-reading-progress.tsx`
- Newsletter widget: `src/components/blog/blog-newsletter-widget.tsx`
- Blog types: `src/modules/blog/blog-types.ts`
- Blog repository: `src/modules/blog/blog-repository.ts`

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: ~6h
- Transform blog pages from functional to editorial-quality layout. Add sidebar with categories, newsletter, trending posts. Polish cards, add author bio card, improve mobile responsive.

## Key Insights
- Current blog index: hero + flat 3-col grid + newsletter widget at bottom. No sidebar.
- Blog post page: already has 2/3 + 1/3 grid with TOC + newsletter in sidebar. Good foundation.
- Category page: minimal — just header + grid. Needs filter/sort UI.
- Icons: Lucide React used consistently (Clock, Eye, Heart). Audit for any fill/colored usage.
- All blog components use `page-stack` layout class and slate color palette.

## Requirements

### Functional
- Blog index sidebar with: categories list, newsletter widget, trending posts (top 5 by views)
- Blog card: improved hover states, better typography hierarchy, tag pills
- Blog post: sticky TOC, author card with bio at article end, related posts section polish
- Category page: sort dropdown (latest/popular), pagination with prev/next

### Non-Functional
- Mobile responsive: sidebar collapses below main content on mobile
- Page load: parallel data fetching (Promise.all) for sidebar data
- ISR: maintain existing revalidation strategy (600s blog index, 1800s category, 3600s post)

## Architecture

```
Blog Index Layout:
+------------------------------------------+
|         Hero Featured Post (full width)    |
+------------------------------------------+
|  Main Content (2/3)   |  Sidebar (1/3)    |
|  - 3-col post grid    |  - Categories     |
|  - Load more/paginate |  - Newsletter     |
|                       |  - Trending Posts  |
+------------------------------------------+
```

Data fetching changes in `blog/page.tsx`:
- Add `blogRepository.findTrendingPosts(5)` to Promise.all
- Move newsletter widget into sidebar
- Categories already fetched, move to sidebar rendering

## Related Code Files

### Files to Modify
- `src/app/(main)/blog/page.tsx` — add sidebar layout, trending posts
- `src/app/(main)/blog/[slug]/page.tsx` — add author bio card, polish related posts
- `src/app/(main)/blog/category/[slug]/page.tsx` — add sort dropdown, pagination
- `src/components/blog/blog-card.tsx` — improve hover, typography, tag pills
- `src/components/blog/blog-card-featured.tsx` — polish if needed
- `src/components/blog/blog-toc.tsx` — make sticky with `sticky top-24`
- `src/modules/blog/blog-repository.ts` — add `findTrendingPosts` query

### Files to Create
- `src/components/blog/blog-sidebar.tsx` — sidebar container with categories, newsletter, trending
- `src/components/blog/blog-trending-posts.tsx` — trending posts widget for sidebar
- `src/components/blog/blog-author-card.tsx` — author bio card at end of article
- `src/components/blog/blog-category-filter.tsx` — sort dropdown client component for category page

## Implementation Steps

### Step 1: Icon Audit (~30min)
1. Search all blog components for Lucide icon usage: `grep -r "lucide-react" src/components/blog/`
2. Verify all icons use outline style (no `fill` prop, no colored variants)
3. Standardize icon sizes: 14px for inline metadata, 16px for buttons, 20px for section headers
4. Fix any inconsistencies found

### Step 2: Trending Posts Query (~30min)
1. Open `src/modules/blog/blog-repository.ts`
2. Add function `findTrendingPosts(limit: number)`:
   ```ts
   // Query: published posts, ordered by viewCount desc, limit N
   // Select: same fields as findPosts card DTO
   // Filter: published in last 30 days (prevent stale trending)
   ```
3. Export from blog-repository

### Step 3: Blog Sidebar Component (~1h)
1. Create `src/components/blog/blog-sidebar.tsx`
   - Props: `{ categories, trendingPosts }`
   - Sections: Categories list (colored pills), Trending posts widget, Newsletter widget
   - Use `aside` semantic HTML
   - Style: `space-y-6`, each section in a `rounded-2xl border border-slate-200 bg-white p-4 shadow-sm` card
2. Create `src/components/blog/blog-trending-posts.tsx`
   - Props: `{ posts: BlogPostCardDTO[] }`
   - Render numbered list (1-5) with post title, category, view count
   - Each item links to `/blog/[slug]`
   - Compact layout — no images, just text

### Step 4: Blog Index Redesign (~1.5h)
1. Open `src/app/(main)/blog/page.tsx`
2. Add `findTrendingPosts(5)` to Promise.all
3. Replace flat layout with:
   ```
   Hero (full width)
   Categories bar (full width, horizontal scroll — keep existing)
   Grid: main (md:col-span-2) + sidebar (md:col-span-1)
     Main: 3-col grid of BlogCard
     Sidebar: BlogSidebar component
   ```
4. Use `grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]`
5. Remove standalone `BlogNewsletterWidget` from bottom (it moves to sidebar)

### Step 5: Blog Card Polish (~1h)
1. Open `src/components/blog/blog-card.tsx`
2. Add tag pills below category badge (show first 2 tags)
3. Improve typography: title `text-lg font-bold`, excerpt `text-sm text-slate-500`
4. Add subtle gradient overlay on image hover
5. Ensure consistent spacing with `gap-3` instead of `gap-4` in metadata
6. Verify mobile: card should be full-width on `<768px`

### Step 6: Author Bio Card (~45min)
1. Create `src/components/blog/blog-author-card.tsx`
   - Props: author data (displayName, bio, avatarUrl, role, linkedinUrl)
   - Layout: avatar left, name/role/bio right
   - Link to LinkedIn if available
   - Style matches existing card pattern (rounded-2xl, border, shadow-sm)
2. Add author card to `blog/[slug]/page.tsx` after article content, before share buttons
3. Author bio comes from `BlogAuthor` model (already has `bio` field)
4. Need to include author bio in `findPostBySlug` query if not already included

### Step 7: Blog Post Page Polish (~30min)
1. Open `src/app/(main)/blog/[slug]/page.tsx`
2. Make TOC sticky: verify `blog-toc.tsx` has `sticky top-24` classes
3. Verify reading progress bar works properly
4. Ensure related posts section has consistent card sizing
5. Add "Back to blog" link at bottom

### Step 8: Category Page Enhancement (~45min)
1. Create `src/components/blog/blog-category-filter.tsx` (client component)
   - Sort dropdown: "Moi nhat" (latest), "Xem nhieu nhat" (popular)
   - Uses URL search params to preserve state on navigation
   - `"use client"` directive
2. Open `src/app/(main)/blog/category/[slug]/page.tsx`
3. Add sort param handling in `searchParams`
4. Pass sort to `blogService.listPosts({ sort: ... })`
5. Add pagination controls (prev/next buttons) — reuse pattern from admin posts page
6. Add post count display: "X bai viet"

## Todo List
- [ ] Icon audit across all blog components
- [ ] Add `findTrendingPosts` to blog-repository
- [ ] Create `blog-sidebar.tsx`
- [ ] Create `blog-trending-posts.tsx`
- [ ] Redesign blog index with sidebar layout
- [ ] Polish blog-card (tags, hover, typography)
- [ ] Create `blog-author-card.tsx`
- [ ] Add author card to post page
- [ ] Make TOC sticky in post page
- [ ] Create `blog-category-filter.tsx`
- [ ] Add sort + pagination to category page
- [ ] Test mobile responsiveness on all pages
- [ ] Verify ISR revalidation unchanged

## Success Criteria
- Blog index has hero + 2/3 main + 1/3 sidebar layout
- Sidebar shows categories, trending posts, newsletter
- Blog cards have improved hover states and tag pills
- Post page has sticky TOC, author bio card
- Category page has sort dropdown + pagination
- All pages responsive on mobile (320px+)
- No Lucide icon inconsistencies

## Risk Assessment
- **Blog repository bloat**: `blog-repository.ts` is 452 lines. Adding `findTrendingPosts` is small, but monitor file size. Consider extracting sidebar queries into separate module if it grows.
- **ISR cache invalidation**: Adding sidebar data to blog index means more cache dependencies. Keep revalidation at 600s.
- **Mobile sidebar**: Sidebar must collapse cleanly. Use `lg:grid-cols-[2fr_1fr]` so it stacks on smaller screens.

## Security Considerations
- No new API endpoints — all data fetched server-side via Prisma
- No user input handling changes
- Trending posts query: add reasonable limit (max 10) to prevent abuse

## Next Steps
- After completion, Phase 2 can begin (RSS feed uses same post data)
- Newsletter widget in sidebar may need minor style adjustments after Phase 2
