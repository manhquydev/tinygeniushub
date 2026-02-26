# CODEX FIX: 404 Cinematic — Sửa Animation Và Layout

## Vấn đề thực tế (quan sát browser)

1. **Nhân vật stuck tại góc trái, không di chuyển** — câu chuyện không chạy
2. **`useAnimationControls` + `x: "calc(...)"` string** không hoạt động ổn định trong motion/react
3. **Tọa độ tính bằng `isMobile` state** sai trong render đầu vì state khởi tạo `false`
4. **Không có cảm giác "film"** — nhân vật không đi từ mép màn hình

## File cần sửa duy nhất: [src/app/not-found.tsx](file:///d:/project/cungcontuhoc/src/app/not-found.tsx)

Viết lại hoàn toàn. Kiến trúc mới đơn giản hơn nhưng đúng hơn.

---

## Kiến trúc Mới: KHÔNG dùng `useAnimationControls`

Dùng **`motion/react-m` với `animate` prop + `key` trick để trigger animation khi phase đổi**:

### Pattern chính thay thế `useAnimationControls`:

```tsx
// Cú Con — key đổi mỗi cycle để trigger initial animation lại từ đầu
<m.div
  key={`small-owl-cycle-${cycleCount}`}  // cycleCount tăng mỗi lần loop
  className="absolute left-0 top-1/2 -translate-y-1/2"
  initial={{ x: -220, opacity: 1 }}
  animate={{ x: 120 }}
  transition={{ duration: 2.6, ease: [0.25, 0.46, 0.45, 0.94] }}
>
```

Khi `cycleCount` tăng → React unmount/mount lại → initial animation chạy lại từ đầu.

---

## State Machine

```tsx
type StoryPhase = 1 | 2 | 3;

const [phase, setPhase] = useState<StoryPhase>(1);
const [cycleCount, setCycleCount] = useState(0);  // trigger re-animate
const [smallState, setSmallState] = useState<MascotState>("sad");
const [smallGaze, setSmallGaze] = useState<MascotGazeDirection>("right");
const [showParent, setShowParent] = useState(false);
const [showRipples, setShowRipples] = useState(false);
const [showGuidePath, setShowGuidePath] = useState(false);
const prefersReducedMotion = useReducedMotion() ?? false;
```

## Timer Sequence (đơn giản, KHÔNG `useAnimationControls`):

```tsx
useEffect(() => {
  if (prefersReducedMotion) {
    setPhase(3);
    setSmallState("happy");
    setSmallGaze("right");
    setShowParent(true);
    setShowGuidePath(true);
    return;
  }

  let cancelled = false;

  function startCycle(count: number) {
    setPhase(1);
    setCycleCount(count);
    setSmallState("sad");
    setSmallGaze("right");
    setShowParent(false);
    setShowRipples(false);
    setShowGuidePath(false);

    const t1 = setTimeout(() => {
      if (cancelled) return;
      setPhase(2);
      setShowParent(true);
      setShowRipples(true);
      setSmallGaze("right");
    }, 3500);

    const t2 = setTimeout(() => {
      if (cancelled) return;
      setPhase(3);
      setSmallState("happy");
      setShowRipples(false);
      setShowGuidePath(true);
    }, 6500);

    const t3 = setTimeout(() => {
      if (!cancelled) startCycle(count + 1);
    }, 14000);

    return [t1, t2, t3];
  }

  const timers = startCycle(0);

  return () => {
    cancelled = true;
    timers?.forEach(clearTimeout);
  };
}, [prefersReducedMotion]);
```

---

## JSX — Full Viewport Stage

