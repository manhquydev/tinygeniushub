# Code Standards & Conventions

**Last updated:** 2026-07-10

This document establishes coding patterns, naming conventions, and architectural decisions for TinyGenius Hub development.

---

## File & Module Organization

### File Naming
- **Kebab-case:** `lesson-player.tsx`, `course-service.ts`, `auth-helper.ts`
- **Descriptive names:** Prefer clarity over brevity. `lesson-completion-modal.tsx` > `modal.tsx`
- **Max file size:** Keep individual files ≤200 lines. Split cohesive modules by responsibility.
- **No barrel exports:** Modules should import directly: `import { courseService } from '@/modules/courses/service'` (not `from '@/modules/courses'`)

### Directory Structure
```
src/
├── app/                  # Next.js App Router (route groups + API)
├── components/           # Shared UI components (by domain subdirs)
├── modules/              # Domain logic (14 self-contained modules)
├── lib/                  # Utilities (auth, db, analytics, env)
├── locales/              # i18n translations (en, vi)
├── worker/               # BullMQ queue definitions + job processors
└── prisma/               # Database schema + migrations
```

### Module Pattern (src/modules)
Each module is self-contained:
```
src/modules/courses/
├── service.ts            # Core business logic (CRUD, workflows)
├── checkout-service.ts   # Specialized sub-service
├── api-handler.ts        # Type-safe handler wrappers (if needed)
└── index.ts              # NOT a barrel export; used only for re-exports in app/
```

**Rule:** Import services directly from their files. No `index.ts` barrel exports in modules.

---

## Component Naming & Structure

### Component File Names
- **PascalCase files:** `LessonPlayer.tsx`, `CourseDetailHero.tsx`
- **Default exports:** Components are default exports
- **Props interfaces:** `interface LessonPlayerProps { ... }`
- **Client components:** Add `'use client'` at top if needed

Example:
```tsx
// components/lessons/lesson-player.tsx
'use client'

interface LessonPlayerProps {
  lessonId: string
  childId: string
}

export default function LessonPlayer({ lessonId, childId }: LessonPlayerProps) {
  return <div>...</div>
}
```

### Component Size & Splitting
- Keep components ≤200 lines. Split into sub-components:
  - `<LessonPlayer />` (wrapper, state) → `<LessonPlayerContent />` + `<LessonPlayerSidebar />`
  - Use composition for complex widgets (garden, lesson detail)

### UI Library
- **shadcn/ui** (Radix UI + Tailwind CSS)
- **Icons:** `lucide-react` (ChevronDown, Check, etc.)
- **Forms:** React Hook Form + Zod validation

---

## API Routes & Handlers

### Route Naming
- **Resource-based:** `/api/courses/[slug]/reviews` not `/api/get-course-reviews`
- **Consistent HTTP methods:**
  - `GET` — fetch, list
  - `POST` — create, action
  - `PATCH` — update (partial)
  - `DELETE` — remove

### Route Handler Pattern
```typescript
// app/api/courses/[slug]/route.ts
import { getParentFromRequest } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    // Fetch logic
    return Response.json(data)
  } catch (error) {
    return Response.json({ error: 'message' }, { status: 400 })
  }
}
```

### Error Handling
- Use route-level `error.ts` for error UI boundaries
- Return typed error responses: `{ error: string, details?: any }`
- Log via `console.error` + structured logging (Winston/Pino)
- Never expose stack traces to client

---

## Service & Business Logic

### Service Structure
```typescript
// modules/courses/service.ts
class CourseService {
  async getCatalog(filters?: Filter) { ... }
  async getDetail(slug: string) { ... }
  async enroll(courseId: string, childId: string) { ... }
  async complete(enrollmentId: string) { ... }
}

export const courseService = new CourseService()
```

**Rule:** Services are singletons. Inject dependencies in constructor or as parameters.

### Database Access
- Use Prisma ORM directly in services
- Avoid N+1 queries — use `include` + `select`
- Keep queries in services, not routes

Example:
```typescript
async getCourseWithEnrollment(slug: string, childId: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: { select: { id: true, title: true } },
      enrollments: {
        where: { childId },
        select: { status: true, completedAt: true }
      }
    }
  })
}
```

---

## Error Handling & Validation

### Input Validation
- Use **Zod** for request body validation
- Validate at route boundaries (before passing to services)
- Define shared schemas in `lib/schemas.ts`

