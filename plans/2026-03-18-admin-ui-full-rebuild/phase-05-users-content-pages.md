# Phase 5: Users + Content Pages

## Context Links
- Users management: `src/components/admin-users-management.tsx` (orchestrator, split pane)
- Users list pane: `src/components/admin/users-management/admin-users-list-pane.tsx`
- User detail pane: `src/components/admin/users-management/admin-user-detail-pane.tsx`
- Users list controller: `src/components/admin/users-management/use-admin-users-list-controller.ts` (DO NOT TOUCH)
- User detail controller: `src/components/admin/users-management/use-admin-user-detail-controller.ts` (DO NOT TOUCH)
- Content panel: `src/components/admin-content-panel.tsx` (orchestrator)
- Content sub-components: `src/components/admin/content/admin-content-*.tsx` (7 files)
- Content controllers: `use-admin-content-browser.ts`, `use-admin-content-editing.ts` (DO NOT TOUCH)
- Users page: `src/app/(main)/admin/users/page.tsx`
- Content page: `src/app/(main)/admin/content/page.tsx`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- **Description:** Rebuild Users (split pane: list + detail) and Content (hierarchy browser with modals) UI. These are the most complex interactive admin modules. Keep all controller hooks untouched.

## Key Insights
- Users module: split pane layout (list left, detail right), search/filter controls, bulk actions, subscription management, email compose, CRM notes
- Content module: hierarchical browser (Track → Level → Unit → Lesson → Activity), modal forms for create/edit, video TUS uploader
- Both modules use "use client" with controller hooks — only swap visual layer
- Users list pane has: search input, status filter select, sort select, paginated table, row selection
- Content has complex modal forms with activity-type-specific field components (MCQ, True/False, Word Match, Fill Blank)

## Requirements
### Functional
- Users: search bar, filter/sort controls, user table with selection, detail pane with tabs (info, subscription, notes, email)
- Content: track/level accordion or tree, unit list, lesson list, activity list, create/edit modals
- All controller hook interfaces unchanged
- Pagination, loading states, error handling preserved

### Non-functional
- Split pane responsive: stacked on mobile, side-by-side on lg+
- Modal forms: shadcn Dialog with Form
- White cards, consistent with Dark Pro theme

## Architecture
### Users Module
```
AdminUsersManagement (orchestrator — "use client")
  ├── useAdminUsersListController() → listVm
  ├── useAdminUserDetailController() → detailVm
  ├── AdminUsersListPane (shadcn Table + Input + Select)
  └── AdminUserDetailPane (shadcn Tabs + Card + Form)
```

### Content Module
```
AdminContentPanel (orchestrator — "use client")
  ├── useAdminContentBrowser() → browserVm
  ├── useAdminContentEditing() → editingVm
  ├── AdminContentTrackLevelSections (shadcn Accordion or Collapsible)
  ├── AdminContentUnitsSection (shadcn Card list)
  ├── AdminContentLessonsSection (shadcn Card list)
  ├── AdminContentLessonActivitiesList (shadcn Table)
  ├── AdminContentLessonModalForm (shadcn Dialog + Form)
  ├── AdminContentActivityModalForm (shadcn Dialog + Form)
  └── AdminContentModalShell (shadcn Dialog wrapper)
```

## Related Code Files
### Modify (visual layer only)
- `src/components/admin-users-management.tsx` — swap CSS classes to shadcn
- `src/components/admin/users-management/admin-users-list-pane.tsx` — shadcn Table + Input + Select
- `src/components/admin/users-management/admin-user-detail-pane.tsx` — shadcn Tabs + Card
- `src/components/admin-content-panel.tsx` — swap CSS classes
- `src/components/admin/content/admin-content-modal-shell.tsx` — shadcn Dialog
- `src/components/admin/content/admin-content-track-level-sections.tsx` — shadcn Accordion
- `src/components/admin/content/admin-content-units-section.tsx` — shadcn Card list
- `src/components/admin/content/admin-content-lessons-section.tsx` — shadcn Card list
- `src/components/admin/content/admin-content-lesson-activities-list.tsx` — shadcn Table
- `src/components/admin/content/admin-content-lesson-modal-form.tsx` — shadcn Dialog + Form
- `src/components/admin/content/admin-content-activity-modal-form.tsx` — shadcn Dialog + Form
- `src/components/admin/content/admin-content-activity-fields-mcq.tsx` — shadcn Input + Button
- `src/components/admin/content/admin-content-activity-fields-true-false.tsx` — shadcn Select
- `src/components/admin/content/admin-content-activity-fields-word-match.tsx` — shadcn Input
- `src/components/admin/content/admin-content-activity-fields-fill-blank.tsx` — shadcn Input + Textarea
- `src/app/(main)/admin/users/page.tsx` — use AdminPageHeader
- `src/app/(main)/admin/content/page.tsx` — use AdminPageHeader

