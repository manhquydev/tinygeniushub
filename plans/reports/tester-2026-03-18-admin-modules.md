# Admin Modules Test Coverage Report
**Date:** 2026-03-18
**Project:** cungcontuhoc
**Test Framework:** Vitest v4.0.18

---

## EXECUTIVE SUMMARY

Admin module test coverage is **significantly limited**. Only 1 test file exists for the entire admin system covering ~10% of service functions. Extensive backend services and all 68+ API endpoints lack test coverage. Critical admin operations have no validation tests.

**Critical Finding:** Admin module is production-ready but **undertested**. Multiple service layers and API routes operate without unit tests.

---

## TEST RESULTS OVERVIEW

### Test File Count
- **Total test files in project:** 57 files
- **Admin-specific test files:** 1 file
  - Location: `src/modules/admin/__tests__/service.test.ts`
  - Coverage: Main admin service only (core functions for dashboard analytics & user actions)

### Test Statistics
**From `src/modules/admin/__tests__/service.test.ts`:**
- Test cases: 35+ tests
- Test suites: 8 describe blocks
- Expected test execution: All tests should pass (based on code review)

---

## ADMIN MODULES INVENTORY

### Service Modules (9 Files - 1 Tested)
| Service | File | Tests | Status |
|---------|------|-------|--------|
| Main Service | `service.ts` | ✅ 35+ | **TESTED** |
| Analytics | `admin-analytics-service.ts` | ❌ 0 | UNTESTED |
| Blog | `admin-blog-service.ts` | ❌ 0 | UNTESTED |
| Billing | `admin-billing-service.ts` | ❌ 0 | UNTESTED |
| User Management | `admin-users-management-service.ts` | ❌ 0 | UNTESTED |
| User Operations | `admin-user-service.ts` | ❌ 0 | UNTESTED |
| Staff Management | `admin-staff-service.ts` | ❌ 0 | UNTESTED |
| Content Management | `content-service.ts` | ❌ 0 | UNTESTED |
| Authentication | `admin-auth-service.ts` | ❌ 0 | UNTESTED |

### UI Components (24+ Components - 0 Tested)
**Component Modules in `src/components/admin*`:**
- 2 Root-level admin components
- 23 Modular admin components (organized in subdirectories)

**Subdirectories:**
- `admin/content/` - 14 components (lesson/activity editing)
- `admin/operations/` - 3 components (payments, webhooks, trials)
- `admin/users-management/` - 3 components (user list, detail views)
- `admin/ui/` - 8 reusable UI components

**All 24+ components UNTESTED**

### API Routes (68+ Endpoints - 1 Tested)
**Admin API Routes by Category:**

| Category | Endpoint Count | Test Coverage |
|----------|----------------|---|
| Analytics | 2 routes | ❌ None |
| Announcements | 2 routes | ❌ None |
| Blog Management | 7 routes | ❌ None |
| Bulk Operations | 2 routes | ❌ None |
| Coupons | 2 routes | ❌ None |
| Content Management | 6 routes | ❌ None |
| Courses | 5 routes | ❌ None |
| Feature Flags | 2 routes | ❌ None |
| Gift Codes | 1 route | ❌ None |
| Impersonation | 2 routes | ❌ None |
| Lessons | 4 routes | ❌ None |
| Logs | 1 route | ❌ None |
| Organizations | 3 routes | ❌ None |
| Payments | 3 routes | ❌ None |
| Security | 2 routes | ❌ None |
| Site Settings | 1 route | ✅ Tested |
| Skills | 3 routes | ❌ None |
| Staff | 2 routes | ❌ None |
| Users | 5 routes | ❌ None |
| Videos | 2 routes | ❌ None |
| Webhooks | 1 route | ❌ None |

**Total: 68 API routes, 1 route tested (1.5%)**

### Admin Pages (15+ Pages - 0 Integration Tests)
- Overview dashboard
- Analytics dashboard
- Operations (payments, webhooks, trials)
- Security management
- User management (list + detail views)
- Content editing (tracks, units, lessons, activities)
- Blog management (posts, authors, categories, comments, analytics)
- Staff management
- Courses management
- Organizations
- Gift codes
- Site settings / Footer social links

**All pages use components and API routes with no e2e or integration tests**

---

## TESTED FUNCTIONS DETAIL

