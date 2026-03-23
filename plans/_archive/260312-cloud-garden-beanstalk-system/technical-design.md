# Thiết Kế Kỹ Thuật Chi Tiết - Khu Vườn Trên Mây

## 1) Bối cảnh hiện tại (đã kiểm tra trong code)

### 1.1 Route đang có

- `src/app/(kid-app)/kid/garden/page.tsx`
  - Đang render `BeanstalkJourney` toàn màn hình.
  - Dùng dữ liệu mock cho progress (chưa gắn completion thật).
- `src/app/(kid-app)/kid/garden/[zone]/page.tsx`
  - Có lesson-zone theo subject (`math/phonics/art/music/story`) qua `LessonBranch`.
- `src/app/(kid-app)/kid/today/page.tsx`
  - Team khác đang tập trung triển khai tại đây theo `childId` query.

### 1.2 Component nền đã có

- `src/components/beanstalk-garden/BeanstalkJourney.tsx`
  - Có scene cuộn dọc 5000px, trunk, cloud platform, node states.
  - Hiện dùng `LEVELS` và `CURRENT_LEVEL` mock.
- `src/components/cloud-garden/*`
  - Có thư viện UI cloud map/lesson card khá đầy đủ (token, mascot, zone, progress).
- `public/assets/garden/*`
  - Có asset nền cơ bản: `trunk.png`, `ground.png`, `cloud_platform.png`.

### 1.3 Khoảng trống hiện tại

1. Chưa có data model "cây đậu theo child + course".
2. Chưa có mapping tiến độ lesson -> mở tầng mây.
3. Chưa có event "mua khóa = gieo hạt".
4. Animation hiện tại đẹp ở mức demo nhưng chưa phản ánh trạng thái business.

## 2) Mục tiêu thiết kế hệ thống

1. Đồng bộ hoàn toàn theo hồ sơ trẻ (child-centric).
2. Mỗi khóa học bé theo học tương ứng 1 "journey tree".
3. Cây đậu chỉ mọc đến tầng đã mở; mở tầng mới phải có animation rõ ràng.
4. Luồng mua khóa học phải tạo cảm giác "gieo hạt hành trình".
5. 2D-first (performance ổn định), có thiết kế nâng cấp hybrid 3D theo feature flag.

## 3) Mô hình nghiệp vụ

## 3.1 Thuật ngữ

- `Journey`: Hành trình của 1 bé với 1 khóa học.
- `Tier`: Tầng mây/điểm mốc của journey.
- `Seed`: Hạt đậu mới tạo từ khóa học vừa mua và gán cho bé.
- `Growth`: Mức mọc hiện tại trong tầng đang mở.

## 3.2 Quy tắc nghiệp vụ

1. Parent mua khóa học -> có quyền tạo journey cho 1 hoặc nhiều bé.
2. Mỗi `childId + courseId` chỉ có tối đa 1 journey đang active.
3. Tiến độ journey lấy từ `LessonCompletion(childId, lessonId)`.
4. Unlock tier theo thứ tự (sequential), không nhảy tầng.

## 4) Thiết kế dữ liệu (additive, không phá luồng production)

## 4.1 Bảng mới đề xuất

### `ChildCourseJourney`

- `id` (cuid)
- `childId` (FK ChildProfile)
- `courseId` (FK Course)
- `sourceEnrollmentId` (FK CourseEnrollment, nullable)
- `status` (`SEEDED | ACTIVE | PAUSED | COMPLETED`)
- `seedName` (text, ví dụ "Hạt Abeka")
- `currentTierNo` (int, default 1)
- `currentTierProgress` (float 0..1)
- `plantedAt` (datetime)
- `activatedAt` (datetime nullable)
- `completedAt` (datetime nullable)
- `createdAt`, `updatedAt`

Unique:
- `@@unique([childId, courseId])`

Index:
- `@@index([childId, status])`
- `@@index([courseId])`

### `ChildCourseJourneyTier`

- `id` (cuid)
- `journeyId` (FK)
- `tierNo` (int)
- `tierKey` (text; ví dụ `abeka:k4`, `littlefox:l3`)
- `title` (text)
- `lessonTotal` (int)
- `lessonCompleted` (int)
- `isUnlocked` (bool)
- `unlockedAt` (datetime nullable)
- `isCompleted` (bool)
- `completedAt` (datetime nullable)

Unique:
- `@@unique([journeyId, tierNo])`

### `ChildCourseJourneyEvent`

- `id` (cuid)
- `journeyId` (FK)
- `eventType` (`PLANTED | WATERED | LESSON_COMPLETED | TIER_UNLOCKED | JOURNEY_COMPLETED`)
- `payload` (json)
- `createdAt` (datetime)

Index:
- `@@index([journeyId, createdAt])`

## 4.2 Không đổi dữ liệu hiện tại

- Giữ nguyên `Course`, `CourseLesson`, `LessonCompletion`, `LessonProgress`.
- Journey chỉ đọc tiến độ từ bảng completion/progress hiện có.

## 5) Phân tầng tiers theo từng khóa

