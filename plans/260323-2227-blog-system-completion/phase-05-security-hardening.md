# Phase 5: Security Hardening

## Context Links
- Rate limit module: `src/lib/rate-limit.ts` (already exists — Redis + in-memory fallback)
- Newsletter subscribe route: `src/app/api/blog/newsletter/subscribe/route.ts` (reference pattern for rate limiting)
- Comment route: `src/app/api/blog/posts/[slug]/comments/route.ts` (already has Zod, no rate limit)
- Like route: `src/app/api/blog/posts/[slug]/like/route.ts` (no validation, no rate limit)
- Search route: `src/app/api/blog/search/route.ts`
- Route error handler: `src/lib/route-error.ts`
- CSRF: `src/lib/security/csrf.ts`
- Redis client: `src/lib/redis-client.ts`
- Blog repository: `src/modules/blog/blog-repository.ts`

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: ~4h
- Add rate limiting to all unprotected public blog endpoints. Add Zod validation where missing. Add Redis caching for hot blog data. Basic comment spam detection.

## Key Insights
- Rate limiting infrastructure already complete: `enforceRateLimit()` with Redis primary + in-memory fallback, `getRequestIp()`, `buildRateLimitIdentity()`. Just need to apply it to more routes.
- Newsletter subscribe already uses rate limiting + Zod + CSRF — this is the gold standard pattern to replicate.
- Comment route has Zod but no rate limit. Like route has neither.
- Search route has no rate limit (could be abused for DB load).
- No Redis caching layer exists yet for read-heavy blog data.

## Requirements

### Functional
- Rate limit all public blog write endpoints
- Zod validation on all public blog API inputs
- Redis caching for blog index, categories, featured posts
- Comment spam detection heuristics

### Non-Functional
- Rate limit failures return 429 with `Retry-After` header
- Cache: stale-while-revalidate pattern, 5-10min TTL
- Spam detection: heuristic-only (no ML), false positive rate < 1%
- All changes backward compatible

## Architecture

### Rate Limit Configuration
| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| POST comments | 5 | 1 hour | IP |
| POST like | 10 | 1 min | IP |
| POST newsletter subscribe | 10 IP / 3 email | 1 min / 1 hour | IP + email |
| GET search | 30 | 1 min | IP |
| POST reader signup | 3 | 1 hour | IP |
| POST reader login | 10 | 5 min | IP |
| POST reader bookmarks | 30 | 1 min | reader ID |

### Cache Strategy
```
Redis Key Pattern: blog:cache:{resource}:{identifier}

blog:cache:index:featured     → 10min TTL → featured posts JSON
blog:cache:categories:all     → 30min TTL → categories list JSON
blog:cache:post:{slug}        → 5min TTL  → post data JSON (public fields only)
blog:cache:trending:top5      → 10min TTL → trending posts JSON

Cache invalidation: on publish/update via blog-service.ts
```

### Spam Detection Heuristics
```
Score-based system (0-100, threshold 70 = spam):
+30  URL count > 2
+20  All-caps content > 50%
+15  Content matches blacklist keywords
+10  Content length < 20 characters
+10  Same IP submitted > 3 comments in last hour
+15  Author name matches known spam patterns (regex)
```

## Related Code Files

### Files to Modify
- `src/app/api/blog/posts/[slug]/comments/route.ts` — add rate limiting, spam check
- `src/app/api/blog/posts/[slug]/like/route.ts` — add rate limiting
- `src/app/api/blog/search/route.ts` — add rate limiting, input validation
- `src/app/api/blog/posts/route.ts` — add response caching
- `src/app/api/blog/featured/route.ts` — add response caching
- `src/app/api/blog/categories/route.ts` — add response caching
- `src/modules/blog/blog-service.ts` — cache invalidation on publish/update
- `src/modules/blog/comment-service.ts` — add spam score check in submitComment

### Files to Create
- `src/lib/blog-cache.ts` — Redis cache layer for blog data
- `src/modules/blog/comment-spam-detector.ts` — spam scoring heuristics

