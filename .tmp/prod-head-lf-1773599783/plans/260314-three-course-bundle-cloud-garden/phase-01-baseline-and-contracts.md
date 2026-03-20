# Phase 01 - Baseline and Contracts

## Goal
Đóng băng hợp đồng dữ liệu cho 3 bundle và xác nhận đường đi không phá vỡ luồng hiện tại.

## Requirements
- Xác định canonical bundle:
  - `abeka` -> root slug điều hướng kid: `abeka-k4`
  - `little-fox-en` -> root slug: `little-fox-en-level-1`
  - `little-fox-cn` -> root slug: `little-fox-cn-level-1`
- Định nghĩa rule map slug -> bundle bằng prefix:
  - `abeka-`
  - `little-fox-en-`
  - `little-fox-cn-`
- Định nghĩa ảnh chuẩn theo bundle (hard mapping file path).

## Planned Files
- Create: `src/modules/courses/course-bundles.ts`
- Create: `src/modules/courses/course-media.ts`
- Optional create: `src/modules/courses/types.ts` (nếu type chung dài)

## Implementation Steps
1. Tạo bundle config typed, export helper:
   - `getCourseBundleBySlug`
   - `listCourseBundles`
   - `isBundleRootSlug`
2. Tạo media resolver:
   - `resolveCourseCoverImage(slug, coverImageUrl?)`
3. Thêm test unit cho mapping.
4. Kiểm tra tương thích với slug hiện có trong DB.

## Success Criteria
- Có mapping deterministic cho toàn bộ slug hiện tại.
- Không cần đổi schema Prisma.
- Test mapping pass.

## Risks
- Slug tương lai lệch chuẩn naming.

## Mitigation
- Nếu không match known prefix thì fallback về `coverImageUrl` DB.
- Log warning tại server layer cho slug ngoài pattern.
