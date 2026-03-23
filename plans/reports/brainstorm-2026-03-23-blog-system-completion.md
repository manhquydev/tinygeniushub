# Brainstorm: Blog System Completion
**Date**: 2026-03-23
**Project**: cungcontuhoc.io.vn
**Purpose**: Content marketing cho phụ huynh

---

## Problem Statement

Hệ thống blog đã có infrastructure đầy đủ (82+ files, 15 public API, 9 admin pages) nhưng cần hoàn thiện:
1. UI/UX chưa đạt chuẩn editorial layout — icon inconsistent, thiếu sidebar
2. Thiếu tính năng: RSS, version history, comment notifications, reader accounts
3. Security gaps: rate limiting + input validation trên public endpoints

---

## Current State

- **Icon system**: Lucide React (108 files) — đã outline style, nhưng có chỗ dùng fill/color
- **Blog index**: Có hero + featured card nhưng thiếu sidebar (categories, newsletter, trending)
- **Blog card**: Light theme, decent layout — cần polish
- **Auth**: Better Auth với admin roles, parent/child accounts — chưa có reader accounts
- **Email infra**: Đã có (newsletter, comment verification) — có thể tận dụng
- **DB models**: BlogPost, BlogComment, BlogAuthor, BlogCategory, BlogTag, BlogNewsletterSubscriber, BlogReadHistory

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Blog layout | Modern editorial | Hero + 3-col grid + 2/3 main + 1/3 sidebar |
| Icon system | Keep Lucide, audit & fix consistency | Không cần đổi lib, chỉ cần audit |
| Reader accounts | Include | Cần cho bookmark + notification tracking |
| Notifications | Email + Bell icon in-app | Đủ bộ, UX tốt hơn email-only |
| RSS Feed | Include | Low effort, high SEO value |
| Version history | Include | Quan trọng cho content team |
| Admin bulk ops | Include | UX improvement cho moderators |

---

## Implementation Phases

### Phase 1: UI/UX Blog Public Pages
**Scope**: Blog index, blog card, blog post page, icon audit
- Icon audit toàn bộ blog components — đảm bảo monochrome outline Lucide
- Blog index: Editorial layout với proper sidebar (categories, newsletter, trending)
- Blog card: Improve typography, hover states, mobile responsive
- Blog post page: Reading UX — TOC sticky, progress bar, author card, related posts
- Category page: Filter + sort UI

**Files**: `blog-card.tsx`, `blog-card-featured.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx`, `blog-toc.tsx`, `blog-reading-progress.tsx`

### Phase 2: RSS Feed + Comment Email Notifications
**Scope**: RSS endpoint, email notification on comment reply
- RSS 2.0 feed tại `/feed.xml` hoặc `/api/blog/rss`
- Email notification khi có reply vào comment của mình (extend comment-service.ts)
- Template email cho comment reply notification
- Unsubscribe từ notifications per-comment

**Files**: `api/blog/rss/route.ts` (new), `comment-service.ts`, email template

### Phase 3: Post Version History + Admin Bulk Operations
**Scope**: Version history cho posts, bulk actions trong admin
- New DB model: `BlogPostVersion` — snapshot mỗi lần save/publish
- Admin: restore về version cũ, diff view
- Admin posts list: bulk select → bulk publish/archive/delete
- Admin comments: bulk approve/reject/spam

**DB**: New `BlogPostVersion` model
**Files**: `blog-repository.ts`, `blog-service.ts`, `admin-blog-post-form.tsx`, admin pages

### Phase 4: Reader Accounts + In-App Notification System
**Scope**: Reader sign-up/login, bookmark posts, bell notification icon
- New auth flow cho readers (separate từ parent/admin)
- Reader profile: bookmark/saved posts, notification preferences
- `BlogBookmark` DB model
- `BlogNotification` DB model — track unread notifications
- Navbar: bell icon với unread count badge, dropdown list
- API: `/api/reader/notifications`, `/api/reader/bookmarks`

**DB**: `BlogReader`, `BlogBookmark`, `BlogNotification` models
**Files**: Multiple new files + auth extension

### Phase 5: Security Hardening
**Scope**: Rate limiting, input validation, caching
- Rate limit: comment submit (5/hour/IP), like (10/min/IP), newsletter sub (3/hour/IP)
- Input validation với Zod trên tất cả public blog API routes
- Redis caching cho blog index, featured posts, categories
- Spam detection cơ bản cho comments (keyword filter)

---

## Architecture Considerations

**Reader Auth strategy**:
- Option A: Extend Better Auth với thêm role `reader` — tận dụng session infra có sẵn
- Option B: Separate lightweight auth cho readers — ít conflict với parent/admin auth
- **Decision**: Option A — extend Better Auth, add `reader` role, separate session cookie prefix

**Notification system**:
- DB-backed (`BlogNotification` table) — không cần WebSocket, polling đơn giản
- Bell icon dùng SWR/React Query để poll `/api/reader/notifications/unread-count` mỗi 60s
- KISS: không cần real-time WebSocket cho blog notifications

**RSS Feed**:
- Static generation với `revalidate = 3600`
- Standard RSS 2.0 XML
- Include: title, description, author, pubDate, category, content:encoded

---

## Risks

| Risk | Mitigation |
|------|------------|
| Reader auth conflict với parent auth | Dùng separate session cookie + route prefix |
| Version history storage bloat | Chỉ lưu khi status thay đổi hoặc explicit save, không auto-save |
| Bell icon polling overhead | Cache unread count 60s, chỉ fetch khi logged in |
| Blog index performance với sidebar | Parallel data fetching, cache categories/featured 10min |

---

## Success Criteria

- [ ] Blog index có proper editorial layout với sidebar
- [ ] Icon hoàn toàn consistent (monochrome outline Lucide)
- [ ] RSS feed hoạt động tại `/feed.xml`
- [ ] Comment reply gửi email notification
- [ ] Reader có thể sign up và bookmark posts
- [ ] Bell icon hiển thị unread notifications
- [ ] Admin có thể xem version history và bulk-operate
- [ ] Rate limiting protect public endpoints

---

## Unresolved Questions

- Reader auth: cần xem schema Better Auth hiện tại có dễ extend không (cần scout thêm)
- Blog index performance: categories/featured đang được cache hay refetch mỗi request?
- Notification email template: dùng cùng email service với newsletter không?
