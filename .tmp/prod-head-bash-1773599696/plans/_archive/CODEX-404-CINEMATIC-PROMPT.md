# CODEX TASK: Cinematic 404 — "Bộ phim liền mạch hai mẹ con Cú"

## Mục tiêu

Viết lại hoàn toàn [src/app/not-found.tsx](file:///d:/project/cungcontuhoc/src/app/not-found.tsx). Giữ toàn bộ nền, sao, đom đóm, sương mù, cây, mặt trăng đã có. **Chỉ thay đổi cách các nhân vật di chuyển và bố cục trang.**

**Triết lý cốt lõi:** Không có gì fade-in/fade-out tại chỗ. Nhân vật *đi vào* từ mép thực sự của màn hình, *di chuyển qua* không gian của trang, rồi *dừng lại* ở vị trí cuối cùng. Toàn bộ câu chuyện diễn ra như một bộ phim hoạt hình cuộn liền mạch — không có "cảnh" nào bị thay thế bằng cảnh khác.

**File duy nhất được sửa:** [src/app/not-found.tsx](file:///d:/project/cungcontuhoc/src/app/not-found.tsx)  
**Không thêm package mới.** Dùng `motion/react` đã có.

---

## Kiến trúc Layout Mới

### Từ bỏ cấu trúc cũ

Xóa bỏ:
- Container `max-w-[320px] h-[264px]` làm khung cảnh vật
- `AnimatePresence mode="wait"` để swap các phase — đây là nguyên nhân gây fade
- Logic `activePhase === 1`, `activePhase === 2`, `activePhase === 3` với 3 nhánh JSX riêng

### Cấu trúc mới: Full-Viewport Stage

Trang có **2 lớp riêng biệt**:

**Lớp 1 — Stage (vị trí tuyệt đối, `position: absolute`, `inset: 0`):**
```
Cú Con   →   chạy từ mép trái vào
Cú Mẹ   →   bay từ mép phải vào
Cả hai  →   gặp nhau, cùng đi xuống phía CTA
```
Các nhân vật sống ở đây, có tọa độ `x, y` thực, di chuyển liên tục.

**Lớp 2 — Content (normal flow, `position: relative z-10`):**
```
Badge "Lỗi 404" (bất động)
Số "404"        (bất động, drop-shadow đẹp)
[khoảng trống — cho stage thở và nhân vật đi qua]
Headline        (thay đổi theo phase)
Subtext         (thay đổi theo phase)
CTA Button
Link quay lại
```

**Làm rõ:** `min-h-screen` layout vẫn là flex column. Nhưng nhân vật được đặt `position: absolute` trong `<main>`, tự do di chuyển bất kỳ đâu trên trang, **không bị giới hạn bởi bất kỳ container nào**. Content nằm ở lớp trên (`z-10`), stage ở `z-5`.

---

## Kịch bản Điện Ảnh Chi Tiết

### Thời gian tổng: 0s → 8s → loop

### ACT 1 — "Cú Con lạc vào màn hình" (0s → 3s)

**Cú Con** xuất hiện từ **mép TRÁI màn hình**, đi sang phải với dáng đi lạc lõng:
- `initial: { x: -180, y: 0 }` → `animate: { x: "calc(30vw - 140px)", y: 0 }`
- Trong khi đi, con lắc lư nhẹ: `rotate: [0, -3, 2, -1, 0]` lặp lại
- Dấu chân 🐾 xuất hiện phía sau theo hành trình đi của nó — **không phải vị trí tĩnh** — dùng 5 `span` với `position: absolute` được tính toán dọc theo path di chuyển
- Dấu `?` nổi phía trên đầu khi đang đi
- State: `sad`, `gazeDirection="right"` (nhìn về phía không có gì — cảm giác lạc)
- Khi dừng lại ở `30vw`, nó dừng hẳn và nhìn xung quanh: `gazeDirection` chuyển `"left"` → `"right"` → `"center"` bằng 3 setTimeout riêng (500ms delay mỗi cái)

**Cú Con kêu lên (1.5s → 2.5s):**
- Một hiệu ứng âm thanh bằng hình ảnh: 3 vòng tròn concentric scale out từ vị trí Cú Con
  ```tsx
  // 3 m.div với initial={scale:0,opacity:0.7} → animate={{scale:3,opacity:0}} repeat
  // Border-only circles, stroke color: rgba(34,211,238,0.5)
  ```
- State chuyển sang `playful` rồi `sad` luân phiên (nhún nhảy gọi mẹ)

---

### ACT 2 — "Cú Mẹ xuất hiện từ xa, bay đến" (3s → 6s)

**Cú Mẹ** xuất hiện từ **mép PHẢI màn hình**, nhỏ hơn (xa hơn), bay sang trái:
- `initial: { x: "100vw", scale: 0.5, opacity: 0 }` — bắt đầu ngoài vùng nhìn thấy, scale nhỏ để giả lập khoảng cách xa
- `animate: { x: "calc(60vw - 140px)", scale: 1, opacity: 1 }` — bay đến vị trí khoảng 60% từ trái, đồng thời to dần (tiến gần)
- Transition: `duration: 2.2s, ease: [0.25, 0.46, 0.45, 0.94]` — decelerating curve (tốc độ giảm dần khi đến)
- Trong khi bay: nhẹ nhàng lắc lư dọc `y: [0, -18, -4, -14, 0]` → cảm giác bay dập dềnh
- State: `love`, `gazeDirection="left"` (nhìn về phía Cú Con ngay từ đầu)

**Cả hai nhìn nhau (5.5s):**
- Cú Mẹ dừng lại ở vị trí bên phải Cú Con
- Cú Con: `gazeDirection` chuyển sang `"right"` — nhận ra mẹ
- State Cú Con: `sad` → `happy`
- Vòng tròn "kêu gọi" dừng lại
- Một hiệu ứng "gặp nhau": một vầng sáng nhỏ màu amber pulse out giữa hai nhân vật

---

### ACT 3 — "Cú Mẹ dẫn con đi về nhà" (6s → ∞)

**Cả hai cùng đi** về phía CTA button (phía dưới trang). Không dùng `variant="duo"` ở đây — giữ 2 Mascot riêng để kiểm soát vị trí độc lập.

**Chuyển động:**
- Cả hai animate `y` tăng dần để "đi xuống" về phía nội dung
- Cú Mẹ: vị trí cuối `y: "calc(45vh - 140px)"`, x không đổi — dừng ở khoảng giữa màn hình bên phải
- Cú Con: vị trí cuối `y: "calc(45vh - 140px)"`, x không đổi — dừng ở bên trái Cú Mẹ
- Khi đã ổn định: cả hai gently bob `y: [0, -6, 0]` lặp lại — idle loop

**Đường dẫn về nhà (Phase 3 only):**
- SVG dashed line từ vị trí giữa 2 nhân vật, cong xuống dưới, kết thúc tại CTA button
- `strokeDashoffset` animate để "chảy" xuống — visual cue dẫn mắt đến button

---

## Cách Implement Phase Machine

### Không dùng AnimatePresence để swap component — dùng `useAnimationControls`

```tsx
import { useAnimationControls } from "motion/react";

const smallOwlControls = useAnimationControls();
const bigOwlControls = useAnimationControls();

// Sequence toàn bộ animation qua useEffect với async/await
useEffect(() => {
  if (prefersReducedMotion) {
    // Jump to final state immediately
    void smallOwlControls.set({ x: "calc(30vw - 140px)", y: "calc(45vh - 140px)" });
    void bigOwlControls.set({ x: "calc(60vw - 140px)", y: "calc(45vh - 140px)", opacity: 1 });
    setPhase(3);
    return;
  }

  async function runCinematic() {
    // ACT 1: Cú Con bước vào
    await smallOwlControls.start({
      x: "calc(30vw - 140px)",
      transition: { duration: 2.2, ease: [0.25, 0.46, 0.45, 0.94] }
    });

    // Pause — Cú Con nhìn xung quanh
    await new Promise(r => setTimeout(r, 800));
    setPhase(2); // trigger "calling" animation

    // ACT 2: Cú Mẹ bay vào đồng thời Cú Con kêu
    await bigOwlControls.start({
      x: "calc(60vw - 140px)",
      scale: 1,
      opacity: 1,
      transition: { duration: 2.2, ease: [0.25, 0.46, 0.45, 0.94] }
    });

    await new Promise(r => setTimeout(r, 600));

    // ACT 3: Cả hai đi xuống về CTA
    setPhase(3);
    await Promise.all([
      smallOwlControls.start({ y: "calc(45vh - 140px)", transition: { duration: 1.4, ease: "easeInOut" } }),
      bigOwlControls.start({ y: "calc(45vh - 140px)", transition: { duration: 1.4, ease: "easeInOut", delay: 0.18 } }),
    ]);

    // Idle loop — gentle bob
    void smallOwlControls.start({ y: ["calc(45vh - 140px)", "calc(45vh - 148px)", "calc(45vh - 140px)"], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } });
    void bigOwlControls.start({ y: ["calc(45vh - 140px)", "calc(45vh - 146px)", "calc(45vh - 140px)"], transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 } });
  }

  void runCinematic();
}, [prefersReducedMotion]);
```

### State machine chỉ để update copy, không swap component

```tsx
type StoryPhase = 1 | 2 | 3;
const [phase, setPhase] = useState<StoryPhase>(1);
const [smallOwlState, setSmallOwlState] = useState<MascotState>("sad");
const [smallOwlGaze, setSmallOwlGaze] = useState<MascotGazeDirection>("right");
const [bigOwlVisible, setBigOwlVisible] = useState(false);
```

---

## JSX Structure

```tsx
<main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a]">
  {/* Background layers — giữ nguyên toàn bộ từ code cũ */}
  {/* Stars, fireflies, fog, moon, tree silhouettes — KHÔNG thay đổi */}

  {/* === STAGE — position absolute, z-5 === */}
  {/* Cú Con — luôn rendered, controls điều khiển vị trí */}
  <m.div
    className="pointer-events-none absolute z-[5]"
    style={{ bottom: "auto", top: "38%" }}  // vertical starting point
    initial={{ x: -200, y: 0 }}
    animate={smallOwlControls}
  >
    <Mascot
      variant="small"
      state={smallOwlState}
      gazeDirection={smallOwlGaze}
      size={200}
      motionLevel={prefersReducedMotion ? "minimal" : "full"}
    />
    {/* Dấu ? phía trên — chỉ phase 1 */}
    {phase === 1 && <QuestionMarksOverlay />}
    {/* Vòng tròn kêu gọi — phase 2 */}
    {phase === 2 && <CallRipples />}
  </m.div>

  {/* Cú Mẹ — luôn rendered, initial opacity 0 */}
  <m.div
    className="pointer-events-none absolute z-[5]"
    style={{ top: "38%" }}
    initial={{ x: "110vw", scale: 0.45, opacity: 0 }}
    animate={bigOwlControls}
  >
    <Mascot
      variant="big"
      state={phase >= 2 ? "love" : "idle"}
      gazeDirection="left"
      size={260}
      motionLevel={prefersReducedMotion ? "minimal" : "full"}
    />
  </m.div>

  {/* Đường dẫn về nhà SVG — chỉ phase 3 */}

  {/* === CONTENT — normal flow, z-10 === */}
  <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
    {/* Badge + 404 + [spacer 280px height cho stage] + Headline + Subtext + CTA */}
    {/* Headline và subtext thay đổi theo `phase` state thuần — dùng AnimatePresence CHỈ cho text */}
  </section>
</main>
```

### Spacer cho Stage

Giữa số "404" và headline, thêm một khoảng trống:
```tsx
{/* Khoảng sân khấu — để nhân vật có chỗ đi qua */}
<div className="h-[280px] w-full" aria-hidden />
```

Nhân vật position:absolute sẽ chiếm lấy khoảng này một cách tự nhiên mà không ảnh hưởng layout.

---

## Dấu Chân Theo Hành Trình

Thay vì dấu chân vị trí tĩnh cũ, render dấu chân **bên dưới đường đi của Cú Con**:

```tsx
// 5 dấu chân đặt absolute theo hành trình ngang
const TRAIL_FOOTPRINTS = [
  { x: "5vw",  opacity: 0.9 },
  { x: "10vw", opacity: 0.72 },
  { x: "15vw", opacity: 0.54 },
  { x: "20vw", opacity: 0.36 },
  { x: "25vw", opacity: 0.2 },
];

// Chỉ render khi phase === 1, position dựa theo vị trí Cú Con trên trục x
// Đặt top: "calc(38% + 160px)" — ngay bên dưới chân Cú Con
```

---

## Responsive

- Mobile (`< sm`): `size={140}` cho Mascot, vị trí x điều chỉnh: `30vw → 22vw`, `60vw → 68vw`
- Dùng `useWindowSize` hook nhỏ (tự implement, không cần package):
  ```tsx
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  ```

---

## Giữ Nguyên Hoàn Toàn

- Toàn bộ `STAR_FIELD` + CSS `@keyframes notFoundTwinkle`
- `FIREFLIES` + animation
- `.not-found-fog` fog drift
- Mặt trăng breathing animation
- SVG tree silhouettes ở đáy trang
- `@keyframes notFoundShimmer` cho CTA button
- Copy tiếng Việt (headline, subtext, CTA text) — giữ đúng
- `router.back()` cho link quay lại

---

## Verifications

Sau khi viết xong:
1. `pnpm type-check` — zero errors
2. Không có prop nào không tồn tại trong [MascotProps](file:///d:/project/cungcontuhoc/src/components/mascot/types.ts#10-30) (xem [src/components/mascot/types.ts](file:///d:/project/cungcontuhoc/src/components/mascot/types.ts))
3. `<m.div>` và `useAnimationControls` được import từ `motion/react` (thông qua `* as m from "motion/react-m"` và import trực tiếp)
4. `LazyMotion` wraps toàn bộ nội dung
5. Với `prefers-reduced-motion: reduce`: tất cả nhân vật xuất hiện ở vị trí cuối ngay lập tức, không có idle loop
