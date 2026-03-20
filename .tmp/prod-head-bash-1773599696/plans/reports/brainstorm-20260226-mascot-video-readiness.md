---
type: brainstorm
date: 2026-02-26
title: Mascot Animation & Video Production Readiness
---

# Tối Ưu Animation Nhân Vật Cho Video Học Tập

## Vấn Đề

Hệ thống mascot hiện có 5 nhân vật, 14 states, nhưng:
- 4 cặp state trùng biểu cảm (cùng eye+beak → nhìn giống nhau)
- Thiếu gestures giáo dục (pointing, waving, nodding)
- Thiếu action props giáo dục (writing, flashcard, trophy)
- Chỉ có loop animation — thiếu timeline/sequence cho kịch bản video
- Chưa có pipeline render SVG→MP4

## Quyết Định

| Câu hỏi | Quyết định |
|----------|-----------|
| Hướng sản xuất video | **Hybrid**: Remotion (SVG→MP4 chính xác) + AI (Veo 3.1 cho background/voiceover) |
| Ưu tiên animation | **Tất cả cùng lúc**: fix expressions + gestures + props |
| Kiểu animation | **Cả hai**: loop cho web + timeline/sequence cho video |

---

## Phân Tích Hiện Trạng

### Có sẵn ✓
- 5 nhân vật SVG React components (DadOwl, BigOwl, SisterOwl, SmallOwl, BabyOwl)
- 14 emotional states với body pose animation
- 6 eye variants, 4 beak variants
- 5 action props (reading, space, magic, heart, music)
- 3 motion levels (full, soft, minimal)
- Gaze direction (left, center, right)
- `motion/react` animation engine (Framer Motion v12)
- Skills available: `video-production`, `remotion`, `ai-multimodal`, `media-processing`

### Gaps Cần Fix

#### 1. Biểu Cảm Trùng (Critical)

4 cặp state chia sẻ cùng eye+beak → **nhìn y hệt nhau**:

| State A | State B | Cùng eye/beak |
|---------|---------|---------------|
| `surprised` | `celebrating` | star + cheer |
| `angry` | `sad` | sad + frown |
| `nervous` | `idle` | open + rest |
| `bored` | `sleepy` | sleep + rest |

**Fix:** Thêm eye/beak variants mới:

| Variant mới | Dùng cho | Mô tả SVG |
|-------------|----------|-----------|
| `wide` eye | surprised | Mắt tròn to hơn bình thường (r tăng 30%), pupil thu nhỏ |
| `angry` eye | angry | Lông mày xéo xuống (2 path chéo phía trên mắt) |
| `nervous` eye | nervous | Mắt hơi nhíu, sweat drop bên thái dương |
| `drowsy` eye | bored | Mắt nửa nhắm (khác sleep hoàn toàn nhắm) |
| `open-wide` beak | surprised | Mỏ mở tròn hình O |
| `grimace` beak | angry | Mỏ nghiến, đường ngang gấp khúc |

**Updated mapping:**
```
surprised: { eye: "wide", beak: "open-wide" }   // was star+cheer
angry:     { eye: "angry", beak: "grimace" }     // was sad+frown
nervous:   { eye: "nervous", beak: "rest" }      // was open+rest
bored:     { eye: "drowsy", beak: "rest" }       // was sleep+rest
```

#### 2. Gestures Giáo Dục (High)

Hiện tại cánh chỉ flap. Video dạy học CẦN:

| Gesture | Mô tả | Ưu tiên | Dùng khi |
|---------|--------|---------|----------|
| `pointing` | Cánh phải duỗi thẳng chỉ về phía trước | P0 | "Nhìn xem nào!" |
| `waving` | Cánh phải giơ lên vẫy | P0 | Chào/tạm biệt |
| `nodding` | Đầu gật lên xuống | P0 | Đúng rồi! |
| `head-shake` | Đầu lắc trái phải | P0 | Chưa đúng, thử lại |
| `clapping` | Hai cánh vỗ vào nhau | P1 | Ăn mừng |
| `thinking-scratch` | Cánh chạm đầu | P1 | Suy nghĩ nào... |
| `raise-hand` | Cánh giơ lên | P1 | "Em biết! Em biết!" |

**Architecture:** Thêm `gesture` prop mới, tách biệt khỏi `state`:
```ts
export type MascotGesture =
  | "none" | "pointing" | "waving" | "nodding"
  | "head-shake" | "clapping" | "thinking-scratch" | "raise-hand";
```
Gesture override wing paths + thêm head transform animation.

#### 3. Action Props Giáo Dục (High)

| Prop mới | Mô tả SVG | Dùng khi |
|----------|-----------|----------|
| `writing` | Bút chì + motion viết | Bài tập viết chữ/số |
| `drawing` | Cọ vẽ + vệt màu | Bài tập vẽ/tô màu |
| `flashcard` | Thẻ card có slot nội dung | Học từ vựng, số đếm |
| `pointing-stick` | Que chỉ bảng | Giảng bài |
| `trophy` | Cúp/huy chương | Hoàn thành bài |
| `magnifying-glass` | Kính lúp | Khám phá/tìm kiếm |

**Per-character positioning:** Fix `resolveBaseTarget` — thêm offset riêng cho sister/baby thay vì collapse về small.

