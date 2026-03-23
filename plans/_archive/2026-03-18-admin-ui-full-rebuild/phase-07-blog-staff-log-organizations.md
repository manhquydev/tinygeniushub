# Phase 7: Blog CMS + Staff + Log + Organizations Pages

## Context Links
- Blog post form: `src/components/admin-blog-post-form.tsx`
- Blog sub-components: `admin-blog-author-create-form.tsx`, `admin-blog-category-create-form.tsx`, `admin-blog-comments-moderation.tsx`, `admin-blog-newsletter-export-button.tsx`
- Staff panel: `src/components/admin-staff-panel.tsx`
- Action log panel: `src/components/admin-action-log-panel.tsx`
- Organizations panel: `src/components/admin-organizations-panel.tsx`
- Footer social links: `src/components/admin-footer-social-links-panel.tsx`
- Blog pages: `src/app/(main)/admin/blog/*.tsx` (7 page files)
- Staff page: `src/app/(main)/admin/staff/page.tsx`
- Log page: `src/app/(main)/admin/log/page.tsx`
- Organizations page: `src/app/(main)/admin/organizations/page.tsx`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- **Description:** Rebuild Blog CMS (posts, categories, authors, newsletter, comments, analytics), Staff management, Audit Log viewer, and Organizations panel.

## Key Insights
- Blog is the largest sub-module with 7 page routes and rich form (markdown editor, image upload, SEO fields)
- Blog post form is likely the most complex single component — preserve existing editor integration
- Staff panel: CRUD for admin accounts with role assignment
- Audit log: filterable/searchable table of admin actions
- Organizations: teacher org management with member lists (Super Admin only)
- Footer social links panel recently added — simple form

## Requirements
### Functional
- Blog: post list table, post create/edit form (title, slug, content, category, author, SEO), category CRUD, author CRUD, newsletter subscriber export, comment moderation, blog analytics
- Staff: staff list table, create/invite form, role selector (Super Admin / Staff Admin)
- Audit Log: searchable/filterable action log table with timestamps, actor, action type
- Organizations: org list, member table, progress per class

### Non-functional
- Blog post form: preserve existing markdown/rich text editor — only wrap in shadcn Form layout
- All Super Admin-only pages: keep existing access guards

## Related Code Files
### Modify (visual layer only)
- `src/components/admin-blog-post-form.tsx` — shadcn Form + Input + Select + Textarea
- `src/components/admin-blog-author-create-form.tsx` — shadcn Dialog + Form
- `src/components/admin-blog-category-create-form.tsx` — shadcn Dialog + Form
- `src/components/admin-blog-comments-moderation.tsx` — shadcn Table + Badge + Button
- `src/components/admin-blog-newsletter-export-button.tsx` — shadcn Button
- `src/components/admin-staff-panel.tsx` — shadcn Table + Dialog + Form
- `src/components/admin-action-log-panel.tsx` — shadcn Table + Input (search) + Select (filter)
- `src/components/admin-organizations-panel.tsx` — shadcn Table + Card
- `src/components/admin-footer-social-links-panel.tsx` — shadcn Form + Input
- `src/app/(main)/admin/blog/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/blog/posts/page.tsx` — AdminPageHeader + Table
- `src/app/(main)/admin/blog/posts/new/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/blog/posts/[id]/edit/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/blog/categories/page.tsx` — AdminPageHeader + Table
- `src/app/(main)/admin/blog/authors/page.tsx` — AdminPageHeader + Table
- `src/app/(main)/admin/blog/newsletter/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/blog/analytics/page.tsx` — AdminPageHeader + Charts
- `src/app/(main)/admin/blog/comments/page.tsx` — AdminPageHeader + Table
- `src/app/(main)/admin/staff/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/log/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/organizations/page.tsx` — AdminPageHeader

## Implementation Steps

1. **Blog post form rebuild**
   - Wrap in shadcn Form layout
   - Title, slug: shadcn Input + Label
   - Category, author: shadcn Select
   - Content: preserve existing editor — wrap in styled container
   - SEO fields: shadcn Input group (meta title, meta description)
   - Publish toggle: shadcn Switch
   - Featured image: keep existing upload — style button with shadcn Button
   - Action buttons: shadcn Button (Save Draft, Publish)

2. **Blog CRUD forms (author, category)**
   - shadcn Dialog + Form pattern
   - Input fields for name, slug, description
   - Author: avatar upload field

3. **Blog comments moderation**
   - shadcn Table: comment text, author, post, date, status Badge
   - Actions: Approve / Reject buttons (shadcn Button)
   - Bulk actions toolbar

4. **Blog analytics page**
   - Use shadcn Chart for blog view/engagement charts
   - AdminStatCard for KPI metrics (total posts, views, subscribers)

5. **Blog list pages (posts, categories, authors, newsletter)**
   - AdminDataTable with columns appropriate to each entity
   - Create button: shadcn Button → Dialog

6. **Staff panel rebuild**
   - Staff table: AdminDataTable (name, email, role, created, actions)
   - Invite form: shadcn Dialog + Form (email + role Select)
   - Role badge: AdminStatusBadge
   - Delete confirmation: shadcn AlertDialog

7. **Audit log panel rebuild**
   - Search: shadcn Input
   - Filter: shadcn Select (action type, date range)
   - Log table: AdminDataTable (timestamp, actor, action, details)
   - Detail expand: shadcn Collapsible or Sheet for action details

8. **Organizations panel rebuild**
   - Org list: shadcn Card grid
   - Member table: AdminDataTable
   - Progress per class: shadcn Progress or Bar
   - Super Admin only guard preserved

9. **Footer social links panel**
   - shadcn Form + Input for each social platform URL
   - shadcn Button for save

10. **Update all page files with AdminPageHeader**

11. **Delete old CSS** — blog/staff/log specific admin classes

12. **Build check**
    ```bash
    pnpm type-check && pnpm build
    ```

## Todo List
- [ ] Rebuild blog post form with shadcn Form layout
- [ ] Rebuild blog author + category create forms
- [ ] Rebuild blog comments moderation
- [ ] Rebuild blog analytics with shadcn Chart
- [ ] Rebuild blog list pages (posts, categories, authors, newsletter)
- [ ] Rebuild staff panel (table + invite dialog)
- [ ] Rebuild audit log panel (search + filter + table)
- [ ] Rebuild organizations panel
- [ ] Rebuild footer social links panel
- [ ] Update all page files with AdminPageHeader
- [ ] Delete old CSS classes
- [ ] Build passes

## Success Criteria
- Blog post create/edit form fully functional
- Blog category/author CRUD works
- Comment moderation approve/reject works
- Newsletter export button works
- Staff invite + role assignment works
- Audit log searchable and filterable
- Organizations member list renders
- All Vietnamese labels preserved
- Super Admin-only pages guarded

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Blog editor integration breaks | Medium | High | Only wrap editor container, don't touch editor internals |
| Blog has most files to modify | High | Medium | Test each sub-page independently |
| Audit log performance with large datasets | Low | Low | Keep existing pagination from controller |

## Security Considerations
- Staff panel: Super Admin only — preserve role check
- Audit log: Super Admin only — preserve role check
- Organizations: Super Admin only — preserve role check
- Blog post publish: preserve existing auth validation

## Next Steps
- Phase 8: Visual polish, CSS cleanup, full test suite
