# Interactive Lesson Production Workflow

> Quy trình chuẩn hóa sản xuất bài giảng tương tác cho hệ thống Cùng Con Tự Học.
> Mỗi bài giảng = 6 bước tương tác + TTS audio + mascot animation.

## Tổng quan hệ thống

### Kiến trúc bài giảng

```
InteractiveLessonData
├── id: string (kebab-case, unique)
├── title: string
├── mascotVariant: "big" | "small" | "dad" | "sister" | "baby"
└── steps: InteractiveLessonStep[6]
    ├── [0] hook       — Chào hỏi, kéo sự chú ý
    ├── [1] concept    — Giới thiệu kiến thức mới
    ├── [2] demonstrate — Minh họa bằng ví dụ (keyword cards)
    ├── [3] activity   — Trắc nghiệm / tương tác
    ├── [4] reinforce  — Ôn tập (hiện khi trả lời sai)
    └── [5] celebrate  — Chúc mừng hoàn thành
```

### Flow tương tác của trẻ

```
hook → concept → demonstrate → activity
                                  │
                         ┌────────┴────────┐
                         │                 │
                      Đúng              Sai
                         │                 │
                         ▼                 ▼
                    celebrate ←── reinforce (ôn lại + thử lại)
                         │
                         ▼
                    Hoàn thành
```

### File structure

```
src/components/interactive-lesson/
├── data/
│   ├── index.ts                    # Export DEMO_LESSONS array
│   └── demo-lesson-{id}.ts        # Data file cho mỗi bài
├── interactive-lesson-types.ts     # TypeScript types
├── interactive-lesson-flow.tsx     # Flow orchestrator
├── use-interactive-lesson-state.ts # State machine
├── audio-player.tsx                # Hidden audio player
├── lesson-step-hook.tsx
├── lesson-step-concept.tsx
├── lesson-step-demonstrate.tsx
├── lesson-step-activity.tsx
├── lesson-step-reinforce.tsx
├── lesson-step-celebrate.tsx
├── interactive-keyword-cards.tsx   # Clickable keyword cards
├── interactive-keyword-display.tsx
├── interactive-speech-bubble.tsx
├── interactive-scene-background.tsx
├── interactive-celebration.tsx
└── index.ts

public/audio/lessons/{lesson-id}/
├── step-1-hook.mp3
├── step-2-concept.mp3
├── step-3-demonstrate.mp3
├── step-4-activity.mp3
├── step-5-reinforce.mp3
├── step-6-celebrate.mp3
├── kw-{word1}.mp3               # Per-keyword audio (demonstrate step)
├── kw-{word2}.mp3
└── kw-{word3}.mp3

scripts/
├── generate-lesson-audio.py     # TTS cho 6 step narration
└── generate-keyword-audio.py    # TTS cho per-keyword cards
```

---

## Quy trình sản xuất (Step-by-step)

### Phase 1: Thiết kế nội dung bài giảng

**Input:** Chủ đề bài học, nhóm tuổi, môn học
**Output:** Lesson data file (TypeScript)

#### 1.1 Xác định thông tin bài

| Field | Mô tả | Ví dụ |
|-------|--------|-------|
| `id` | Kebab-case, unique | `am-a`, `so-1-5`, `hinh-tron-vuong` |
| `title` | Tên bài (tiếng Việt) | `"Âm /a/ và /m/"` |
| `mascotVariant` | Nhân vật mascot | `"big"`, `"dad"`, `"sister"` |

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
- Mỗi card hiện khi audio keyword đó phát
- Sau khi tất cả card hiện, trẻ có thể click replay từng card

**Step 4 — Activity (Bài tập)**
```ts
{
  type: "activity",
  mascot: { variant: "big", state: "idle" },
  speech: "Con thử nhé!",
  audioUrl: "/audio/lessons/{id}/step-4-activity.mp3",
  activity: {
    type: "MULTIPLE_CHOICE",          // Loại activity
    prompt: "Từ nào có âm /a/?",
    spec: {
      type: "MULTIPLE_CHOICE",
      question: "Từ nào có âm /a/?",
      options: ["apple", "egg", "ice", "owl"],
      correctIndex: 0,                // Index đáp án đúng (0-based)
      explanation: "'apple' có âm /a/ ở đầu từ",
    },
    passCriteria: 1,                  // 0–1, tỉ lệ đúng để pass
  },
}
```
- Activity types: `MULTIPLE_CHOICE`, `FILL_BLANK`, `ORDERING`
- `correctIndex`: zero-based
- Trẻ bị disable options cho đến khi audio narration xong

