# Phase 3: Post Version History + Admin Bulk Operations

## Context Links
- Prisma schema: `prisma/schema.prisma` (BlogPost model line ~767)
- Blog service: `src/modules/blog/blog-service.ts`
- Blog repository: `src/modules/blog/blog-repository.ts` (452 lines - monitor size)
- Admin posts page: `src/app/(main)/admin/blog/posts/page.tsx`
- Admin post form: `src/components/admin-blog-post-form.tsx`
- Admin comments page: `src/app/(main)/admin/blog/comments/page.tsx`
- Admin comments moderation: `src/components/admin-blog-comments-moderation.tsx`
- Admin blog API: `src/app/api/admin/blog/posts/` directory

## Overview
- **Priority**: P2
- **Status**: completed
- **Effort**: ~5h
- Add version history for blog posts (snapshot on publish/save). Add bulk select + actions for admin posts and comments lists.

## Key Insights
- Blog post editor already calls `updatePost` and `publishPost` in blog-service - hook version save there
- Admin posts page uses server-side rendering with Prisma queries, no client-side state
- Admin comments page uses `admin-blog-comments-moderation.tsx` component
- Bulk operations need client-side state (checkbox selection) - requires `"use client"` wrapper
- Existing admin page pattern: server component fetches data, renders table with shadcn Table components

## Requirements

### Functional
- **Version History**:
  - New `BlogPostVersion` model storing content snapshot
  - Version created on: status change (publish/archive/schedule), explicit "Save version" button
  - Admin: versions sidebar in post editor showing timestamp + saved-by info
  - Restore button: loads version content into editor fields
  - No auto-save versioning (prevent storage bloat)
- **Bulk Operations**:
  - Posts list: checkbox per row + "Select all" header checkbox
  - Bulk actions dropdown: Publish, Archive, Delete (with confirmation)
  - Comments list: checkbox per row + bulk Approve, Reject, Mark as Spam

### Non-Functional
- Version diff viewer: optional/deferred (nice-to-have, not MVP)
- Bulk delete: soft-delete (set status=ARCHIVED) not hard delete
- Bulk operations: max 50 items per request

## Architecture

### DB Schema Addition
```prisma
model BlogPostVersion {
  id               String   @id @default(cuid())
  postId           String
  titleVi          String
  contentMarkdown  String
  excerptVi        String
  metaTitleVi      String?
  metaDescVi       String?
  coverImageUrl    String?
  status           BlogPostStatus
  savedBy          String?        // admin email who triggered save
  createdAt        DateTime @default(now())

  post BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId, createdAt(sort: Desc)])
}
```

### Bulk Operations Flow
```
Admin selects posts -> clicks "Publish" in dropdown
  -> Client sends POST /api/admin/blog/posts/bulk
  -> Body: { action: "publish", postIds: ["id1", "id2"] }
  -> Server validates admin session, executes Prisma updateMany
  -> Revalidate admin posts page cache
```

## Related Code Files

### Files to Modify
- `prisma/schema.prisma` - add BlogPostVersion model, add versions relation to BlogPost
- `src/modules/blog/blog-service.ts` - add version save on publish/update
- `src/app/(main)/admin/blog/posts/page.tsx` - add checkbox column, bulk actions bar
- `src/components/admin-blog-post-form.tsx` - add "Save version" button, versions sidebar
- `src/components/admin-blog-comments-moderation.tsx` - add checkboxes, bulk actions
- `src/modules/blog/blog-repository.ts` - add version CRUD queries

### Files to Create
- `src/modules/blog/blog-version-repository.ts` - version queries (keep blog-repository under 200 lines)
- `src/components/admin-blog-post-versions-sidebar.tsx` - versions list in editor sidebar
- `src/components/admin-blog-bulk-actions-bar.tsx` - reusable bulk action bar (posts + comments)
- `src/app/api/admin/blog/posts/bulk/route.ts` - bulk operations endpoint
- `src/app/api/admin/blog/comments/bulk/route.ts` - bulk comment operations endpoint
- `src/app/api/admin/blog/posts/[id]/versions/route.ts` - list + create versions

## Implementation Steps

### Step 1: DB Migration (~30min)
1. Add `BlogPostVersion` model to `prisma/schema.prisma`:
   - Fields: id, postId, titleVi, contentMarkdown, excerptVi, metaTitleVi, metaDescVi, coverImageUrl, status, savedBy, createdAt
   - Relation: `post BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)`
   - Index: `@@index([postId, createdAt(sort: Desc)])`
2. Add to BlogPost model: `versions BlogPostVersion[]`
3. Run migration: `npx prisma migrate dev --name add-blog-post-versions`

### Step 2: Version Repository (~45min)
1. Create `src/modules/blog/blog-version-repository.ts`
2. Functions:
   - `createVersion(postId, snapshot, savedBy?)` - insert version record
   - `findVersionsByPostId(postId, limit = 20)` - list versions desc by createdAt
   - `findVersionById(versionId)` - get single version for restore
   - `deleteOldVersions(postId, keepCount = 50)` - cleanup, keep max 50 per post
3. Export all functions

