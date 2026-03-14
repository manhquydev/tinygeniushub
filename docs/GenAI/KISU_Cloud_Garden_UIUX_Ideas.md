# 🌍 Ý Tưởng Kết Hợp UI/UX Cloud Garden Bằng Three.js

Tài liệu này trình bày các ý tưởng sử dụng tài nguyên 2D/3D (được sinh ra từ tệp Prompt) kết hợp với **Three.js** để tạo ra một trải nghiệm UI/UX sống động, tạo cảm giác "Học tập như một cuộc thám hiểm" cho các bé, thay vì là một trang tĩnh thông thường.

---

## 1. Hành Trình Trải Nghiệm & Kịch Bản Three.js

### Giai đoạn 1: Ươm Mầm Khóa Học (Mặt đất - Ground Level)
Khu vườn mặt đất là nơi khởi đầu, chứa các khóa học bé đang theo học.
- **Tài nguyên sử dụng**: `bg_ground_garden.jpg`, `course_planter_base.png`, `course_sapling_level0.png`.
- **Three.js Effects (Môi trường & Hoạt ảnh tĩnh)**:
  - Render hình nền dưới dạng Plane 3D ở khoảng cách rất xa để làm nền không gian mở.
  - Sử dụng **Particle System (Three.js Points)** để rải các hạt đom đóm (Fireflies) màu vàng / chàm ngọc bích bay lơ lửng, lập loè mượt mà quanh các chậu cây khóa học.
  - Dùng shader (GLSL) tạo một gợn sóng (distortion) rất mỏng lên mầm cây để giả lập lá cây rung rinh trong gió nhẹ.
- **Tương tác (Hover/Click UX)**: 
  - Khi bé rà chuột vào mầm cây, mầm cây sẽ "hít thở" (Scale to ra và nhỏ lại thành nhịp đều đặn bằng Sine Wave).
  - Có một vầng sáng chớp nhẹ (Aura) phát ra quanh chậu cây, đi kèm tiếng "Bling" trong trẻo vẫy gọi bé click.

### Giai đoạn 2: Cú Click Phép Thuật & Hạt Giống Bùng Nổ
Thay vì chuyển trang bình thường, việc ấn vào nụ mầm sẽ mở ra hiệu ứng tăng rần sinh lực.
- **Tài nguyên sử dụng**: `vfx_seed_sprout.png`, `beanstalk_trunk_loop.png`.
- **Three.js Effects (Zoom & Chuyển cảnh Parallax)**:
  - Kích hoạt Camera trong Three.js bắt đầu **Zoom mượt mà thẳng vào tâm** của mầm cây.
  - Tại tiêu điểm, mầm cây thu lại và nổ ra thành hàng ngàn Particle (Sử dụng texture `vfx_seed_sprout.png` làm material cho các điểm phát sáng) phun trào lên trên.
  - Màn hình giả lập một phương tiện đang bay vút lên cao (Bằng cách trượt trục Y của Scene xuống dưới cực nhanh, làm các đám mây 2D mờ ảo - Foreground Layers lướt nhanh che khuất góc nhìn).

### Giai đoạn 3: Cuộc Phiêu Lưu Dọc Thân Cây Đậu (Vertical Climbing)
Màn hình chuyển sang giao diện cuộn dọc để hiển thị các Module bài học.
- **Tài nguyên sử dụng**: Thân cây đậu lặp lại (`beanstalk_trunk_loop.png`), và các tài nguyên bổ sung (Lá đỡ bài học, Nụ hoa).
- **Three.js Effects (Skybox Gradient & Parallax Scroll)**:
  - Ghép chồng liên tiếp texture thân cây đậu trên một khối trụ 3D (CylinderGeometry) để tạo cảm giác thân cây tròn.
  - Mỗi khi bé vuốt (Scroll) lên trên để xem tiến độ, thân cây di chuyển xuống dưới. 
  - **Dynamic Background Coloring**: Màu nền đằng sau bầu trời sẽ nội suy (Lerp) tự động tuỳ vào độ chênh lệch cuộn: Mặt đất sáng sớm ➡️ Tầng 1: Mây trưa ➡️ Tầng 2: Hoàng hôn màu cam ➡️ Tầng 3: Tím hoàng hôn ➡️ Tầng 4: Đêm đầy sao. Three.js tự động phối màu bầu trời (Color Blending) cực kỳ mượt mà.