## 5.1 Abeka

- Tier theo `Level` (K4, K5, G1...).
- Trong mỗi tier, lesson đi theo `CourseLesson.orderNo`.
- `tierKey`: `abeka:<level_slug>`.

## 5.2 LittleFox / LittleFoxCN

- Tier theo `Level` (Level 1, 2, 3...).
- Series vẫn hiển thị trong tier để điều hướng bài.
- `tierKey`: `littlefox:l<no>` / `littlefoxcn:l<no>`.

## 5.3 Công thức progress

- `tierProgress = lessonCompleted / lessonTotal`.
- `journeyProgress = (completedTiers + tierProgressCurrent) / totalTiers`.
- Unlock tier `n+1` khi tier `n` đạt 100%.

## 6) Thiết kế luồng người dùng

## 6.1 Luồng mua khóa -> gieo hạt

1. Parent checkout thành công khóa `courseSlug`.
2. Hệ thống chuyển tới entry page chọn bé để gieo hạt.
3. Xác nhận gieo -> tạo `ChildCourseJourney` + build tier rows.
4. Trigger animation intro: hạt rơi xuống đất, mầm nhú.
5. Điều hướng vào `/kid/garden` với highlight cây mới.

Ghi chú đồng bộ:
- Nếu đang còn dùng `/kid/today?childId=...`, luồng gieo hạt chạy độc lập và không ảnh hưởng page đó.

## 6.2 Luồng học -> mọc cây -> mở tầng

1. Bé hoàn thành lesson (API completion hiện tại).
2. Journey sync service cập nhật `lessonCompleted` của tier tương ứng.
3. Nếu đạt điều kiện unlock:
- ghi event `TIER_UNLOCKED`,
- tăng `currentTierNo`,
- trả về `unlockPayload` cho UI.
4. UI phát animation:
- vine growth,
- cloud glow burst,
- camera pan tới tầng mới.

## 6.3 Luồng quay lại vườn

- Vào `/kid/garden` thấy danh sách cây (mỗi cây là 1 course journey).
- Chọn cây để leo/chơi vào tầng hiện tại.

## 7) Thiết kế route và tích hợp

## 7.1 Route mới đề xuất (không phá route cũ)

- `GET /kid/garden?childId=...`
  - Giữ tương thích ngắn hạn cho team đang dùng query.
- `GET /kid/children/[childId]/garden` (canonical mục tiêu)
- `GET /kid/children/[childId]/garden/journeys/[courseSlug]`
- `GET /kid/children/[childId]/garden/journeys/[courseSlug]/tier/[tierNo]`

## 7.2 API mới

- `POST /api/garden/journeys/plant`
  - input: `childId`, `courseSlug`.
  - output: journey snapshot + animation seed payload.

- `GET /api/garden/journeys?childId=...`
  - trả danh sách cây đậu + progress.

- `GET /api/garden/journeys/[journeyId]`
  - trả chi tiết tiers + trạng thái hiện tại.

- `POST /api/garden/journeys/[journeyId]/sync`
  - ép đồng bộ từ `LessonCompletion` (idempotent).

## 7.3 Integration hook vào completion hiện có

Trong `completion-service` sau khi ghi `LessonCompletion`:
- Gọi `updateJourneyFromLessonCompletion({ childId, lessonId })`.
- Nếu unlock tier, publish domain event để client lấy animation payload.

## 8) Kiến trúc UI/Component

## 8.1 Cấu trúc component mới (đề xuất)

`src/components/garden-v2/`

- `scene/CloudGardenScene.tsx`
- `scene/BeanstalkStem.tsx`
- `scene/CloudTierPlatform.tsx`
- `scene/TierNode.tsx`
- `scene/GrowthEffect.tsx`
- `scene/CameraController.tsx`
- `journey/JourneyForestPanel.tsx`
- `journey/PlantSeedModal.tsx`
- `journey/JourneyHUD.tsx`
- `mascot/GardenGuide.tsx`

## 8.2 Tận dụng component cũ

- Giữ token màu từ `cloud-garden.css` và `globals.css`.
- Tái dùng một phần `CloudZone`, `LessonCard`, `GardenMascotGuide`.
- `BeanstalkJourney` hiện tại chuyển sang data-driven (loại bỏ mock constants).

## 8.3 State management

- Server state: fetch snapshot ở page server component.
- Client transient state:
  - camera position,
  - selected tier,
  - running animation queue,
  - soft cache event list.
- Không dùng localStorage làm nguồn chân lý cho progress unlock.

## 9) Thiết kế animation chi tiết

## 9.1 Animation taxonomy

1. `seed_drop` (600ms)
- hạt rơi + nảy nhẹ + bụi sáng.

2. `sprout_pop` (700ms)
- mầm nhú khỏi đất.

3. `vine_grow_tier` (900-1400ms)
- thân đậu kéo dài đến tier mới.

4. `cloud_unlock_burst` (450ms)
- tầng mây đang khóa chuyển sang active.

5. `leaf_bloom` (300ms * 3 nhịp)
- lá nở theo nhịp easing.