### DO NOT TOUCH
- `src/components/admin/users-management/use-admin-users-list-controller.ts`
- `src/components/admin/users-management/use-admin-user-detail-controller.ts`
- `src/components/admin/content/use-admin-content-browser.ts`
- `src/components/admin/content/use-admin-content-editing.ts`
- `src/components/admin/video-tus-uploader.tsx` (keep as-is, only style wrapper if needed)

### shadcn Components to Install
```bash
npx shadcn@canary add accordion textarea label switch checkbox radio-group
```

## Implementation Steps

1. **Install remaining shadcn components**
   ```bash
   npx shadcn@canary add accordion textarea label switch checkbox radio-group
   ```

2. **Rebuild admin-users-list-pane.tsx**
   - Search: shadcn Input with search icon
   - Filters: shadcn Select for status filter + sort
   - Table: AdminDataTable (Phase 3) or shadcn Table directly
   - Pagination: Button group prev/next
   - Row selection: highlight selected row
   - Bulk actions toolbar: shadcn Button group

3. **Rebuild admin-user-detail-pane.tsx**
   - shadcn Tabs: Info | Subscription | Notes | Email
   - Each tab content in shadcn Card
   - Subscription management: Badge + action buttons
   - Email compose: shadcn Textarea + Button
   - CRM notes: list + add form

4. **Rebuild admin-users-management.tsx**
   - Minimal changes — swap CSS classes on grid wrapper
   - Keep same controller hook calls

5. **Rebuild content modal shell**
   - Replace custom modal with shadcn Dialog
   - DialogContent + DialogHeader + DialogTitle + DialogFooter
   - Keep same open/close callback interface

6. **Rebuild content track/level sections**
   - shadcn Accordion for track → level hierarchy
   - AccordionItem per track, nested AccordionItem per level (or Collapsible)

7. **Rebuild content units/lessons/activities sections**
   - Unit list: shadcn Card list with click to select
   - Lesson list: shadcn Card list with edit/delete actions
   - Activity list: AdminDataTable with type column + edit button

8. **Rebuild content modal forms**
   - Lesson form: shadcn Dialog + Form with Input fields
   - Activity form: shadcn Dialog + Form, dynamic fields based on activity type
   - Keep activity field sub-components (MCQ, TrueFalse, WordMatch, FillBlank) — just swap to shadcn Input/Select/Textarea

9. **Update page files**
   - users/page.tsx: add AdminPageHeader
   - content/page.tsx: add AdminPageHeader (if not already using it)

10. **Delete old CSS** — remove `admin-controls`, `admin-table-wrap`, `admin-table`, `admin-lesson-list` classes

11. **Build check**
    ```bash
    pnpm type-check && pnpm build
    ```

## Todo List
- [ ] Install shadcn accordion, textarea, label, switch, checkbox, radio-group
- [ ] Rebuild users list pane (search, filters, table, pagination)
- [ ] Rebuild user detail pane (tabs, subscription, notes, email)
- [ ] Rebuild users management orchestrator
- [ ] Rebuild content modal shell with shadcn Dialog
- [ ] Rebuild content track/level sections with Accordion
- [ ] Rebuild content units/lessons/activities sections
- [ ] Rebuild content lesson modal form
- [ ] Rebuild content activity modal form + field components
- [ ] Update page files with AdminPageHeader
- [ ] Delete old CSS classes
- [ ] Build passes

## Success Criteria
- Users list: search, filter, sort, paginate all functional
- User detail: all tabs render with correct data
- Content hierarchy: track → level → unit → lesson → activity browsing works
- Modal forms: create/edit lesson and activity works
- All controller hooks called with same interface
- No "use client" added to server page files

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Controller interface mismatch | Low | High | Don't change any hook params/returns |
| Modal z-index conflicts | Low | Medium | shadcn Dialog handles z-index via portal |
| Accordion nested depth | Medium | Low | Test 3-level nesting (track > level > content) |
| Activity field components complexity | Medium | Medium | Change only wrapper elements, keep logic |

## Security Considerations
- User email display: preserve existing sanitization
- Subscription actions: keep existing auth checks in controllers
- Content edit: keep existing CSRF/auth in API calls

## Next Steps
- Phase 6: Operations + Security + Gift Codes + Courses
