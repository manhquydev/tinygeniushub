# Interactive Lesson Production Workflow

> Quy trình chuẩn hóa sản xuất bài giảng tương tác cho hệ thống TinyGenius Hub.
> Mỗi bài giảng = 6 bước tương tác + TTS audio + mascot animation.

## Tổng quan hệ thống

### Kiến trúc bài giảng

```
InteractiveLessonData
├── id: string (kebab-case, unique, trùng với tên thư mục audio)
├── title: string
├── mascotVariant: MascotVariant (mặc định cho bài, step-level ghi đè)
└── steps: InteractiveLessonStep[] (convention: 6 steps, không bắt buộc bởi TypeScript)
    ├── [0] hook       — Chào hỏi, kéo sự chú ý
    ├── [1] concept    — Giới thiệu kiến thức mới
    ├── [2] demonstrate — Minh họa bằng ví dụ (keyword cards)
    ├── [3] activity   — Trắc nghiệm / tương tác
    ├── [4] reinforce  — Ôn tập (chỉ hiện khi trả lời sai, bị skip trong flow bình thường)
    └── [5] celebrate  — Chúc mừng hoàn thành
```

> **Lưu ý:** `mascotVariant` ở cấp lesson là giá trị mặc định/gợi ý. Giá trị thực sự render đến từ `step.mascot.variant` trong mỗi step. Nếu hai giá trị khác nhau, step-level thắng.

### Flow tương tác của trẻ

```
hook → concept → demonstrate → activity
                                  │
                         ┌────────┴────────┐
                         │                 │
                      Đúng              Sai (retry < 3)
                         │                 │
                         │                 ▼
                         │         reinforce (ôn lại + thử lại)
                         │                 │
                         │           ┌─────┴─────┐
                         │        Đúng        Sai (lặp lại, tối đa 3 lần)
                         │           │            │
                         ▼           ▼            ▼
                    celebrate ◄──────┘     celebrate (sau 3 lần sai,
                         │                  tự chuyển dù chưa đúng)
                         ▼
                    Hoàn thành
```

**State machine (`use-interactive-lesson-state.ts`):**
- `retryCount` tăng mỗi lần sai, reset về 0 khi đúng hoặc khi `advanceStep`
- `needsReinforce = retryCount < 3` → sau 3 lần sai, trẻ tự chuyển celebrate
- `advanceStep` tự động skip step có `type === "reinforce"` trong flow bình thường
- Reinforce step tái sử dụng `activity` từ step 4 nếu reinforce step không có `activity` riêng
- Nếu cả reinforce lẫn activity step đều không có `activity` spec → reinforce render `null` (cần tránh)

### Chế độ Preview vs Production

| | Preview (`previewMode={true}`) | Production |
|--|------|------|
| API completion | Không gọi | POST `/api/lessons/{id}/complete` |
| Payload | — | `{ childId, quizScore, minutesLearned: 3, checklist: ["interactive_done"], useExtendedRetention: true }` |
| Lưu ý | Dùng ở `/interactive-lesson-preview` | `minutesLearned` hardcoded = 3, chưa đo thời gian thực |

### Hệ thống âm thanh

**TTS Audio** (từ MP3 files):
- `AudioPlayer` component: hidden `<audio>` element, auto-play, fire `onEnd` callback
- Nếu `audioUrl` trống/undefined → `onEnd` fire sau 100ms (step không bị block)
- Nếu MP3 load lỗi (404) → fallback timer 2s rồi `onEnd` (lesson vẫn tiến, không block)

**Sound effects** (`synth` từ `src/lib/audio-utils.ts`, dùng Web Audio API):
- `synth.playYay()` — correct answer + celebrate step (major C arpeggio)
- `synth.playBzz()` — wrong answer (sawtooth error buzz)
- `synth.playPop()` — card reveal, button tap
- `synth.playTing()` — continue button click

**Keyword card fallback** (khi không có MP3):
- Dùng `window.speechSynthesis` (Web Speech API)
- Tự detect ngôn ngữ: Vietnamese diacritics → `vi-VN`, else → `en-US`
- `rate: 0.7` (chậm cho trẻ), `pitch: 1.1`

