# Phase 4: Reader Accounts + In-App Notification System

## Context Links
- Admin auth: `src/lib/auth/admin-auth.ts` (Better Auth config pattern)
- Auth middleware: `src/lib/auth/admin.ts` (requireAdminParent pattern)
- Blog types: `src/modules/blog/blog-types.ts`
- Prisma schema: `prisma/schema.prisma`
- Blog post page: `src/app/(main)/blog/[slug]/page.tsx`
- Main layout: `src/app/(main)/layout.tsx`
- Env config: `src/lib/env.ts`

## Overview
- **Priority**: P2
- **Status**: completed
- **Effort**: ~10h
- Add reader accounts (sign up/login via dedicated reader auth APIs), bookmark posts, in-app notification bell with polling.

### Implementation Note
- Final implementation uses custom reader auth modules (`src/lib/auth/reader.ts`, `src/modules/reader/reader-auth-service.ts`) and explicit reader auth routes, not a separate Better Auth catch-all instance.

## Key Insights
- Reader auth is isolated from parent/admin auth via dedicated `ReaderAccount` + `ReaderSession` models and cookie `ccth_reader_session`.
- No conflict: separate session tables/cookies between reader and parent/admin.
- Reader model: lightweight - email, displayName, avatarUrl. No role-based access needed beyond "is reader".
- Notification polling: SWR `refreshInterval: 60000` only when reader logged in. No WebSocket.
- Bookmark = simple join table. No complex state.

## Requirements

### Functional
- **Reader Auth**:
  - Sign up with email + password
  - Login / logout
  - Session persistence via `ccth_reader_session` cookie
  - Reader profile page (name, email - read-only for now)
- **Bookmarks**:
  - Bookmark button on blog post page (heart/bookmark icon)
  - Toggle bookmark (add/remove)
  - "My Bookmarks" page listing saved posts
- **Notifications**:
  - Bell icon in navbar with unread count badge
  - Dropdown: last 10 notifications (read/unread)
  - Mark individual as read, "Mark all as read"
  - Notification types: comment reply (if reader commented), new post in bookmarked category
  - Poll unread count every 60s (only when logged in)

### Non-Functional
- Reader auth isolated from admin/parent auth (no session conflicts)
- Notification polling: max 1 req/min/reader, cached response
- Bookmarks: max 100 per reader
- Pages: SSR for auth-gated, ISR for public

## Architecture

### DB Schema Additions
```prisma
model ReaderAccount {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  displayName   String
  image         String?
  emailVerified Boolean  @default(false)
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions      ReaderSession[]
  bookmarks     BlogBookmark[]
  notifications BlogReaderNotification[]
}

model ReaderSession {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  readerId  String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  reader ReaderAccount @relation(fields: [readerId], references: [id], onDelete: Cascade)

  @@index([readerId])
  @@index([expiresAt])
}

model BlogBookmark {
  id        String   @id @default(cuid())
  readerId  String
  postId    String
  createdAt DateTime @default(now())

  reader ReaderAccount @relation(fields: [readerId], references: [id], onDelete: Cascade)
  post   BlogPost      @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([readerId, postId])
  @@index([readerId, createdAt(sort: Desc)])
}

model BlogReaderNotification {
  id        String   @id @default(cuid())
  readerId  String
  type      String   // "comment_reply" | "new_post"
  title     String
  message   String
  link      String?
  payload   Json?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  readAt    DateTime?

  reader ReaderAccount @relation(fields: [readerId], references: [id], onDelete: Cascade)

  @@index([readerId, isRead, createdAt(sort: Desc)])
  @@index([readerId, createdAt(sort: Desc)])
}
```

### Auth Architecture
```
Reader auth (custom session service):
  routes: /api/reader/auth/login, /signup, /logout, /me
  cookie: "ccth_reader_session"
  storage: ReaderSession table (hashed token + expiry)
  sign-up: enabled
  session expiry: 7 days
```

