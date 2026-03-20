# Phase 03 — Course System (Subscription + Premium Courses)

## Context Links
- [Plan Overview](./plan.md)
- [Brainstorm Summary](../260225-brainstorm-business-model/brainstorm-summary.md)
- [Phase 02 Video Infra](./phase-02-video-infrastructure.md) ← must complete first
- [Handover Doc](../../docs/handover/handover-master-agent-ready.md)

## Overview
- **Priority:** P1
- **Status:** ⬜ pending
- **Duration:** Month 3–6 (after Phase 01 + 02 complete)
- **Goal:** 500 paying users, MRR 30–50M VND, first Premium Course live

## Key Insights
1. Subscription system already partially built (billing module, Stripe adapter) — extend, not rebuild
2. Course = depth (30-60 day structured program); Subscription = breadth (all standard lessons)
3. Sub users get 20% discount at course checkout — applied via coupon code logic
4. Certificate generation: use `@react-pdf/renderer` or `pdf-lib` — lightweight, server-side
5. Gift codes: unique alphanumeric codes, redeemable for 1-year subscription
6. Pricing page A/B test: use Next.js middleware + cookie to split traffic

## Business Rules
- Course purchase does NOT require subscription (standalone)
- Course enrollment grants access to course-specific lessons only (not all sub content)
- 1 course purchase = 1 enrollment per parent account (not per child)
- Certificate issued after ≥ 80% lesson completion rate
- Gift code = 1 use only; expires 1 year after purchase date
- Sub 20% discount at course checkout: applied automatically if active subscription detected

## Requirements

### Functional
- [ ] Course entity: title, description, price, lessons, duration (days)
- [ ] Course enrollment: parent purchases → enrollment record created
- [ ] Course lesson access: enrolled parent can access course lessons
- [ ] Sub discount (20%): auto-applied at checkout for active subscribers
- [ ] Certificate: PDF generated on course completion, downloadable + shareable
- [ ] Course admin CMS: create/edit courses, add lessons to course
- [ ] Gift code system: generate codes, redeem for subscription
- [ ] Pricing page A/B test: variant A (current) vs variant B (new layout)

### Non-functional
- [ ] Course purchase webhook idempotent (same as subscription billing rules)
- [ ] Certificate PDF generated async (BullMQ job, not blocking request)
- [ ] Gift code redemption rate-limited (max 5 attempts/hour/IP)

## Architecture

### DB Schema (Prisma additions)
```prisma
model Course {
  id            String    @id @default(cuid())
  slug          String    @unique
  title         String
  description   String
  price         Int       // VND, e.g. 299000
  durationDays  Int       // e.g. 30
  isPublished   Boolean   @default(false)
  lessons       CourseLesson[]
  enrollments   CourseEnrollment[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model CourseLesson {
  id        String  @id @default(cuid())
  courseId  String
  lessonId  String
  order     Int
  course    Course  @relation(fields: [courseId], references: [id])
  lesson    Lesson  @relation(fields: [lessonId], references: [id])
  @@unique([courseId, lessonId])
}

model CourseEnrollment {
  id            String    @id @default(cuid())
  courseId      String
  userId        String    // parent account
  paymentId     String?   // payment record reference
  completedAt   DateTime?
  certificateUrl String?
  enrolledAt    DateTime  @default(now())
  course        Course    @relation(fields: [courseId], references: [id])
  @@unique([courseId, userId])
}

model GiftCode {
  id          String    @id @default(cuid())
  code        String    @unique  // e.g. "HOCGIOI2025"
  planSlug    String    // which plan to activate
  durationDays Int      @default(365)
  usedBy      String?   // userId who redeemed
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}
```

### New API Routes
- `GET /api/courses` — list published courses
- `GET /api/courses/[slug]` — course detail
- `POST /api/courses/[slug]/checkout` — initiate one-time purchase
- `GET /api/courses/[slug]/enrollment` — check enrollment status
- `POST /api/gift-codes/redeem` — redeem a gift code
- `POST /api/admin/courses` — create/update course (admin)
- `GET /api/certificates/[enrollmentId]` — download PDF certificate

### Access Control Logic
```
canAccessLesson(user, lesson):
  if lesson.isPreview → true
  if user has active subscription → true (if lesson is standard)
  if user has CourseEnrollment for a course containing this lesson → true
  else → false
```

## Skills Execution Order

```
Step 1:
  backend-development → Course DB schema + migrations + service layer

Step 2 (parallel):
  backend-development → Course purchase API + Stripe one-time payment
  cook               → Course admin CMS (extend blog admin pattern)

Step 3:
  backend-development → Certificate PDF generation (BullMQ job)

Step 4:
  backend-development → Gift code system

Step 5:
  frontend-design + cook → Course catalog page + detail page + checkout UI

Step 6:
  cook → Pricing page A/B test

Step 7:
  web-testing → E2E purchase flow, enrollment access, certificate download
```

## Related Code Files

### Files to Modify
- `prisma/schema.prisma` — add Course, CourseLesson, CourseEnrollment, GiftCode models
- `src/modules/billing/` — extend for one-time payment (course purchase)
- `src/modules/content/` — extend lesson access check with course enrollment
- `src/app/(main)/pricing/page.tsx` — add course upsell section
- `src/app/(main)/admin/blog/page.tsx` — extend admin to manage courses

