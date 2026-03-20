# Phase 01 — Video TUS Direct Upload

**Context:** [plan.md](./plan.md) | [Bunny Stream Docs](https://docs.bunny.net/docs/stream-tus-uploading)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** ~2.5h
- **Description:** Replace current admin video upload flow (alert + manual upload) with in-browser TUS resumable upload directly to Bunny CDN. No file data touches our server.

## Key Insights

### Current Flow (broken UX)
```
Admin → POST /api/admin/videos/upload
     → server calls bunnyCreateVideo() → returns { videoId, uploadUrl }
     → UI shows alert("use Bunny Dashboard or TUS client")  ← manual step!
```

### Target Flow (Option B)
```
Admin → POST /api/admin/videos/upload  (unchanged — still creates Bunny video record)
     → returns { videoId, uploadUrl }  (uploadUrl = Bunny TUS endpoint)
     → Browser uses tus-js-client to upload FILE DIRECTLY to Bunny
     → Progress bar shown in admin UI
     → On complete: webhook fires → DB updates videoStatus = "ready"
```

### TUS Protocol Bunny Support
- Bunny TUS endpoint: `https://video.bunnycdn.com/tusupload`
- Required headers: `AuthorizationSignature`, `AuthorizationExpire`, `VideoId`, `LibraryId`
- The `uploadUrl` returned by current API = `https://video.bunnycdn.com/library/{id}/videos/{videoId}` (PUT endpoint, not TUS)
- **Need new API endpoint**: `GET /api/admin/videos/[videoId]/tus-token` to generate signed TUS headers (server-side, keeps API key secret)

### Security
- TUS headers must be generated server-side (BUNNY_STREAM_API_KEY must not leak to browser)
- Token expires: 3600s is sufficient for large uploads
- `AuthorizationSignature` = SHA256(libraryId + apiKey + expiry + videoId)

## Requirements

### Functional
- Admin can select video file in lesson editor
- Upload progress shown (0–100%)
- Resumable on network failure
- File validation: max 2GB, video MIME types only
- Status polling after upload: show "processing" → "ready"

### Non-Functional
- No video data proxied through Next.js server
- Upload token expires in 1h
- Works on modern Chrome/Firefox/Safari

## Architecture

```
[Admin browser]
  │
  ├─ 1. POST /api/admin/videos/upload { lessonId, title }
  │       → bunnyCreateVideo() → { videoId }
  │       → DB: lesson.bunnyVideoId = videoId, videoStatus = "uploading"
  │       → returns { videoId }
  │
  ├─ 2. GET /api/admin/videos/[videoId]/tus-token
  │       → generates signed TUS headers (server-side HMAC)
  │       → returns { tusEndpoint, headers: { Authorization, ... }, expires }
  │
  ├─ 3. Browser: tus-js-client uploads FILE → Bunny TUS endpoint (direct)
  │       → progress callbacks → UI progress bar
  │
  └─ 4. Webhook: POST /api/webhooks/bunny (already exists)
           → videoStatus: "processing" → "ready"
           → Admin UI polls GET /api/admin/lessons/[id] to show status
```

## Related Code Files

**Modify:**
- `src/lib/bunny-stream-client.ts` — add `bunnyGenerateTusToken(videoId)`
- `src/components/admin-content-panel.tsx` — replace alert with `VideoTusUploader` component

**Create:**
- `src/app/api/admin/videos/[videoId]/tus-token/route.ts` — TUS token endpoint
- `src/components/admin/video-tus-uploader.tsx` — upload UI component

**Keep unchanged:**
- `src/app/api/admin/videos/upload/route.ts` — still used for step 1
- `src/app/api/webhooks/bunny/route.ts` — already handles status updates

## Implementation Steps

1. **Install `tus-js-client`**
   ```bash
   npm install tus-js-client
   npm install --save-dev @types/tus-js-client
   ```

2. **Add `bunnyGenerateTusToken()` to `bunny-stream-client.ts`**
   ```ts
   export function bunnyGenerateTusToken(videoId: string, expirySeconds = 3600): {
     tusEndpoint: string;
     authSignature: string;
     authExpire: number;
   }
   // SHA256(libraryId + apiKey + expiry + videoId)
   ```

3. **Create `GET /api/admin/videos/[videoId]/tus-token/route.ts`**
   - Require admin auth
   - Validate videoId exists in DB (belongs to a lesson)
   - Call `bunnyGenerateTusToken()`
   - Return token data

4. **Create `src/components/admin/video-tus-uploader.tsx`** (~150 lines)
   - Props: `videoId: string, lessonId: string, onComplete: () => void`
   - File input (accept="video/*", max 2GB validation)
   - Fetch TUS token from step 3
   - Use `tus-js-client` Upload class
   - Show progress bar (framer-motion or native `<progress>`)
   - Error state with retry button
   - On upload complete: show "Processing..." + poll lesson status

5. **Update `admin-content-panel.tsx`**
   - Replace the current alert-based button with `<VideoTusUploader>`
   - Show uploader inline in lesson editor when lesson has bunnyVideoId

## Todo

- [ ] Install tus-js-client
- [ ] Add `bunnyGenerateTusToken()` to bunny-stream-client.ts
- [ ] Create `/api/admin/videos/[videoId]/tus-token/route.ts`
- [ ] Create `video-tus-uploader.tsx` component
- [ ] Wire VideoTusUploader into admin-content-panel.tsx
- [ ] Test: upload small video, verify webhook fires, videoStatus → "ready"

## Success Criteria

- Admin can upload video file without leaving admin UI
- Progress bar visible during upload
- Video status updates from "uploading" → "processing" → "ready"
- No video data hits Next.js server

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Bunny TUS CORS restriction | Bunny allows cross-origin TUS from browser with proper auth headers |
| Large file browser memory | tus-js-client streams chunks — doesn't load full file in RAM |
| Token expiry during large upload | Token TTL 3600s = sufficient for files up to ~10GB on 1Mbps |

## Security Considerations

- API key never sent to browser; only HMAC signature
- TUS token endpoint gated behind `requireAdminFromRequest()`
- Token scoped to specific videoId; cannot be reused for other videos
- CSRF: `assertTrustedOrigin()` on token endpoint

## Next Steps

→ Phase 02 and 03 can start in parallel after this phase
