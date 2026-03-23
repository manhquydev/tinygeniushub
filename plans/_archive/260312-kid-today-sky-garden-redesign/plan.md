# Kỹ thuật chi tiết: Redesign `/kid/today` theo mô hình "Khu vườn trên mây"

Ngày: 2026-03-12  
Phạm vi: UI/UX + animation + kiến trúc dữ liệu cho trải nghiệm học của bé tại `/kid/today?childId=...`  
Trạng thái: Draft kỹ thuật để triển khai

## 1) Kết quả "agent team" cho phiên nghiên cứu này

- `Scout`: rà soát codebase, xác định route/flow đang chạy ở [src/app/(kid-app)/kid/today/page.tsx](D:/project/cungcontuhoc/src/app/(kid-app)/kid/today/page.tsx), [src/components/kid-mission-panel.tsx](D:/project/cungcontuhoc/src/components/kid-mission-panel.tsx), prototype vườn mây ở [src/components/beanstalk-garden/BeanstalkJourney.tsx](D:/project/cungcontuhoc/src/components/beanstalk-garden/BeanstalkJourney.tsx), cloud-garden ở `src/components/cloud-garden/*`.
- `Research`: đối chiếu luồng dữ liệu thật (lesson/completion/course enrollment) từ [src/modules/content/service.ts](D:/project/cungcontuhoc/src/modules/content/service.ts), [src/modules/learning/completion-service.ts](D:/project/cungcontuhoc/src/modules/learning/completion-service.ts), [src/modules/courses/course-service.ts](D:/project/cungcontuhoc/src/modules/courses/course-service.ts), [src/app/api/courses/checkout/mock-success/route.ts](D:/project/cungcontuhoc/src/app/api/courses/checkout/mock-success/route.ts).
- `Frontend Design + UI/UX`: đề xuất visual system mobile-first, chuyển từ "space map ngang" sang "beanstalk dọc nhiều tầng mây", có cơ chế gieo hạt khi mua khóa học.
- `Planning`: gom lại thành blueprint triển khai theo phase, có điểm cắt MVP 2D và mở rộng 3D.

## 2) Hiện trạng và khoảng trống

## 2.1 Hiện trạng đang có

- `/kid/today` đang dùng `KidMissionPanel` với journey ngang + theme không gian.
- Đã có animation engine (`motion/react`, `framer-motion`, `canvas-confetti`) và mascot pipeline.
- Đã có prototype beanstalk nhưng đang mock cứng `LEVELS`, `CURRENT_LEVEL`, asset tĩnh, chưa bám dữ liệu thật.
- Đã có cloud-garden components tách lớp khá tốt (zone, lesson card, mascot guide), có thể tái dùng pattern.

## 2.2 Khoảng trống cần lấp

- Chưa có mô hình dữ liệu "cây đậu theo khóa học" (lane per enrollment).
- Chưa có state machine cho "gieo hạt -> nảy mầm -> leo tầng mới".
- Chưa có animation sự kiện mua khóa học để bắt đầu hành trình mới.
- Chưa có phân tầng rõ giữa `scene data` (server) và `playback state` (client animation state).

## 3) Mục tiêu sản phẩm -> chuyển thành yêu cầu kỹ thuật

1. "Khu vườn trên mây": scene dọc theo trục Y, nền trời nhiều lớp, mây phân tầng.
2. "Xoay quanh cây đậu, tầng mây, ngọn đậu chỉ mọc ở tầng đang mở": mở tới tầng nào thì growth animation dừng ở đó.
3. "Thiết kế từng thành phần": tách component rõ cho cloud tier / beanstalk / growth FX / HUD / mascot.
4. "Mua khóa học = gieo cây mới": enrollment mới tạo `seed event` + cinematic ngắn.
5. "Ưu tiên 2D, có thể xen kẽ 3D": MVP dùng 2D + parallax/particle, 3D là phase mở rộng.

## 4) Kiến trúc đề xuất cho `/kid/today`

## 4.1 Cấu trúc high-level

- Server component route giữ tại [src/app/(kid-app)/kid/today/page.tsx](D:/project/cungcontuhoc/src/app/(kid-app)/kid/today/page.tsx).
- Thay `KidMissionPanel` bằng container mới `KidSkyGardenPage` (feature-flagged).
- Client scene root: `KidSkyGardenScene` nhận `initialSceneData` từ server.

Đề xuất thư mục mới:

