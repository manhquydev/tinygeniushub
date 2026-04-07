# Production imported courses check - 2026-04-07

## Scope
- Server: `152.42.246.218` (`do-server`)
- App path: `/var/www/cungcontuhoc`
- Branch/revision: `main` / `65c2f129`
- Runtime: `cungcontuhoc-web`, `cungcontuhoc-worker` đều `online` (PM2)

## What checked
1. Existence of imported course records in production DB (`Course`).
2. Lesson linkage integrity (`CourseLesson` + `Lesson`) for imported slugs.
3. Enrollment presence (`CourseEnrollment`) to confirm real traffic.
4. Course pricing fields (`listPriceVnd`, `salePriceVnd`, sale window).

## Findings
- Total courses: `18`.
- Published split/imported courses: `12`.
- Legacy/root courses: tồn tại nhưng `isPublished=false` cho `abeka`, `abeka-g1`, `abeka-k4`, `abeka-k5`, `littlefox`, `littlefoxcn`.

### Published imported slugs detected
- `abeka-g1-foundation-8w`
- `abeka-g1-intro-4w`
- `abeka-k4-foundation-8w`
- `abeka-k4-intro-4w`
- `abeka-k5-foundation-8w`
- `abeka-k5-intro-4w`
- `lfcn-l1-builder-8w`
- `lfcn-l1-starter-5w`
- `lfen-l1-builder-8w`
- `lfen-l1-starter-6w`
- `lfen-l2-builder-8w`
- `lfen-l2-starter-6w`

### Lesson integrity
- Tất cả published imported slugs đều có bài học (`lesson_count > 0`).
- Sample orderNo=1 lesson ID query trả dữ liệu đầy đủ cho cả 12 slugs.

### Enrollment signal
- Đã có enrollment trên một số khóa imported (`abeka-g1-intro-4w`, `abeka-k4-foundation-8w`, `lfcn-l1-builder-8w`, `lfcn-l1-starter-5w`).
- Kết luận: dữ liệu import không chỉ tồn tại mà đang được dùng thực tế.

### Pricing anomaly (directly related to bug report)
- Tại thời điểm check, tất cả rows trong `Course` có `listPriceVnd=0` và `salePriceVnd=0`.
- Đây là nguyên nhân trực tiếp khiến storefront hiển thị trạng thái miễn phí tạm thời và không thể hiện được “giá gốc -> giá sale 0đ theo khung thời gian”.

## Conclusion
- Dữ liệu course import trên production **có tồn tại và hợp lệ về liên kết bài học**.
- Vấn đề chính nằm ở **pricing state hiện tại trên production (all zero)** + logic hiển thị/checkout tương ứng.

## Recommended production SQL (for sale 0đ with fallback to original price)
```sql
UPDATE "Course"
SET
  "priceVnd" = 299000,
  "listPriceVnd" = 299000,
  "salePriceVnd" = 0,
  "saleStartsAt" = NOW(),
  "saleEndsAt" = NOW() + INTERVAL '30 days',
  "updatedAt" = NOW()
WHERE
  "isPublished" = true
  AND COALESCE("priceVnd", 0) = 0
  AND COALESCE("listPriceVnd", 0) = 0
  AND COALESCE("salePriceVnd", 0) = 0;
```

```sql
SELECT
  slug,
  "priceVnd",
  "listPriceVnd",
  "salePriceVnd",
  "saleStartsAt",
  "saleEndsAt"
FROM "Course"
WHERE "isPublished" = true
ORDER BY slug;
```

## Note
- SQL recommendation added but not executed in this run.

## Unresolved questions
- Có cần giữ sale 0đ trong 30 ngày hay mốc khác?
