---
title: "Fix secure video playback for Abeka lessons"
description: "Align secure stream hints so HLS videos render via HLS player instead of file fallback."
status: in-progress
priority: P1
effort: 2h
branch: main
tags: [video-playback, hls, secure-playback]
created: 2026-03-27
---

# Plan

## Context
- Production issue: lesson video visible but cannot play on `/courses/abeka-g1-intro-4w`.
- Secure playback URL hides source extension, so client depends on `streamType` hint.

## TODO
- [x] Trace video token + secure playback flow and identify mismatch.
- [x] Patch API to return concrete secure stream hint (`hls` or `file`).
- [x] Patch clients to preserve/forward stream hint (no forced `file` fallback).
- [x] Run type-check for compile safety.
- [x] Verify playback behavior on production after deploy.
- [x] Run post-deploy smoke check and capture evidence.

## Code Touch Points
- `src/app/api/lessons/[lessonId]/video-token/route.ts`
- `src/components/courses/lesson-player-content.tsx`
- `src/components/courses/course-lesson-preview-modal.tsx`
- `src/components/lesson-wizard/lesson-start-card.tsx`

## Validation
- `pnpm type-check`
- Spot-check lesson preview + lesson player on production.

## Evidence
- Production `GET /api/lessons/cmmqojfql0127ryor3xow4h9e/video-token` now returns `streamType: "hls"` (previously `secure`).
- Production `GET /api/health` is healthy after restart.
- Browser-side probe confirms token endpoint returns `hls` on the live course page context.

## Deploy Checklist
- Pull latest on server
- Install deps
- Build
- Reload PM2 app
- Verify page + video playback + error logs