6. `camera_follow_up` (900ms)
- camera pan/scroll lên tầng mới.

## 9.2 Quy tắc kích hoạt

- `PLANTED` -> `seed_drop` + `sprout_pop`.
- `LESSON_COMPLETED` (không unlock) -> `vine_grow_tier` nhẹ theo progress.
- `TIER_UNLOCKED` -> full chain: grow + unlock burst + camera.

## 9.3 Accessibility / Reduced Motion

- Nếu `prefers-reduced-motion`:
  - bỏ camera pan mạnh,
  - thay bằng fade/scale ngắn,
  - không chạy particle dày.

## 10) Định hướng 2D và hybrid 3D

## 10.1 Giai đoạn 1 (MVP bắt buộc): 2D

- Stack: CSS + Framer Motion (đang có sẵn).
- Lý do:
  - không cần thêm package,
  - an toàn hiệu năng trên tablet/mobile,
  - ra MVP nhanh.

## 10.2 Giai đoạn 2 (optional): hybrid 3D

- Mặc định dùng CSS 3D parallax (không thêm lib).
- Nếu cần React Three Fiber/WebGL:
  - phải xin approve trước khi thêm package mới,
  - bật qua feature flag `GARDEN_3D_ENABLED`.

## 11) Bảo mật và tính đúng dữ liệu

1. Guard child ownership ở toàn bộ Garden API.
2. Chỉ cho plant journey khi parent có enrollment course.
3. Sync progress idempotent, chống double-unlock do race condition.
4. Không để client tự gửi unlock trực tiếp; client chỉ gửi action hợp lệ, server quyết định unlock.

## 12) Hiệu năng mục tiêu

- 60fps ở scene chính trên thiết bị tầm trung.
- Tối đa 1 animation chain nặng tại 1 thời điểm.
- Virtualize hoặc window hóa tiers nếu số tầng > 20.
- Lazy load asset lớn ngoài viewport.

## 13) Quan sát và đo lường (analytics)

Event đề xuất:
- `garden_seed_planted`
- `garden_tier_unlocked`
- `garden_tree_selected`
- `garden_lesson_entered`
- `garden_journey_completed`

KPI:
- Tỷ lệ bé quay lại vườn trong 7 ngày.
- Tỷ lệ hoàn thành tier đầu trong 48h.
- Tỷ lệ chuyển đổi sau khi mua khóa -> plant thành công.

## 14) Kế hoạch triển khai theo phase

## Phase A - Data + Service

- Thêm migration cho 3 bảng journey.
- Service:
  - `createJourneyFromCourse(...)`
  - `buildJourneyTiersFromCourse(...)`
  - `syncJourneyProgress(...)`

## Phase B - UI map data-driven

- Chuyển `BeanstalkJourney` từ mock sang props snapshot.
- Render tiers + state locked/active/completed theo DB.

## Phase C - Plant flow

- Sau checkout success, route qua flow chọn bé + gieo hạt.
- Modal intro animation + redirect vườn.

## Phase D - Completion integration

- Hook completion-service -> sync journey.
- Trả unlock payload để client animate.

## Phase E - QA + E2E

- E2E outside-in: mua khóa -> gieo cây -> học bài -> mở tầng.
- Regression: route `/kid/today` của team khác không bị ảnh hưởng.

## 15) Acceptance criteria chi tiết

1. Vào vườn thấy đúng số cây theo số journey active của bé.
2. Cây chỉ mọc tới tầng đang mở (không vượt quá current tier).
3. Mở tầng mới có đủ animation chuỗi (grow + unlock + camera).
4. Mua khóa mới xong có thể gieo cây mới ngay cho bé đã chọn.
5. Nếu đổi bé, toàn bộ rừng cây/tiến độ đổi theo bé tương ứng.
6. Không có hành vi unlock sai khi gọi API completion nhiều lần.

## 16) Rủi ro và giảm thiểu

1. Rủi ro: parent mua khóa nhưng chưa chọn bé.
- Giảm thiểu: seed inventory tạm + bắt buộc bước chọn bé trước khi tạo journey.

2. Rủi ro: race condition khi hoàn thành bài gần đồng thời.
- Giảm thiểu: transaction + unique constraint + recompute unlock idempotent.

3. Rủi ro: scene nặng trên mobile yếu.
- Giảm thiểu: motion levels + giới hạn particle + giảm layer blur.

4. Rủi ro: xung đột route với team `/kid/today`.
- Giảm thiểu: route garden tách riêng, chỉ tích hợp qua API và deep-link sau.

## 17) Quyết định kỹ thuật chốt cho MVP

1. Làm 2D data-driven trước, không thêm package mới.
2. Mỗi khóa học = một cây đậu riêng theo `childId + courseId`.
3. Unlock tầng dựa trên `LessonCompletion` server-side.
4. Mua khóa học kích hoạt flow "gieo hạt" ngay sau checkout thành công.
5. Giữ tương thích ngắn hạn với query `childId`, hướng tới canonical path theo child.
