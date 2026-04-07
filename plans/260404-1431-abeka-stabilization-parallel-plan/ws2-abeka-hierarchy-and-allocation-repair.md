# WS2: Abeka Hierarchy and Allocation Repair

## Owner
- Backend dev + Data engineer

## Scope
- Sửa pipeline import để tạo đầy đủ hierarchy quan hệ.
- Sửa allocation calculator theo canonical package rules.

## Tasks
1. Điều tra root cause vì sao `AbekaLesson = 0` dù có 20,195 videos.
2. Sửa import/backfill:
   - `AbekaGrade`
   - `AbekaSubject`
   - `AbekaLesson`
   - `AbekaLessonPackage`
   - `AbekaVideo`
3. Viết query chuẩn tính allocation theo package scope.
4. Cập nhật/reseed `videoCount` package theo kết quả thật.
5. Thêm verify script:
   - orphan checks
   - duplicate checks
   - invalid grade/subject checks

## Deliverables
- Pipeline import đã sửa.
- SQL verify pack.
- Allocation report trước/sau.

## Success Criteria
- Không còn mismatch lớn giữa declared vs actual.
- Hierarchy đầy đủ, truy vấn parent/child hoạt động.