```tsx
return (
  <LazyMotion features={domAnimation}>
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] text-slate-100">

      {/* ------- BACKGROUND (giữ nguyên từ code cũ) ------- */}
      {/* radial-gradient overlay */}
      {/* moon m.div */}
      {/* fog-a + fog-b divs */}
      {/* STAR_FIELD spans */}
      {/* FIREFLIES m.spans */}
      {/* tree SVG */}

      {/* ------- STAGE LAYER ------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">

        {/* Cú Con — từ mép TRÁI đi vào */}
        <m.div
          key={`small-${cycleCount}`}
          className="absolute left-0 top-[48%] -translate-y-1/2"
          initial={prefersReducedMotion ? false : { x: -220 }}
          animate={{ x: phase >= 2 ? 80 : 120 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 2.6, ease: [0.25, 0.46, 0.45, 0.94] }
          }
        >
          <Mascot
            variant="small"
            state={smallState}
            gazeDirection={phase >= 2 ? "right" : smallGaze}
            size={180}
            motionLevel={prefersReducedMotion ? "minimal" : "full"}
            className="drop-shadow-[0_20px_48px_rgba(14,165,233,0.4)]"
          />
          {phase === 1 && <QuestionCloud />}
          {showRipples && <CallRipples />}
        </m.div>

        {/* Cú Mẹ — từ mép PHẢI bay vào */}
        <AnimatePresence>
          {showParent && (
            <m.div
              key="big-owl"
              className="absolute right-0 top-[44%] -translate-y-1/2"
              initial={{ x: 280, opacity: 0, scale: 0.5 }}
              animate={{ x: -40, opacity: 1, scale: 1 }}
              exit={{ x: 280, opacity: 0 }}
              transition={{ duration: 2.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Mascot
                variant="big"
                state="love"
                gazeDirection="left"
                size={240}
                motionLevel={prefersReducedMotion ? "minimal" : "full"}
                className="drop-shadow-[0_20px_48px_rgba(251,191,36,0.3)]"
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* Guide path — phase 3 */}
        <AnimatePresence>
          {showGuidePath && (
            <m.svg
              key="guide"
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <m.path
                d="M 32 50 Q 50 68 50 82"
                stroke="#fde047"
                strokeOpacity="0.65"
                strokeWidth="0.4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="2 1.5"
                animate={{ strokeDashoffset: [0, -7] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              />
            </m.svg>
          )}
        </AnimatePresence>
      </div>

      {/* ------- CONTENT LAYER ------- */}
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-5 px-6 py-12 text-center">

        <p className="rounded-full border border-cyan-200/30 bg-slate-950/45 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-100/90">
          Lỗi 404
        </p>

        <div className="flex items-center gap-2" style={{ filter: "drop-shadow(0 0 28px rgba(99,102,241,0.55))" }}>
          {["4", "0", "4"].map((d, i) => (
            <m.span
              key={i}
              className="inline-flex min-h-20 min-w-16 items-center justify-center rounded-2xl border border-slate-200/20 bg-slate-900/35 px-3 text-8xl font-black leading-none text-transparent [background-image:linear-gradient(to_bottom,#ffffff,#94a3b8)] bg-clip-text"
              initial={{ opacity: 0, y: -28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              {d}
            </m.span>
          ))}
        </div>

        {/* Spacer — sân khấu cho nhân vật */}
        <div className="h-52 sm:h-60" aria-hidden />

        <AnimatePresence mode="wait">
          <m.h1
            key={phase === 3 ? "found" : "lost"}
            className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {phase === 3 ? "Cú Mẹ đã tìm thấy con rồi! 🦉💛" : "Ôi không! Cú Con đang lạc đường..."}
          </m.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <m.p
            key={phase}
            className="max-w-[50ch] text-pretty text-base leading-relaxed text-slate-200/90 sm:text-lg"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {phase === 1
              ? "Bé Cú đã bay nhầm vào khu rừng tối. Đừng lo, Cú Mẹ đang đến rồi!"
              : phase === 2
              ? "Ồ! Cú Mẹ nghe thấy tiếng kêu của con rồi! Đang bay đến..."
              : "Hai mẹ con sẽ dẫn bạn trở về nhà. Đường dẫn này không tồn tại, nhưng trang chủ luôn ở đây!"}
          </m.p>
        </AnimatePresence>

        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 px-7 text-sm font-black text-slate-950 shadow-[0_18px_36px_rgba(45,212,191,0.34)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
          style={{
            background: "linear-gradient(90deg, #34d399, #22d3ee, #34d399)",
            backgroundSize: "200% 100%",
            animation: "notFoundShimmer 2.5s linear infinite",
          }}
        >
          {phase >= 3 ? "🏠 Về trang chủ cùng Cú Mẹ" : "🏠 Về trang chủ"}
        </Link>

        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-slate-300/80 underline-offset-4 transition hover:text-slate-100 hover:underline"
        >
          ← Quay lại trang trước
        </button>
      </section>
    </main>
  </LazyMotion>
);
```

---

## Helper Components (đặt NGOÀI function NotFound, trong cùng file)

```tsx
function QuestionCloud() {
  return (
    <div className="absolute -top-14 left-1/2 flex -translate-x-1/2 gap-3">
      {["?", "?", "?"].map((q, i) => (
        <m.span
          key={i}
          className="text-xl font-black text-amber-200/80"
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
        >
          {q}
        </m.span>
      ))}
    </div>
  );
}

function CallRipples() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[0, 0.35, 0.7].map((delay) => (
        <m.div
          key={delay}
          className="absolute h-16 w-16 rounded-full border-2 border-cyan-300/50"
          style={{ left: "-32px", top: "-32px" }}
          animate={{ scale: [0, 2.8], opacity: [0.85, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
```

---

## Checklist Verification

```bash
pnpm type-check   # zero errors
```

Kiểm tra browser tại `/nonexistent-url`:

- [ ] **Phase 1 (0–3.5s):** Cú Con đi từ ngoài mép TRÁI vào, dừng ở 1/3 trái màn hình. Dấu `???` nổi phía trên đầu.
- [ ] **Phase 2 (3.5–6.5s):** Cú Mẹ bay từ mép PHẢI vào, dừng ở 1/3 phải màn hình. Ripples xung quanh Cú Con. Subtext đổi.
- [ ] **Phase 3 (6.5–14s):** Cả hai đứng nhìn nhau. Đường vàng nối xuống CTA button. Headline và subtext đổi.
- [ ] **14s:** Cycle lại — Cú Con animation chạy lại từ mép trái (`key={cycleCount}` tăng).
- [ ] **`prefers-reduced-motion`:** Nhảy thẳng phase 3, không có animation loop.
- [ ] **Nền không đổi:** Stars, fireflies, moon, fog, trees vẫn hiển thị.
- [ ] **`<style jsx>` KHÔNG có trong file** — CSS keyframes đã ở [src/app/globals.css](file:///d:/project/cungcontuhoc/src/app/globals.css).
