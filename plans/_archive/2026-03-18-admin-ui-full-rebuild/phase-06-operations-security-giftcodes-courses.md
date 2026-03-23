# Phase 6: Operations + Security + Gift Codes + Courses Pages

## Context Links
- Operations panel: `src/components/admin-operations-panel.tsx`
- Operations tabs: `src/components/admin-operations-tabs.tsx`
- Operations sub-components: `src/components/admin/operations/admin-operations-*.tsx` (3 files)
- Operations controller: `src/components/admin/operations/use-admin-operations-controller.ts` (DO NOT TOUCH)
- Operations types/constants: `src/components/admin/operations/admin-operations-types.ts`, `admin-operations-constants.ts`
- Security panel: `src/components/admin-security-panel.tsx`
- Feature flags: `src/components/admin-feature-flags-panel.tsx`
- Gift code panel: `src/components/admin-gift-code-panel.tsx`
- Coupon panel: `src/components/admin-coupon-panel.tsx`
- Announcement panel: `src/components/admin-announcement-panel.tsx`
- Export data: `src/components/admin-export-data.tsx`
- Courses page: `src/app/(main)/admin/courses/page.tsx`
- Courses detail: `src/app/(main)/admin/courses/[id]/page.tsx`
- Operations page: `src/app/(main)/admin/operations/page.tsx`
- Security page: `src/app/(main)/admin/security/page.tsx`
- Gift codes page: `src/app/(main)/admin/gift-codes/page.tsx`

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 6h
- **Description:** Rebuild 4 admin modules: Operations (payments/webhooks/trials), Security (rate limits/flags/DDoS), Gift Codes, and Courses listing. Mix of client and server components.

## Key Insights
- Operations uses tabbed interface (payments, webhooks, trials) with controller hook
- Security panel has rate limit policy table with editable limits, DDoS mode selector, IP blocklist
- Gift codes: create form + usage tracking table
- Courses: listing page with publish state management
- Operations types/constants files — keep untouched (data contracts)

## Requirements
### Functional
- Operations: tabbed view (Payments | Webhooks | Trials), record limit input, payment/webhook tables with status badges, trial toggle switches
- Security: rate limit policy table with edit, DDoS mode radio buttons, IP CIDR list with add/remove, feature flags toggles
- Gift Codes: create form (code, value, expiry), usage table with status
- Courses: course card grid with publish/unpublish actions, course detail page

### Non-functional
- Tabs: shadcn Tabs component
- Forms: shadcn Input + Select + Switch
- Tables: AdminDataTable or shadcn Table

## Related Code Files
### Modify (visual layer only)
- `src/components/admin-operations-panel.tsx` — shadcn layout + controls
- `src/components/admin-operations-tabs.tsx` — shadcn Tabs
- `src/components/admin/operations/admin-operations-payments-section.tsx` — shadcn Table + Badge
- `src/components/admin/operations/admin-operations-webhooks-section.tsx` — shadcn Table + Badge
- `src/components/admin/operations/admin-operations-trials-section.tsx` — shadcn Switch + Table
- `src/components/admin-security-panel.tsx` — shadcn Table + Radio + Input
- `src/components/admin-feature-flags-panel.tsx` — shadcn Switch + Card
- `src/components/admin-gift-code-panel.tsx` — shadcn Form + Table
- `src/components/admin-coupon-panel.tsx` — shadcn Form + Table
- `src/components/admin-announcement-panel.tsx` — shadcn Card + Form
- `src/components/admin-export-data.tsx` — shadcn Button + Dialog
- `src/app/(main)/admin/operations/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/security/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/gift-codes/page.tsx` — AdminPageHeader
- `src/app/(main)/admin/courses/page.tsx` — AdminPageHeader + Card grid
- `src/app/(main)/admin/courses/[id]/page.tsx` — AdminPageHeader + detail layout

### DO NOT TOUCH
- `src/components/admin/operations/use-admin-operations-controller.ts`
- `src/components/admin/operations/admin-operations-types.ts`
- `src/components/admin/operations/admin-operations-constants.ts`

## Implementation Steps

1. **Rebuild operations panel**
   - Replace `<label>` + `<input>` controls with shadcn Input + Label
   - Replace tab switching with shadcn Tabs (TabsList + TabsTrigger + TabsContent)
   - Keep controller hook call unchanged

2. **Rebuild operations sub-sections**
   - Payments: shadcn Table with AdminStatusBadge for payment status
   - Webhooks: shadcn Table with AdminStatusBadge for webhook status
   - Trials: shadcn Switch for toggle, Card list for trial lessons

3. **Rebuild security panel**
   - Rate limit table: shadcn Table with inline Input for editable limits
   - DDoS mode: shadcn RadioGroup (normal/elevated/emergency)
   - IP blocklist: shadcn Input + Button add/remove, list with X buttons
   - Feature flags: shadcn Switch + Label per flag

4. **Rebuild gift code panel**
   - Create form: shadcn Form + Input (code, value) + Button
   - Usage table: AdminDataTable with status Badge
   - Copy-to-clipboard: shadcn Button with clipboard icon

5. **Rebuild coupon panel**
   - Similar pattern to gift codes — Form + Table
   - shadcn Select for coupon type

6. **Rebuild announcement panel**
   - shadcn Card + Textarea for message
   - shadcn Switch for active/inactive
   - Preview card

7. **Rebuild export data component**
   - shadcn Button to trigger export
   - shadcn Dialog for confirmation
   - Loading state with shadcn Skeleton

8. **Rebuild courses pages**
   - Course listing: shadcn Card grid with publish Badge
   - Course detail: AdminSectionCard sections for info, lessons, settings
   - Action buttons: shadcn Button (publish/unpublish/edit)

9. **Update page files with AdminPageHeader**

10. **Delete old CSS** — operations/security-specific admin classes

11. **Build check**
    ```bash
    pnpm type-check && pnpm build
    ```

## Todo List
- [ ] Rebuild operations panel + tabs
- [ ] Rebuild payments section with shadcn Table + Badge
- [ ] Rebuild webhooks section with shadcn Table + Badge
- [ ] Rebuild trials section with shadcn Switch
- [ ] Rebuild security panel (rate limits, DDoS mode, IP blocklist)
- [ ] Rebuild feature flags panel with shadcn Switch
- [ ] Rebuild gift code panel (form + table)
- [ ] Rebuild coupon panel
- [ ] Rebuild announcement panel
- [ ] Rebuild export data component
- [ ] Rebuild courses listing + detail pages
- [ ] Update all page files with AdminPageHeader
- [ ] Delete old CSS classes
- [ ] Build passes

## Success Criteria
- Operations tabs switch correctly, all 3 sections render
- Payment/webhook tables show correct status badges
- Trial toggles work
- Security rate limit editing works
- DDoS mode selector functions
- Gift code create + usage tracking works
- Courses listing + detail pages render
- All controllers unchanged

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Security panel complex state | Medium | Medium | Only swap visual layer, test each control |
| Operations tab state loss | Low | Medium | shadcn Tabs preserves content by default |

## Security Considerations
- Rate limit controls: keep existing server-side validation
- DDoS mode changes: keep existing auth check (Super Admin only)
- IP blocklist: preserve CIDR validation
- Feature flags: keep existing auth for toggle actions

## Next Steps
- Phase 7: Blog CMS + Staff + Log + Organizations