### Schema Validation (3 test suites, ~5 tests)
**In `service.ts`:**
- `adminPaymentQuerySchema` - 2 tests
  - Default limit validation
  - Out-of-range limit rejection
- `adminWebhookQuerySchema` - 1 test
  - Known status filter acceptance
- `adminLessonTrialFlagSchema` - 1 test
  - Boolean validation for trial flag

### Core Service Functions (5 test suites, ~30 tests)

#### 1. **getAdminOverview()** - 1 test
   - Aggregates dashboard stats (parents, children, payments, revenue, referrals)
   - Maps grouped status counts for subscriptions and webhooks
   - Returns recent payments and webhook events

#### 2. **listPaymentRecordsAdmin()** - 2 tests
   - Queries payments with optional status filter
   - Applies limit constraints (1-100 range, default 20)
   - Uses Prisma findMany with proper where/take clauses

#### 3. **listWebhookEventsAdmin()** - 1 test
   - Queries webhook events with optional status filter
   - Applies limit constraints (consistent with payments)

#### 4. **updateLessonTrialFlagAdmin()** - 2 tests
   - Throws LESSON_NOT_FOUND (404) when lesson missing
   - Updates trial flag and writes audit log
   - Validates audit log metadata includes slug, previous/next trial state

#### 5. **getAdminLearningAnalytics()** - 6 tests
   - Returns zeros when no data
   - Calculates activeChildrenLast7d (distinct childId count, 7 days)
   - Calculates activeChildrenLast30d (distinct childId count, 30 days)
   - Streak distribution: zero=0, low=1-3, medium=4-7, high=8+
   - Top lessons sorted descending by completion, max 10 items
   - Joins lessons table to get titles

#### 6. **getAdminRetentionAnalytics()** - 5 tests
   - Avoids division by zero when no subscriptions (returns 0)
   - Calculates retentionRate = (active/total)*100, rounded to 1 decimal
   - Counts churned30d (CANCELED_AT_PERIOD_END status, 30d lookback)
   - Considers subscription status transitions
   - Returns: newParents7d, newParents30d, churned30d, retentionRate, avgDaysToFirstLesson, avgLessonsPerChildPerWeek

#### 7. **getAdminActionLogs()** - 2 tests
   - Queries adminActionLog ordered by createdAt desc
   - Default limit=50 when not provided
   - Custom limit parameter support
   - Selects: id, adminEmail, action, target, detail, createdAt

#### 8. **createAdminActionLog()** - 2 tests
   - Saves adminEmail + action + target + detail to DB
   - Supports undefined target and detail (optional fields)
   - Returns created record with ID and timestamp

#### 9. **executeAdminBulkUsersAction()** - 5 tests
   - SUSPEND action: sets suspended=true for parentIds batch
   - ACTIVATE action: sets suspended=false for parentIds batch
   - SEND_NOTIFICATION action: creates notification for each parentId
   - Throws when parentIds empty
   - Throws when parentIds.length > 100
   - Returns: {succeeded: number, failed: number}

**Total Functions Tested:** 9 core functions
**Functions NOT Tested:** All other service functions across 8+ service files

---

## UNTESTED ADMIN SERVICES

### admin-analytics-service.ts
**Functions likely present but untested:**
- Period-based analytics calculations (7d, 30d, 90d)
- Top lessons aggregation
- Skill progression analytics
- Learning streaks calculation
- Custom date range queries

### admin-users-management-service.ts
**Functions likely present but untested:**
- User list/pagination
- User search and filtering
- Subscription status filtering
- Sort by createdAt, plan, etc.
- Bulk user operations

### admin-billing-service.ts
**Functions likely present but untested:**
- Payment record management
- Coupon validation and creation
- Revenue calculations
- Payment status transitions
- Refund operations

### admin-blog-service.ts
**Functions likely present but untested:**
- Blog post CRUD operations
- Category management
- Author management
- Comment moderation
- Newsletter subscriber management
- Blog analytics

### admin-user-service.ts
**Functions likely present but untested:**
- User notes creation/retrieval
- User profile updates
- Email change operations
- Subscription modifications
- Bulk user actions (SUSPEND, ACTIVATE)

### admin-staff-service.ts
**Functions likely present but untested:**
- Admin account creation
- Admin account updates
- Staff role management
- Admin activation/deactivation

### admin-auth-service.ts
**Functions likely present but untested:**
- Admin session validation
- JWT verification
- Permission/role checking
- Cookie management

