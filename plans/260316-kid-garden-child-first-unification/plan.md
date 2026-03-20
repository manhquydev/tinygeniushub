# Plan: Kid Garden Child-First Unification

## Mục tiêu
- Giảm tải nhận thức cho bé khi dùng khu học tập.
- Loại bỏ cảm giác "dashboard người lớn" ở `/kid/courses` và `/kid/garden`.
- Dùng mô hình "khu vườn tương tác" làm bề mặt chính, text chỉ là phụ trợ.

## Vấn đề hiện tại
- `/kid/courses` và `/kid/garden` đang trùng data, trùng CTA mở khóa học, khác chủ yếu skin.
- Bé đang phải hiểu nhiều nút/chip điều hướng thay vì chạm trực tiếp vào vật thể trong vườn.
- Entry hiện tại đổ vào `/kid/courses`, khiến `/kid/garden` thành một lớp điều hướng bổ sung.

## Phương án giảm tải đề xuất
1. Chuẩn hóa một trang chính duy nhất cho bé: `Kid Garden Home` (đề xuất giữ URL `/kid/garden`).
2. Biến `/kid/courses` thành redirect mềm sang `/kid/garden?childId=...` trong giai đoạn chuyển tiếp.
3. Trên `Kid Garden Home`, bỏ flow-chip kiểu người lớn; thay bằng tương tác object:
   - Chạm vào chậu/mầm/cây để vào course.
   - Chạm mascot để mở trợ giúp.
   - Chạm bảng gỗ nhỏ để đổi bé.
4. Chỉ giữ tối đa 3 hành động rõ ràng trên màn hình:
   - "Học tiếp" (auto chọn course đang ACTIVE).
   - "Đổi bé".
   - "Về phụ huynh" (ẩn trong góc, không nổi bật hơn hành động học).

## UX nguyên tắc cho trẻ em
- Mobile-first tuyệt đối, tap target >= 56px.
- Ưu tiên icon/asset + voice cue, hạn chế text dài.
- Mỗi màn hình có 1 nhiệm vụ chính, không buộc bé đọc luồng nhiều bước.
- Trạng thái học biểu đạt bằng hình ảnh:
  - Chưa học = nụ.
  - Đang học = mầm/cây non.
  - Hoàn thành = hoa nở + hiệu ứng thưởng.

## Mapping tài nguyên hiện có (dùng ngay)
- Nền đất: `public/images/cloud-garden/ground/bg_ground_garden.png`
- Chậu + mầm course: 
  - `public/images/cloud-garden/ground/course_planter_base.png`
  - `public/images/cloud-garden/ground/course_sapling_level0.png`
- Hành trình dọc khóa học:
  - `public/images/cloud-garden/vfx/beanstalk_trunk_loop.png`
  - `public/images/cloud-garden/vfx/platform_cloud_fluffy.png`
- Trạng thái node:
  - `public/images/nodes/node_flower_bud_locked.png`
  - `public/images/nodes/node_flower_bloomed_done.png`
  - `public/images/nodes/node_giant_leaf_platform.png`
- Mascot/companion:
  - `public/images/nodes/kisu_companion_balloon.png`
  - `public/kisu-assets/stickers/*`
- Hiệu ứng thưởng:
  - `public/images/cloud-garden/vfx/vfx_seed_sprout.png`
  - `public/images/cloud-garden/vfx/vfx_cloud_burst_levelup.png`
  - `public/images/cloud-garden/vfx/vfx_tier_unlocked_badge.png`

## Backlog triển khai (khuyến nghị)
### Phase 1 - IA và routing (nhanh, giảm tải tức thì)
- Đặt `/kid/garden` là home chính của bé.
- `/kid/courses` redirect sang `/kid/garden` (giữ query `childId`).
- Xóa flow chip dạng tab giữa 2 trang.

### Phase 2 - Child-first layout
- Tạo scene vườn tương tác dạng object map.
- Course card chuyển thành "cụm cây/chậu" có nhãn ngắn.
- Bổ sung audio cue nhẹ khi hover/tap.

### Phase 3 - Course journey
- Giữ `/kid/courses/[slug]` làm "vườn khóa học chi tiết".
- Đồng bộ visual state với `journey.status` bằng node asset.

### Phase 4 - Progressive enhancement
- Performance mode theo thiết bị:
  - Low-end: giảm particle/blur.
  - Reduced motion: tắt pan/camera mạnh.

## Tiêu chí thành công
- Bé vào trang và thao tác học tiếp trong <= 2 chạm.
- Không cần đọc text dài để hiểu phải làm gì.
- FPS ổn định trên tablet/mobile tầm trung.
- Không còn cảm giác "2 trang giống nhau" ở entry flow.