### Giai đoạn 4: Đột Phá Lớp Mây Đạt Cấp Độ Mới (Level Up Effect)
Mỗi khi kết thúc 1 Section bài giảng, cây đậu vươn dài chọc thủng 1 tầng mây.
- **Tài nguyên sử dụng**: Mây nền tảng (`platform_cloud_fluffy.png`), Hiệu ứng xé mây (`vfx_cloud_burst_levelup.png`), Huy hiệu chúc mừng (`vfx_tier_unlocked_badge.png`).
- **Three.js Effects (Celebration VFX)**:
  - Kích hoạt **Camera Shake** gằn nhẹ, tạo tiếng uỳnh xé mây cực ngầu nhưng không loá mắt bé. Hai lớp mây che màn hình sẽ tách qua 2 bên.
  - Pháo hoa Particle (Confetti) bắn tung loé lên cao và rớt dần xuống (Sử dụng Physics nhẹ dạng trọng lực).
  - Huy hiệu (Linh vật Kisu vươn ngón tay cái) bay bật ra từ giữa tầng mây dưới dạng Mesh 2.5D có viền Kim Loại/Phát sáng (StandardMaterial), lộn nhào và xoay 1 vòng quanh trục Y tự quay để chúc mừng bé.

---

## 2. Phân Tích Sự Chặt Chẽ & Danh Sách Prompt Bổ Sung Để Hoàn Thiện

Sau khi rà soát chéo các tài nguyên ban đầu từ file `KISU_Cloud_Garden_Prompts.md` và ý tưởng vận hành giao diện bên trên, phát hiện ra bộ tài nguyên hiện tại **VẪN CÒN BỊ THIẾU SÓT** để dựng nên một quy trình UX thực sự thoả mãn.

Thân cây lặp chỉ là một cái ống, chúng ta chưa có **Gờ Đỡ** (Platform) để đặt các bài học. Chúng ta cũng chưa có hình thể đại diện cho các trạng thái của Bài Học trên cây (Bài chưa học, đã học, bị khoá) và thiếu mất tương tác với Linh Vật Kisu đi theo cuộn cảnh.

**=> LẬP TỨC TIẾN HÀNH BỔ SUNG CÁC PROMPT SAU VÀO TÀI LIỆU CHÍNH:**

1. **Lá Cây Đậu Khổng Lồ (Gian Bước / Nền Tảng Bài Học)**: Đóng vai trò làm đĩa hứng mọc ra từ thân. Các nút Level sẽ rải lên các lá này.
2. **Nụ Hoa Chưa Nở / Đang Ngủ (Bài Học Tương Lai/Bị Khoá)**: Nếu bé chưa chạm tới bài đó, nó chỉ là một nụ hoa e ấp sương sớm. 
3. **Hoa Đã Nở Rực Rỡ (Bài Học Hoàn Thành)**: Dùng để thay thế nụ hoa, có vầng hào quang báo hiệu module này hoàn thành 100%. Mức độ nở tương đương điểm tuyệt đối.
4. **Kisu Đi Cùng Bé (Companion)**: Quá trình bé kéo chuột/màn che sẽ có mặt Kisu bay khinh khí cầu hoặc cầm dù kế bên để dẫn đường. Kisu là thứ phản hồi lại tốc độ scroll chuột.

> *(Hệ thống AI đã tự động ghi các prompt bổ sung này vào cuối file `KISU_Cloud_Garden_Prompts.md` trong Phần 4).*
