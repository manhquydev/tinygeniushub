# Phase 02 — Video Infrastructure (Bunny Stream)

## Context Links
- [Plan Overview](./plan.md)
- [Video/Infra Research](../260225-0059-marketing-strategy-gtm/research/video-hosting-and-github-student-pack-research.md)
- [Handover Doc](../../docs/handover/handover-master-agent-ready.md)

## Overview
- **Priority:** P1 (start immediately, parallel with Phase 01)
- **Status:** ⬜ pending
- **Duration:** Month 0–2
- **Goal:** Bunny Stream integrated, 10–20 video lessons live, signed URL access control working

## Key Insights
1. Bunny Stream = best cost/DX at MVP stage (~$0.50–3/month, auto-HLS, no FFmpeg needed)
2. Signed URLs required for paid content access control (free content: public; paid: signed)
3. Current codebase uses Cloudflare R2 for storage — Bunny Stream replaces video delivery, R2 stays for other assets (images, PDFs)
4. Content hierarchy already defined in handover: Track → Level → Unit → Lesson
5. DO server (2vCPU 4GB) can handle upload proxy + metadata; video delivery via Bunny CDN
6. COPPA risk: no YouTube embed for paid content; public trailers only

## Requirements

### Functional
- [ ] Bunny Stream account + API key configured
- [ ] Video upload flow: admin uploads video → stored in Bunny Stream library
- [ ] HLS playback in lesson page using `hls.js` or Bunny's player
- [ ] Signed URL generation for paid/trial-gated lessons
- [ ] Public URL (no signing) for free preview lessons
- [ ] Admin CMS: upload video, link to lesson entity in DB
- [ ] 10–20 video lessons published (content production separate from tech)

### Non-functional
- [ ] Video starts within 3s on typical Vietnamese mobile connection (4G ~20Mbps)
- [ ] Signed URLs expire in 4 hours (session-length appropriate)
- [ ] Upload webhook from Bunny → mark lesson as "video_ready" in DB
- [ ] Env vars: `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_CDN_HOSTNAME`

## Architecture

```
Admin uploads video
       ↓
POST /api/admin/videos/upload
  → proxy upload to Bunny Stream API
  → store video_id in Lesson.bunnyVideoId
       ↓
Bunny encodes → webhook → PATCH Lesson.videoStatus = "ready"
       ↓
Parent/child opens lesson
POST /api/lessons/[id]/video-token
  → verify subscription or course enrollment
  → generate Bunny signed URL (4h expiry)
  → return signed URL
       ↓
Frontend: hls.js player loads signed URL
```

### DB Changes (Prisma)
```prisma
model Lesson {
  // existing fields ...
  bunnyVideoId    String?   // Bunny Stream video GUID
  videoStatus     String    @default("pending") // pending | processing | ready | error
  videoDuration   Int?      // seconds
  isPreview       Boolean   @default(false)     // free preview = public URL
}
```

### New API Routes
- `POST /api/admin/videos/upload` — upload to Bunny Stream
- `GET /api/admin/videos/[videoId]/status` — check encoding status
- `POST /api/lessons/[id]/video-token` — generate signed playback URL
- `POST /api/webhooks/bunny` — receive Bunny encoding webhooks

### New Env Vars
```
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_LIBRARY_ID=
BUNNY_CDN_HOSTNAME=
BUNNY_WEBHOOK_SECRET=
```

## Related Code Files

### Files to Modify
- `src/modules/content/` — Lesson service, add `bunnyVideoId`, `videoStatus`, `isPreview`
- `prisma/schema.prisma` — add Bunny fields to `Lesson` model
- `src/app/api/admin/` — new upload endpoint
- `src/app/api/lessons/` — new video-token endpoint
- `src/app/api/webhooks/` — Bunny webhook handler

### Files to Create
- `src/lib/bunny-stream.ts` — Bunny Stream API client (upload, delete, signed URL)
- `src/app/api/admin/videos/upload/route.ts`
- `src/app/api/lessons/[id]/video-token/route.ts`
- `src/app/api/webhooks/bunny/route.ts`
- `src/components/video-player.tsx` — hls.js wrapper component

### Files to Delete
- Any existing R2-based video serving code (check `src/modules/content/` for video URL logic)

## Implementation Steps