- `src/components/kid-sky-garden/KidSkyGardenScene.tsx`
- `src/components/kid-sky-garden/components/CloudTier.tsx`
- `src/components/kid-sky-garden/components/BeanstalkLane.tsx`
- `src/components/kid-sky-garden/components/BeanTipGrowthFx.tsx`
- `src/components/kid-sky-garden/components/SeedPlantingCinematic.tsx`
- `src/components/kid-sky-garden/components/SkyGardenHud.tsx`
- `src/components/kid-sky-garden/components/SkyGardenMascotGuide.tsx`
- `src/components/kid-sky-garden/sky-garden.css`
- `src/components/kid-sky-garden/types.ts`
- `src/components/kid-sky-garden/mappers.ts`

## 4.2 Data contract cho scene

`GardenSceneDTO` (server -> client):

```ts
type GardenSceneDTO = {
  child: { id: string; nickname: string };
  lanes: Array<{
    laneId: string;            // courseEnrollment.id hoặc fallback track key
    title: string;             // tên khóa học / track
    isNewlyPlanted: boolean;   // vừa mua xong
    totalNodes: number;        // tổng mốc học của lane
    unlockedNodeIndex: number; // node đang mở (0-based)
    completedNodeIds: string[];
    nodes: Array<{
      nodeId: string;
      lessonId: string;
      title: string;
      estimatedMinutes: number;
      tierIndex: number;       // tầng mây chứa node
      state: "locked" | "active" | "completed";
    }>;
  }>;
  tiers: Array<{
    tierIndex: number;
    yPercent: number;
    label: string;
    theme: "dawn" | "day" | "sunset" | "starlit";
  }>;
  streakDays: number;
  dailyGoal: { totalMinutesToday: number; dailyGoalMinutes: number; reached: boolean };
};
```

## 4.3 Nguồn dữ liệu (không phá kiến trúc hiện tại)

- Lesson source: tận dụng `getTodayMission` trước (MVP), sau đó mở rộng qua `CourseLesson` nếu muốn lane dài hơn.
- Completion source: `LessonCompletion`.
- Purchase source: `CourseEnrollment` + redirect checkout success.

MVP không bắt buộc migration DB.  
Phase 2 mới thêm bảng event nếu cần replay animation.

## 5) State machine trải nghiệm

## 5.1 Trạng thái lane

- `seeded`: vừa gieo hạt (chưa học node đầu).
- `growing`: đang mở node hiện tại.
- `tier_unlocking`: vừa hoàn thành node và mở tầng kế.
- `plateau`: đã lên tới tầng tối đa hiện có.

## 5.2 Trạng thái node

- `locked`: chưa tới lượt.
- `active`: node duy nhất cho phép học ở lane.
- `completed`: đã xong.

Rule cứng:

- Mỗi lane chỉ có 1 node `active`.
- `Bean tip` chỉ animate tới `active tier`.
- Khi complete node `k`: phát growth `k -> k+1`, không cho nhảy cóc.

## 6) Thiết kế UI thành phần

## 6.1 Cloud tier

- Mỗi tầng là cụm mây lớn (foreground + mid + back) có parallax nhẹ.
- Tầng active có glow + hạt bụi sáng.
- Tầng locked giảm saturation + blur nhẹ.

## 6.2 Beanstalk lane

- Thân đậu dạng spline dọc, có lá theo checkpoints.
- `Bean tip` là đầu mầm chuyển động mềm (spring).
- Node gắn cạnh thân (trái/phải xen kẽ) để tăng cảm giác leo.

## 6.3 Growth effect

- Trigger: lesson complete hoặc unlock tầng mới.
- Timeline:
- `0-180ms`: tip squash + glow.
- `180-900ms`: stem extend theo path + lá pop.
- `900-1200ms`: cloud tier pulse + badge "Đã mở tầng X".

## 6.4 Mua khóa học = gieo hạt mới

- Trigger từ checkout success redirect.
- Cinematic ngắn 2.2-3.0s:
- hạt rơi xuống mây nền.
- nảy mầm.
- hiện lane mới với label khóa học.
- CTA "Bắt đầu hành trình".

## 7) Luồng tích hợp backend

## 7.1 Đề xuất API

- `GET /api/kid/garden-scene?childId=...` -> trả `GardenSceneDTO`.
- `POST /api/kid/garden/ack-seed` -> client xác nhận đã xem cinematic gieo hạt.