### Files to Create
- `src/modules/courses/service.ts` — course business logic
- `src/modules/courses/certificate-service.ts` — PDF generation
- `src/app/api/courses/` — course API routes
- `src/app/api/gift-codes/redeem/route.ts`
- `src/app/api/certificates/[enrollmentId]/route.ts`
- `src/app/(main)/courses/page.tsx` — course catalog
- `src/app/(main)/courses/[slug]/page.tsx` — course detail + purchase
- `src/jobs/certificate-generator.ts` — BullMQ worker job

## Implementation Steps

### 1. DB Schema + Migrations (Day 1–2)
1. Add Course, CourseLesson, CourseEnrollment, GiftCode to `prisma/schema.prisma`
2. `prisma migrate dev --name add-course-system`
3. Seed 1 sample course for testing

### 2. Course Service Layer (Day 2–4)
- `src/modules/courses/service.ts`:
  - `getCourses()` — list published
  - `getCourse(slug)` — detail with lessons
  - `enrollUser(courseId, userId, paymentId)` — create enrollment
  - `checkEnrollment(courseId, userId)` — boolean
  - `markCourseComplete(enrollmentId)` — set completedAt, queue certificate job

### 3. Course Purchase API (Day 4–6)
- `POST /api/courses/[slug]/checkout`:
  - Check if user already enrolled → 409 if yes
  - If user has active subscription → apply 20% discount (create Stripe coupon or calculate discounted price)
  - Create Stripe PaymentIntent (one-time, not subscription)
  - Return `{ clientSecret }` for Stripe Elements
- `POST /api/webhooks/stripe` (extend existing) — handle `payment_intent.succeeded` → call `enrollUser()`

### 4. Certificate Generation (Day 6–8)
- Use `pdf-lib` (no native deps) for PDF generation
- Template: logo + child name + course name + completion date + QR code (verify URL)
- BullMQ job `certificate-generator`: triggered on `markCourseComplete`
- Upload to R2: `certificates/{enrollmentId}.pdf`
- Update `CourseEnrollment.certificateUrl`
- Email to parent: "Bé đã hoàn thành khóa học! Tải chứng chỉ tại đây"

### 5. Course Admin CMS (Day 8–10)
- Extend `/admin/blog/page.tsx` pattern for courses
- Course form: title, description, price, duration, add/remove/reorder lessons
- Publish toggle
- Show enrollment count

### 6. Gift Code System (Day 10–12)
- Admin: bulk generate codes (specify plan, duration, quantity, expiry)
- Export as CSV for Shopee listing
- Redeem endpoint: validate code → create subscription → mark code as used
- Rate limiting: 5 attempts/hour/IP (use Redis counter)

### 7. Course Pages (Day 12–16)
- `/courses` — catalog with card layout (title, price, duration, CTA)
- `/courses/[slug]` — full detail: curriculum, instructor bio, testimonials, purchase button
- Checkout: Stripe Elements embedded on course page
- Post-purchase: redirect to enrolled course lessons
- Certificate download button (once completed)

### 8. Pricing Page Update + A/B Test (Day 16–18)
- Add "Khóa học Premium" section below subscription plans
- A/B test: Next.js middleware assigns `pricingVariant` cookie
- Variant A: current layout; Variant B: course-first layout
- Track conversion with GA4 `experiment_impression` + `purchase` events

## Todo List
- [ ] Prisma: add Course, CourseLesson, CourseEnrollment, GiftCode models
- [ ] Course service layer
- [ ] Course purchase API (Stripe PaymentIntent)
- [ ] Stripe webhook: handle payment_intent.succeeded
- [ ] Sub 20% discount logic
- [ ] Certificate PDF generation job (pdf-lib + BullMQ)
- [ ] Certificate email (Resend)
- [ ] Course admin CMS (extend blog admin)
- [ ] Gift code generate + redeem endpoints
- [ ] Gift code rate limiting
- [ ] Course catalog page
- [ ] Course detail + checkout page
- [ ] Pricing page: add course section
- [ ] A/B test infrastructure (Next.js middleware + cookie)
- [ ] E2E tests: purchase → enroll → complete → certificate (web-testing)

## Success Criteria
- [ ] Parent can purchase a course without subscription
- [ ] Active subscriber gets 20% off at checkout automatically
- [ ] Course lessons inaccessible to non-enrolled users
- [ ] Certificate PDF generated and emailed on 80% completion
- [ ] Gift code redeemed successfully activates subscription
- [ ] Admin can create and publish a course
- [ ] A/B test running with correct traffic split

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Stripe one-time payment different from subscription webhooks | High | Test with Stripe CLI test events before prod |
| Certificate PDF looks bad → parents don't share | Medium | Invest in design; test on mobile screenshot |
| Gift code abuse (bulk redemption) | Medium | Rate limit + one-use enforcement |
| Course access check performance | Low | Index CourseEnrollment(courseId, userId) |

## Security Considerations
- Payment webhooks must verify Stripe signature (already pattern in existing billing code)
- Certificate URLs should be signed R2 URLs (not public) — linked via `enrollmentId` auth
- Gift code endpoint needs auth (must be logged in to redeem)
- Admin course creation requires admin role check

## Next Steps
→ Phase 04 (B2B Kindergarten) starts after this is stable
→ Launch Tết gift code campaign (December–January) once gift code system is ready