## Implementation Steps

### Step 1: Blog Cache Layer (~1h)
1. Create `src/lib/blog-cache.ts`:
   ```ts
   import { getRedisClient } from "@/lib/redis-client";

   const CACHE_PREFIX = "blog:cache";

   export async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
     try {
       const redis = getRedisClient();
       await redis.connect().catch(() => {});
       const cached = await redis.get(`${CACHE_PREFIX}:${key}`);
       if (cached) {
         return JSON.parse(cached) as T;
       }
       const data = await fetcher();
       await redis.set(`${CACHE_PREFIX}:${key}`, JSON.stringify(data), { PX: ttlMs });
       return data;
     } catch {
       // Redis unavailable — fall through to fetcher
       return fetcher();
     }
   }

   export async function invalidateCache(pattern: string) {
     try {
       const redis = getRedisClient();
       await redis.connect().catch(() => {});
       // Use SCAN + DEL for pattern-based invalidation
       // pattern: "blog:cache:post:*" or specific key
       const keys = [];
       for await (const key of redis.scanIterator({ MATCH: `${CACHE_PREFIX}:${pattern}`, COUNT: 100 })) {
         keys.push(key);
       }
       if (keys.length > 0) {
         await redis.del(keys);
       }
     } catch {
       // Ignore cache invalidation failures
     }
   }
   ```
2. Export: `getCached`, `invalidateCache`

### Step 2: Apply Cache to API Routes (~45min)
1. `src/app/api/blog/featured/route.ts`:
   ```ts
   const featured = await getCached("featured", 10 * 60 * 1000, () => blogService.getFeaturedPosts());
   ```
2. `src/app/api/blog/categories/route.ts`:
   ```ts
   const categories = await getCached("categories:all", 30 * 60 * 1000, () => blogRepository.findCategories());
   ```
3. `src/app/api/blog/posts/route.ts` — cache per page/category combo:
   ```ts
   const cacheKey = `posts:p${page}:c${category ?? "all"}:s${sort ?? "latest"}`;
   const result = await getCached(cacheKey, 5 * 60 * 1000, () => blogService.listPosts(params));
   ```

### Step 3: Cache Invalidation (~15min)
1. Open `src/modules/blog/blog-service.ts`
2. In `publishPost()`: add `await invalidateCache("*")` (invalidate all blog cache on publish)
3. In `updatePost()`: add `await invalidateCache("post:*")` if status changes
4. Keep simple: full cache bust on publish is acceptable given 5-10min TTLs

### Step 4: Rate Limit Comment Endpoint (~30min)
1. Open `src/app/api/blog/posts/[slug]/comments/route.ts`
2. Add to POST handler, before Zod parse:
   ```ts
   const ip = getRequestIp(request);
   const rateLimit = await enforceRateLimit({
     key: `blog:comment:ip:${buildRateLimitIdentity(ip)}`,
     limit: 5,
     windowMs: 60 * 60 * 1000, // 1 hour
     storeFailureMode: "deny",
   });
   if (!rateLimit.allowed) {
     return NextResponse.json(
       { error: "Too many comments. Please try again later." },
       { status: 429, headers: rateLimit.retryAfterMs ? { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } : undefined }
     );
   }
   ```
3. Add `assertTrustedOrigin(request)` CSRF check if not present

### Step 5: Rate Limit Like Endpoint (~15min)
1. Open `src/app/api/blog/posts/[slug]/like/route.ts`
2. Add rate limiting: 10 requests/min/IP
3. Add `assertTrustedOrigin(request)` CSRF check

### Step 6: Rate Limit Search Endpoint (~15min)
1. Open `src/app/api/blog/search/route.ts`
2. Add rate limiting: 30 requests/min/IP
3. Add Zod validation for `q` param: `z.string().trim().min(2).max(100)`