Nếu muốn zero-API mới ở MVP:

- Build DTO ngay trong server page `/kid/today`.
- Dùng query param/cookie từ checkout redirect để biết `isNewlyPlanted`.

## 7.2 Điểm nối purchase

Tại [src/app/api/courses/checkout/mock-success/route.ts](D:/project/cungcontuhoc/src/app/api/courses/checkout/mock-success/route.ts):

- Sau khi `enrollParent(...)`, redirect có thêm tín hiệu:
- `/kid/today?childId={id}&seedCourse={courseId}` hoặc cookie ngắn hạn `kid_seed_course`.
- Scene đọc tín hiệu này, bật `SeedPlantingCinematic` đúng 1 lần.

## 7.3 Điểm nối lesson complete

- `LessonStartCard` đã có callback `onLessonComplete`.
- Tại callback, thay confetti thuần bằng:
- cập nhật node state.
- chạy `BeanTipGrowthFx`.
- sync lại goal guard như hiện tại.

## 8) Animation + motion system

- Nền tảng dùng sẵn `motion/react` + `framer-motion`, không thêm package mới.
- Chuẩn duration:
- micro: `120-220ms`
- state: `280-480ms`
- cinematic: `1.2-3s`
- `prefers-reduced-motion`:
- tắt path growth liên tục.
- thay bằng instant step + fade.

## 9) Mobile-first và A11y

- Touch target >= 44px.
- HUD cố định nhưng không che node active trên viewport thấp.
- Scroll dọc là chính; drag ngang chỉ trong lane phụ (nếu có).
- Mọi icon-only button có `aria-label`.
- Giữ tương phản text nền mây >= 4.5:1.

## 10) Performance budget

- First paint scene < 2.5s (thiết bị tablet trung bình).
- Main thread animation frame < 8ms khi idle.
- Max 2 canvas layer đồng thời.
- Không tải ảnh nền > 200KB/layer ở mobile.

## 11) Roadmap triển khai

## Phase 1 (MVP 2D khả dụng)

- Tạo `KidSkyGardenScene` + `CloudTier` + `BeanstalkLane` + `SkyGardenHud`.
- Map dữ liệu từ `getTodayMission` + `LessonCompletion`.
- Chạy trên `/kid/today` sau feature flag.

## Phase 2 (Trải nghiệm growth hoàn chỉnh)

- Thêm `BeanTipGrowthFx` + state machine node/tier unlock.
- Tích hợp callback complete lesson.
- Tối ưu reduced-motion.

## Phase 3 (Cinematic gieo hạt khi mua khóa học)

- Thêm seed trigger qua checkout success redirect.
- `SeedPlantingCinematic` + ack logic chống lặp.

## Phase 4 (Nâng cấp chiều sâu 2.5D / 3D nhẹ)

- Parallax nhiều lớp + depth fog + particle.
- Nếu cần 3D thật (Three.js/R3F): trình duyệt review package riêng trước khi cài.

## 12) Rủi ro và biện pháp

- Rủi ro đồng bộ trạng thái giữa local animation và server completion.
- Biện pháp: source of truth luôn từ API completion, animation chỉ là projection.
- Rủi ro lane/course quá nhiều gây rối.
- Biện pháp: chỉ hiển thị 1 lane active + lane mới mua, còn lại thu gọn.
- Rủi ro thiết bị yếu tụt FPS.
- Biện pháp: adaptive quality theo `deviceMemory` + reduced effects.

## 13) Tiêu chí nghiệm thu

- Bé vào `/kid/today` thấy scene vườn mây dọc, không còn bản đồ không gian cũ.
- Hoàn thành bài hiện tại => ngọn đậu mọc lên tầng mới (visual rõ).
- Khi vừa mua khóa học => có animation gieo hạt và tạo lane mới.
- Không có package mới ở MVP.
- Pass lint + type-check + test liên quan route kid.

## 14) Quyết định kỹ thuật cần chốt với bạn trước khi code

1. MVP chỉ dùng dữ liệu "2 bài hôm nay" (nhanh lên hình) hay mở rộng luôn theo toàn bộ course lesson của enrollment.
2. Mua khóa học xong sẽ vào thẳng `/kid/today` (để xem gieo hạt) hay giữ redirect hiện tại `/courses/{slug}/lessons`.
3. Phase 4 có bật nhánh 3D thật không (sẽ cần duyệt thêm package).
