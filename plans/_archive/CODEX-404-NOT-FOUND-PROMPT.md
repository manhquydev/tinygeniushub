# CODEX TASK: Redesign 404 Not-Found Page — "Cú Con Lạc Đường"

## Objective

Redesign `src/app/not-found.tsx` to create a premium, story-driven 404 experience using both project mascots. The page must be emotionally engaging, charming for Vietnamese parents and children aged 2–6, and visually stunning.

**Do NOT add any new npm dependencies for animation** — the project already has `motion/react` (Framer Motion) and Tailwind CSS v4.

---

## Project Context (read these files first)

```
src/app/not-found.tsx              ← file to rewrite entirely
src/components/mascot/Mascot.tsx   ← Mascot component (variant="duo" renders both owls)
src/components/mascot/types.ts     ← MascotVariant, MascotState, MascotProps
src/components/mascot/characters/BigOwl.tsx   ← Cú Phụ Huynh (parent owl, dark blue)
src/components/mascot/characters/SmallOwl.tsx ← Cú Con (baby owl, sky blue)
src/app/globals.css                ← design tokens
```

Key API of `<Mascot>`:
- `variant="duo"` → renders BigOwl (parent) + SmallOwl (child) together
- `variant="small"` → renders only SmallOwl
- `variant="big"` → renders only BigOwl
- `parentState` / `childState` — independent states for each character in duo mode
- `parentGazeDirection` / `childGazeDirection` — `"left" | "center" | "right"`
- `layout="horizontal"` → side by side (parent left, child right)
- `motionLevel="full"` — enable all animations
- Available states: `"idle" | "happy" | "thinking" | "sad" | "sleepy" | "playful" | "celebrating" | "proud" | "love"`

---

## Narrative Concept: "Con Lạc Đường — Mẹ Đến Tìm Con"

The 404 page tells a **3-phase animated story**:

### Phase 1 — CÚ CON LẠC ĐƯỜNG (0s → 3s)
Baby owl appears alone, lost in a dark cosmic/forest night. It looks confused, sad. A dotted trail of question marks floats around it. Small owl is shown first (`variant="small"`) before parent arrives.

### Phase 2 — CÚ PHỤ HUYNH XUẤT HIỆN (3s → 6s)
Parent owl flies in from the right edge of the screen with a gentle swooping motion (CSS `@keyframes` flyIn: `translateX(+120px) → translateX(0)` with easing). Once arrived, parent owl turns to look at the child (`gazeDirection="left"`).

### Phase 3 — CÚ CON ĐƯỢC DẪN ĐẦU VỀ (6s → ∞)
After parent arrives, switch to `variant="duo"` with:
- `parentState="love"` + `parentGazeDirection="right"` (looking at child)
- `childState="happy"` + `childGazeDirection="left"` (looking at parent)
- Both gently float/bob together in the duo idle animation
- A glowing golden "path home" arrow or dotted trail drawn in SVG animates between them and points toward the CTA button

**Implementation approach:** Use React `useState` + `useEffect` with `setTimeout` to drive the phase transitions. Start with `phase: 1`, progress to `phase: 2` after 3000ms, then `phase: 3` after 6000ms.

---

## Visual Scene Design

### Background (dark night sky / mystical forest)
- Background: `bg-[#050d1a]` (very deep navy, darker than current `#0f172a`)
- Three layered radial gradients: teal glow top-left, blue glow top-right, purple/indigo glow bottom-center
- Add a large glowing moon: `absolute top-[8%] right-[12%]` — a `div` with `rounded-full bg-white/90` at `w-20 h-20`, with `blur-[2px]` and a yellow-tinted outer glow via `box-shadow: 0 0 60px 20px rgba(253,224,71,0.25)`
- Floating stars: use the existing `STAR_FIELD` approach but increase to 20 stars, vary animation delays with `animationDelay` style prop for a non-uniform twinkle effect
- Ground / forest floor hint: a very subtle SVG path at the bottom (just 3-4 rounded tree silhouettes at 10% opacity, drawn inline in JSX as `<svg>` with `fill="#0a1628"`)

### Footprint Trail (Phase 1)
- When `phase === 1`: render 5 small owl footprint icons (use emoji 🐾 or simple SVG circles) in a dotted, winding path from the left side of the SmallOwl toward the edge, each with staggered `animate-pulse` and decreasing opacity (first = 0.9, last = 0.2), suggesting the child walked AWAY from home
- Place them absolutely, offset diagonally below-left of the owl

### Glow Path Home (Phase 3)
- When `phase >= 3`: render a soft glowing dashed line in SVG (`stroke-dasharray="8 6"`, color `#fde047` at 60% opacity) arcing from the duo toward the CTA button below
- Animate the dash offset with `motion/react`: `strokeDashoffset: [0, -42]`, `repeat: Infinity`, duration 1.8s — creates a "flowing path" effect guiding the eye to the button

---

## Animation Details

### Phase Transitions (implement with motion/react AnimatePresence)
```tsx
// Phase 1 → 2 → 3 driven by useEffect + setTimeout
// Wrap each mascot/element in <AnimatePresence mode="wait">
// Use <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}> for each phase
```

