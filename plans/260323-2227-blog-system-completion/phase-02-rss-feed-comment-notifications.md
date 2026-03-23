# Phase 2: RSS Feed + Comment Email Notifications

## Context Links
- Email infrastructure: `src/modules/platform/lifecycle-email-service.ts` (Resend provider)
- Comment service: `src/modules/blog/comment-service.ts`
- Comment API: `src/app/api/blog/posts/[slug]/comments/route.ts`
- Newsletter service: `src/modules/blog/newsletter-service.ts`
- Blog SEO: `src/modules/blog/blog-seo.ts`
- Worker queue: `src/worker/queue.ts`
- Verify comment job: `src/worker/jobs/verify-blog-comment-email.ts`
- Prisma schema: `prisma/schema.prisma` (BlogComment model, line ~815)

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: ~3h
- Add RSS 2.0 feed endpoint. Add email notification when someone replies to an approved comment.

## Key Insights
- Email sending uses Resend API via `lifecycle-email-service.ts` — reuse `sendEmail` pattern
- Comment system already has email verification flow (BullMQ job `verify-blog-comment-email`)
- BlogComment model has `authorEmail` field — use for reply notifications
- RSS standard requires: title, link, description, pubDate, guid per item
- Next.js route handler can return XML with proper content-type

## Requirements

### Functional
- RSS feed at `/feed.xml` returning valid RSS 2.0 XML
- Include last 20 published posts with full content
- When a comment reply is approved, email the parent comment author
- Unsubscribe link in notification email (per-comment opt-out)
- RSS auto-discovery `<link>` tag in blog layout head

