TASK: Blog System — Phase 3: API Routes

PREREQUISITE: Phase 2 complete. pnpm type-check must pass.

STUDY FOR PATTERNS:
  - src/app/api/reports/ (GET route structure)
  - src/app/api/billing/checkout/route.ts (POST with Zod validation)
  - src/app/api/admin/overview/route.ts (admin auth pattern)

CREATE THESE FILES:

=== src/app/api/blog/posts/route.ts ===
GET handler:
  - Parse searchParams: page (default 1), limit (default 12, max 50), category, tag, author, ageGroup, type, featured (bool), sort
  - Import blogService from src/modules/blog/blog-service
  - Call blogService.listPosts(params)
  - Return NextResponse.json({ posts, pagination: { page, limit, total, totalPages } })
  - Set headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600' }

=== src/app/api/blog/posts/[slug]/route.ts ===
GET handler:
  - Call blogService.getPostBySlug(params.slug)
  - If null: return NextResponse.json({ error: 'Not found' }, { status: 404 })
  - Return NextResponse.json({ post })
  - Headers: Cache-Control public max-age=600 s-maxage=600 stale-while-revalidate=7200

=== src/app/api/blog/posts/[slug]/like/route.ts ===
POST handler:
  - Find post by slug using blogRepository.findPostBySlug(slug) — need id
  - If not found: 404
  - Call blogRepository.incrementLikeCount(post.id)
  - Return { likeCount: number }

=== src/app/api/blog/posts/[slug]/view/route.ts ===
POST handler:
  - Response immediately: return NextResponse.json({ ok: true })
  - Fire-and-forget (no await): import prisma, create BlogReadHistory + increment viewCount

=== src/app/api/blog/featured/route.ts ===
GET handler:
  - Call blogService.getFeaturedPosts()
  - Return { posts }
  - Cache-Control: public max-age=600

=== src/app/api/blog/categories/route.ts ===
GET handler:
  - Import blogRepository
  - Call blogRepository.findCategories()
  - Return { categories }
  - Cache-Control: public max-age=3600

=== src/app/api/blog/tags/route.ts ===
GET handler:
  - Call blogRepository.findTags()
  - Return { tags }
  - Cache-Control: public max-age=3600

=== src/app/api/blog/search/route.ts ===
GET handler:
  - Get q from searchParams
  - If !q || q.length < 2: return 400 { error: 'Query too short, minimum 2 characters' }
  - Call blogService.searchPosts(q)
  - Return blogSearchResult as JSON (no cache)

=== src/app/api/blog/newsletter/subscribe/route.ts ===
POST handler:
  - Import z from 'zod', newsletterService from modules/blog/newsletter-service
  - Parse body, validate with z.object({ email: z.string().email(), nameVi: z.string().optional() })
  - If validation fails: return 400 { error: 'Invalid email' }
  - Call newsletterService.subscribe(email, { nameVi })
  - Return { message: 'Please check your email to confirm subscription' }

=== src/app/api/blog/newsletter/verify/route.ts ===
GET handler:
  - Get token from searchParams
  - If !token: return 400
  - Call newsletterService.verifySubscription(token)
  - Redirect to /blog?subscribed=true using NextResponse.redirect(new URL('/blog?subscribed=true', request.url))

=== src/app/api/blog/newsletter/unsubscribe/route.ts ===
GET handler:
  - Get token from searchParams
  - Call newsletterService.unsubscribe(token)
  - Redirect to /blog?unsubscribed=true

=== src/app/api/admin/blog/posts/route.ts ===
POST handler:
  - Use existing admin auth pattern (look at how /api/admin/overview validates admin access)
  - Parse body with Zod: CreateBlogPostInput schema
  - Call blogService.createPost(input, adminEmail)
  - Return { post }

=== src/app/api/admin/blog/posts/[id]/route.ts ===
PATCH handler:
  - Admin auth check
  - Parse body with Zod (UpdateBlogPostInput)
  - Call blogService.updatePost({ ...input, id: params.id }, adminEmail)
  - Return { post }

=== src/app/api/admin/blog/posts/[id]/publish/route.ts ===
POST handler:
  - Admin auth check
  - Call blogService.publishPost(params.id, adminEmail)
  - Return { success: true, publishedAt: new Date() }

AFTER ALL FILES CREATED:
  pnpm type-check && pnpm lint
  Fix all errors.