### Parent gate dialog

Nút X (thoát lesson) mở `ParentGateDialog` — trẻ không thể tự thoát. Phụ huynh phải xác nhận qua dialog trước khi đóng lesson. Đây là tính năng child-proofing có chủ đích.

### File structure

```
src/components/interactive-lesson/
├── data/
│   ├── index.ts                    # Export DEMO_LESSONS array
│   └── demo-lesson-{id}.ts        # Data file cho mỗi bài
├── interactive-lesson-types.ts     # TypeScript types
├── interactive-lesson-flow.tsx     # Flow orchestrator
├── use-interactive-lesson-state.ts # State machine (retryCount, needsReinforce)
├── audio-player.tsx                # Hidden audio player (onEndRef pattern)
├── lesson-step-hook.tsx
├── lesson-step-concept.tsx
├── lesson-step-demonstrate.tsx
├── lesson-step-activity.tsx
├── lesson-step-reinforce.tsx
├── lesson-step-celebrate.tsx
├── interactive-keyword-cards.tsx   # Clickable keyword cards (MP3 + Web Speech fallback)
├── interactive-keyword-display.tsx
├── interactive-speech-bubble.tsx
├── interactive-scene-background.tsx
├── interactive-celebration.tsx
└── index.ts

public/audio/lessons/{lesson-id}/
├── step-1-hook.mp3                 # Filename 1-based, array index 0-based
├── step-2-concept.mp3
├── step-3-demonstrate.mp3
├── step-4-activity.mp3
├── step-5-reinforce.mp3
├── step-6-celebrate.mp3
├── kw-{word1}.mp3                  # Per-keyword audio (demonstrate step)
├── kw-{word2}.mp3
└── kw-{word3}.mp3

scripts/
├── generate-lesson-audio.py        # TTS cho 6 step narration
└── generate-keyword-audio.py       # TTS cho per-keyword cards
```

---

## Quy trình sản xuất (Step-by-step)

### Phase 1: Thiết kế nội dung bài giảng

**Input:** Chủ đề bài học, nhóm tuổi, môn học
**Output:** Lesson data file (TypeScript)

#### 1.1 Xác định thông tin bài

| Field | Mô tả | Ví dụ |
|-------|--------|-------|
| `id` | Kebab-case, unique, trùng tên thư mục audio | `am-a`, `so-1-5`, `hinh-tron-vuong` |
| `title` | Tên bài (tiếng Việt) | `"Âm /a/ và /m/"` |
| `mascotVariant` | Nhân vật mascot mặc định | `"big"`, `"dad"`, `"sister"` |

#### 1.2 Soạn nội dung 6 bước

Mỗi bước cần:

**Step 1 — Hook (Chào hỏi)**
```ts
{
  type: "hook",
  mascot: { variant: "big", state: "happy", gesture: "waving" },
  speech: "Chào con!",               // Max 4 từ, hiện speech bubble
  audioUrl: "/audio/lessons/{id}/step-1-hook.mp3",
  autoAdvanceMs: 2500,                // Tự chuyển sau 2.5s (sau khi audio kết thúc)
}
```
- `speech`: Ngắn gọn, thân thiện
- `autoAdvanceMs`: Nên 2000–3000ms

**Step 2 — Concept (Giới thiệu)**
```ts
{
  type: "concept",
  mascot: { variant: "big", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
  keyword: "/a/",                     // Từ khóa chính, hiện lớn giữa màn
  speech: "Đây là âm A",             // Speech bubble
  subtext: "Phát âm: 'a' như trong 'ant'",  // Dòng phụ dưới keyword
  audioUrl: "/audio/lessons/{id}/step-2-concept.mp3",
}
```
- `keyword`: 1–3 từ, font lớn
- `subtext`: Giải thích ngắn
- Có nút speaker replay (phát lại audio)