### Parent Owl Fly-In (Phase 2 → Phase 3)
When the parent owl first appears (entering phase 2), animate it with:
```tsx
// Use motion/react m.div wrapping the Mascot
initial={{ x: 80, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ type: "spring", stiffness: 120, damping: 18, duration: 0.9 }}
```

### "404" Number Treatment
- The "404" digits are NOT plain text — render them as three large pill/card shapes using `<span>` with individual `<m.span>` wrappers
- Each digit: `text-8xl font-black` with gradient text (`bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400`)
- Each digit gets an `initial={{ opacity: 0, y: -30 }}` → `animate={{ opacity: 1, y: 0 }}` with a staggered delay: `delay: 0`, `delay: 0.12`, `delay: 0.24`
- Add a subtle drop shadow glow: `filter: drop-shadow(0 0 24px rgba(99,102,241,0.5))`

### Shimmer on CTA Button
The "Về trang chủ" button gets a shimmer sweep:
```css
/* In globals.css or inline keyframes via Tailwind arbitrary */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```
Apply via: `background: linear-gradient(90deg, #34d399, #22d3ee, #34d399); background-size: 200%; animation: shimmer 2.5s linear infinite;`

---

## Full Copywriting (Vietnamese)

### Phase 1 copy:
- **Error badge**: `Lỗi 404`
- **Headline**: `Ôi không! Cú Con đang lạc đường...`
- **Subtext**: `Bé cú đã bay nhầm vào một khu rừng tối. Đừng lo, Cú Mẹ đang trên đường đến rồi!`

### Phase 2 copy (transition, brief):
- **Subtext updates to**: `Ồ! Cú Mẹ nghe thấy tiếng kêu của con rồi! Đang bay đến...`

### Phase 3 copy (final state):
- **Headline**: `Cú Mẹ đã tìm thấy con! 🦉💛`
- **Subtext**: `Hai mẹ con Cú sẽ chỉ đường dẫn bạn trở về nhà. Đường dẫn bạn tìm không tồn tại, nhưng trang chủ thì luôn ở đây!`
- **CTA Button**: `🏠 Về trang chủ cùng Cú Mẹ`
- **Secondary link**: `← Quay lại trang trước` (use `router.back()` from `next/navigation`)

---

## Layout & Spacing

```
[Spacer 6vh]
[Error 404 badge — small pill, centered]
[404 digit treatment — large centered, staggered]
[Mascot scene — centered, 320px wide container]
  └─ Phase 1: SmallOwl only, sad, footprint trail
  └─ Phase 2: Parent owl flies in from right
  └─ Phase 3: Duo layout, both happy, glow path to button
[Headline h1 — centered, max 22ch wide]
[Subtext p — centered, max 52ch wide, phase-aware]
[CTA Button — rounded-full, shimmer green-to-teal]
[Secondary "go back" link — muted, text-sm]
[Spacer 6vh]
```

Total page: `min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-12 text-center`

---

## Technical Requirements

1. **File to modify only**: `src/app/not-found.tsx` — do NOT touch any other files
2. **`'use client'` directive is REQUIRED** — the phase state machine uses `useState` + `useEffect`
3. **Wrap animation elements in `LazyMotion`**: import `{ LazyMotion, domAnimation }` from `motion/react` and wrap the root with `<LazyMotion features={domAnimation}>` to keep the bundle lean
4. **Respect `useReducedMotion`**: import from `motion/react`, if `prefersReducedMotion` is true, skip phase transitions (jump directly to phase 3), remove all continuous animations
5. **Tree silhouettes**: inline SVG only, no external assets. Keep it under 20 lines of SVG code
6. **Moonlight glow**: pure CSS `div` with `border-radius: 50%` — no external images
7. **Run after**: `pnpm type-check` must pass with zero errors

---

## Quality Checklist

- [ ] Phase 1 renders correctly on initial load (SmallOwl, sad state, footprints trail)
- [ ] Phase 2 triggers at 3s: parent owl animates in from right
- [ ] Phase 3 triggers at 6s: switches to duo variant, both states, glow path visible
- [ ] With `prefers-reduced-motion: reduce`: jumps to phase 3 immediately, no continuous animation loops
- [ ] All copy is in Vietnamese with correct diacritics
- [ ] CTA button links to `/`, secondary link uses `router.back()`
- [ ] Page has proper `<title>` via Next.js metadata (export `metadata` or use `generateMetadata` — but since this is `not-found.tsx`, just ensure `<h1>` is present for SEO)
- [ ] `pnpm type-check` → zero errors

---

## Reference: Current `not-found.tsx` to Replace

```tsx
// Current: single SmallOwl, sad, space actionProp, static copy
// Headline: "Ôi không, bé vừa lạc vào hố đen vũ trụ."
// Theme: space/sci-fi
// → Replace entirely with the forest night + duo owl story above
```

The current space theme is replaced by a **mystical night forest** theme, consistent with the owl/nature brand identity of Cùng Con Tự Học.
