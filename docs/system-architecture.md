# System Architecture

**Last updated:** 2026-07-10

High-level architecture, data flows, and deployment topology for TinyGenius Hub.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Parent   │  │ Child    │  │ Teacher  │  │ Reader   │        │
│  │ Web/App  │  │ Web/App  │  │ Web/App  │  │ Web/App  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┼─────────────┼─────────────┘
                      │ HTTPS
        ┌─────────────▼──────────────┐
        │   Cloudflare / Nginx       │  (Reverse Proxy + SSL)
        │   CDN / Rate Limiting      │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────────────┐
        │   Next.js App Router (Node.js)    │
        │  ┌────────────────────────────┐   │
        │  │  /api/* Routes             │   │
        │  │  /app/* Pages (RSC + SSG)  │   │
        │  │  /middleware (proxy.ts)    │   │
        │  └────────────────────────────┘   │
        └─────────────┬──────────────────────┘
                      │
        ┌─────────────┴──────────────┬──────────────────┐
        │                            │                  │
    ┌───▼──────┐          ┌──────────▼────┐    ┌────────▼────────┐
    │ PostgreSQL  │          │   Redis     │    │   BullMQ Queue  │
    │  (Database) │          │ (Cache/Sess)│    │   (Job Queues)  │
    └───────────┘          └──────────────┘    └────────┬────────┘
        ▲                                               │
        │                                    ┌──────────▼──────────┐
        └────────────────────────────────────│  BullMQ Worker      │
                                            │  (Job Processors)   │
                                            │  - Email            │
                                            │  - Reports          │
                                            │  - Media Cleanup    │
                                            │  - Certificates     │
                                            └─────────────────────┘
        ┌─────────────────────────────────────────────────────────┐
        │             EXTERNAL SERVICES                           │
        │  ┌──────────────┐  ┌──────────┐  ┌──────────┐          │
        │  │ Bunny Stream │  │Cloudflare│  │  Stripe  │          │
        │  │ (Video CDN)  │  │ R2 (S3)  │  │PayOS/Email        │
        │  └──────────────┘  └──────────┘  └──────────┘          │
        └─────────────────────────────────────────────────────────┘
```

---

## Request Flow (Browser → Server → Database)

### 1. HTTP Request (proxy.ts middleware)
```
Browser → Cloudflare/Nginx → proxy.ts (middleware)
          ↓
  - Parse cookies (session, A/B test, attribution, consent)
  - Track page view (GA4)
  - Set response headers (cache-control, security)
  - Route to App Router
```

### 2. App Router (SSR/SSG)
```
Next.js Page Component
  ↓
  ├─ getServerSideProps / generateMetadata (Server Component)
  │   ↓
  │   Call service layer (courseService.getCatalog())
  │   ↓
  │   Prisma query (with Redis cache if applicable)
  │   ↓
  │   Return data to page
  │
  └─ Client Component ('use client')
      ↓
      useEffect() call to /api/... route
      ↓
      Route handler → service layer → Prisma → response
```

### 3. API Route (Type-Safe Handler)
```
/api/courses/[slug]/GET
  ↓
  1. Extract params + query
  2. Validate input (Zod schema)
  3. Auth check (getParentFromRequest)
  4. Call service (courseService.getDetail)
  5. Return Response.json(data)
```

### 4. Database (Prisma)
```
Service Layer
  ↓
  prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: true,
      enrollments: { where: { childId } }
    }
  })
  ↓
PostgreSQL 16 → Cache (Redis) → Return to service
```

---

## Worker Flow (Background Jobs)

### Queue System (BullMQ + Redis)
```
Event (signup, course completion, cron) → Enqueue job
  ↓
Job stored in Redis queue
  ↓
BullMQ Worker process polls Redis
  ↓
Job processor runs (email, report, media cleanup)
  ↓
On success: job marked complete
On failure: retry (exponential backoff) or dead-letter queue
```

### Job Types (10 Queues)

| Queue | Job | Trigger | Processor |
|---|---|---|---|
| `lifecycle-emails` | send-lifecycle-email | Signup → D0/D3/D7 | Resend API |
| `weekly-reports` | generate-weekly-reports | Cron (Sunday 8am) | Progress calculation |
| `weekly-report-emails` | dispatch-weekly-report-emails | Cron (Sunday 9am) | Resend + templating |
| `blog-newsletter` | dispatch-blog-newsletter-email | Admin trigger | Resend + list |
| `transactional-emails` | send-transactional-email | Invoice, receipt | Resend |
| `certificates` | generate-certificate | Course completion | pdf-lib + R2 upload |
| `bulk-enroll` | bulk-enroll | Teacher CSV upload | Prisma batch insert |
| `portfolio-retention` | purge-expired-media | Cron (nightly) | S3/R2 delete |
| `blog-comment-emails` | verify-blog-comment | Comment posted | Moderation + email |
| `blog-comment-reply-emails` | notify-comment-reply | Reply to comment | Resend |

### Worker Scalability
```
Single Worker (dev):
  BullMQ Worker on same process as web server
  ↓
Multiple Workers (production):
  - Separate PM2 process for worker
  - Can scale horizontally with Redis-backed queue
  - Job state persisted in Redis
```

---

## Authentication Flow (Better Auth)

### Session Management
```
Parent Signup
  ↓
  1. POST /api/auth/signup → validate email/password
  2. Create `ParentAccount` + `Session` in database
  3. Set signed session cookie (httpOnly, secure, sameSite=strict)
  4. Redirect to onboarding
  ↓
Client makes request
  ↓
  getParentFromRequest(request) → parse cookies → verify signature
  ↓
  Attach parent context to route handler
  ↓
  Parent can now access `/parent/*` and `/api/parent/*`
```

### Multi-Auth (Parent vs Admin vs Reader)
```
Better Auth (Parent + Admin):
  - Parent: email/password, session cookie
  - Admin: email/password + superadmin flag, session cookie
  - Routes check `admin` field for admin-only access

Reader (Separate Auth):
  - Independent `ReaderAccount` + `Session`
  - Used for blog comments, newsletter signup
  - No access to parent/child data
```

### Permission Guards
```
Route Handler
  ↓
  parent = getParentFromRequest(request)
  if (!parent) return 401 Unauthorized
  ↓
  Resource ownership check:
  child = await prisma.childProfile.findUnique({ where: { id: childId } })
  if (child?.parentId !== parent.id) return 403 Forbidden
  ↓
  Proceed with action (read, update, delete)
```

---

## Data Flow Patterns

### Course Purchase
```
Parent clicks "Buy Course" on /courses/[slug]
  ↓
  POST /api/courses/[slug]/checkout
  ↓
  Create `CourseEnrollment` record
  ↓
  Redirect to Stripe checkout session
  ↓
  Stripe webhook → /api/billing/webhooks/stripe
  ↓
  Update `Subscription.status` = "active"
  ↓
  Parent granted access to course lessons
```

### Lesson Completion
```
Child completes lesson on /kid/[lessonId]
  ↓
  POST /api/lessons/[lessonId]/complete
  ↓
  Create `LessonCompletion` record
  ↓
  Update `ChildSkillState` (spaced repetition scoring)
  ↓
  Enqueue `generate-certificate` job (if course complete)
  ↓
  Enqueue `generate-weekly-reports` job (if trigger met)
  ↓
  Return success + reward points
```

### Adaptive Next-Lesson Sequencing
```
Child requests next lesson
  ↓
  GET /api/adaptive/next-lesson?childId=...
  ↓
  Query `ChildSkillState` (current skill levels)
  ↓
  Query `ReviewQueue` (due for spaced repetition)
  ↓
  AI logic: return lesson targeting skill gaps
  ↓
  Track `SkillAttempt` (attempt record for analytics)
  ↓
  Return lesson + progress
```

---

## Storage & CDN

### Video Streaming (Bunny Stream)
```
Admin uploads video → POST /api/admin/videos/upload
  ↓
  Client sends video to Bunny Stream API
  ↓
  Bunny returns video ID + status (encoding)
  ↓
  Store `Lesson.bunnyVideoId` in database
  ↓
  Bunny webhook → /api/webhooks/bunny → Update `Lesson.videoStatus`
  ↓
  Parent plays lesson → GET /api/lessons/[lessonId]/video-token
  ↓
  Return signed embed URL (HMAC-SHA256) + expiry
  ↓
  Bunny serves video to browser (cached at edge)
```

### Media Storage (Cloudflare R2)
```
Evidence upload (child drawing, screenshot)
  ↓
  POST /api/progress/media → validate + sign
  ↓
  Client uploads directly to R2 (signed URL)
  ↓
  Create `EvidenceMedia` record (URL + metadata)
  ↓
  Weekly cleanup job: purge old evidence (>30 days)
```

### Cache (Redis)
```
High-traffic data:
  - Course catalog (updated hourly)
  - Blog posts (updated on publish)
  - Feature flags (checked on every request)
  ↓
  Cache key pattern: `courses:catalog:v1`
  TTL: 3600 seconds (1 hour)
  Invalidate on: admin publish, new course, flag toggle
```

---

## Deployment Topology

### Docker Compose (Development / Staging)
```
docker-compose up -d
  ├── postgres:16-alpine     (Port 5432)
  ├── redis:7-alpine         (Port 6379)
  ├── web (Node.js)          (Port 3000)
  └── worker (Node.js BullMQ)(No port exposed)
```

### VPS (Production — DigitalOcean Ubuntu 24.04)
```
IP: 152.42.246.218
  ├── Nginx (reverse proxy)
  │   ├── Listen :80 → redirect to :443
  │   ├── Listen :443 → upstream to Node.js :3000
  │   ├── SSL via Let's Encrypt
  │   └── Cache headers, CORS, rate-limit
  │
  ├── PM2 process manager
  │   ├── Node.js web process (npm start)
  │   └── BullMQ worker process (npm run worker)
  │
  └── Docker Compose
      ├── PostgreSQL 16 (persistent volume /var/lib/postgresql)
      └── Redis 7 (persistent volume /var/lib/redis)
```

### CI/CD (GitHub Actions)
```
Push to main branch
  ↓
  .github/workflows/deploy-digitalocean-ssh.yml
  ├── Run tests (npm test)
  ├── Build Docker image
  ├── SSH into VPS
  ├── Pull latest code
  ├── Run migrations (prisma migrate deploy)
  ├── Restart services (pm2 restart)
  └── Health check (curl /api/health)
```

### Vercel (Preview / Staging)
```
vercel.json configured with 5 cron routes:
  - /api/cron/weekly-reports (Sunday 8am)
  - /api/cron/streak-alerts (Daily 6am)
  - /api/cron/newsletter-digest (Monday 9am)
  - /api/cron/cleanup-media (Nightly 2am)
  - /api/cron/publish-scheduled-posts (Every hour)
```

---

## Security Architecture

### Input Validation
```
Route receives request
  ↓
  Zod schema validates request body
  ↓
  On error: return 400 + ZodError details
  ↓
  On success: pass validated data to service
```

### Authentication
```
Every request checked:
  ├─ Session cookie valid?
  ├─ Session not expired?
  ├─ Signature valid (HMAC)?
  ├─ User ID matches cookie?
  └─ Admin check (if needed)
```

### Authorization
```
After auth, check resource ownership:
  ├─ Child belongs to parent?
  ├─ Organization member has permission?
  ├─ Blog comment author correct?
  └─ Admin role verified?
```

### Encryption
```
At Rest:
  - PostgreSQL encryption (optional TDE)
  - R2 S3-side encryption

In Transit:
  - HTTPS only (force redirect http → https)
  - TLS 1.3 minimum
  - Signed cookies (HMAC-SHA256)
```

---

## Observability & Monitoring

### Logging
```
Request logging: method, path, status, duration (Pino/Winston)
Error logging: stack trace, context, user ID (Sentry optional)
Audit logging: admin actions (create, update, delete) → AuditLog table
```

### Analytics
```
Event tracking via GA4:
  - page_view (automatically)
  - custom events: purchase, lesson_complete, signup
  - funnels: signup → trial → purchase

Meta Pixel:
  - Purchase event (revenue tracking)
  - ViewContent event (lesson view)
```

### Monitoring
```
Health endpoint: GET /api/health
  ├─ Database connection ok?
  ├─ Redis connection ok?
  ├─ Worker alive?
  └─ Recent errors?

Uptime monitoring:
  - Pingdom / UptimeRobot (external)
  - Alerts on 5xx errors, slow queries

Performance:
  - Core Web Vitals (Lighthouse, CrUX)
  - Query performance (slow query log)
  - Worker job duration (BullMQ dashboard)
```

---

## Scaling Considerations

### Horizontal Scaling
```
Web Server:
  - Multiple Node.js instances behind load balancer
  - Shared PostgreSQL (connection pooling)
  - Shared Redis (session store)

Worker:
  - Multiple BullMQ workers (Redis-backed queue)
  - Job distribution via queue
  - Retry logic handles transient failures
```

### Database Optimization
```
Indexes: (childId, createdAt), (courseId, status), (skillId)
Read replicas: For analytics + reporting (future)
Connection pooling: Via Prisma client
Query optimization: Selective include/select
```

### Caching Strategy
```
Cache invalidation:
  - Time-based (TTL 1–24 hours)
  - Event-based (admin publish invalidates course cache)
  - Full invalidation (cache clear on major release)
```

---

## Disaster Recovery

### Backup Strategy
```
Database:
  - Nightly PostgreSQL backup to Cloudflare R2
  - 30-day retention
  - Test restore quarterly

Code:
  - Git repository (GitHub, private)
  - Automated deploys from main branch
```

### Failover
```
Primary site down:
  - DNS failover to standby (if available)
  - Fallback: manual intervention (ETA <1 hour)

Database corruption:
  - Restore from latest backup
  - Replay transaction log (if available)
  - Manual data recovery (last resort)
```

---

## Technology Decisions

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Node.js 20 LTS | Stable, TypeScript support |
| **Framework** | Next.js 16 App Router | Server components, built-in optimization |
| **Language** | TypeScript | Type safety, refactoring confidence |
| **Database** | PostgreSQL 16 | ACID, relational, proven at scale |
| **ORM** | Prisma | Type-safe, migrations, excellent DX |
| **Cache** | Redis 7 | Session store, queue backend, fast |
| **Queue** | BullMQ | Redis-backed, reliable, TypeScript |
| **Auth** | Better Auth | Modern, passkey-ready, fresh maintenance |
| **UI** | shadcn/ui | Headless, accessible, Tailwind CSS |
| **CDN** | Bunny Stream + R2 | Cost-effective, SE Asia performance |
| **Email** | Resend | Simple API, good deliverability |
| **Payments** | Stripe + PayOS | Global + local support |