**Step 3 — Demonstrate (Minh họa)**
```ts
{
  type: "demonstrate",
  mascot: { variant: "big", state: "happy", gesture: "nodding" },
  keywords: ["ant", "apple", "map"],  // Các keyword card sẽ hiện lần lượt
  keywordsWithAudio: [                // Audio sync cho từng card
    { word: "ant", audioUrl: "/audio/lessons/{id}/kw-ant.mp3" },
    { word: "apple", audioUrl: "/audio/lessons/{id}/kw-apple.mp3" },
    { word: "map", audioUrl: "/audio/lessons/{id}/kw-map.mp3" },
  ],
  speech: "Nghe nào!",
  audioUrl: "/audio/lessons/{id}/step-3-demonstrate.mp3",  // Intro narration
}
```
- 2–5 keyword cards
- Flow: intro audio → card-by-card (card hiện khi audio keyword phát) → done
- Card taps bị disable khi audio đang phát (tránh chèn âm)
- Sau khi tất cả card hiện (phase "done"), trẻ có thể click replay từng card
- Nếu không có `keywordsWithAudio`, fallback timer 1.5s/card

**Step 4 — Activity (Bài tập)**
```ts
{
  type: "activity",
  mascot: { variant: "big", state: "idle" },
  speech: "Con thử nhé!",
  audioUrl: "/audio/lessons/{id}/step-4-activity.mp3",
  activity: {
    type: "MULTIPLE_CHOICE",          // Loại activity (xem bảng đầy đủ ở phần Tham chiếu)
    prompt: "Từ nào có âm /a/?",
    spec: {
      type: "MULTIPLE_CHOICE",
      question: "Từ nào có âm /a/?",
      options: ["apple", "egg", "ice", "owl"],
      correctIndex: 0,                // Index đáp án đúng (0-based)
      explanation: "'apple' có âm /a/ ở đầu từ",
    },
    passCriteria: 1,                  // 0–1 (hiện tại chưa dùng bởi state machine)
  },
}
```
- `correctIndex`: zero-based
- Options bị disable khi audio narration chưa xong
- Đúng: mascot `celebrating`, sound `playYay()`, chuyển celebrate sau 1.2s
- Sai: mascot `sad`, sound `playBzz()`, chờ 1.2s → mở lại options
- Tối đa 3 lần sai → tự chuyển celebrate (không loop vô hạn)

**Step 5 — Reinforce (Ôn tập)**
```ts
{
  type: "reinforce",
  mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
  keyword: "/a/",
  speech: "Nhớ lại nào!",
  subtext: "Âm /a/ như trong 'ant', 'apple'",
  audioUrl: "/audio/lessons/{id}/step-5-reinforce.mp3",
  // activity: { ... }  // Optional: nếu không có, tự lấy từ step 4
}
```
- Chỉ hiện khi trẻ trả lời sai ở step 4 (tối đa 3 lần)
- Hiện keyword 1.5s → hiện activity (tái sử dụng từ step 4 nếu không định nghĩa riêng)
- **Quan trọng:** Nếu reinforce step KHÔNG có `activity` và step 4 cũng không có → component render `null`. Luôn đảm bảo ít nhất step 4 có `activity`.

**Step 6 — Celebrate (Chúc mừng)**
```ts
{
  type: "celebrate",
  mascot: { variant: "big", state: "celebrating", gesture: "clapping" },
  speech: "Giỏi lắm!",
  audioUrl: "/audio/lessons/{id}/step-6-celebrate.mp3",
  autoAdvanceMs: 3000,
}
```
- Sound `playYay()` + confetti animation
- Tự chuyển sau `autoAdvanceMs` (mặc định 3000ms)

#### 1.3 Tạo data file

Tạo file: `src/components/interactive-lesson/data/demo-lesson-{id}.ts`

```ts
import type { InteractiveLessonData } from "../interactive-lesson-types";

export const demoLesson{PascalCase}: InteractiveLessonData = {
  id: "{id}",
  title: "{title}",
  mascotVariant: "{variant}",
  steps: [
    // ... 6 steps như trên
  ],
};
```

#### 1.4 Đăng ký vào danh sách

Thêm vào `src/components/interactive-lesson/data/index.ts`:

