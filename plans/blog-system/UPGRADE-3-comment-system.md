# CODEX UPGRADE: Blog — Comment System

## Context
Add a full comment system to blog posts. Comments are tied to posts, support threaded replies (1 level deep), and require email verification before publishing.

Zero breaking changes. New Prisma models added via migration.

## STEP 1 — Prisma Schema

Open `prisma/schema.prisma`. Add at the bottom:

```prisma
enum BlogCommentStatus {
  PENDING   // awaiting verification or moderation
  APPROVED
  SPAM
  DELETED
}

model BlogComment {
  id          String              @id @default(cuid())
  postId      String
  parentId    String?             // null = top-level, set = reply to parentId
  authorName  String
  authorEmail String
  content     String              @db.Text
  status      BlogCommentStatus   @default(PENDING)
  verifyToken String?             @unique
  likeCount   Int                 @default(0)
  ipHash      String?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  post        BlogPost            @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent      BlogComment?        @relation("CommentReplies", fields: [parentId], references: [id])
  replies     BlogComment[]       @relation("CommentReplies")

  @@index([postId, status, createdAt])
  @@index([parentId])
  @@index([authorEmail, createdAt])
}
```

Also add to BlogPost model (inside the model block, before the closing `}`):
```prisma
  comments   BlogComment[]
```

Run migration:
```bash
pnpm db:migrate --name add-blog-comments
pnpm db:generate
```

## STEP 2 — Comment Service

Create: `src/modules/blog/comment-service.ts`

```typescript
import { prisma } from '@/lib/db'  // use actual prisma path
import { createId } from '@paralleldrive/cuid2'

export const commentService = {
  async getApprovedComments(postId: string) {
    return prisma.blogComment.findMany({
      where: { postId, status: 'APPROVED', parentId: null },
      include: {
        replies: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async submitComment(data: {
    postId: string
    parentId?: string
    authorName: string
    authorEmail: string
    content: string
    ipHash?: string
  }) {
    // Basic spam check: no URLs in content, content 10-2000 chars
    if (data.content.length < 10 || data.content.length > 2000) {
      throw new Error('Comment must be 10–2000 characters.')
    }
    if (/https?:\/\//i.test(data.content) && (data.content.match(/https?:\/\//gi)?.length ?? 0) > 2) {
      throw new Error('Too many URLs detected.')
    }

    const verifyToken = createId()
    const comment = await prisma.blogComment.create({
      data: {
        ...data,
        status: 'PENDING',
        verifyToken,
      },
    })
    return { comment, verifyToken }
  },

  async verifyComment(token: string) {
    const comment = await prisma.blogComment.findUnique({ where: { verifyToken: token } })
    if (!comment) return false
    await prisma.blogComment.update({
      where: { id: comment.id },
      data: { status: 'APPROVED', verifyToken: null },
    })
    return true
  },

  async moderateComment(id: string, status: 'APPROVED' | 'SPAM' | 'DELETED') {
    return prisma.blogComment.update({ where: { id }, data: { status } })
  },

  async getPendingComments() {
    return prisma.blogComment.findMany({
      where: { status: 'PENDING' },
      include: { post: { select: { slug: true, titleVi: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  },
}
```

## STEP 3 — API Routes

### `src/app/api/blog/posts/[slug]/comments/route.ts`

**GET:**
- Find post by slug → get id
- `commentService.getApprovedComments(post.id)`
- Return `{ comments }`
- Cache-Control: no-store (always fresh)

**POST:**
- Parse body with Zod: `{ authorName: z.string().min(2).max(50), authorEmail: z.string().email(), content: z.string().min(10).max(2000), parentId: z.string().optional() }`
- Find post by slug → get id
- IP hash: `crypto.createHash('sha256').update(request.headers.get('x-forwarded-for') ?? '').digest('hex').slice(0, 16)`
- `commentService.submitComment({ postId: post.id, ...body, ipHash })`
- Enqueue email verification job (see below)
- Return 201 `{ message: 'Vui long kiem tra email de duyet binh luan' }`

