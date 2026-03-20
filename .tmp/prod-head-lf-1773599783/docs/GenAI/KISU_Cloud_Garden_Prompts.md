# ☁️ Từ Điển Prompt Giao Diện Cloud Garden (Khu Vườn Trên Mây)

Tài liệu này tổng hợp các Prompt dùng để tạo tài nguyên đồ hoạ cho giao diện học tập "Cloud Garden" của học viên. Bao gồm cảnh quan mặt đất, cây đậu thần (Beanstalk), và các hiệu ứng chuyển tầng.

> **QUY TẮC CỐT LÕI MỌI PROMPT LIÊN QUAN ĐẾN KISU (Nếu có Kisu trong hình):**
> `MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, standing on two legs. Head larger than body (1.2:1 proportion). Natural fox ears, short muzzle, dark triangular nose. Micro-fluff body fur: warm amber-gold. Belly and inner ears: warm ivory. Deep ink-blue irises (#1B4F8A). Left ear has a Chàm Jade sound-wave marking. Scholar's Stripe: a distinct white fur mark on the forehead, slightly left of center. Huge fluffy fox tail passing naturally through the side slit of the jacket. COSTUME (Vietnamese Áo Bà Ba Tech Edition): Wearing a sleeveless, dark navy-indigo fabric jacket with fine linen weave. Collarless V-neck. All edges trimmed with Chàm Jade thread. LEFT CHEST: small gold 5-pointed star. CENTER CHEST: ivory Lotus flower motif. LIGHTING & STYLE: Pixar/Disney 3D animation quality, soft warm studio lighting, highly detailed textures.`

---

## Phần 1: Khu Vườn Bắt Đầu (Ground Level / Khu vườn chung)

Đây là giao diện chính khi bé vừa vào trang học tập, nơi hiển thị các khoá học bé đang sở hữu dưới dạng các mầm cây hoặc chậu cây. Bối cảnh ở mặt đất, tươi sáng, mang lại cảm giác bắt đầu một hành trình.

📂 **Vị trí lưu trữ tổng hợp:** Thư mục `public/images/cloud-garden/ground/`

### 1. Hình Nền Khu Vườn Mặt Đất (Ground Garden Background)
Dùng làm background toàn màn hình cho trang Dashboard. Bối cảnh không gian mở phía dưới mặt đất, nơi hội tụ các khóa học.
💾 **Tên file đề xuất:** `bg_ground_garden.jpg`
```text
3D Pixar style digital art, highly detailed environment background. A magical, beautifully manicured children's garden at ground level, early morning soft golden sunlight. The ground is covered in vibrant, lush green grass with tiny glowing magical flowers (in pastel pink, amber gold, and mint green). Soft, fluffy white clouds at the bottom edge. In the center, there is a magical circular soil patch ready for planting. A cozy wooden fence in the background and a distant view of endless blue sky. High end mobile game art style, colorful, joyful, child-friendly EdTech aesthetic. Masterpiece, 8k resolution, volumetric lighting. empty center space for UI elements. --ar 16:9
```

### 2. Chậu Cây / Đất Trồng Khoá Học (Course Planter Base)
Dùng làm bệ đỡ (base) cho mỗi khoá học bé sở hữu, để từ đó mọc lên mầm cây.
💾 **Tên file đề xuất:** `course_planter_base.png`
```text
3D Pixar style digital art. A single, stylized magical wooden planter box filled with rich, glowing magical soil. Tiny glowing sparkles (amber gold and chàm jade colors) are floating up from the soil. The planter has beautiful, soft rounded edges and cute decorative carvings of stars and math symbols. Front isometric view. Solid pure white background, no ground shadows. High end mobile game art style, vibrant and colorful.
```

### 3. Mầm Cây Đại Diện Khoá Học Mới (Course Sapling - 2D/3D Asset)
Mầm cây nhỏ đại diện cho một khoá học bé vừa sở hữu, đang ở nấc đầu tiên.
💾 **Tên file đề xuất:** `course_sapling_level0.png`
```text
3D Pixar style digital art. A super cute, plump glowing magical sapling with just two or three vibrant green leaves. The leaves are soft and rounded. The stem is glowing slightly with a Chàm Jade aura. Solid pure white background, no ground shadows. Isometric view. High end mobile game asset style, colorful and inviting.
```