```ts
import { demoLesson{PascalCase} } from "./demo-lesson-{id}";

export const DEMO_LESSONS: InteractiveLessonData[] = [
  // ... existing lessons
  demoLesson{PascalCase},  // ← thêm
];
```

---

### Phase 2: Soạn TTS script

**Input:** Lesson data file từ Phase 1
**Output:** TTS script entries trong Python scripts

#### 2.1 Thêm lesson vào `scripts/generate-lesson-audio.py`

Thêm entry vào mảng `LESSONS`:

```python
{
    "id": "{lesson-id}",
    "title": "{title}",
    "steps": [
        (1, "hook", "Chào con! Hôm nay mình học {chủ đề} nhé!", "greet warmly"),
        (2, "concept", "{Nội dung giảng dạy chi tiết...}", "slow clear teaching"),
        (3, "demonstrate", "{Ví dụ minh họa...}", "demonstrate clearly"),
        (4, "activity", "{Hướng dẫn làm bài...}", "encouraging prompt"),
        (5, "reinforce", "{Ôn tập kiến thức...}", "gentle review"),
        (6, "celebrate", "{Lời khen ngợi...}", "enthusiastic celebration"),
    ],
},
```

**Nguyên tắc viết TTS script:**
- Nói chậm, rõ ràng, thân thiện
- Giọng cô giáo mầm non Việt Nam
- Speech trong Python dài hơn `speech` field trong TS data (speech bubble chỉ hiện 3–4 từ, TTS nói đầy đủ hơn)
- Step context (cột 4) hướng dẫn giọng đọc cho AI

#### 2.2 Thêm keywords vào `scripts/generate-keyword-audio.py`

Nếu bài có demonstrate step với keyword cards:

```python
KEYWORD_AUDIO = {
    # ... existing
    "{lesson-id}": ["word1", "word2", "word3"],
}
```

> **Lưu ý:** Nếu bài không có entry trong `KEYWORD_AUDIO` (ví dụ `so-1-5`, `hinh-tron-vuong`), keyword cards sẽ fallback sang Web Speech API khi trẻ click. Nên thêm entry cho tất cả bài có `keywordsWithAudio`.

---

### Phase 3: Generate TTS Audio

**Input:** Python scripts đã cập nhật
**Output:** MP3 files trong `public/audio/lessons/{id}/`

#### 3.1 Prerequisites

```bash
# Python packages (dùng venv của skills)
pip install google-genai google-auth

# ffmpeg (để convert WAV → MP3)
# Windows: winget install Gyan.FFmpeg
# Linux: sudo apt install ffmpeg
# Script fallback: nếu FFMPEG_PATH hardcoded không tồn tại, dùng "ffmpeg" từ PATH

# Authenticate với Google Cloud
gcloud auth login
```

#### 3.2 Generate audio

```bash
# Lấy access token (hết hạn sau ~1h)
export GCLOUD_TOKEN=$(gcloud auth print-access-token)

# Generate step narration audio (6 files/lesson)
python scripts/generate-lesson-audio.py

# Generate keyword audio (2-5 files/lesson)
python scripts/generate-keyword-audio.py
```

**Xử lý lỗi và retry:**
- Script tự skip file đã tồn tại (idempotent, chạy lại an toàn)
- **429 Rate limit (~10 RPM):** Script KHÔNG tự retry — in `[ERR]` rồi tiếp tục. Chờ 60s rồi chạy lại script (file đã có sẽ skip).
- **401 Token expired:** Chạy lại `export GCLOUD_TOKEN=$(gcloud auth print-access-token)` rồi re-run script.
- **Workflow khuyến nghị cho batch lớn:** Chạy script → kiểm tra `[ERR]` → chờ 60s → chạy lại → lặp cho đến hết `[ERR]`.

**Thông số kỹ thuật:**
- Model: `gemini-2.5-flash-tts` (Vertex AI, GA)
- Voice: `Aoede` (warm female Vietnamese)
- Output: PCM/WAV → ffmpeg → MP3 (libmp3lame, qscale 4)
- File size trung bình: 30–90 KB/file

#### 3.3 Verify output