### Notification Flow
```
Trigger: Admin approves comment reply -> check if parent commenter is a reader
  -> Create BlogReaderNotification(type: "comment_reply")

Trigger: New post published -> find readers who bookmarked that category
  -> Bulk create BlogReaderNotification(type: "new_post")

Display: Reader visits site -> navbar polls GET /api/reader/notifications/unread-count
  -> Badge shows count
  -> Click bell -> dropdown fetches GET /api/reader/notifications?limit=10
```

## Related Code Files

### Files to Modify
- `prisma/schema.prisma` - add ReaderAccount, ReaderSession, BlogBookmark, BlogReaderNotification models, add bookmarks relation to BlogPost
- `src/lib/auth/reader.ts` - reader cookie/session helpers
- `src/app/(main)/layout.tsx` - add NotificationBell to navbar (conditionally for readers)
- `src/app/(main)/blog/[slug]/page.tsx` - add BookmarkButton component
- `src/modules/blog/comment-service.ts` - create notification on reply approval (if reader)
- `src/modules/blog/blog-service.ts` - create notification on publish (for bookmarked category readers)

### Files to Create
- `src/modules/reader/reader-auth-service.ts` - credential auth + reader session issuance
- `src/lib/auth/reader.ts` - helper: `getReaderSession()`, `requireReader()`
- `src/app/api/reader/auth/signup/route.ts` - reader signup
- `src/app/api/reader/auth/login/route.ts` - reader login
- `src/app/api/reader/auth/logout/route.ts` - reader logout
- `src/app/api/reader/auth/me/route.ts` - current reader session
- `src/modules/reader/reader-repository.ts` - bookmark + notification queries
- `src/modules/reader/reader-service.ts` - business logic
- `src/app/(main)/reader/login/page.tsx` - login page
- `src/app/(main)/reader/signup/page.tsx` - signup page
- `src/app/(main)/reader/bookmarks/page.tsx` - bookmarks list
- `src/app/api/reader/bookmarks/route.ts` - GET (list) + POST (add)
- `src/app/api/reader/bookmarks/[postId]/route.ts` - DELETE (remove)
- `src/app/api/reader/notifications/route.ts` - GET (list) + POST (mark read)
- `src/app/api/reader/notifications/unread-count/route.ts` - GET unread count
- `src/app/api/reader/notifications/[id]/read/route.ts` - POST mark single as read
- `src/components/blog/blog-bookmark-button.tsx` - bookmark toggle (client component)
- `src/components/layout/notification-bell.tsx` - bell icon + dropdown (client component)
- `src/components/reader/reader-login-form.tsx` - login form (client component)
- `src/components/reader/reader-signup-form.tsx` - signup form (client component)

## Implementation Steps

### Step 1: DB Migration (~30min)
1. Add `ReaderAccount`, `ReaderSession`, `BlogBookmark`, `BlogReaderNotification` models to `prisma/schema.prisma`
2. Add `bookmarks BlogBookmark[]` relation to BlogPost model
3. Run migration: `npx prisma migrate dev --name add-reader-accounts-bookmarks-notifications`
4. Verify generated types

### Step 2: Reader Auth Setup (~1.5h)
1. Create `src/modules/reader/reader-auth-service.ts`:
   ```ts
   // signup/login with password hashing + reader session token issuance
   export const readerAuthService = { signup, login };
   ```
2. Create `src/lib/auth/reader.ts`:
   ```ts
   export async function getReaderSession() { ... }
   export async function requireReaderFromRequest(request: Request) { ... }
   export function clearReaderSession(response: Response) { ... }
   ```
3. Create explicit auth routes:
   - `src/app/api/reader/auth/signup/route.ts`
   - `src/app/api/reader/auth/login/route.ts`
   - `src/app/api/reader/auth/logout/route.ts`
   - `src/app/api/reader/auth/me/route.ts`
4. Use `ccth_reader_session` cookie with secure/httpOnly defaults and 7-day TTL.

### Step 3: Reader Login/Signup Pages (~1h)
1. Create `src/components/reader/reader-login-form.tsx` (`"use client"`)
   - Email + password fields
   - Submit via `POST /api/reader/auth/login`
   - Error handling, loading state
   - Link to signup page