### Non-Functional
- RSS: cache with `revalidate = 3600` (1 hour)
- Email: async via BullMQ job (don't block comment moderation)
- Unsubscribe: one-click via token (no auth required)

## Architecture

```
RSS Feed:
  GET /feed.xml → route handler → blogRepository.findPosts(20) → XML response

Comment Reply Notification:
  Admin approves comment → commentService.moderateComment()
    → if comment has parentId and parent is approved
    → enqueue "notify-comment-reply" job
    → worker sends email via Resend
    → email includes unsubscribe link with token
```

### DB Changes
Add `notifyOnReply` boolean field to BlogComment model (default: true).
No new model needed — unsubscribe toggles this field via a token.

## Related Code Files

### Files to Modify
- `prisma/schema.prisma` — add `notifyOnReply Boolean @default(true)` to BlogComment
- `src/modules/blog/comment-service.ts` — extend `moderateComment` to trigger notification
- `src/worker/queue.ts` — add `enqueueNotifyCommentReply` job type
- `src/app/(main)/blog/layout.tsx` or root layout — add RSS auto-discovery link

### Files to Create
- `src/app/(main)/feed.xml/route.ts` — RSS feed route handler
- `src/worker/jobs/notify-blog-comment-reply.ts` — BullMQ job for sending reply notification email
- `src/app/api/blog/comments/unsubscribe/route.ts` — unsubscribe from reply notifications

## Implementation Steps

### Step 1: RSS Feed Route (~1h)
1. Create `src/app/(main)/feed.xml/route.ts`
2. Export async `GET` function:
   ```ts
   import * as blogRepository from "@/modules/blog/blog-repository";
   import { env } from "@/lib/env";

   export const revalidate = 3600;

   export async function GET() {
     const posts = await blogRepository.findPosts({
       page: 1,
       limit: 20,
       sort: "latest",
     });

     const siteUrl = env.BETTER_AUTH_URL.replace(/\/$/, "");
     const xml = buildRssFeed(siteUrl, posts.posts);

     return new Response(xml, {
       headers: {
         "Content-Type": "application/rss+xml; charset=utf-8",
         "Cache-Control": "public, max-age=3600, s-maxage=3600",
       },
     });
   }
   ```
3. Implement `buildRssFeed(siteUrl, posts)` function:
   - Channel: title="Cung Con Tu Hoc Blog", link=siteUrl/blog, description, language="vi"
   - Items: title (titleVi), link (/blog/slug), description (excerptVi), pubDate (RFC 2822), guid (permalink), category (nameVi), author (displayName)
   - Escape XML entities in all text fields
4. Add RSS auto-discovery link in blog layout or head:
   ```html
   <link rel="alternate" type="application/rss+xml" title="Blog RSS" href="/feed.xml" />
   ```

### Step 2: DB Migration — notifyOnReply (~15min)
1. Add to `prisma/schema.prisma` BlogComment model:
   ```prisma
   notifyOnReply Boolean @default(true)
   ```
2. Run `npx prisma migrate dev --name add-comment-notify-on-reply`
3. Generate Prisma client

### Step 3: Comment Reply Notification Job (~1h)
1. Create `src/worker/jobs/notify-blog-comment-reply.ts`
   - Input: `{ parentCommentId, replyCommentId, postSlug }`
   - Fetch parent comment (authorName, authorEmail, notifyOnReply)
   - If `notifyOnReply` is false, skip
   - Build email: "Ai do da tra loi binh luan cua ban..."
   - Include link to post + #comments anchor
   - Include unsubscribe link: `/api/blog/comments/unsubscribe?token={verifyToken}`
   - Use same Resend API pattern as `lifecycle-email-service.ts`
2. Register job in worker dispatcher (follow existing pattern in `src/worker/`)

### Step 4: Extend Comment Moderation (~30min)
1. Open `src/modules/blog/comment-service.ts`
2. In `moderateComment()`, after status update:
   ```ts
   if (status === "APPROVED" && comment.parentId) {
     const parentComment = await prisma.blogComment.findUnique({
       where: { id: comment.parentId },
       select: { id: true, authorEmail: true, notifyOnReply: true, status: true },
     });
     if (parentComment?.status === "APPROVED" && parentComment.notifyOnReply) {
       await enqueueNotifyCommentReply({
         parentCommentId: parentComment.id,
         replyCommentId: id,
         postSlug: comment.post.slug,
       });
     }
   }
   ```
3. Update `moderateComment` to include relation data needed for notification check

### Step 5: Unsubscribe Endpoint (~15min)
1. Create `src/app/api/blog/comments/unsubscribe/route.ts`
2. `GET` handler: read `token` from search params
3. Find comment by `verifyToken` (reuse existing token field or generate separate unsubToken)
4. Set `notifyOnReply = false`
5. Return simple HTML page: "Ban da tat thong bao tra loi binh luan."

## Todo List
- [ ] Create RSS feed route handler at `/feed.xml`
- [ ] Add `buildRssFeed` function with proper XML escaping
- [ ] Add RSS auto-discovery link to blog layout
- [ ] Add `notifyOnReply` field to BlogComment model
- [ ] Run Prisma migration
- [ ] Create BullMQ job for comment reply notification
- [ ] Extend `moderateComment` to trigger notification on reply approval
- [ ] Create unsubscribe endpoint
- [ ] Test RSS feed validates with W3C Feed Validation Service
- [ ] Test email notification flow end-to-end

## Success Criteria
- `/feed.xml` returns valid RSS 2.0 XML with latest 20 posts
- RSS auto-discovery tag in page source
- When admin approves a reply, parent commenter receives email
- Unsubscribe link in email works (sets notifyOnReply=false)
- No email sent if parent commenter already unsubscribed

## Risk Assessment
- **XML injection**: Must escape `&`, `<`, `>`, `"` in all RSS text fields. Use dedicated escape function.
- **Email spam**: Reply notifications could be abused if comment volume is high. Rate limiting on comment submit (Phase 5) mitigates this.
- **verifyToken reuse**: BlogComment already uses `verifyToken` for email verification. After verification, token is set to null. For unsubscribe, generate a separate `unsubToken` field or use comment ID + HMAC.

## Security Considerations
- RSS feed: read-only, no auth needed. Cache aggressively.
- Unsubscribe endpoint: use cryptographic token, not predictable IDs
- Email content: don't include full comment text (prevents email phishing via comment injection)

## Next Steps
- Phase 3 can begin independently after this phase
- Newsletter widget in sidebar (from Phase 1) links naturally to RSS