### Step 3: Integrate Version Save into Blog Service (~30min)
1. Open `src/modules/blog/blog-service.ts`
2. In `publishPost()`: after status update, call `createVersion()` with current post data
3. In `updatePost()`: if status changes, call `createVersion()`
4. Import from `blog-version-repository`
5. Version snapshot includes: titleVi, contentMarkdown, excerptVi, metaTitleVi, metaDescVi, coverImageUrl, status

### Step 4: Version API Endpoints (~30min)
1. Create `src/app/api/admin/blog/posts/[id]/versions/route.ts`
2. `GET`: list versions for post (admin auth required)
   ```ts
   const versions = await findVersionsByPostId(postId, 20);
   return NextResponse.json({ versions });
   ```
3. `POST`: manually save current version (admin auth + "Save version" button)
   - Fetch current post data
   - Call `createVersion()`
4. Auth: use `requireAdminParent()` pattern from existing admin routes

### Step 5: Versions Sidebar Component (~1h)
1. Create `src/components/admin-blog-post-versions-sidebar.tsx` (`"use client"`)
2. Props: `{ postId: string }`
3. Fetch versions via SWR from `/api/admin/blog/posts/{id}/versions`
4. Render list: timestamp, savedBy, status at time of save
5. "Restore" button per version: calls parent callback with version data to populate form fields
6. "Save version" button at top: POST to versions endpoint
7. Style: collapsible sidebar panel, matches admin design system (admin-card-bg, admin-card-border)

### Step 6: Bulk Actions Bar Component (~45min)
1. Create `src/components/admin-blog-bulk-actions-bar.tsx` (`"use client"`)
2. Props: `{ selectedIds: string[], onAction: (action, ids) => void, actions: ActionDef[] }`
3. Sticky bar appears when `selectedIds.length > 0`
4. Shows: "{N} selected" + action buttons
5. Confirmation dialog for destructive actions (delete/archive)
6. Reusable for both posts and comments

### Step 7: Admin Posts Bulk Operations (~1h)
1. Create `src/app/api/admin/blog/posts/bulk/route.ts`
   ```ts
   const schema = z.object({
     action: z.enum(["publish", "archive", "delete"]),
     postIds: z.array(z.string()).min(1).max(50),
   });
   ```
   - `publish`: updateMany status=PUBLISHED, set publishedAt
   - `archive`: updateMany status=ARCHIVED
   - `delete`: updateMany status=ARCHIVED (soft delete, not hard delete)
   - Auth: `requireAdminParent()`
2. Modify `src/app/(main)/admin/blog/posts/page.tsx`:
   - Wrap table in client component for checkbox state
   - Create `src/components/admin-blog-posts-table.tsx` (`"use client"`) that receives posts data
   - Add checkbox column to table header + each row
   - Render `AdminBlogBulkActionsBar` when items selected
   - On action complete: `router.refresh()` to reload server data

### Step 8: Admin Comments Bulk Operations (~45min)
1. Create `src/app/api/admin/blog/comments/bulk/route.ts`
   ```ts
   const schema = z.object({
     action: z.enum(["approve", "reject", "spam"]),
     commentIds: z.array(z.string()).min(1).max(50),
   });
   ```
2. Modify `src/components/admin-blog-comments-moderation.tsx`:
   - Add checkbox state management
   - Render bulk actions bar
   - Actions: Approve (APPROVED), Reject (REJECTED), Spam (SPAM)

## Todo List
- [x] Add BlogPostVersion model to Prisma schema
- [x] Run migration
- [x] Create `blog-version-repository.ts`
- [x] Integrate version save into `publishPost` and `updatePost`
- [x] Create versions API endpoint (GET + POST)
- [x] Create `admin-blog-post-versions-sidebar.tsx`
- [x] Integrate versions sidebar into post editor form
- [x] Create `admin-blog-bulk-actions-bar.tsx`
- [x] Create bulk posts API endpoint
- [x] Add checkboxes + bulk bar to admin posts page
- [x] Create bulk comments API endpoint
- [x] Add checkboxes + bulk bar to admin comments page
- [x] Test version save on publish
- [x] Test version restore populates form
- [x] Test bulk operations with 5+ items

## Success Criteria
- Version created automatically on publish/status change
- Manual "Save version" button works in editor
- Versions sidebar shows list with timestamps
- Restore button populates editor with version content
- Admin can multi-select posts -> bulk publish/archive
- Admin can multi-select comments -> bulk approve/reject/spam
- Max 50 versions per post (auto-cleanup)

## Risk Assessment
- **Blog repository size**: Already 452 lines. Creating separate `blog-version-repository.ts` prevents bloat.
- **Admin posts page refactor**: Converting server table to client component for checkboxes. Keep data fetching in server component, pass as props to client table.
- **Version storage**: Large posts with many saves could grow DB. Limit 50 versions/post + cleanup job.
- **Bulk delete safety**: Only soft-delete (archive). No hard delete from bulk actions.

## Security Considerations
- All version/bulk endpoints require `requireAdminParent()` auth check
- Bulk operations: validate postIds/commentIds exist before operating
- Version restore: only populates form, doesn't auto-save (admin must explicitly save)
- Zod validation on all bulk API inputs
- Max 50 items per bulk request to prevent DoS

## Next Steps
- Phase 4 (reader accounts) can begin after DB migration from this phase
- Version diff viewer is deferred - can be added later as enhancement