#### 4. Timeline/Sequence Animation (Medium-High)

Hiện tại tất cả animation là `repeat: Infinity`. Video cần:

| Capability | Mô tả |
|-----------|--------|
| `entry` | Nhân vật bay/nhảy vào cảnh |
| `exit` | Nhân vật vẫy tay rời cảnh |
| `reaction` | One-shot: nhảy lên 1 lần khi đúng, lắc đầu 1 lần khi sai |
| `transition` | Chuyển từ state A → B mượt mà |
| `sequence` | Chain: entry → idle → pointing → reaction → exit |

**Architecture:** Thêm `animationMode` prop:
```ts
export type MascotAnimationMode = "loop" | "once" | "sequence";

// sequence mode
interface MascotSequenceStep {
  state: MascotState;
  gesture?: MascotGesture;
  duration: number; // frames (30fps)
  actionProp?: MascotActionProp;
}
```

Web dùng `loop` (default, backward compatible). Remotion dùng `once` hoặc `sequence`.

#### 5. Character-Specific Personality (Medium)

| Nhân vật | Animation riêng cần thêm |
|----------|-------------------------|
| DadOwl | Peer-over-glasses (pupil xuống dưới, kính hơi lệch) |
| SisterOwl | Spin 360° khi celebrating, ear tufts rung, bow wobble |
| BabyOwl | Stumble/toddle walk, beanie rơi lệch khi surprised, napping curl |
| BigOwl | Teacher lean-forward pose |
| SmallOwl | Raise-hand bounce, curious head-tilt |

---

## Giải Pháp Đề Xuất: Video Pipeline

### Stack

```
┌─────────────────────────────────────────────────┐
│             Script & Storyboard                  │
│   video-production skill → Gemini → markdown     │
├─────────────────────────────────────────────────┤
│               Assets Layer                       │
│   SVG Mascots (React) + AI Backgrounds (Veo)    │
│   + TTS Voiceover (Gemini) + Music (Lyria)      │
├─────────────────────────────────────────────────┤
│            Composition Layer                     │
│   Remotion: <Composition> + <Sequence>           │
│   Mascot components render frame-by-frame        │
│   Audio sync via useCurrentFrame()               │
├─────────────────────────────────────────────────┤
│              Render Layer                        │
│   Remotion CLI → MP4/WebM                        │
│   FFmpeg post-processing (captions, optimize)    │
└─────────────────────────────────────────────────┘
```

### Phân Chia Phase

| Phase | Nội dung | Effort | Priority |
|-------|---------|--------|----------|
| **A** | Fix 4 cặp biểu cảm trùng (thêm 6 eye/beak variants) | M | P0 |
| **B** | Thêm 7 gestures (pointing, waving, nodding, etc.) | L | P0 |
| **C** | Thêm 6 action props giáo dục | L | P1 |
| **D** | Timeline/sequence animation mode | M | P1 |
| **E** | Character-specific personality animations | M | P2 |
| **F** | Per-character ActionProp positioning | S | P1 |
| **G** | Install Remotion + setup compositions | M | P1 |
| **H** | AI pipeline (Veo background, TTS voiceover) | M | P2 |

### Dependency Flow

```
A (fix expressions) ──┐
B (gestures)      ────┼──→ D (timeline) ──→ G (Remotion) ──→ H (AI pipeline)
C (props)         ────┘         │
F (prop positioning) ───────────┘
E (personality) ── standalone, anytime
```

**Phases A + B + C + F** có thể parallel.
**Phase D** phụ thuộc A+B+C (cần biểu cảm/gesture mới để sequence).
**Phase G** phụ thuộc D (cần animation mode mới để render video).
**Phase H** sau G (cần Remotion hoạt động trước).

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SVG path complexity tăng → file size lớn | Medium | Mỗi character < 200 lines, modularize gestures riêng file |
| Remotion + motion/react conflict | High | Test compatibility early. Remotion dùng `useCurrentFrame()`, motion dùng CSS spring. Có thể cần adapter |
| Veo 3.1 output không consistent style | Medium | Dùng Veo chỉ cho background/effects, KHÔNG cho nhân vật. Nhân vật luôn SVG |
| Too many props → component bloat | Medium | Lazy-load props, code-split per prop component |

## Success Criteria

- [ ] 14 states đều có biểu cảm KHÁC BIỆT (nhìn thấy sự khác nhau)
- [ ] Mỗi nhân vật có ≥2 personality animations riêng
- [ ] Có ≥4 gestures hoạt động cho video (pointing, waving, nodding, head-shake)
- [ ] Có ≥3 action props giáo dục (writing, flashcard, trophy)
- [ ] Render được 1 video mẫu 30s từ Remotion với mascot animation
- [ ] Timeline mode: nhân vật entry → action → reaction → exit mượt mà
- [ ] TTS voiceover sync với animation timeline

## Câu Hỏi Chưa Giải Quyết

1. **Remotion version?** v4 (stable) hay v5 (mới)? Cần check compatibility với motion/react v12
2. **Video resolution?** 1080p (YouTube) hay 1920x1080 + 1080x1920 (cả TikTok)?
3. **Voiceover language?** Tiếng Việt only hay bilingual (Việt + English)?
4. **Template system?** Cần lesson template (intro→content→quiz→outro) hay tự do mỗi video?
