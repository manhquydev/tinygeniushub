# Phase 04: Module Audit & Fix

## Context Links
- Module catalog: `src/components/admin/admin-module-catalog.ts`
- Impersonation API: `src/app/api/admin/impersonate/route.ts`
- Impersonation stop: `src/app/api/admin/impersonate/stop/route.ts`
- Skills API: `src/app/api/admin/skills/`
- Impersonation lib: `src/lib/auth/impersonation.ts`

## Overview
- **Priority**: P2
- **Status**: pending
- **Description**: Audit all 14 admin modules. Fix 5 partial modules, build UI for 2 gap modules (Impersonation, Skills Mapping).

## Key Insights
- **Complete (7)**: Overview, Analytics, Users, Content, Blog, Staff, Audit Log -- no action needed
- **Partial (5)**: Need specific fixes per module
- **Gap (2)**: API exists but no admin UI page

### Partial Module Analysis

| Module | What Works | What's Missing/Broken |
|--------|-----------|----------------------|
| Courses | List courses, enrollment counts | No create/edit course UI, no publish toggle |
| Operations | Payments list, webhooks, trial toggle | No coupon management UI, announcements panel incomplete |
| Gift Codes | List + create codes | No bulk generate, no usage analytics view |
| Organizations | List organizations | No member management, no billing detail view |
| Security | Security policies, feature flags | No IP blocklist management UI, rate limit config UI |

### Gap Module Analysis

| Module | Available API | UI Needed |
|--------|-------------|-----------|
| Impersonation | POST `/api/admin/impersonate` (start), POST `/api/admin/impersonate/stop` (stop) | User search + impersonate button, active impersonation status |
| Skills Mapping | `/api/admin/skills/*` endpoints | Skill CRUD, lesson-to-skill mapping table |

## Requirements
### Functional
- All partial modules reach "complete" health status
- Impersonation and Skills Mapping get dedicated admin pages
- Module catalog updated to reflect new health statuses
- Navigation updated to include new pages

### Non-functional
- New pages follow same component patterns (AdminPageHeader, AdminSectionCard, etc.)
- New pages use admin theme CSS vars
- Keep files under 200 lines

## Related Code Files

### Files to Create
- `src/app/(main)/admin/impersonation/page.tsx` -- impersonation admin page
- `src/components/admin/impersonation/admin-impersonation-panel.tsx` -- client component
- `src/app/(main)/admin/skills-mapping/page.tsx` -- skills mapping admin page
- `src/components/admin/skills-mapping/admin-skills-mapping-panel.tsx` -- client component
- `src/components/admin/operations/admin-coupon-management.tsx` -- coupon CRUD (if not exists)

### Files to Modify
- `src/components/admin/admin-module-catalog.ts` -- update health statuses, add hrefs
- `src/components/admin-shell-nav.tsx` -- add Impersonation + Skills Mapping nav items
- `src/app/(main)/admin/courses/page.tsx` -- enhance course management
- `src/app/(main)/admin/operations/page.tsx` -- add coupon tab
- `src/app/(main)/admin/gift-codes/page.tsx` -- add bulk generate + analytics
- `src/app/(main)/admin/organizations/page.tsx` -- add member management
- `src/app/(main)/admin/security/page.tsx` -- add IP blocklist UI

## Implementation Steps

### A. Fix Partial Modules

1. **Courses module**:
   - Add course publish/unpublish toggle (PATCH `/api/admin/courses/[id]`)
   - Add inline edit for course title, description, pricing
   - Verify enrollment count display works
   - Check: does `AdminCoursesClient` component exist? Review and extend.

2. **Operations module**:
   - Check `AdminOperationsTabs` for existing tab inventory
   - Add "Coupons" tab with list + create/toggle coupon (service functions exist in `admin-billing-service.ts`)
   - Verify announcements panel renders and can create/dismiss announcements
   - Verify trial toggle works end-to-end

3. **Gift Codes module**:
   - Add bulk generate feature (create N codes at once)
   - Add usage stats summary (total created, redeemed, expired)
   - Review `AdminGiftCodePanel` component for completeness

4. **Organizations module**:
   - Add member list within each org (click org -> see members)
   - Add billing detail view (billingStart, billingEnd, plan info)
   - Use existing `listAllOrganizations` service + extend with member query

5. **Security module**:
   - Review `AdminSecurityPanel` for completeness
   - Add IP blocklist management (add/remove IPs)
   - Add rate limit configuration display
   - Feature flags panel already exists (`AdminFeatureFlagsPanel`)

### B. Build Gap Module UIs

6. **Impersonation page** (`/admin/impersonation`):
   - User search input (search by email)
   - Results list with "Impersonate" button per user
   - Active impersonation status indicator
   - "Stop impersonation" action
   - Uses existing API: POST `/api/admin/impersonate` with `{ parentId }`
   - Banner component already exists: `src/components/impersonation-banner.tsx`

7. **Skills Mapping page** (`/admin/skills-mapping`):
   - List all skills with CRUD operations
   - Lesson-to-skill mapping table (which lessons teach which skills)
   - Drag-drop or select UI for assigning skills to lessons
   - Uses existing API at `/api/admin/skills/`

### C. Update Catalog & Navigation

8. **Update module catalog**:
   - Set all partial modules to `health: "complete"` after fixes
   - Set gap modules to `health: "complete"` with valid `href` values
   - `impersonation.href = "/admin/impersonation"`
   - `skills-mapping.href = "/admin/skills-mapping"`

9. **Update sidebar navigation**:
   - Add Impersonation to "Hệ thống" group (superAdminOnly)
   - Add Skills Mapping to "Dữ liệu" or "Hệ thống" group (superAdminOnly)

## Todo List
- [ ] Audit Courses module, add publish toggle + inline edit
- [ ] Audit Operations module, add coupon management tab
- [ ] Audit Gift Codes module, add bulk generate + stats
- [ ] Audit Organizations module, add member + billing views
- [ ] Audit Security module, add IP blocklist + rate limit UI
- [ ] Create Impersonation admin page + panel
- [ ] Create Skills Mapping admin page + panel
- [ ] Update admin-module-catalog.ts health statuses
- [ ] Update admin-shell-nav.tsx with new nav items
- [ ] Smoke test all 14 modules render and function

## Success Criteria
- All 14 modules have `health: "complete"` in catalog
- All modules accessible via sidebar navigation
- Impersonation: can search user, start/stop impersonation from admin UI
- Skills Mapping: can view/create/delete skills, assign to lessons
- No module shows empty state when data exists
- All new pages follow admin component patterns

## Risk Assessment
- **Medium**: Some API endpoints may not exist for all planned features (e.g., IP blocklist CRUD). Mitigate: verify API existence before building UI; mark missing APIs as follow-up.
- **Medium**: Skills Mapping data model unclear. Mitigate: inspect Prisma schema and `/api/admin/skills/` routes before implementation.
- **Low**: Adding 2 new pages + nav items is straightforward extension of existing patterns.

## Security Considerations
- Impersonation page must be SUPER_ADMIN only (already enforced at API level, add `superAdminOnly: true` to nav)
- Skills Mapping admin access should be SUPER_ADMIN only
- All new pages must call `getAdminSession()` and verify role before rendering