**Step 5 — Reinforce (Ôn tập)**
```ts
{
  type: "reinforce",
  mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
  keyword: "/a/",
  speech: "Nhớ lại nào!",
  subtext: "Âm /a/ như trong 'ant', 'apple'",
  audioUrl: "/audio/lessons/{id}/step-5-reinforce.mp3",
}
```
- Chỉ hiện khi trẻ trả lời sai ở step 4
- Có thể kèm activity lại (tự lấy từ step 4 nếu không định nghĩa riêng)

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
- Speech dài hơn `speech` field trong data (speech bubble chỉ hiện 3–4 từ, TTS nói đầy đủ)
- Step context (cột 4) hướng dẫn giọng đọc cho AI

#### 2.2 Thêm keywords vào `scripts/generate-keyword-audio.py`

Nếu bài có demonstrate step với keyword cards:

```python
KEYWORD_AUDIO = {
    # ... existing
    "{lesson-id}": ["word1", "word2", "word3"],
}
```

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

# Authenticate với Google Cloud
gcloud auth login
```

#### 3.2 Generate audio

```bash
# Lấy access token (hết hạn sau ~1h, cần chạy lại khi expired)
export GCLOUD_TOKEN=$(gcloud auth print-access-token)

# Generate step narration audio (6 files/lesson)
python scripts/generate-lesson-audio.py

# Generate keyword audio (2-5 files/lesson)
python scripts/generate-keyword-audio.py
```

**Lưu ý:**
- Script tự skip file đã tồn tại (idempotent, chạy lại an toàn)
- Vertex AI rate limit: ~10 requests/phút, chờ 60s nếu gặp 429
- Mỗi lesson tạo 6 step MP3 + N keyword MP3
- Model: `gemini-2.5-flash-tts` (Vertex AI, GA)
- Voice: `Aoede` (warm female Vietnamese)

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
# kw-{word1}.mp3
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
| 2 | Concept: Keyword hiện lớn, subtext rõ, có nút replay audio | ☐ |
| 3 | Demonstrate: Cards hiện lần lượt sync với audio, click card phát lại đúng | ☐ |
| 4 | Activity: Options bị disable khi audio đang phát, chọn đáp án đúng → celebrate | ☐ |
| 5 | Activity sai: Mascot buồn, chờ 1.2s → mở lại options | ☐ |
| 6 | Reinforce: Hiện keyword + activity lại sau khi sai | ☐ |
| 7 | Celebrate: Confetti, audio chúc mừng, tự hoàn thành sau 3s | ☐ |
| 8 | Audio không bị chèn nhau giữa các step | ☐ |
| 9 | Thoát lesson: Parent gate dialog hoạt động | ☐ |

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
ssh do-server "cd /var/www/cungcontuhoc && git pull && pnpm install && pnpm build && pm2 restart cungcontuhoc"
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
   activity, speech)
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
| Generate audio | Chạy script CLI | CI/CD pipeline + queue |
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

### Mascot states

`idle`, `happy`, `thinking`, `celebrating`, `sad`, `sleepy`, `surprised`

### Mascot gestures

`waving`, `pointing`, `nodding`, `clapping`, `thinking-scratch`

### Mascot action props

`none`, `pointing-stick`, `flashcard`, `trophy`, `magnifying-glass`, `drawing`, `writing`

### Activity types

| Type | Mô tả | Spec fields |
|------|--------|-------------|
| `MULTIPLE_CHOICE` | Chọn 1 đáp án đúng | `question`, `options[]`, `correctIndex`, `explanation` |
| `FILL_BLANK` | Điền vào chỗ trống | `sentence`, `blanks[]`, `correctAnswers[]` |
| `ORDERING` | Sắp xếp thứ tự | `items[]`, `correctOrder[]` |

### TTS configuration

| Config | Value |
|--------|-------|
| Model | `gemini-2.5-flash-tts` (Vertex AI GA) |
| Voice | `Aoede` (warm female) |
| Project | `project-ee27e1d4-eab0-406a-a19` |
| Region | `us-central1` |
| Rate limit | ~10 RPM (Vertex AI) |
| Auth | `gcloud auth print-access-token` → `GCLOUD_TOKEN` env |
| Output | WAV → ffmpeg → MP3 (libmp3lame, qscale 4) |

### Naming conventions

| Asset | Pattern | Ví dụ |
|-------|---------|-------|
| Lesson data file | `demo-lesson-{id}.ts` | `demo-lesson-am-a.ts` |
| Step audio | `step-{N}-{type}.mp3` | `step-1-hook.mp3` |
| Keyword audio | `kw-{word}.mp3` | `kw-ant.mp3` |
| Audio directory | `public/audio/lessons/{id}/` | `public/audio/lessons/am-a/` |
| Export variable | `demoLesson{PascalCase}` | `demoLessonAmA` |