```bash
# Kiểm tra tất cả file đã tạo
ls -la public/audio/lessons/{lesson-id}/

# Expected output:
# step-1-hook.mp3
# step-2-concept.mp3
# step-3-demonstrate.mp3
# step-4-activity.mp3
# step-5-reinforce.mp3
# step-6-celebrate.mp3
# kw-{word1}.mp3  (nếu có keywordsWithAudio)
# kw-{word2}.mp3
# kw-{word3}.mp3
```

---

### Phase 4: Kiểm tra & QA

#### 4.1 Type check

```bash
npx tsc --noEmit
# Phải 0 errors
```

#### 4.2 Preview trên local

```bash
pnpm dev
# Mở http://localhost:3000/interactive-lesson-preview
# Chọn bài mới, click "Bắt đầu"
```

#### 4.3 QA checklist

| # | Kiểm tra | Pass |
|---|----------|------|
| 1 | Hook: Audio phát, speech bubble hiện, tự chuyển sau autoAdvanceMs | ☐ |
| 2 | Concept: Keyword hiện lớn, subtext rõ, có nút replay audio (speaker icon) | ☐ |
| 3 | Demonstrate: Cards hiện lần lượt sync với audio, card taps disabled khi audio đang phát | ☐ |
| 4 | Demonstrate done: Click card phát lại đúng keyword audio | ☐ |
| 5 | Activity: Options bị disable khi audio đang phát, chọn đáp án đúng → celebrate | ☐ |
| 6 | Activity sai: Mascot buồn, sound bzz, chờ 1.2s → mở lại options | ☐ |
| 7 | Activity sai 3 lần: Tự chuyển celebrate (không loop vô hạn) | ☐ |
| 8 | Reinforce: Hiện keyword 1.5s → activity lại sau khi sai | ☐ |
| 9 | Celebrate: Confetti, sound yay, audio chúc mừng, tự hoàn thành sau autoAdvanceMs | ☐ |
| 10 | Audio không bị chèn nhau giữa các step | ☐ |
| 11 | Thoát lesson: Parent gate dialog hoạt động (trẻ không tự thoát được) | ☐ |
| 12 | Nếu MP3 file thiếu: lesson vẫn tiến (fallback 2s auto-advance) | ☐ |

#### 4.4 E2E test

```bash
npx playwright test tests/e2e/interactive-lesson-preview.spec.ts
```

---

### Phase 5: Deploy

```bash
# Commit
git add src/components/interactive-lesson/data/ public/audio/lessons/ scripts/
git commit -m "feat(lesson): add interactive lesson {id} - {title}"
git push origin main

# Deploy to VPS
ssh do-server "cd /var/www/tinygeniushub && git pull && pnpm install && pnpm build && pm2 restart tinygeniushub-web"

# Nếu build bị OOM (4GB RAM server):
ssh do-server "pm2 stop tinygeniushub-web"
ssh do-server "cd /var/www/tinygeniushub && git pull && pnpm install && pnpm build"
ssh do-server "pm2 start tinygeniushub-web"
```

---

## Quy trình sản xuất hàng loạt

### Batch production pipeline

```
[Spreadsheet/CMS]          [Python Scripts]           [Build & Deploy]
     │                          │                          │
     ▼                          ▼                          ▼
1. Soạn nội dung          3. Generate TTS           5. Type check
   (chủ đề, keywords,        audio batch               + E2E test
   activity, speech)      (chạy lại nếu 429)
                           4. Generate keyword       6. Deploy
2. Export → TS data           audio batch
   files (có thể tự
   động hóa)
```

### Khi scale lên, cần tự động hóa:

| Bước | Hiện tại (manual) | Tự động hóa (tương lai) |
|------|-------------------|------------------------|
| Soạn nội dung | Viết TS file thủ công | CMS/Spreadsheet → JSON → TS codegen |
| TTS script | Thêm vào Python array | Đọc trực tiếp từ data files |
| Generate audio | Chạy script CLI + retry | CI/CD pipeline + queue + auto-retry |
| QA | Manual preview | Automated E2E per lesson |
| Deploy | SSH command | Git push → auto-deploy |

### Ước lượng thời gian sản xuất

