# Courses Storefront API Contract

Updated: 2026-04-05

## Scope
- `GET /api/courses`
- `GET /api/courses/[slug]`
- Shared normalization: `src/modules/courses/storefront-course-contract.ts`

## Contract Version
- `contractVersion`: `2026-04-05`

## Canonical Storefront Fields
- `trackLabel`: string
- `lessonCount`: number
- `durationDays`: number
- `videoCount`: number

## Fallback Rules (Official)
1. `trackLabel`
   - Input from bundle/storefront content.
   - Fallback: `"Lộ trình học"`.
2. `lessonCount`
   - Input from allocated lesson count.
   - Fallback: `videoCount`.
   - Last fallback: `1`.
3. `durationDays`
   - Input from course duration.
   - Fallback from lesson cadence: `max(28, ceil(lessonCount / 5) * 7)`.
4. `videoCount`
   - Input from actual allocated playable lesson/video mapping.
   - Fallback: `lessonCount`.

## Pricing Display Rule
- UI always shows **current price**.
- If `listPriceVnd > salePriceVnd`, show strikethrough list price (`giá gốc`) and promotion context.
- If not (`listPriceVnd <= salePriceVnd`), do not show promotion treatment.

## Note on `videoCount`
- `videoCount` on storefront is based on **actual allocated content**, not package metadata.

## API Examples
- List endpoint returns:
  - `contractVersion`
  - `contract` field guide
  - `courses[]` with normalized fields.
- Detail endpoint returns:
  - `contractVersion`
  - `course`
  - `enrolled`
  - `storefrontContract` with normalized `trackLabel/lessonCount/durationDays/videoCount`.