---

## Phần 2: Hiệu Ứng Nảy Mầm & Leo Cây Đậu (Sprouting & Climbing Beanstalk)

Khi bé click vào một khoá học, mầm cây sẽ nảy mọc lên thành một cây đậu khổng lồ vươn lên các tầng mây (tượng trưng cho các bài học).

📂 **Vị trí lưu trữ tổng hợp:** Thư mục `public/images/cloud-garden/vfx/` (khuyến nghị dùng sinh ảnh đen rồi phối blend mode, hoặc tách nền tạo sprite sheet).

### 1. Hiệu Ứng Ánh Sáng Nảy Mầm (Seed Sprouting Magic VFX)
Hiệu ứng ánh sáng phép thuật lúc hạt giống nứt ra và mọc lên mạnh mẽ.
💾 **Tên file đề xuất:** `vfx_seed_sprout.png`
```text
3D Pixar style VFX effect on a solid black background. A magical glowing green botanical sprout bursting upwards with intense stylized light rays. Glowing particles, sparkles, and tiny magical leaves swirling in a joyful, energetic upward motion. Colors consist of vibrant spring green, neon chàm jade (#4ECDC4), and glowing amber gold. High-end casual mobile game UI effect, clean magical energy burst.
```

### 2. Thân Cây Đậu Khổng Lồ (Giant Beanstalk Trunk Loop)
Đoạn thân cây trải dài, có thể được lặp lại (tileable) để tạo cảm giác cây mọc cao vô tận lên các tầng mây.
💾 **Tên file đề xuất:** `beanstalk_trunk_loop.png`
```text
3D Pixar style digital art. A thick, magical, stylized green beanstalk trunk growing straight upwards. The vines twist playfully together, with oversized, soft, rounded and glowing magical leaves sticking out from the sides. Bright, vibrant spring green with soft pastel yellow highlights. Subtle glowing geometric patterns on the leaves. Isometric view, straight vertical orientation, seamless tiling pattern. Solid pure white background. High end mobile game asset style.
```

---

## Phần 3: Hiệu Ứng Lên Tầng Mây Mới (Level Up / New Cloud Tier)

Khi bé hoàn thành một cụm bài học, cây đậu xuyên qua mây để lên tầng tiếp theo. Các tài nguyên này dùng làm hiệu ứng điểm nhấn chúc mừng chặng đường mới.

📂 **Vị trí lưu trữ tổng hợp:** Thư mục `public/images/cloud-garden/vfx/`

### 1. Đám Mây Nền Tảng (Cloud Platform)
Nơi đặt các bài học ở mỗi tầng trên cao, làm bệ đỡ trên ngọn cây đậu.
💾 **Tên file đề xuất:** `platform_cloud_fluffy.png`
```text
3D Pixar style digital art. A soft, stylized, ultra-fluffy white and pastel blue magical cloud acting as a solid floating platform. Joyful, bubbly, rounded shapes with soft glowing edges. The cloud is thick enough to stand on. Isometric view. Solid pure white background. High end mobile UI asset.
```

### 2. Hiệu Ứng Xé Mây Lên Tầng Mới (Cloud Burst / Level Up VFX)
Cảnh ánh sáng rực rỡ khi vượt qua một lớp mây để lên tầng mới.
💾 **Tên file đề xuất:** `vfx_cloud_burst_levelup.png`
```text
3D Pixar style VFX effect on a solid black background. An explosive, joyful burst of soft, fluffy pastel clouds splitting open outwards. From the center bursts an intense upward pillar of magical golden and Chàm Jade light, surrounded by confetti, glowing stars, and swirling magical sparkles. Triumphant, highly energetic "level up" celebratory effect. High end mobile game UI VFX.
```

