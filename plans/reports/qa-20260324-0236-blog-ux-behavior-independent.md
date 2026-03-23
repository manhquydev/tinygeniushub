# QA Report - Blog UX and Behavior (Independent)

Date: 2026-03-24
Work context: D:/project/cungcontuhoc
Method: repo-level static review + existing tests only (no browser)

## Scope
- Newsletter subscribe verification flow
- Like button visibility/usability
- Duplicate like protection
- Bookmark count consistency logic
- Bulk comment moderation transaction and side-effects

## Commands Run
- `pnpm -s type-check` -> pass
- `pnpm -s vitest run src/app/api/blog/newsletter/verify/route.test.ts src/app/api/blog/posts/[slug]/like/route.test.ts src/app/api/admin/blog/comments/bulk/route.test.ts src/modules/blog/comment-service.submit-comment.test.ts src/app/api/reader/bookmarks/route.test.ts src/app/api/blog/newsletter/subscribe/route.test.ts` -> pass (6 files, 19 tests)
- `pnpm -s vitest run src/app/api/blog/newsletter/unsubscribe/route.test.ts src/app/api/blog/comments/verify/route.test.ts src/app/api/blog/posts/[slug]/comments/route.test.ts` -> no matching tests

## Findings

### Critical
1. Bulk approve is not idempotent for reply notifications; repeated approve can resend queue jobs and reader notifications/email for same reply.
- Evidence: `approvedReplies` is selected after mass update with no transition guard (`already approved` vs `newly approved`).
- Files: `src/app/api/admin/blog/comments/bulk/route.ts:75`, `src/app/api/admin/blog/comments/bulk/route.ts:120`, `src/worker/queue.ts:181`
- Impact: duplicate user notifications + duplicate emails; easy to trigger via repeated admin action or retry.

### Major
1. Bulk moderation side-effects happen after transaction commit and are non-atomic.
- Evidence: DB update inside transaction, then queue/enrichment sends outside transaction via `Promise.all`.
- Files: `src/app/api/admin/blog/comments/bulk/route.ts:35`, `src/app/api/admin/blog/comments/bulk/route.ts:120`
- Impact: partial side-effects possible (some sent, some failed) while status changes are already committed; retry can amplify duplicates.

2. Newsletter subscribe path introduced race window (`findUnique` then `create`) for new email.
- Evidence: read-before-create without fallback on unique conflict.
- File: `src/modules/blog/newsletter-service.ts:11`, `src/modules/blog/newsletter-service.ts:24`
- Impact: concurrent same-email subscribe can throw unique error (500 path), despite one request succeeding.

### Minor
1. Like button cannot reflect pre-existing like state on initial render; user learns “already liked” only after click.
- Evidence: `liked` client state always initializes `false`; no initial liked status from server/cookie.
- Files: `src/components/blog/blog-like-button.tsx:13`, `src/app/(main)/blog/[slug]/page.tsx:181`
- Impact: UX confusion, unnecessary like API call for already-liked user.

## Missed Test Coverage
1. No tests for bulk moderation idempotency/duplicate side-effects on repeated approve.
- Missing: repeat approve same comment(s), expect no duplicate queue/email/reader notification.

2. No tests for bulk moderation side-effect failure after transaction.
- Missing: simulate `enqueueNotifyBlogCommentReply` or `notifyCommentReply` failure and assert behavior policy (retry/partial-failure handling).

3. No tests for newsletter subscribe concurrency / unique conflict handling.
- Missing: parallel subscribe same email; assert no 500 and deterministic response.

4. No tests for newsletter verify-email worker path.
- Missing: `verify-blog-newsletter-email` job processing, stale token handling, provider failure behavior.

5. No tests for repository-level duplicate like path.
- Missing: `registerPostLike` unique-constraint branch and returned `created: false` under real persistence behavior.

6. No tests for bookmark consistency edge cases.
- Missing: unpublished bookmarked posts effect on `countReaderBookmarks`/`findReaderBookmarks` and cap enforcement race behavior in `addBookmark`.

## Test Result Overview
- Files executed: 6
- Tests executed: 19
- Passed: 19
- Failed: 0
- Skipped: 0
- Type-check: pass

## Unresolved Questions
1. Should bulk approve send notifications only on status transition to `APPROVED`, or also on re-approve?
2. For newsletter subscribe, is 1st-request-only create semantics acceptable, or should endpoint be concurrency-safe and always return 200 without unique conflict surface?
3. For like UX, should initial liked state be server-derived (cookie/reader) to avoid extra click?
