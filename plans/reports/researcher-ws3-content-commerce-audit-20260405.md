# WS3 Data/Content Commerce Audit (Local + Prod)
Date: 2026-04-05  
Scope: course/package/video description thresholds + published 0đ course list + QA implementation points  
Data basis: existing local code inspection + production DB read queries already executed

## Commands used
```powershell
# local context/code inspection
rg -n "description|publish|price|saleStatus|freeTemporary" src scripts prisma plans
Get-Content prisma/schema.prisma
Get-Content src/modules/courses/course-service.ts
Get-Content src/modules/courses/course-pricing.ts
Get-Content src/app/api/admin/courses/[id]/publish/route.ts
Get-Content src/app/api/admin/courses/[id]/publish/route.test.ts
Get-Content scripts/import-abeka-videos.ts
Get-Content scripts/abeka/validate-import.ts

# production access
ssh root@152.42.246.218
docker exec root-postgres-1 psql -U postgres -d app -c "<SQL>"
```

## 1) Published course description quality (>=80 chars)

| Metric | Count |
|---|---:|
| Published courses | 12 |
| Pass (>=80) | 5 |
| Fail (<80) | 7 |

Failing published slugs:

| slug | desc_len |
|---|---:|
| abeka-g1-intro-4w | 76 |
| abeka-k4-foundation-8w | 79 |
| abeka-k5-foundation-8w | 79 |
| abeka-k5-intro-4w | 69 |
| lfen-l1-builder-8w | 67 |
| lfen-l2-builder-8w | 79 |
| lfen-l2-starter-6w | 76 |

## 2) Package description quality (>=60 chars, if package metadata exists)

| Metric | Count |
|---|---:|
| Active packages | 8 |
| Active with description | 8 |
| Active without description | 0 |
| Pass (>=60) | 8 |
| Fail (<60) | 0 |

Result: current active package metadata descriptions pass threshold.

## 3) Video description quality (>=20 chars) + source/validation path

| Metric | Count |
|---|---:|
| Published videos | 20,195 |
| Pass (>=20) | 20,195 |
| Fail (<20) | 0 |
| Null/blank | 0 |

Current source/validation path:
- Source ingest writes description from import payload: `scripts/import-abeka-videos.ts` (`description: video.description`).
- Validation exists in `scripts/abeka/validate-import.ts` but checks presence/type only; no min-length rule in importer validation.
- No explicit publish-time gate found enforcing `video.description >= 20`.

## 4) 0đ courses: exact list/count + likely intended 18-course set

### A. Currently published 0đ courses
- Count: **12**

| slug |
|---|
| abeka-g1-foundation-8w |
| abeka-g1-intro-4w |
| abeka-k4-foundation-8w |
| abeka-k4-intro-4w |
| abeka-k5-foundation-8w |
| abeka-k5-intro-4w |
| lfcn-l1-builder-8w |
| lfcn-l1-starter-5w |
| lfen-l1-builder-8w |
| lfen-l1-starter-6w |
| lfen-l2-builder-8w |
| lfen-l2-starter-6w |

### B. Likely intended 18-course 0đ set (from current DB zero-price set)
- Total zero-price courses: **18**
- Published: **12**
- Unpublished: **6**

Unpublished 6:
- abeka
- abeka-g1
- abeka-k4
- abeka-k5
- littlefox
- littlefoxcn

18-set description threshold summary:

| Metric | Count |
|---|---:|
| 18-set total | 18 |
| Pass (>=80) | 5 |
| Fail (<80) | 13 |

## 5) Concrete implementation points (automated QA + docs wording)

### Automated QA checks
1. Add publish gate in `src/app/api/admin/courses/[id]/publish/route.ts`:
- Block publish if `course.description.length < 80`.
- If linked package metadata exists, block if package description `< 60`.
- Return structured error payload listing failed fields and lengths.

2. Add reusable validator module in `src/modules/courses/`:
- `validateCourseContentQuality(course, packageMeta?)` for API + scripts reuse.
- Keep thresholds in constants/env (`COURSE_DESC_MIN=80`, `PACKAGE_DESC_MIN=60`, `VIDEO_DESC_MIN=20`).

3. Strengthen ingest validation:
- Update `scripts/abeka/validate-import.ts` to enforce video description min length (>=20), not just presence/type.

4. Add CI audit script:
- New read-only script (e.g. `scripts/audit-content-thresholds.ts`) that prints pass/fail counts and failing IDs/slugs.
- Run in CI nightly + pre-release checklist.

5. Tests:
- Add unit tests for validator module.
- Add publish-route tests for description-threshold rejection/acceptance cases.

### Docs wording updates
1. Admin content guideline doc:
- “Published course descriptions must be >=80 chars (non-whitespace).”
- “Package descriptions (when package metadata exists) must be >=60 chars.”
- “Published video descriptions must be >=20 chars.”

2. Release checklist wording:
- “Run content-threshold audit. Release blocked if any published item fails.”

3. Pricing/free-course wording:
- Clarify `0đ` is allowed only for approved temporary-free campaign SKUs and must match approved 18-course list.

## Risks / unresolved questions
1. 7/12 currently published 0đ courses fail course-description threshold; enforcing publish gate immediately will block edits/re-publish flow until content backfill.
2. “Likely intended 18-course set” inferred from zero-price DB set + WS3 context; needs explicit product/business owner confirmation.
3. Video threshold currently passes in prod snapshot, but publish-time enforcement path not confirmed for non-Abeka ingestion sources.
4. Need decision: hard block vs soft warning rollout for first release to avoid operational disruption.