2. Create `src/components/reader/reader-signup-form.tsx` (`"use client"`)
   - Name, email, password fields
   - Zod validation on client side
   - Submit via `POST /api/reader/auth/signup`
   - Redirect to `/blog` after success
3. Create page wrappers:
   - `src/app/(main)/reader/login/page.tsx` - renders ReaderLoginForm
   - `src/app/(main)/reader/signup/page.tsx` - renders ReaderSignupForm
4. Style: match existing site design (slate palette, rounded-2xl cards)

### Step 4: Reader Repository + Service (~1h)
1. Create `src/modules/reader/reader-repository.ts`:
   - `addBookmark(readerId, postId)` - upsert to prevent duplicates
   - `removeBookmark(readerId, postId)` - delete
   - `findBookmarks(readerId, limit, offset)` - list bookmarked posts with card DTO data
   - `isBookmarked(readerId, postId)` - boolean check
   - `countBookmarks(readerId)` - for limit enforcement
   - `createNotification(data)` - insert notification
   - `bulkCreateNotifications(data[])` - for new post notifications
   - `findNotifications(readerId, limit)` - list with pagination
   - `countUnread(readerId)` - unread count
   - `markAsRead(notificationId, readerId)` - mark single
   - `markAllAsRead(readerId)` - mark all
2. Create `src/modules/reader/reader-service.ts`:
   - `toggleBookmark(readerId, postId)` - add if not exists, remove if exists
   - `getBookmarkStatus(readerId, postId)` - check if bookmarked
   - `notifyCommentReply(readerEmail, postSlug, commentId)` - find reader by email, create notification
   - `notifyNewPost(postId, categoryId)` - find readers who bookmarked posts in this category

### Step 5: Bookmark API + Button (~1h)
1. Create `src/app/api/reader/bookmarks/route.ts`:
   - `GET`: list bookmarked posts (requires reader auth)
   - `POST`: add bookmark `{ postId }` (requires reader auth, max 100 check)
2. Create `src/app/api/reader/bookmarks/[postId]/route.ts`:
   - `DELETE`: remove bookmark
3. Create `src/components/blog/blog-bookmark-button.tsx` (`"use client"`):
   - Props: `{ postId, initialBookmarked?: boolean }`
   - Icon: `Bookmark` (outline) / `BookmarkCheck` (filled) from Lucide
   - Toggle on click, optimistic update
   - If not logged in: redirect to `/reader/login`
   - SWR mutation for API call
4. Add BookmarkButton to `blog/[slug]/page.tsx` near share buttons

### Step 6: Bookmarks Page (~30min)
1. Create `src/app/(main)/reader/bookmarks/page.tsx`:
   - Server component, calls `requireReader()`
   - Fetch bookmarked posts via repository
   - Render grid of BlogCard components
   - Empty state: "Chua co bai viet nao duoc luu"

### Step 7: Notification APIs (~45min)
1. Create `src/app/api/reader/notifications/route.ts`:
   - `GET`: list last 10 notifications for reader
   - `POST`: `{ action: "mark_all_read" }` - mark all as read
2. Create `src/app/api/reader/notifications/unread-count/route.ts`:
   - `GET`: return `{ count: number }` - lightweight, cached 30s
3. Create `src/app/api/reader/notifications/[id]/read/route.ts`:
   - `POST`: mark single notification as read
4. All endpoints require reader auth

### Step 8: Notification Bell Component (~1.5h)
1. Create `src/components/layout/notification-bell.tsx` (`"use client"`):
   - Fetch unread count via SWR with `refreshInterval: 60000`
   - Only poll when reader session exists (check cookie or context)
   - Bell icon (`Bell` from Lucide) with red badge showing unread count
   - Click opens dropdown (absolute positioned)
   - Dropdown fetches last 10 notifications
   - Each item: title, message, timestamp, read/unread indicator
   - Click notification -> navigate to link + mark as read
   - "Mark all as read" button at bottom
   - Close on click outside (useRef + effect)
