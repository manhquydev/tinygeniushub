TASK: Blog System — Phase 5: Admin CMS Interface

PREREQUISITE: Phases 1-3 complete (API routes must exist).

STUDY FIRST:
  - src/app/admin/ — existing admin pages structure
  - src/app/admin/page.tsx or similar — admin UI patterns, how auth is checked
  - src/components/ — existing table, form, button component patterns
  - How ADMIN_EMAILS check is implemented in existing admin routes

=== src/app/admin/blog/page.tsx — Dashboard ===
Server component with admin auth (same pattern as other admin pages).
Fetch these stats in parallel:
  - blogPost count where status=PUBLISHED
  - blogPost count where status=DRAFT
  - blogNewsletterSubscriber count where verified=true AND unsubscribedAt IS NULL
  - Top viewed post (findFirst, orderBy viewCount desc, status=PUBLISHED)

Render:
  - Stats cards (4 cards): Published, Drafts, Subscribers, Total Views
  - Quick actions: link to /admin/blog/posts/new, link to /admin/blog/posts
  - Most viewed post card (if exists): title + view count
  - Link back to /blog (public blog)

=== src/app/admin/blog/posts/page.tsx — Post List ===
Server component with admin auth.
Fetch: paginated blog posts (20 per page), with category + author included.
Support searchParams: page, status filter, search (title contains).

Table columns:
  - Small thumbnail (50x50, Next.js Image)
  - Title (link to /admin/blog/posts/[id]/edit)
  - Status badge (color-coded: DRAFT=gray, REVIEW=yellow/amber, PUBLISHED=green, SCHEDULED=blue, ARCHIVED=red)
  - Category name
  - Author displayName
  - View count + Like count
  - publishedAt formatted date
  - Actions: Edit button (link), View button (link to /blog/[slug]), Delete button (form with POST to delete endpoint or client-side fetch)

Filter controls above table:
  - Status select dropdown (All, Draft, Review, Published, Scheduled, Archived)
  - Search input (title filter)

Simple pagination: Prev/Next page buttons using searchParams.

=== src/app/admin/blog/posts/new/page.tsx — Create Form ===
Client component ('use client') OR server component with client form parts.

Form structure (single column layout is fine for MVP):
  Section 1 - Basic Info:
    - titleVi (text, required, onBlur auto-generate slug)
    - slug (text, required, show auto-generation from title)
    - excerptVi (textarea, 160 char max, show remaining count)
    - type (select: ARTICLE/TIP/NEWS/GUIDE/RESEARCH/STORY)
    - ageGroup (select: UNDER_3/AGE_3_5/AGE_6_8/AGE_9_12/ALL_AGES)

  Section 2 - Taxonomy:
    - categoryId (select, fetch from /api/blog/categories)
    - authorId (select, fetch from API or server-side data)
    - tags (multi-select or text input comma-separated for MVP)

  Section 3 - Content:
    - contentMarkdown (large textarea, 100% width, min-height 400px)
    - coverImageUrl (text input for URL)

  Section 4 - SEO:
    - metaTitleVi (text, 60 char hint)
    - metaDescVi (textarea, 160 char hint)

  Section 5 - Publishing:
    - status (select: DRAFT/REVIEW/PUBLISHED/SCHEDULED)
    - scheduledAt (datetime-local, shown only when status=SCHEDULED)
    - Submit button: "Save" + "Publish Now" buttons

On submit: POST to /api/admin/blog/posts
On success: redirect to /admin/blog/posts

=== src/app/admin/blog/posts/[id]/edit/page.tsx — Edit Form ===
Server component that fetches post by id from DB (use prisma directly or via blog-repository).
Pass data as defaultValues to same form as new page.
Include "Publish Now" button that calls POST /api/admin/blog/posts/[id]/publish.
Include "View Live" link to /blog/[slug].

=== src/app/admin/blog/categories/page.tsx ===
Admin auth.
Table: emoji, nameVi, slug, active status, actions.
Simple form above table: slug, nameVi, emoji, color, description → POST to create category.
Can use fetch directly to a simple /api/admin/blog/categories route (create this route too: GET + POST).

=== src/app/admin/blog/authors/page.tsx ===
Admin auth.
Table: displayName, role, email, active.
Form: displayName, role, email, bio → POST to /api/admin/blog/authors (create this route: GET + POST).

=== src/app/admin/blog/newsletter/page.tsx ===
Admin auth.
Stats: total verified subscribers.
Table of subscribers: email, nameVi?, verified, frequency, subscribedAt.
Rows per page: 50.
Client-side "Export CSV" button: fetch all verified subscribers, build CSV string, trigger download via Blob + URL.createObjectURL.

CREATE ADDITIONAL NEEDED ADMIN API ROUTES:
  - GET /api/admin/blog/categories/route.ts → find all categories
  - POST /api/admin/blog/categories/route.ts → create category
  - GET /api/admin/blog/authors/route.ts → find all authors  
  - POST /api/admin/blog/authors/route.ts → create author
  - GET /api/admin/blog/newsletter/subscribers/route.ts → find all verified subscribers (for CSV export)

All admin routes must use same admin auth check as existing routes.

AFTER ALL FILES:
  pnpm type-check
  Navigate to http://localhost:3000/admin/blog and verify.
