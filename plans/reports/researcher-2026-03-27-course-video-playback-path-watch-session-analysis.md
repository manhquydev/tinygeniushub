# Course video playback path + watch-session API analysis

Date: 2026-03-27
Work context: D:/project/cungcontuhoc

## 1) End-to-end map: course page -> video source URL

1. Course detail page renders curriculum:
   - `src/app/(main)/courses/[slug]/page.tsx:286-292` -> mounts `CourseDetailCurriculum`.
   - `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx:115-123` -> opens `CourseLessonPreviewModal` with lesson id.

2. Preview modal fetches playback token/url:
   - `src/components/courses/course-lesson-preview-modal.tsx:73-75` -> `GET /api/lessons/{lessonId}/video-token`.
   - Parses `embedUrl + streamType` at `:105-130`.
   - If secure source: renders `SecureVideoPlayer` at `:304-316`.

3. Token route returns either Bunny iframe or secure playback path:
   - `src/app/api/lessons/[lessonId]/video-token/route.ts:71-74` -> Bunny embed (`streamType: "embed"`).
   - `:76-95` -> protected source path `/api/lessons/{id}/secure-playback?token=...` + stream hint (`hls|file`).

4. Secure playback route verifies token + eligibility then redirects:
   - `src/app/api/lessons/[lessonId]/secure-playback/route.ts:31-66` token + eligibility checks.
   - `:75-80` resolves source + `307` redirect to real video URL.

5. Player behavior:
   - `src/components/media/secure-video-player.tsx:96-103` decides HLS vs file using hint.
   - `:122-158` uses `hls.js` for HLS.
   - `:107-111` / `:115-119` uses native `<video>` for file/native HLS.

## 2) Playback tracking map (preview + watch-session)

A. Course preview modal tracking (analytics only, no watch-session API):
- Trigger points in `src/components/courses/course-lesson-preview-modal.tsx`:
  - open `:63-69`
  - play success `:194-205`
  - watch-qualified timer `:213-251`
  - close `:167-183`
- Event wrappers in `src/components/courses/course-storefront-tracking.tsx:187-272`.
- Sink is client analytics utility `src/lib/analytics/track-event.ts:153-177` (gtag/fbq only).

B. Watch-session APIs (used by authenticated lesson player flow, not storefront preview):
- Client caller: `src/components/lesson-player/LessonPlayerScene.tsx`
  - start session `:213-217` -> `POST /api/lessons/{id}/watch/session`
  - heartbeat `:259-267` -> `POST /api/lessons/{id}/watch/heartbeat`
  - finalize watch `:318-322` -> `POST /api/lessons/{id}/watch`
- API routes:
  - `src/app/api/lessons/[lessonId]/watch/session/route.ts:11-61`
  - `src/app/api/lessons/[lessonId]/watch/heartbeat/route.ts:11-61`
  - `src/app/api/lessons/[lessonId]/watch/route.ts:11-61`
- Domain logic:
  - `src/modules/learning/video-watch-service.ts:320-400` create session
  - `:402-480` heartbeat crediting
  - `:482-588` mark watched

## 3) Most likely breakpoints for symptom: "UI renders, play button does nothing"

### Candidate RC-1 (highest probability): stream type regression on secure playback

Why:
- Historically, `/video-token` returned `streamType: "secure"` for protected URLs (no hls/file hint).
- `SecureVideoPlayer` must choose HLS vs native. Without hint, HLS detection for `/secure-playback?...` is brittle.
- On non-Safari browsers, if HLS gets treated as plain file/native, pressing play yields unsupported source while UI still renders.

Evidence:
- Fix commit exists and is very recent: `b0c92df4 fix(video): preserve secure stream hints for hls playback`.
- Changed `video-token` from generic `secure` to `hls|file`:
  - `src/app/api/lessons/[lessonId]/video-token/route.ts:20-22,81-94`.
- Propagated hint in preview modal:
  - `src/components/courses/course-lesson-preview-modal.tsx:111-117,307`.

Minimal fix:
- Ensure production is running commit `b0c92df4` (or equivalent).
- Keep API response contract as `embed | hls | file` and pass through to `SecureVideoPlayer.streamTypeHint`.

### Candidate RC-2: secure playback token expires before user clicks Play

Why:
- Token TTL is 5 minutes for both parent and guest preview.
- Modal fetches token on open, but user may click Play later; UI still shows player, source then fails (403) at actual media load.

Evidence:
- `src/lib/secure-video-source.ts:6` TTL 5m.
- `src/modules/courses/course-trial-policy.ts:7` guest TTL 5m.
- Modal fetch happens at mount (`src/components/courses/course-lesson-preview-modal.tsx:59-75`), not refreshed on Play click.

Minimal fix:
- Re-fetch `/video-token` when user clicks `Bắt đầu xem thử` before setting `previewStarted=true`.
- Alternative quick fix: raise TTL from 5m to 10-15m.

### Candidate RC-3: source host allowlist mismatch for specific course video

Why:
- Token route can still return secure path, but secure-playback route rejects final URL if hostname not allowlisted.
- Result: player UI visible, actual media request 404 `Video source unavailable`.

Evidence:
- Host allowlist check at `src/lib/secure-video-source.ts:58-73`.
- Default hosts hardcoded at `:7` (`fileta.hoctienganh.xyz`, `cdn.littlefox.com`).
- Enforcement in secure-playback route `src/app/api/lessons/[lessonId]/secure-playback/route.ts:75-77`.

Minimal fix:
- Add actual CDN host to `VIDEO_SOURCE_ALLOWED_HOSTS` in production env.
- Keep SSRF guard; do not disable allowlist.

## 4) Note on watch-session APIs

- For storefront preview page (`/courses/[slug]` modal), watch-session APIs are not in the execution path.
- So watch-session regressions affect lesson progression/continue gating in `LessonPlayerScene`, but do not directly explain "preview play button does not start video".

## 5) Recommended minimal fix sequence

1. Verify prod commit includes `b0c92df4` changes (RC-1).
2. If still intermittent: refresh token on Play click (RC-2).
3. If course-specific only: verify redirect target host against allowlist (RC-3).

## Unresolved questions

1. In production for lesson(s) under `abeka-g1-intro-4w`, `/api/lessons/{id}/video-token` currently returns which `streamType` (`embed|hls|file`)?
2. For failing click, `/api/lessons/{id}/secure-playback?...` returns 307 to which host/path, and does that host exist in `VIDEO_SOURCE_ALLOWED_HOSTS`?
3. Time gap between modal open and Play click in real user sessions (to confirm TTL expiry scenario).