### Step 7: Comment Spam Detector (~45min)
1. Create `src/modules/blog/comment-spam-detector.ts`:
   ```ts
   const BLACKLIST_KEYWORDS = [
     "buy now", "click here", "free money", "casino",
     "viagra", "crypto trading", "earn money fast",
   ];

   export function calculateSpamScore(input: {
     content: string;
     authorName: string;
     urlCount: number;
     recentCommentsByIp: number;
   }): number {
     let score = 0;
     if (input.urlCount > 2) score += 30;
     const upperRatio = (input.content.match(/[A-Z]/g)?.length ?? 0) / Math.max(input.content.length, 1);
     if (upperRatio > 0.5 && input.content.length > 30) score += 20;
     const lowerContent = input.content.toLowerCase();
     for (const keyword of BLACKLIST_KEYWORDS) {
       if (lowerContent.includes(keyword)) { score += 15; break; }
     }
     if (input.content.length < 20) score += 10;
     if (input.recentCommentsByIp > 3) score += 10;
     if (/^[a-z]+\d{3,}$/i.test(input.authorName)) score += 15;
     return Math.min(score, 100);
   }

   export const SPAM_THRESHOLD = 70;
   ```
2. Integrate in `comment-service.ts` `submitComment()`:
   - Calculate spam score before creating comment
   - If score >= SPAM_THRESHOLD: set status to "SPAM" instead of "PENDING"
   - Still return success to client (don't reveal detection)
   - Log spam detection for admin review

### Step 8: Validate Remaining Routes (~30min)
1. Review all public blog API routes for missing Zod validation:
   - `GET /api/blog/posts` — validate query params (page, limit, category, sort)
   - `GET /api/blog/posts/[slug]` — slug already validated by Prisma lookup
   - `POST /api/blog/posts/[slug]/like` — no body needed, slug from URL
   - `GET /api/blog/search` — add Zod for `q` param
2. Add validation schemas where missing
3. Ensure all routes use `handleRouteError` for consistent error responses

## Todo List
- [ ] Create `blog-cache.ts` with getCached + invalidateCache
- [ ] Add caching to featured posts API
- [ ] Add caching to categories API
- [ ] Add caching to posts list API
- [ ] Add cache invalidation to publishPost + updatePost
- [ ] Add rate limiting to comments POST
- [ ] Add rate limiting + CSRF to like POST
- [ ] Add rate limiting + Zod to search GET
- [ ] Create `comment-spam-detector.ts`
- [ ] Integrate spam detection in submitComment
- [ ] Audit all public blog routes for missing Zod validation
- [ ] Add Zod to posts list query params
- [ ] Test rate limiting with Redis available
- [ ] Test rate limiting with Redis unavailable (in-memory fallback)
- [ ] Test spam detection with known spam patterns
- [ ] Test cache hit/miss behavior

## Success Criteria
- All public write endpoints rate-limited
- Search endpoint rate-limited
- Newsletter subscribe already rate-limited (verify unchanged)
- All public API inputs validated with Zod
- Featured posts, categories, trending cached in Redis
- Cache invalidation works on publish
- Comments with high spam score auto-flagged
- 429 responses include Retry-After header
- No breaking changes to existing behavior

## Risk Assessment
- **Redis unavailable**: All cache + rate limit code has in-memory fallback. System degrades gracefully.
- **Cache invalidation miss**: If invalidation fails, stale data served for max TTL (10min). Acceptable.
- **Spam false positives**: Conservative threshold (70/100). Vietnamese content with keywords in English unlikely to trigger. Add Vietnamese spam keywords later based on actual spam data.
- **Rate limit too strict**: 5 comments/hour/IP is generous for legitimate users. Adjust based on production data.

## Security Considerations
- Rate limiting uses SHA-256 hashed IP (privacy-preserving)
- CSRF checks via `assertTrustedOrigin` on all POST endpoints
- Zod validation prevents injection via malformed input
- Cache stores serialized JSON — no code execution risk
- Spam detector doesn't block users, just flags for moderation

## Next Steps
- After Phase 4 (reader accounts): apply rate limits to reader API endpoints
- Monitor spam detection effectiveness, tune thresholds
- Consider adding CAPTCHA for comment submission if spam persists
- Consider WAF rules for additional protection
