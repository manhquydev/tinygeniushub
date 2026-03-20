TASK: Blog System — Phase 4: Frontend Pages & Components

PREREQUISITE: Phases 1-3 complete.

STUDY FIRST (mandatory):
  - src/app/globals.css — CSS variables, fonts, color palette
  - src/app/(main)/layout.tsx — main layout wrapper
  - src/components/ — existing component styles and patterns
  - The project uses Tailwind CSS v4 and `motion` library

=== src/components/blog/blog-card.tsx ===
Props: { post: BlogPostCardDTO }
Client or Server component (prefer Server unless hover animation needed, use Server + CSS hover).

Render:
- Wrapper: article tag with CSS hover lift (translate-y, box-shadow transition)
- Link wraps entire card (href: /blog/[slug])
- Next.js Image: cover art, aspect-ratio 16/9, object-cover, sizes for responsive
- Category badge: small pill with emoji + nameVi, background=category.color, white text
- Title: h2, line-clamp-2 (use CSS -webkit-line-clamp or Tailwind line-clamp)
- Excerpt: p, line-clamp-3
- Footer row: author avatar (small circle, fallback initials), author name, separator, reading time, date
- Stats row: eye icon + viewCount, heart icon + likeCount (use lucide-react)
- Date format: Vietnamese style, use date-fns/locale vi

=== src/components/blog/blog-card-featured.tsx ===
Props: { post: BlogPostCardDTO }
Large hero card. Next.js Image in fill mode (position: relative container, overflow hidden).
Dark gradient overlay: after: css, from transparent to black 80%.
Text on image: category pill + large title + author + date (all white).

=== src/components/blog/blog-newsletter-widget.tsx ===
'use client' directive.
State: email (string), loading (boolean), success (boolean).
On submit: fetch('/api/blog/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) })
Shows checkmark + success message when done.
Design: card with gradient background, headline, email input + button, privacy note.
Headline text: "Nhan bi quyet nuoi day con moi tuan" (in the component, use the actual Vietnamese with diacritics if project encoding supports it, check existing Vietnamese text in globals.css)

=== src/components/blog/blog-toc.tsx ===
'use client' directive.
Props: { headings: { id: string, text: string, level: number }[] }
Uses IntersectionObserver to track which heading is in viewport.
Highlights active heading with accent color.
Click scrolls smoothly to heading: document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

=== src/components/blog/blog-share.tsx ===
'use client' directive.
Props: { url: string, title: string }
Three buttons using lucide-react icons:
1. Facebook: window.open('https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url))
2. Twitter: window.open('https://twitter.com/intent/tweet?url=...')
3. Copy: navigator.clipboard.writeText(url), setState 'copied' for 2s
Show "Da sao chep!" tooltip/state when copied.

=== src/app/(main)/blog/layout.tsx ===
Server component. No special chrome, just renders children.
Export metadata with title template.

=== src/app/(main)/blog/page.tsx ===
Server component.
export const revalidate = 600

generateMetadata(): returns { title: 'Blog | CungConTuHoc', description: '...' }

Fetch in parallel (Promise.all):
  1. blogService.getFeaturedPosts()
  2. blogService.listPosts({ page: 1, limit: 8 })
  3. blogRepository.findCategories()

Page structure:
  1. Featured section: BlogCardFeatured with first featured post (full width)
  2. Category pills: horizontal scroll row with category emoji + name links (/blog/category/[slug])
  3. "Bai viet moi nhat" heading
  4. Grid: 2-col on md+, 1-col on mobile, 8 BlogCards
  5. BlogNewsletterWidget (full width CTA)

Handle empty state: if no posts, show friendly empty message.

=== src/app/(main)/blog/[slug]/page.tsx ===
Server component.
export const revalidate = 3600

generateStaticParams(): fetch top 50 PUBLISHED posts by publishedAt desc, return [{ slug: post.slug }]

generateMetadata({ params }): call blogService.getPostBySlug(params.slug), call blogSeo.generateBlogPostMetadata(post, siteUrl)

Page:
  - notFound() if post is null
  - Inject JSON-LD in <script type="application/ld+json"> using blogSeo.generateBlogPostJsonLd(post, siteUrl)
  - Layout: 2-column CSS grid (2/3 article, 1/3 sidebar) on md+, stacked on mobile
  - Article column:
    * Breadcrumb links
    * Cover image (Next.js Image, priority=true for LCP)
    * Title (h1), category badge, age group badge
    * Author card (avatar + name + role + publishedAt)
    * Reading time
    * Content: <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} className="prose" />
    * BlogShare at bottom
  - Sidebar column (sticky, top-24):
    * BlogToc (pass headings extracted from markdown via extractToc)
    * BlogNewsletterWidget
  - Below grid: "Bai viet lien quan" heading + 3 BlogCards (post.relatedPosts)

=== src/app/(main)/blog/category/[slug]/page.tsx ===
Server component.
export const revalidate = 1800
generateMetadata: title 'Danh muc [nameVi] | Blog CungConTuHoc'
Fetch category + paginated posts.
Category header: emoji + nameVi + description.
Grid of BlogCards.

=== src/app/(main)/blog/search/page.tsx ===
'use client' directive.
Controlled search input.
useEffect with debounce (300ms) → fetch /api/blog/search?q={query}
Shows BlogCard grid when results, empty state when no results, skeleton when loading.

STYLING REQUIREMENTS:
- Mobile-first. Use Tailwind responsive prefixes (md:, lg:).
- For prose content (blog article body): add class="prose max-w-none" div. Add .prose styles to globals.css if not present (headings, paragraphs, code blocks, blockquotes).
- All Next.js Image components must have valid sizes prop.
- Hero images: priority={true}

AFTER CREATING ALL FILES:
  pnpm type-check
  pnpm dev (should be running already)
  Navigate to http://localhost:3000/blog and verify page renders.