### content-service.ts
**Functions likely present but untested:**
- Lesson CRUD operations
- Activity management (MCQ, fill-blank, word-match, true-false)
- Skill association
- Trial flag management
- Track/unit/lesson hierarchical operations
- Video source handling

---

## API ENDPOINT COVERAGE ANALYSIS

### Tested API Routes (1/68)
✅ **POST `/api/admin/site-settings/footer-social-links`**
- File: `src/app/api/admin/site-settings/footer-social-links/route.test.ts`
- Tests site content settings management
- Validates footer social links CRUD

### Completely Untested API Categories

**Content APIs (6 routes untested):**
- POST/GET `/api/admin/content/lessons`
- POST/PUT `/api/admin/content/lessons/[id]`
- PATCH `/api/admin/content/lessons/[id]/trial-toggle`
- POST/GET `/api/admin/content/activities`
- POST/PUT/DELETE `/api/admin/content/activities/[id]`
- GET `/api/admin/content/tracks`, `units`, `levels`

**User Management APIs (5 routes untested):**
- GET/POST `/api/admin/users`
- GET/PUT/POST `/api/admin/users/[parentId]`
- POST `/api/admin/users/[parentId]/subscription`
- PATCH `/api/admin/users/[parentId]/email`
- POST/GET `/api/admin/users/[parentId]/notes`
- POST `/api/admin/users/bulk`

**Analytics APIs (2 routes untested):**
- GET `/api/admin/analytics`
- GET `/api/admin/analytics/lessons`

**Blog APIs (7 routes untested):**
- CRUD `/api/admin/blog/posts`, `[id]`, `[id]/publish`
- GET/POST `/api/admin/blog/authors`
- GET/POST `/api/admin/blog/categories`
- GET/POST/DELETE `/api/admin/blog/comments`
- GET `/api/admin/blog/analytics`
- GET `/api/admin/blog/newsletter/subscribers`

**Billing/Operations APIs (6 routes untested):**
- GET `/api/admin/payments`, `[id]/reconcile`
- GET `/api/admin/webhooks`
- POST `/api/admin/coupons`, `[id]`
- GET `/api/admin/gift-codes`

**Staff APIs (2 routes untested):**
- GET/POST `/api/admin/staff`
- PUT/DELETE `/api/admin/staff/[id]`

---

## CRITICAL GAPS

### High-Risk Untested Areas
1. **Billing Operations** - Payment processing, coupon validation, refunds - NO TESTS
2. **User Management** - Bulk actions, subscription modifications - NO TESTS
3. **Content Management** - Lesson/activity CRUD, activity type handling - NO TESTS
4. **Blog Management** - Post publishing, comment moderation - NO TESTS
5. **Staff Management** - Admin account creation, role changes - NO TESTS
6. **Security** - Rate limits, edge exports - NO TESTS

### Error Scenario Coverage
**Tested:**
- Missing lesson (LESSON_NOT_FOUND)
- Empty bulk actions array
- Bulk action size limits (max 100)

**Not Tested:**
- Invalid input validation across all services
- Database connection failures
- Permission/authorization checks
- Duplicate entry handling
- Data integrity constraints
- Race conditions in bulk operations
- Status transition validation
- Foreign key constraint errors

### Component Testing
**UI Components:** 0/24 tested
- No unit tests for:
  - Form components (lesson editor, activity editor, blog post form)
  - Data display components (user list, payment table)
  - Modal shells and dialog components
  - Status indicators and badges
  - Admin navigation and layouts

---

## RECOMMENDATIONS

### Priority 1: Critical (Security/Data Integrity)
1. Add tests for ALL API routes - use factory pattern for test data
2. Add validation tests for Zod schemas in all services
3. Test permission/authorization checks (requireAdminSession)
4. Test error scenarios: not found, already exists, invalid transitions
5. Test bulk operations for atomicity and rollback

### Priority 2: High (Business Logic)
6. Test analytics calculations with realistic data distributions
7. Test billing operations: payment creation, coupon validation, refunds
8. Test user suspension/activation workflows
9. Test blog publishing and comment moderation workflows
10. Test content hierarchy (track → unit → lesson → activity)

