# Phase 04 - Cloud Garden UI/UX and Three.js

## Goal
Custom lại 2 trang kid theo concept Cloud Garden, có lớp hiệu ứng chiều sâu/particle/camera feel bằng Three.js.

## Target Pages
- `/kid/courses?childId=...` (Learning Hub / Ground Garden)
- `/kid/courses/[slug]?childId=...` (Vertical Beanstalk Journey)

## Reference Docs
- `docs/GenAI/KISU_Cloud_Garden_UIUX_Ideas.md`
- `docs/GenAI/KISU_Cloud_Garden_Prompts.md`

## Requirements
- Mobile-first (tablet/phone ưu tiên).
- Hiệu ứng không gây lag:
  - có reduced-motion mode
  - có low-performance mode
- Dùng asset prompt đã thống nhất:
  - ground background
  - beanstalk
  - cloud tier vfx
  - node states (bud/bloom/leaf platform)

## Planned Files
- Modify: `src/components/kid-courses/KidCoursesDashboard.tsx`
- Modify: `src/components/kid-courses/kid-courses.css`
- Modify: `src/components/kid-sky-garden/KidSkyGardenScene.tsx`
- Modify: `src/components/kid-sky-garden/sky-garden.css`
- Create: `src/components/kid-courses/three/GroundGardenCanvas.tsx`
- Create: `src/components/kid-sky-garden/three/SkyGardenFxCanvas.tsx`
- Optional: `public/images/cloud-garden/**` (nếu cần bổ sung asset mới)

## Implementation Steps
1. Tách nền hiệu ứng thành lớp canvas riêng để không ảnh hưởng logic business.
2. Ground page:
   - particle đom đóm
   - cloud parallax
   - subtle seed aura
3. Course detail page:
   - vertical depth parallax
   - cloud-tier transition cues
   - unlock fx khi hoàn thành bài.
4. Bổ sung `data-testid` ổn định cho e2e.
5. Kiểm tra accessibility:
   - focus ring
   - keyboard trigger card
   - màu chữ đủ tương phản.

## Three.js Package Plan
- Cài tối thiểu `three` (không thêm stack 3D phụ nếu chưa cần).
- Nếu cần productivity cao hơn, cân nhắc `@react-three/fiber` ở bước sau.

## Success Criteria
- UI cảm giác “cloud garden adventure” đúng tài liệu.
- Tương tác mượt trên mobile trung bình.
- Không phá luồng học và API hiện có.

## Risks
- Bundle size tăng khi thêm Three.js.
- Hiệu ứng quá mạnh gây khó chịu cho trẻ.

## Mitigation
- Dynamic import canvas, chỉ load ở kid pages.
- Giảm mật độ particle theo `deviceMemory` và `prefers-reduced-motion`.
