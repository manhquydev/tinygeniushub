---
title: "Learning System Expansion"
description: "TUS direct video upload, 3 new activity types (drag-drop, sort-order, drawing), mascot enhancement with 5 new states + combo streak"
status: complete
priority: P1
effort: 10h
branch: main
tags: [learning, activities, mascot, video, admin]
created: 2026-02-26
---

# Learning System Expansion

## Overview

Expand the core learning experience with:
1. **Video upload via TUS** — admin uploads directly to Bunny CDN (no server relay)
2. **3 new activity types** — DRAG_DROP, SORT_ORDER renderer, DRAWING
3. **Mascot enhancement** — 5 new emotional states + combo streak

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 01 | [Video TUS Direct Upload](./phase-01-video-tus-direct-upload.md) | ✅ complete | 2.5h |
| 02 | [Activity Types — DRAG_DROP + SORT_ORDER](./phase-02-activity-drag-sort.md) | ✅ complete | 3h |
| 03 | [Activity Type — DRAWING Canvas](./phase-03-activity-drawing-canvas.md) | ✅ complete | 2h |
| 04 | [Mascot — New States + Combo Streak](./phase-04-mascot-enhancement.md) | ✅ complete | 2.5h |

## Key Dependencies

- Phase 01 is independent
- Phase 02 + 03 can run in parallel after Phase 01
- Phase 04 is independent of all

## Quick File Index

| File | Role |
|------|------|
| `src/lib/bunny-stream-client.ts` | Bunny API client |
| `src/app/api/admin/videos/upload/route.ts` | Video create endpoint (returns TUS URL) |
| `src/components/admin-content-panel.tsx` | Admin CMS UI (video upload button) |
| `src/modules/content/activity-types.ts` | ActivitySpec type definitions |
| `src/components/lesson-wizard/activity-renderer.tsx` | Kid-facing activity renderer |
| `src/components/mascot/types.ts` | MascotState type |
| `src/components/mascot/expressions.ts` | Eye/beak expression map |
| `src/components/mascot/BigOwl.tsx` | Big owl SVG component |
| `src/lib/audio-utils.ts` | Web Audio synth (already has ting/bzz/yay/pop) |

## Research Reports

- [researcher-01-video-activities.md](./research/researcher-01-video-activities.md)
- [researcher-02-mascot-audio.md](./research/researcher-02-mascot-audio.md)