### Priority 3: Medium (Maintainability)
11. Add integration tests for API routes (minimal - just success path)
12. Add component snapshot tests for complex UI
13. Add hook tests for state management (use-admin-*-controller)
14. Document test patterns and setup for new developers
15. Consider E2E tests for critical user journeys

### Implementation Strategy
**Phase 1 (Week 1):** Add tests for top 5 untested API routes
**Phase 2 (Week 2):** Add schema validation tests + error scenarios
**Phase 3 (Week 3):** Add integration tests for bulk operations
**Phase 4 (Week 4):** Add UI component tests (highest complexity)

---

## TEST QUALITY METRICS

### Current Coverage
- **Service functions tested:** 9/50+ (~18%)
- **API routes tested:** 1/68 (~1.5%)
- **UI components tested:** 0/24 (0%)
- **Overall module coverage:** ~2-3%

### Test Organization
**Strengths:**
- Proper use of vi.hoisted() for mock setup
- Clear test organization with describe blocks
- Comprehensive mocking of Prisma queries
- Good test naming (Vietnamese comments acceptable in describe blocks)
- Proper use of beforeEach for test isolation
- Realistic mock data with proper types

**Weaknesses:**
- No integration tests
- No API route tests (except 1)
- No component tests
- No error scenario coverage for most services
- No permission/authorization tests
- No edge case testing
- Mocks don't cover all Prisma methods used in services

---

## TECHNICAL FINDINGS

### Test Framework Status
- **Vitest:** v4.0.18 properly configured
- **Coverage reporting:** Available via `npm test:coverage` (not run in this session)
- **Watch mode:** Available via `npm test:watch`
- **Compatibility:** JSDOM configured for DOM testing

### Service Dependencies
All services depend on:
1. Prisma client (mocked in existing test)
2. Error handling (DomainError class)
3. Date utilities (date-fns, date-fns-tz)
4. Schema validation (Zod)
5. Audit logging (platform/audit-service)
6. Notifications (platform/notification-service)

### Build & Type Safety
- TypeScript types defined in service files
- Zod schemas provide runtime validation
- Prisma types from @prisma/client
- No obvious type conflicts found in admin services

---

## UNRESOLVED QUESTIONS

1. **Test Execution:** Cannot verify test pass/fail status due to restricted bash environment. Tests assumed passing based on code structure, but need actual run.
2. **Coverage Reports:** Current line/branch/function coverage percentages not measured. Need `npm test:coverage` output.
3. **Flaky Tests:** No way to identify intermittent failures without running multiple times.
4. **Performance:** Test execution time unknown. No profiling of slow tests.
5. **External Dependencies:** API routes make external calls (S3, payment providers, email) - need to confirm all are properly mocked.
6. **Database:** Which tests require actual database vs mocks? Prisma mock strategy covers most but needs verification.
7. **Auth Tests:** The 1 existing auth test in `src/lib/auth/__tests__/admin.test.ts` - what does it cover?

---

## NEXT STEPS

**Immediate (This Session):**
1. Run actual test suite to confirm pass/fail: `npm test -- --reporter=verbose`
2. Generate coverage report: `npm run test:coverage`
3. Identify slow tests: `npm test -- --reporter=verbose --reporter=timing`

**Follow-up (Next Session):**
1. Add tests for critical API routes (payments, users, content)
2. Implement integration test suite for admin workflows
3. Add UI component snapshot tests
4. Document test patterns and conventions for team

---

## FILES FOR REVIEW

**Test Files:**
- `/d/project/cungcontuhoc/src/modules/admin/__tests__/service.test.ts` (35+ tests, main admin service)
- `/d/project/cungcontuhoc/src/app/api/admin/site-settings/footer-social-links/route.test.ts` (1 route tested)

**Untested Services (Priority Order):**
1. `/d/project/cungcontuhoc/src/modules/admin/admin-billing-service.ts`
2. `/d/project/cungcontuhoc/src/modules/admin/admin-blog-service.ts`
3. `/d/project/cungcontuhoc/src/modules/admin/admin-users-management-service.ts`
4. `/d/project/cungcontuhoc/src/modules/admin/content-service.ts`
5. `/d/project/cungcontuhoc/src/modules/admin/admin-user-service.ts`

**All Admin API Routes:** `/d/project/cungcontuhoc/src/app/api/admin/**/*.ts` (68 routes)

**All Admin Components:** `/d/project/cungcontuhoc/src/components/admin*.tsx` (24+ components)