| Task | Thời gian/bài | Batch 10 bài |
|------|---------------|--------------|
| Soạn nội dung | 15–30 phút | 3–5 giờ |
| Cập nhật scripts | 5 phút | 50 phút |
| Generate TTS | 2–3 phút (auto) | 20–30 phút |
| QA + fix | 10–15 phút | 2–3 giờ |
| **Tổng** | **~45–60 phút** | **~6–9 giờ** |

---

## Tham chiếu kỹ thuật

### Mascot variants

| Variant | Mô tả | Dùng cho |
|---------|--------|----------|
| `big` | Cú lớn (chính) | Phonics, toán cơ bản |
| `small` | Cú nhỏ | Bài nhẹ nhàng |
| `dad` | Cú bố | Toán, khoa học |
| `sister` | Cú chị | Nghệ thuật, sáng tạo |
| `baby` | Cú bé | Bài cho trẻ nhỏ nhất |
| `duo` | Cú lớn + cú nhỏ | Bài tương tác đôi (cần thêm `parentState`, `childState`) |
| `family` | Cả gia đình cú | Bài đặc biệt (cần thêm `dadState`, `sisterState`, `babyState`) |

### Mascot states (14)

`idle`, `happy`, `thinking`, `celebrating`, `sad`, `sleepy`, `playful`, `proud`, `love`, `surprised`, `excited`, `nervous`, `angry`, `bored`

### Mascot gestures (8)

`none`, `pointing`, `waving`, `nodding`, `head-shake`, `clapping`, `thinking-scratch`, `raise-hand`

### Mascot action props (12)

`none`, `pointing-stick`, `flashcard`, `trophy`, `magnifying-glass`, `drawing`, `writing`, `reading`, `space`, `magic`, `heart`, `music`

### Activity types (8)

| Type | Mô tả | Spec fields |
|------|--------|-------------|
| `MULTIPLE_CHOICE` | Chọn 1 đáp án đúng | `question`, `options: string[]`, `correctIndex: number`, `explanation?: string` |
| `TRUE_FALSE` | Đúng/Sai | `statement`, `isTrue: boolean`, `explanation?: string` |
| `FILL_BLANK` | Điền vào chỗ trống | `sentence`, `answer: string`, `hint?: string` |
| `MATCH_PAIRS` | Nối cặp | `pairs: { left, right }[]` |
| `SORT_ORDER` | Sắp xếp thứ tự | `items: string[]`, `correctOrder: number[]` |
| `LISTEN_IDENTIFY` | Nghe và nhận diện | (spec tùy implementation) |
| `DRAG_DROP` | Kéo thả | (spec tùy implementation) |
| `DRAWING` | Vẽ | (spec tùy implementation) |

### TTS configuration

| Config | Value |
|--------|-------|
| Model | `gemini-2.5-flash-tts` (Vertex AI GA) |
| Voice | `Aoede` (warm female) |
| Project | `project-ee27e1d4-eab0-406a-a19` |
| Region | `us-central1` |
| Rate limit | ~10 RPM (Vertex AI), script không tự retry |
| Auth | `gcloud auth print-access-token` → `GCLOUD_TOKEN` env (hết hạn ~1h) |
| Output | PCM/WAV → ffmpeg → MP3 (libmp3lame, qscale 4) |
| File size | ~30–90 KB/file |

### Naming conventions

| Asset | Pattern | Ví dụ |
|-------|---------|-------|
| Lesson data file | `demo-lesson-{id}.ts` | `demo-lesson-am-a.ts` |
| Step audio | `step-{N}-{type}.mp3` (N = 1-based) | `step-1-hook.mp3` |
| Keyword audio | `kw-{word}.mp3` | `kw-ant.mp3` |
| Audio directory | `public/audio/lessons/{id}/` | `public/audio/lessons/am-a/` |
| Export variable | `demoLesson{PascalCase}` | `demoLessonAmA` |

> **Cẩn thận:** Audio filename dùng numbering 1-based (`step-1`), trong khi `steps[]` array trong TypeScript là 0-indexed. Không nhầm lẫn khi mapping.
