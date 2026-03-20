# Phase 02 - Grouped Lesson Presentation (Abeka/LittleFox/LittleFoxCN)

## 1) Mục tiêu

Thiết kế giao diện bài học theo nhóm có nghĩa với dữ liệu import hiện có, thay vì list phẳng:
- Abeka: nhóm theo K/G level.
- LittleFox: nhóm Level -> Series -> Episode.
- LittleFoxCN: nhóm Level -> Series -> Episode.

## 2) Dữ liệu nguồn hiện tại

Từ script import `prisma/scripts/import-three-courses-bootstrap.ts`:
- Abeka:
  - `Level.title` dạng `Abeka K4`, `Abeka K5`, `Abeka G1`...
  - `Unit.title` cố định `Core lessons`.
- LittleFox/LittleFoxCN:
  - `Level.title` dạng `Little Fox EN Level N` / `Little Fox CN Level N`.
  - `Unit.title` dạng `<series title> (lfid)`.
  - Lesson là episode có `orderNo` theo episode sequence.

=> Có đủ metadata để group mà không cần thay schema.

## 3) View-model chuẩn hóa

```ts
type CourseLessonNode = {
  lessonId: string;
  orderNo: number;
  title: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
};

type CourseUnitGroup = {
  unitId: string;
  unitLabel: string;
  orderNo: number;
  completed: number;
  total: number;
  lessons: CourseLessonNode[];
};

type CourseLevelGroup = {
  levelId: string;
  levelLabel: string;
  orderNo: number;
  completed: number;
  total: number;
  units: CourseUnitGroup[];
};
```

## 4) Quy tắc grouping theo course

## 4.1 Abeka

Rule:
- Group cấp 1: `level` (K4, K5, G1...).
- Group cấp 2: unit (về thực tế chỉ có 1 unit `Core lessons`).
- UI hiển thị: accordion theo level, mặc định mở level có lesson current.

Label normalization:
- Input: `Abeka K4` -> hiển thị `K4`.
- Input: `Abeka G1` -> hiển thị `G1`.

## 4.2 LittleFox EN / CN

Rule:
- Group cấp 1: `level`.
- Group cấp 2: `series` (unit title).
- Lesson list trong series theo `lesson.orderNo`.

UI hiển thị:
- Left nav: Level tabs/chips.
- Main: danh sách series dạng accordion, mỗi series có progress mini.

## 5) Quy tắc progression/lock

- Hoàn thành dựa trên `LessonCompletion(childId, lessonId)`.
- `currentLesson` = lesson đầu tiên chưa hoàn thành theo `CourseLesson.orderNo`.
- `isLocked`:
  - mặc định khóa các lesson sau `currentLesson` nếu bật sequential mode.
  - mở toàn bộ nếu course cho phép free navigation.

Khuyến nghị P0:
- Mặc định sequential mode để tránh bé nhảy bài.

## 6) Service/query đề xuất

Tạo service mới:

```ts
getCourseOutlineForChild({ parentId, childId, courseSlug }): Promise<{
  course: { id: string; slug: string; title: string };
  groups: CourseLevelGroup[];
  progress: { completed: number; total: number; percent: number };
}>;
```

Bắt buộc check:
1. child thuộc parent.
2. parent đã enroll course.

Query shape:
- Course -> CourseLesson(orderNo) -> Lesson -> Unit -> Level.
- LessonCompletion theo child với `lessonId in courseLessonIds`.

## 7) Thiết kế UI course page theo nhóm

## 7.1 Layout

- Cột trái:
  - progress tổng khóa,
  - danh sách group level,
  - chip filter (All/K4/K5/...).
- Cột phải:
  - danh sách unit/series theo level đang chọn,
  - mỗi lesson card có trạng thái: done/current/locked.

## 7.2 Hành vi

1. Mở trang:
- auto scroll tới lesson current.

2. Click lesson:
- mở lesson wizard/player với `childId` + `lessonId`.
- khi complete, cập nhật trạng thái group theo optimistic update + refetch.

3. Đổi child:
- route đổi sang path child mới.
- outline render lại theo progress child mới.

## 8) Bảo mật tài nguyên video (giữ nguyên nguyên tắc hiện tại)

- Không render raw source URL ra client.
- Luôn lấy playback qua `/api/lessons/[lessonId]/video-token`.
- Video token route trả `secure-playback` URL có token ngắn hạn.
- `secure-playback` route verify session + token + allowlist host trước khi redirect upstream.

## 9) Acceptance criteria cho phần grouping

1. `/kid/children/[childId]/courses/abeka` hiển thị rõ các nhóm K/G.
2. `/kid/children/[childId]/courses/littlefox` và `littlefoxcn` hiển thị Level -> Series.
3. Progress phần trăm và trạng thái lesson phản ánh đúng `LessonCompletion` theo child.
4. Không còn list phẳng toàn bộ lesson trong course player.
5. Video lesson mở được qua secure token flow như hiện tại.

## 10) Checklist test

1. Child A đã hoàn thành 5 bài Abeka K4, Child B chưa học gì.
- Mở cùng course ở A/B phải thấy progress khác nhau.

2. Course LittleFox có nhiều series trong cùng level.
- Đúng thứ tự series theo import index.
- Episode đúng thứ tự trong series.

3. Legacy route `/courses/abeka/lessons`.
- Redirect sang flow mới và vẫn mở được bài đầu tiên.
