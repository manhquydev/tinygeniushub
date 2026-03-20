# Phase 04 — B2B Kindergarten (Multi-Tenant Schools)

## Context Links
- [Plan Overview](./plan.md)
- [Brainstorm Summary](../260225-brainstorm-business-model/brainstorm-summary.md)
- [Handover Doc](../../docs/handover/handover-master-agent-ready.md)
- [Phase 03 Course System](./phase-03-course-system.md) ← must complete first

## Overview
- **Priority:** P2
- **Status:** ⬜ pending
- **Duration:** Month 6–12
- **Goal:** 3–5 kindergarten contracts, 1,000+ students via B2B channel

## Key Insights
1. B2B2C = lowest CAC in EdTech (trust via institution); 1 school = 200–500 students
2. Kindergarten billing = annual invoice (not Stripe subscription) — parents don't see cost
3. White-label = school logo + colors on app/reports; underlying platform is ours
4. Teacher dashboard is the key product differentiator for schools (vs consumer app)
5. Bulk enrollment via CSV = mandatory for school rollout (IT admins won't create accounts 1-by-1)
6. Vietnamese kindergartens are tech-conservative — need offline-friendly fallback (PDF reports)

## Business Rules
- School Organization entity owns multiple child/parent accounts
- School admin (teacher) can: assign children to classes, view all progress, send reports
- Parents linked to school retain their consumer account (no duplicate account)
- B2B pricing: negotiated annually, 500k–2M VND/student/year
- School logo/colors applied via CSS custom properties (not hard-coded)
- School data is isolated: teacher can only see their school's students

## Requirements

### Functional
- [ ] Organization model: school entity with name, logo, primary color, domain
- [ ] School admin role: teacher with admin privileges scoped to their organization
- [ ] Bulk enrollment: CSV upload → create parent accounts + link to organization
- [ ] Teacher dashboard: class view, student progress grid, bulk report generation
- [ ] White-label: organization logo on header, custom primary color via CSS variables
- [ ] B2B billing: admin creates organization + sets billing period manually (no Stripe automation)
- [ ] Offline-friendly: teacher can download PDF progress reports for entire class

### Non-functional
- [ ] Teacher can manage up to 500 students without performance issues
- [ ] CSV import processes 500 rows < 30 seconds (async BullMQ job)
- [ ] Organization data isolation enforced at DB query level (not just UI)

## Architecture

### DB Schema
```prisma
model Organization {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  logoUrl       String?
  primaryColor  String?   @default("#4F46E5")
  domain        String?   // optional: school email domain
  billingStart  DateTime?
  billingEnd    DateTime?
  isActive      Boolean   @default(true)
  members       OrganizationMember[]
  createdAt     DateTime  @default(now())
}

model OrganizationMember {
  id             String       @id @default(cuid())
  organizationId String
  userId         String
  role           OrgRole      @default(STUDENT_PARENT)
  joinedAt       DateTime     @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id])
}

enum OrgRole {
  TEACHER_ADMIN
  STUDENT_PARENT
}
```

### Access Control Extension
```
canAccessTeacherDashboard(user, orgId):
  user has OrganizationMember with role=TEACHER_ADMIN for orgId

canViewStudentProgress(teacher, studentUserId):
  both share same Organization
```

### New Routes
- `GET /api/organizations/[orgId]/members` — list students
- `POST /api/organizations/[orgId]/bulk-enroll` — CSV upload
- `GET /api/organizations/[orgId]/progress-report` — class-wide PDF
- `GET /teacher/dashboard` — teacher UI (authenticated, org-scoped)
- `POST /api/admin/organizations` — super-admin creates school org

## Skills Execution Order
```
Step 1:
  plan:hard → detailed sub-plan for multi-tenant architecture decisions

Step 2:
  backend-development → Organization + OrganizationMember models + service

Step 3 (parallel):
  backend-development → Bulk CSV enrollment (BullMQ job)
  frontend-design + cook → Teacher dashboard UI

Step 4:
  backend-development → White-label CSS variables system
  backend-development → Class-wide PDF progress report

Step 5:
  web-testing → E2E: school signup → bulk enroll → teacher views progress

Step 6:
  mkt:seo:keywords → B2B landing page keywords ("phần mềm trường mầm non", etc.)
  content:cro → B2B landing page copy
  cook → B2B landing page (/for-schools)
```

## Related Code Files

### Files to Modify
- `prisma/schema.prisma` — add Organization, OrganizationMember, OrgRole
- `src/modules/identity/` — extend user roles for TEACHER_ADMIN
- `src/app/(main)/` — add `/for-schools` landing page
- `src/app/api/` — organization routes

### Files to Create
- `src/modules/organizations/service.ts`
- `src/modules/organizations/bulk-enroll-service.ts`
- `src/jobs/bulk-enroll-processor.ts` — BullMQ job
- `src/app/teacher/dashboard/page.tsx`
- `src/app/teacher/students/page.tsx`
- `src/app/api/organizations/` — API routes
- `src/app/(main)/for-schools/page.tsx` — B2B landing page

## Implementation Steps

### 1. Pre-work: Architecture Decision (Day 1–2)
- Run `/plan:hard` for multi-tenant security architecture
- Decision point: row-level security (PostgreSQL RLS) vs application-level isolation?
- Recommendation: application-level with mandatory `organizationId` filter on all org-scoped queries

### 2. DB + Service Layer (Day 2–5)
1. Add Organization + OrganizationMember to schema
2. `prisma migrate dev --name add-organization-multi-tenant`
3. Create `src/modules/organizations/service.ts`:
   - `createOrganization(data)` — admin only
   - `addMember(orgId, userId, role)` — invite flow
   - `getOrgMembers(orgId, requestingUserId)` — with access check
   - `getOrgStudentProgress(orgId, teacherUserId)` — aggregate progress data

### 3. Bulk CSV Enrollment (Day 5–8)
- `POST /api/organizations/[orgId]/bulk-enroll` — accepts CSV file
- CSV columns: `parent_name, parent_email, child_name, child_age`
- BullMQ job processes rows:
  - Create parent account (or find existing by email)
  - Create child profile
  - Link parent to organization as `STUDENT_PARENT`
  - Send welcome email to parent (Resend)
- Return: job ID → poll `GET /api/jobs/[jobId]/status` for progress

### 4. Teacher Dashboard (Day 8–14)
- `/teacher/dashboard` — layout: sidebar (class list) + main (student grid)
- Student grid: avatar, child name, parent name, streak, lessons completed, last active
- Filter by: all students / active this week / at-risk (no activity 7+ days)
- Bulk actions: "Send reminder email to all at-risk parents"
- Download class report: triggers PDF generation job

### 5. White-Label System (Day 14–16)
- Organization has `primaryColor` and `logoUrl` fields
- Teacher/parent accounts in an org see: org logo in header, primary color applied
- Implement via CSS custom properties injected in layout:
  ```tsx
  <div style={{ '--org-primary': org.primaryColor }}>
  ```
- No runtime CSS injection — use CSS variables already defined in Tailwind config

### 6. Class PDF Report (Day 16–18)
- BullMQ job: `class-report-generator`
- Aggregate: all students in org, last 30 days of progress
- PDF layout: org logo, class name, student list with progress bars, generated date
- Upload to R2, return signed URL to teacher

### 7. B2B Landing Page (Day 18–22)
- Run `/mkt:seo:keywords` for B2B terms: "phần mềm học tiếng Anh cho trường mầm non"
- Run `/content:cro` for B2B copy (different messaging: ROI for school, not parent anxiety)
- `/for-schools` page: hero, benefits for school, pricing table (contact for quote), case study
- CTA: "Đăng ký demo miễn phí" → contact form (not self-service signup yet)

## Todo List
- [ ] Architecture decision: multi-tenant isolation approach
- [ ] Prisma: Organization + OrganizationMember models
- [ ] Organization service layer
- [ ] Bulk CSV enrollment API + BullMQ job
- [ ] Teacher dashboard UI
- [ ] White-label CSS variables system
- [ ] Class-wide PDF progress report
- [ ] B2B landing page (/for-schools)
- [ ] Super-admin: create organization in admin panel
- [ ] E2E: school onboarding → bulk enroll → teacher dashboard
- [ ] Security review: org data isolation

## Success Criteria
- [ ] Teacher can upload 100-student CSV and all accounts created correctly
- [ ] Teacher can only see students in their organization
- [ ] White-label logo appears for org-linked users
- [ ] Class PDF report downloads with correct data
- [ ] `/for-schools` page live and indexed by Google
- [ ] At least 1 pilot school enrolled and using the system

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Data isolation bug → teacher sees other school's data | Critical | Mandatory `organizationId` filter; integration test every query |
| School IT blocks app (firewall, HTTPS cert issues) | Medium | Test on mobile data; provide offline PDF export |
| CSV format inconsistency per school | Medium | Provide template download; validate + show preview before processing |
| Sales cycle too long (6+ months for school contracts) | High | Start outreach in month 3; pilot with 1 friend school first |

## Security Considerations
- All organization-scoped queries MUST include `organizationId` filter — never trust client-provided org ID alone
- Teacher role cannot elevate to super-admin
- CSV processing: sanitize all inputs, validate email format, reject oversized files
- PDF reports use signed R2 URLs (time-limited)
- White-label: `primaryColor` must be validated as valid CSS hex (prevent XSS via CSS injection)

## Next Steps
→ Post Phase 04: Consider native mobile app (React Native) for offline-first school use
→ Consider Physical+Digital bundle: workbook + QR → Fahasa distribution (separate project)
→ Evaluate Shopee gift code campaign results to inform pricing strategy for year 2
