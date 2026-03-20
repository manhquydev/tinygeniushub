# Admin Layout Files - Quick Reference

## Core Layout Files (Primary)
- D:\project\cungcontuhoc\src\app\(main)\admin\layout.tsx
- D:\project\cungcontuhoc\src\components\admin-shell-nav.tsx
- D:\project\cungcontuhoc\src\components\ui\sidebar.tsx
- D:\project\cungcontuhoc\src\components\admin\ui\admin-page-header.tsx

## Admin UI Components
- D:\project\cungcontuhoc\src\components\admin\ui\admin-section-card.tsx
- D:\project\cungcontuhoc\src\components\admin\ui\admin-stat-card.tsx
- D:\project\cungcontuhoc\src\components\admin\ui\admin-data-table.tsx
- D:\project\cungcontuhoc\src\components\admin\ui\admin-empty-state.tsx
- D:\project\cungcontuhoc\src\components\admin\ui\admin-loading-skeleton.tsx
- D:\project\cungcontuhoc\src\components\admin\ui\admin-status-badge.tsx

## Admin Feature Components
- D:\project\cungcontuhoc\src\components\admin\video-tus-uploader.tsx
- D:\project\cungcontuhoc\src\components\admin\admin-module-health-grid.tsx
- D:\project\cungcontuhoc\src\components\admin\admin-page-header.tsx (re-export)
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-modal-shell.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-activity-modal-form.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-activity-fields-fill-blank.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-activity-fields-word-match.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-activity-fields-mcq.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-activity-fields-true-false.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-lesson-modal-form.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-lesson-activities-list.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-lessons-section.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-units-section.tsx
- D:\project\cungcontuhoc\src\components\admin\content\admin-content-track-level-sections.tsx
- D:\project\cungcontuhoc\src\components\admin\operations\admin-operations-payments-section.tsx
- D:\project\cungcontuhoc\src\components\admin\operations\admin-operations-webhooks-section.tsx
- D:\project\cungcontuhoc\src\components\admin\operations\admin-operations-trials-section.tsx
- D:\project\cungcontuhoc\src\components\admin\users-management\admin-users-list-pane.tsx
- D:\project\cungcontuhoc\src\components\admin\users-management\admin-user-detail-pane.tsx
- D:\project\cungcontuhoc\src\components\admin\site-settings\admin-social-links-editor.tsx

## Key CSS Classes

### Positioning
- `sticky top-0 z-10` (header)
- `absolute inset-x-0 top-0` (accent elements)
- `relative` (search icon containers)
- `absolute left-2.5 top-1/2 -translate-y-1/2` (icon positioning)

### Layout
- `flex-1 p-3 md:p-6` (main content)
- `flex h-12 items-center gap-2 px-3` (header row)
- `overflow-hidden` (card containers)
- `overflow-y-auto` (scrollable areas)
- `overflow-x-auto` (tables)

### Z-Index
- `z-10` (sticky header)

### Responsive Breakpoints
- `md:h-14`, `md:gap-3`, `md:px-4`, `md:p-6`
- `group-data-[collapsible=icon]:*` (icon mode variants)

### Color Variables
- `var(--admin-header-bg)`
- `var(--admin-card-bg)`
- `var(--admin-card-border)`
- `var(--admin-sidebar-bg)`
- `var(--admin-sidebar-fg)`
- `var(--admin-sidebar-accent)`
- `var(--admin-text-primary)`
- `var(--admin-text-secondary)`
- `var(--admin-text-muted)`
- `var(--admin-content-bg)`