2. Add to `src/app/(main)/layout.tsx`:
   - Conditionally render NotificationBell when reader cookie exists
   - Place next to existing nav items

### Step 9: Notification Triggers (~1h)
1. Extend `src/modules/blog/comment-service.ts` `moderateComment()`:
   - After approval of reply, check if parent commenter email matches a ReaderAccount
   - If match: create BlogReaderNotification(type: "comment_reply")
   - Message: "Ai do da tra loi binh luan cua ban tren bai [title]"
   - Link: `/blog/{slug}#comments`
2. Extend `src/modules/blog/blog-service.ts` `publishPost()`:
   - After publish, find readers who bookmarked posts in same category
   - Bulk create BlogReaderNotification(type: "new_post")
   - Message: "Bai viet moi: {title}"
   - Link: `/blog/{slug}`
   - Limit: max 1000 notifications per publish event (prevent runaway)

### Step 10: Reader Nav Integration (~30min)
1. Update main layout navbar:
   - If reader logged in: show avatar/name + bell + "Dang xuat" link
   - If not: show "Dang nhap" link to `/reader/login`
2. Use `getReaderSession()` (server-side) to check auth state
3. Keep admin nav completely separate (different layout)

## Todo List
- [x] Add ReaderAccount, ReaderSession, BlogBookmark, BlogReaderNotification to Prisma
- [x] Run migration
- [x] Add reader auth cookie/session helpers
- [x] Create reader-auth-service.ts
- [x] Create reader.ts (session helpers)
- [x] Create reader auth routes (login/signup/logout/me)
- [x] Create login form component
- [x] Create signup form component
- [x] Create login page
- [x] Create signup page
- [x] Create reader-repository.ts
- [x] Create reader-service.ts
- [x] Create bookmark API routes
- [x] Create blog-bookmark-button.tsx
- [x] Add bookmark button to post page
- [x] Create bookmarks list page
- [x] Create notification API routes (list, unread-count, mark-read)
- [x] Create notification-bell.tsx
- [x] Add bell to main layout
- [x] Add notification triggers in comment-service
- [x] Add notification triggers in blog-service (publish)
- [x] Update navbar with reader auth state
- [x] Test sign up -> login -> bookmark -> notification flow
- [x] Test no session conflict between admin and reader

## Success Criteria
- Reader can sign up, log in, log out
- Reader can bookmark/unbookmark posts
- Bookmarks page shows saved posts
- Bell icon shows unread notification count
- Notification dropdown lists recent notifications
- Comment reply creates notification for reader
- New post creates notification for category-interested readers
- No conflict with admin auth (separate cookies, separate routes)
- Polling only active when reader logged in

## Risk Assessment
- **Auth conflict**: Main risk. Mitigated by separate cookie namespace and dedicated reader session storage. Test thoroughly: log in as admin + reader simultaneously.
- **Reader session isolation**: Reader auth uses dedicated `ReaderSession` records and cookie namespace, isolated from parent/admin sessions.
- **Notification spam**: Publishing a post could create 1000+ notifications. Batch insert with limit. Consider background job for large audiences.
- **Bookmark limit**: 100 bookmarks/reader prevents storage abuse. Show warning when approaching limit.
- **Polling overhead**: 60s interval per active reader. At 100 concurrent readers = 100 req/min. Acceptable. Cache unread count response for 30s.

## Security Considerations
- **Password hashing**: bcryptjs with 12 rounds (same as admin)
- **Session expiry**: 7 days for readers (longer than admin's 8h, appropriate for consumer)
- **Rate limiting**: Apply to signup (3/hour/IP), login (10/min/IP), bookmark (30/min/reader)
- **CSRF**: Reader auth routes enforce trusted-origin checks for state-changing requests
- **Notification access**: Reader can only see own notifications (readerId filter in all queries)
- **Bookmark privacy**: Reader bookmarks not visible to other readers or public
- **Email verification**: Optional future enhancement for reader accounts

## Next Steps
- Phase 5 (security hardening) should apply rate limits to reader API endpoints
- Future: reader profile editing, avatar upload, email preferences
- Future: social login (Google, Facebook) for readers