### 1. Bunny Stream Setup (Day 1–2)
1. Create Bunny.net account → create Stream library (region: Singapore/Asia)
2. Get API key, Library ID, CDN hostname
3. Set env vars in `.env.local` and production

### 2. Prisma Schema Update (Day 2)
1. Add `bunnyVideoId`, `videoStatus`, `videoDuration`, `isPreview` to `Lesson` model
2. Run `prisma migrate dev --name add-bunny-video-fields`

### 3. Bunny Stream Client (Day 2–3)
Create `src/lib/bunny-stream.ts`:
```typescript
// uploadVideo(filePath): Promise<{ videoId: string }>
// deleteVideo(videoId): Promise<void>
// getSignedUrl(videoId, expiresInSeconds): string
// getPublicUrl(videoId): string
```
Use HMAC-SHA256 for signed URL (Bunny's signing method).

### 4. Upload API Route (Day 3–4)
- `POST /api/admin/videos/upload` — multipart upload proxy to Bunny
- Auth: admin session required (Better Auth)
- Validate file type (video/mp4, video/webm only)
- Max size: 500MB (limit in Next.js config)
- On success: return `{ videoId, status: "processing" }`

### 5. Webhook Handler (Day 4)
- `POST /api/webhooks/bunny` — Bunny calls this when encoding completes
- Verify webhook secret (HMAC-SHA256 signature header)
- Update `Lesson.videoStatus = "ready"` + set `videoDuration`

### 6. Video Token API (Day 4–5)
- `POST /api/lessons/[id]/video-token`
- Auth: valid session required
- Access check: lesson is `isPreview` OR user has active subscription OR has course enrollment
- Generate signed URL: 4-hour expiry
- Return: `{ url, expiresAt }`

### 7. Video Player Component (Day 5–6)
- `src/components/video-player.tsx`
- Use `hls.js` for HLS stream playback
- Fallback: native `<video>` for Safari (native HLS support)
- Props: `{ lessonId, isPreview }` — component fetches token internally
- Track: play, pause, complete events → POST to progress API

### 8. Admin CMS Integration (Day 6–8)
- Add video upload UI to existing admin lesson editor
- Show upload progress bar
- Show encoding status (pending/processing/ready/error)
- Allow admin to mark lesson as `isPreview = true`

### 9. Content Production Support
- Provide spec sheet for content creators: "Upload MP4, max 500MB, 720p minimum, 16:9"
- Create 1 sample lesson as proof-of-concept

## Todo List
- [ ] Create Bunny Stream account + library
- [ ] Add env vars (BUNNY_STREAM_API_KEY etc.)
- [ ] Prisma schema: add Bunny fields to Lesson
- [ ] Create `src/lib/bunny-stream.ts` client
- [ ] POST /api/admin/videos/upload route
- [ ] POST /api/webhooks/bunny handler
- [ ] POST /api/lessons/[id]/video-token route
- [ ] VideoPlayer component (hls.js)
- [ ] Admin CMS: video upload UI
- [ ] E2E test: upload → encode → playback flow (web-testing)
- [ ] Verify signed URLs expire correctly
- [ ] Deploy and smoke test on production

## Success Criteria
- [ ] Admin can upload a video and see it "ready" after encoding
- [ ] Paid user can play video lesson (signed URL)
- [ ] Trial user can play preview lessons only (gated correctly)
- [ ] Signed URL access denied for logged-out user
- [ ] Video starts within 3s on 4G simulation in DevTools
- [ ] Bunny encoding webhook updates DB correctly

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Bunny API changes | Low | Pin API version, document endpoint used |
| Signed URL signing bug → leaks paid content | High | Unit test signing logic; test with expired tokens |
| Large video uploads timeout (Next.js 4MB limit) | High | Increase `api.bodyParser.sizeLimit` in `next.config.ts` or use direct-to-Bunny upload |
| Content production delays | Medium | Tech can be done independently; use placeholder test videos |

## Security Considerations
- Signed URLs use HMAC-SHA256 — never expose signing key in client
- Webhook endpoint must verify signature before processing
- Admin upload route must verify admin role (not just any session)
- `isPreview = false` by default — explicit opt-in for free content

## Next Steps
→ Phase 01 runs in parallel (marketing does not depend on this)
→ Phase 03 (Course System) requires this to be complete (courses contain video lessons)