### `src/app/api/blog/comments/verify/route.ts`

**GET:**
- Get `token` from searchParams
- `commentService.verifyComment(token)` → redirect to `/blog/[slug]?commented=true`
- If token not found → redirect to `/blog?comment-error=true`

### `src/app/api/admin/blog/comments/route.ts`

**GET** (admin auth):
- `commentService.getPendingComments()`
- Return `{ comments }`

**PATCH** (admin auth):
- Body: `{ id, status }` — validate status is APPROVED/SPAM/DELETED
- `commentService.moderateComment(id, status)`
- Return `{ ok: true }`

## STEP 4 — Email Verification (BullMQ)

Study `src/worker/jobs/` for existing job pattern. Add job handler for `'verify-blog-comment'`:

```typescript
// src/worker/jobs/verify-blog-comment-email.ts
// data: { commentId, authorName, authorEmail, postSlug, verifyToken }
// Send email via existing email adapter with:
// - Subject: "Xac nhan binh luan cua ban tren CungConTuHoc"
// - Body: link to /api/blog/comments/verify?token={verifyToken}
// Copy email sending pattern from another worker job
```

Register this handler in `src/worker/index.ts` (or wherever jobs are registered).

## STEP 5 — Comment UI Components

### `src/components/blog/blog-comment-form.tsx` — `'use client'`
State: authorName, authorEmail, content, loading, success, error.
On submit: POST to `/api/blog/posts/[slug]/comments`
- Disable after success, show: "Cam on! Hay kiem tra email {email} de duyet binh luan."

Form fields:
- Name (text, required)
- Email (email, required) — note: "Email chi dung de xac nhan, khong hien thi cong khai"  
- Comment (textarea, 10-2000 chars, show counter)
- Submit button "Gui binh luan"

### `src/components/blog/blog-comment-card.tsx` — Server component
Props: `{ comment: BlogComment & { replies: BlogComment[] } }`
Render:
- Commenter initial avatar (first letter of name, colored background)
- Name + date (formatted Vietnamese)
- Content (sanitized plain text — DO NOT use dangerouslySetInnerHTML)
- "Tra loi" button → toggles reply form (inline BlogCommentForm with parentId set)
- Replies nested below (same card structure, indented)

### `src/components/blog/blog-comments-section.tsx` — `'use client'`
Fetch comments from `/api/blog/posts/[slug]/comments` via useEffect.
Show: heading "Binh luan ({count})", list of BlogCommentCards, then BlogCommentForm at bottom.
Handle `?commented=true` searchParam: show success banner "Binh luan da duoc gui! Kiem tra email de xac nhan."

## STEP 6 — Integrate into Blog Post Page

Open `src/app/(main)/blog/[slug]/page.tsx`.
Below the related posts section, add:

```typescript
import { BlogCommentsSection } from '@/components/blog/blog-comments-section'

// At the bottom of the article:
<section id="comments">
  <BlogCommentsSection slug={params.slug} />
</section>
```

## STEP 7 — Admin Moderation Page

Open or create `src/app/admin/blog/comments/page.tsx`.
Server component with admin auth.
Fetch pending comments. For each:
- Show: post title link, commenter name, preview of content (100 chars), date
- Three action buttons: "Duyet" (APPROVED), "Spam" (SPAM), "Xoa" (DELETED)
- These call PATCH `/api/admin/blog/comments` client-side, then `router.refresh()`

Add to admin nav in `admin-shell-nav.tsx`:
- `/admin/blog/comments` — "Binh luan" with MessageCircle icon (lucide-react)

## STEP 8 — Validation

```bash
pnpm db:migrate --name add-blog-comments
pnpm db:generate
pnpm type-check
```

Test flow:
1. Visit `/blog/[slug]` → see comment form at bottom
2. Submit comment → receive verification email (or check console in dev)
3. Click verify link → comment appears on post
4. Admin: `/admin/blog/comments` → see pending + approve