Example:
```typescript
import { z } from 'zod'

const enrollCourseSchema = z.object({
  courseId: z.string().uuid(),
  childId: z.string().uuid()
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = enrollCourseSchema.parse(body) // throws ZodError
  return courseService.enroll(parsed.courseId, parsed.childId)
}
```

### Error Types
- **Validation:** Return 400 (Bad Request)
- **Auth:** Return 401 (Unauthorized)
- **Forbidden:** Return 403 (Forbidden)
- **Not Found:** Return 404 (Not Found)
- **Conflict:** Return 409 (Conflict) — e.g., duplicate enrollment
- **Server:** Return 500 (Internal Server Error)

---

## Testing Standards

### Test Naming
- **Unit:** `service.test.ts` (same dir as service)
- **Integration:** `route.test.ts` (same dir as route)
- **E2E:** `src.spec.ts` in `tests/e2e/`

### Test Framework
- **Unit/Integration:** Vitest + supertest (for routes)
- **E2E:** Playwright
- **Coverage goal:** >80%

### Test Example
```typescript
// modules/courses/service.test.ts
describe('CourseService', () => {
  it('getCatalog returns published courses only', async () => {
    const catalog = await courseService.getCatalog()
    expect(catalog).toEqual(expect.arrayContaining([
      expect.objectContaining({ isPublished: true })
    ]))
    expect(catalog.some(c => !c.isPublished)).toBe(false)
  })
})
```

---

## Authentication & Authorization

### Auth Pattern
- Use **Better Auth** for session management
- Store user/parent context in request:
  ```typescript
  const parent = await getParentFromRequest(request)
  if (!parent) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  ```
- Admin routes use `requireAdminFromRequest(request)`

### Permission Guards
```typescript
// Verify resource ownership before mutation
const enrollment = await prisma.courseEnrollment.findUnique({ where: { id } })
if (enrollment?.childId !== childId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## Environment Variables

### Validation
- All env vars validated via `src/lib/env.ts`
- Use `z.string()`, `z.number()`, `z.enum()` for type safety
- Fail fast at startup if missing

Example:
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BUNNY_STREAM_API_KEY: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export const env = envSchema.parse(process.env)
```

### Secrets
- Never commit `.env.local`
- Production secrets via environment variables (not files)
- Use `NEXT_PUBLIC_` prefix only for public values (GA4 ID, FB Pixel ID)

---

## Commit Message Format

### Conventional Commits
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat` | `fix` | `refactor` | `test` | `chore` | `docs`
**Scope:** `courses`, `blog`, `adaptive`, `admin`, etc.
**Subject:** Imperative, present tense, no period. Max 50 chars.

**Examples:**
- `feat(courses): add course reviews system`
- `fix(adaptive): correct skill state calculation`
- `refactor(lesson-player): split into sub-components`
- `test(auth): add session expiry coverage`

---

## Code Quality

### Linting & Formatting
- **ESLint:** Enforce rules, catch errors
- **Prettier:** Code formatting (auto on save)
- **TypeScript:** Strict mode (`strict: true` in tsconfig)
- Run pre-commit: `npm run lint && npm run format`

### Code Review Checklist
- [ ] No syntax errors, TypeScript strict
- [ ] Services have tests (>80% coverage)
- [ ] Error handling for all paths
- [ ] No console.log in production code (use structured logging)
- [ ] API changes documented in code comments (non-obvious)
- [ ] Database changes include migration + seed update

---

## Internationalization (i18n)

### next-intl Usage
- Translations in `locales/{locale}/translation.json`
- Use `useTranslations()` hook in client components
- Wrap app with `<IntlProvider>` (via middleware)
- Define `i18n.config.ts` with supported locales

Example:
```typescript
// app/page.tsx
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('home')
  return <h1>{t('title')}</h1>
}
```

---

## Performance Best Practices

- **Images:** Use `next/image` with `priority` for LCP
- **Fonts:** Self-host or use next/font with `preload`
- **API routes:** Cache with Redis where applicable (courses, blog)
- **Lesson player:** Preload video manifests, defer non-critical scripts
- **Analytics:** Use `sendBeacon()` for page unload events

---

## Security

- **XSS:** Sanitize user input (use libraries, not manual regex)
- **SQL Injection:** Prisma handles via parameterized queries
- **CSRF:** Add CSRF token to forms (if not using session cookies)
- **Rate Limiting:** Apply to auth routes (5 attempts/15 min) and API (per IP)
- **HTTPS:** Enforce in production (redirect http → https)
