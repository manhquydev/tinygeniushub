# Production Gate Recheck - 2026-04-04

## Scope
- Recheck WS4 gates on production (`152.42.246.218`).
- Validate UI/API/package parity.
- Diagnose worker restart storm.
- Apply minimal runtime hotfix, rerun gate.
- Repair WS2 Abeka hierarchy drift (`AbekaLesson=0`).

## Evidence
- Commit running on server: `65c2f129`.
- UI/API HTTP check on server-local:
  - `200 /`
  - `200 /pricing`
  - `200 /courses`
  - `200 /try-garden`
  - `200 /admin/login`
  - `200 /api/health`
  - `200 /api/abeka/packages`
- DB snapshot:
  - `Course`: 18 total, 12 published, 18 with description, 18 price=0
  - `CurriculumPackage`: 8 total, 8 active
  - `AbekaGrade`: 13 (before repair)
  - `AbekaSubject`: 75
  - `AbekaLesson`: 0 (before repair)
  - `AbekaVideo`: 20195
  - Package codes/prices matched canonical 8-code matrix.

## Root Cause (worker instability)
- Worker restart storm due runtime env issues:
  - `MOCK_UPLOAD_SIGNING_SECRET` missing in `.env`
  - `BILLING_WEBHOOK_SECRET` placeholder value
- Worker observed state before fix:
  - frequent `online` <-> `waiting restart`
  - restart counter increased continuously

## Hotfix Applied on Production
- Added missing key to `/var/www/cungcontuhoc/.env`:
  - `MOCK_UPLOAD_SIGNING_SECRET=<generated random>`
- Replaced placeholder:
  - `BILLING_WEBHOOK_SECRET=<generated random>`
- Restarted worker with updated env:
  - `pm2 restart cungcontuhoc-worker --update-env`
- Fixed PM2 config compatibility issue:
  - `ecosystem.config.js` switched to ESM export (`export default`) to match `type: module`
  - Added `env_file: '/var/www/cungcontuhoc/.env'` for web and worker
  - Reload via `pm2 reload ecosystem.config.js --only cungcontuhoc-worker --env production`

## Gate Result (after hotfix)
- Ran `scripts/production/production-gate-check.sh` (streamed execution).
- Result:
  - `PASS=12 WARN=0 FAIL=0`
  - Worker restart delta in 20s: `0`
  - Worker status stable `online` during observation window.

## WS2 Data Hierarchy Repair (completed)
- Updated `scripts/import-abeka-videos.ts` to support hierarchy repair:
  - correct grade mapping (`k4->0`, `k5->1`, `g1->2` ... `g12->13`)
  - upsert `AbekaLesson` and `AbekaLessonPackage`
  - backfill `AbekaVideo.lessonPackageId`
  - update existing videos instead of skipping
- Ran repair on production using existing source file:
  - `/var/www/cungcontuhoc/data/abeka_database.json`
  - Result: `Total Updated: 20195`, `Total Errors: 0`
- Normalized grade labels and removed stale legacy grade level `-1`.

### WS2 Verification (after repair)
- `AbekaGrade`: 14
- `AbekaSubject`: 89
- `AbekaLesson`: 2380
- `AbekaLessonPackage`: 12683
- `AbekaVideo`: 20195
- `AbekaVideo` with non-null `lessonPackageId`: 20195
- `AbekaVideo` with null `lessonPackageId`: 0

## Follow-up Needed
- Keep 24h monitoring on:
  - worker restart count
  - health endpoint
  - API error rate
- If business requires all 18 courses to stay free temporarily, keep admin pricing guardrails unchanged (already satisfied: all course price fields currently `0`).

## Unresolved Questions
- Should we pin a canonical `AbekaGrade.level` convention in docs (`0..13`) to prevent future importer drift?
