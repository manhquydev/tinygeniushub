TASK: Blog System — Phase 2: Blog Module Business Logic

PREREQUISITE: Phase 1 (schema migration) must be complete and pnpm type-check must pass.

INSTALL DEPENDENCIES FIRST:
  pnpm add remark remark-html remark-gfm reading-time slugify

STUDY THESE FILES FOR CODE STYLE:
  - src/modules/billing/ (service + repository pattern)
  - src/modules/reports/ (service pattern)
  - src/lib/prisma.ts (find the prisma client export path)

CREATE THE FOLLOWING FILES:

=== FILE 1: src/modules/blog/blog-types.ts ===

export type BlogPostStatus = 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
export type BlogPostType = 'ARTICLE' | 'TIP' | 'NEWS' | 'GUIDE' | 'RESEARCH' | 'STORY'
export type AgeGroup = 'UNDER_3' | 'AGE_3_5' | 'AGE_6_8' | 'AGE_9_12' | 'ALL_AGES'

export interface BlogAuthorSummary {
  displayName: string
  avatarUrl: string | null
  slug: string
  role: string
}

export interface BlogCategorySummary {
  nameVi: string
  slug: string
  emoji: string | null
  color: string | null
}

export interface BlogTagSummary {
  slug: string
  nameVi: string
}

export interface BlogPostCardDTO {
  id: string
  slug: string
  type: BlogPostType
  titleVi: string
  excerptVi: string
  coverImageUrl: string | null
  publishedAt: Date | null
  readingTimeMin: number
  viewCount: number
  likeCount: number
  ageGroup: AgeGroup
  author: BlogAuthorSummary
  category: BlogCategorySummary
  tags: BlogTagSummary[]
}

export interface BlogPostFullDTO extends BlogPostCardDTO {
  contentHtml: string
  metaTitleVi: string | null
  metaDescVi: string | null
  ogImageUrl: string | null
  structuredData: unknown | null
  isFeatured: boolean
  isPinned: boolean
  coAuthorIds: string[]
  relatedPosts: BlogPostCardDTO[]
}

export interface BlogListParams {
  page?: number
  limit?: number
  category?: string
  tag?: string
  author?: string
  ageGroup?: AgeGroup
  type?: BlogPostType
  featured?: boolean
  sort?: 'latest' | 'popular' | 'trending'
}

export interface BlogListResult {
  posts: BlogPostCardDTO[]
  total: number
  totalPages: number
  page: number
}

export interface BlogSearchResult {
  results: BlogPostCardDTO[]
  total: number
  query: string
}

export interface CreateBlogPostInput {
  slug: string
  type: BlogPostType
  titleVi: string
  titleEn?: string
  excerptVi: string
  contentMarkdown: string
  categoryId: string
  authorId: string
  ageGroup: AgeGroup
  tagIds: string[]
  coverImageUrl?: string
  metaTitleVi?: string
  metaDescVi?: string
  scheduledAt?: Date
  status: BlogPostStatus
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  id: string
}

=== FILE 2: src/modules/blog/blog-markdown.ts ===

Use remark + remark-gfm + remark-html pipeline.
calculateReadingTime: count words (split on whitespace), divide by 200, Math.ceil, minimum 1.
renderMarkdown: async function returning HTML string.

=== FILE 3: src/modules/blog/blog-repository.ts ===

Import prisma from the project's prisma client location (check src/lib/prisma.ts).
Implement these functions:

findPostBySlug(slug: string): Promise<BlogPostFullDTO | null>
  - Query BlogPost where slug matches, include: author, category, tags.tag, relatedPosts.relatedPost (with author+category)
  - status must be PUBLISHED
  - Map to BlogPostFullDTO

findPosts(params: BlogListParams): Promise<{ posts: BlogPostCardDTO[], total: number }>
  - Filter: status = PUBLISHED
  - Apply category/tag/author/ageGroup/type filters if provided
  - Sort: publishedAt desc (default), viewCount desc (popular), publishedAt desc of last week (trending)
  - Paginate: skip = (page-1)*limit, take = limit
  - Return posts + total count (use prisma.$transaction for atomic count+find)

findFeaturedPosts(limit: number): Promise<BlogPostCardDTO[]>
  - isFeatured=true, status=PUBLISHED, featuredUntil IS NULL OR > now()
  - Ordered by publishedAt desc

findCategories(): all active categories ordered by orderNo
findTags(): all tags with _count of PUBLISHED posts
findAuthors(): all active authors with _count of PUBLISHED posts

incrementViewCount(postId: string): atomic increment
incrementLikeCount(postId: string): atomic increment

createPost(input: CreateBlogPostInput): creates post, connects tags via BlogPostTag
updatePost(input: UpdateBlogPostInput): updates post, syncs tags (deleteMany old, createMany new)

searchPosts(query: string, limit: number): Promise<BlogPostCardDTO[]>
  - Use prisma findMany with where: { status: 'PUBLISHED', OR: [{ titleVi: { contains: query, mode: 'insensitive' } }, { excerptVi: { contains: query, mode: 'insensitive' } }] }

=== FILE 4: src/modules/blog/blog-service.ts ===

Wraps blog-repository + blog-markdown with business logic:

getPostBySlug(slug): Gets post, renders markdown if contentHtml is null/empty
listPosts(params): Applies defaults (page=1, limit=12), enforces max limit=50
getFeaturedPosts(): findFeaturedPosts(3)
searchPosts(query): Validates 2-100 chars, calls repo
createPost(input, adminEmail): validates slug uniqueness, calculates readingTimeMin, calls repo.createPost
publishPost(id, adminEmail): { status: 'PUBLISHED', publishedAt: new Date() }

=== FILE 5: src/modules/blog/blog-seo.ts ===

Import Metadata from 'next'.
generateBlogPostMetadata(post, siteUrl): returns Next.js Metadata object
generateBlogPostJsonLd(post, siteUrl): returns JSON.stringify of schema.org Article
generateBlogListMetadata(): returns Metadata for blog homepage

=== FILE 6: src/modules/blog/newsletter-service.ts ===

Import prisma.
subscribe(email, opts): Upsert BlogNewsletterSubscriber (verified=false), generate cuid() verifyToken, return token
verifySubscription(token): find by verifyToken, set verified=true, clear verifyToken
unsubscribe(token): find by unsubToken, set unsubscribedAt=new Date()
getActiveSubscribers(): all where verified=true AND unsubscribedAt IS NULL

AFTER CREATING ALL FILES:
  pnpm type-check
  Fix all TypeScript errors before marking done.