### 3. Huy Hiệu Chúc Mừng Hoàn Thành Tầng (Tier Complete Badge có Kisu)
Huy hiệu nhận được khi lên mây mới, kèm theo linh vật Kisu chúc mừng ấn tượng.
💾 **Tên file đề xuất:** `vfx_tier_unlocked_badge.png`
```text
3D Pixar style digital art. A majestic, glowing 3D golden badge in the shape of a winged glowing star. The badge is radiating warm magical energy and sparkling particles. The mascot Kisu is peeking from behind the badge, winking and giving a thumbs up. MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, amber-gold fur, ivory belly, ink-blue eyes. Left ear Chàm Jade marking, distinct white Scholar's stripe on forehead. Wearing a sleeveless dark navy-indigo fabric jacket with Chàm Jade thread edges. Solid pure white background. Masterpiece, high detail.
```

---

## Phần 4: Các Tài Nguyên Bổ Sung Cho Trải Nghiệm Hoàn Hảo (UI/UX Nodes)

Sau khi phân tích kịch bản tương tác (Three.js & Parallax), dưới đây là các tài nguyên còn thiếu để hoàn thiện các trạm tĩnh (Node) và đa dạng hoá trạng thái bài học dọc theo nhánh cây.

📂 **Vị trí lưu trữ tổng hợp:** Thư mục `public/images/cloud-garden/nodes/`

### 1. Lá Cây Đậu Khổng Lồ Nối Từ Thân (Giant Leaf Platform)
Lá cây khổng lồ vươn ra từ thân chính, dùng làm bệ đỡ đặt các nút/chương bài học trên dọc đường đi.
💾 **Tên file đề xuất:** `node_giant_leaf_platform.png`
```text
3D Pixar style digital art. A single, giant, thick magical beanstalk leaf glowing softly. The leaf extends horizontally serving as a wide, safe platform. Rich spring green color with visible, slightly glowing yellow veins. A few sparkling dewdrops sit on the edge. Isometric view, solid pure white background. High end mobile game UI asset.
```

### 2. Nụ Hoa Thần Kỳ Đang Ngủ (Locked Lesson / Bài học chưa mở)
Đại diện cho các bài học ở tương lai, trạng thái đóng khóa. Bé chưa học tới đây.
💾 **Tên file đề xuất:** `node_flower_bud_locked.png`
```text
3D Pixar style digital art. A cute, magical flower bud tightly closed, sleeping gracefully. The bud has soft pastel pink and magenta petals wrapped around each other, with vines holding it securely. A tiny, glowing semi-transparent padlock floating gently in front of it. Soft, sleepy ambient lighting. Solid pure white background. Isometric view.
```

### 3. Hoa Nở Rực Rỡ Bừng Sáng (Completed Lesson / Bài học đã xong)
Trạng thái hoa nở hoàn toàn thành đài, khoe sắc ấn tượng. Tương đương với chiến thắng hoàn hảo 3 sao.
💾 **Tên file đề xuất:** `node_flower_bloomed_done.png`
```text
3D Pixar style digital art. A large, magnificently bloomed magical flower with multi-layered glowing petals (rich gradient of amber gold and vibrant pink). In the glowing center of the flower sits a shiny golden academic star. Radiant light beams shoot up softly from the center. Joyful, rewarding aesthetic. Solid pure white background. Isometric view.
```

### 4. Kisu Cầm Dù Nhảy Mây / Bay Khinh Khí Cầu (Scroll Companion)
Hình ảnh Kisu đu lơ lửng, tạo thành vật chạy dọc theo thanh cuộn màn hình của bé làm bạn đồng hành.
💾 **Tên file đề xuất:** `kisu_companion_balloon.png`
```text
3D Pixar style digital art. The mascot Kisu is holding onto the strings of a small, cute, colorful hot air balloon, floating happily in the air. Looking upwards with an excited smile. MASCOT KISU EXACT DETAILS: A cute 3D chibi anthropomorphic fox, upright bipedal, amber-gold fur, ivory belly, ink-blue eyes. Left ear Chàm Jade marking, distinct white Scholar's stripe on forehead. Wearing a sleeveless dark navy-indigo fabric jacket with Chàm Jade thread edges, a gold star on the left chest, and an ivory Lotus motif in the center. Solid pure white background. Highlighted edges for character contrast.
```
