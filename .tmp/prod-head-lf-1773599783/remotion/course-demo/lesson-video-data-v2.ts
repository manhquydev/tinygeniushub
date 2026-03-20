import type { LessonVideoDataV2 } from "./lesson-phase-types";

// 7 English Phonics lessons using the 7-phase arc. Each lesson = 900 frames (30s).
// Phase frame allocation: hook=90, concept=120, demonstrate=210, your-turn=120, reinforce=180, celebrate=120, recap=60

export const lessonVideoDataV2: LessonVideoDataV2[] = [
  {
    id: "lesson-01",
    title: "Âm /a/ và /m/",
    mascotVariant: "big",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
        speech: "Chào con!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
        keyword: "Aa", subtext: "Âm /a/",
        speech: "Nhìn đây nào!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "idle", midState: "happy", gesture: "nodding", actionProp: "flashcard" },
        keyword: "apple", subtext: "/a/ - /a/ - apple",
        keywords: ["apple", "ant", "arm"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", midState: "thinking", gesture: "pointing" },
        speech: "Con thử nào!", soundProxy: "thinking",
        answerOptions: ["moon", "apple", "egg"], correctIndex: 1,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", midState: "happy", gesture: "nodding" },
        keyword: "apple", subtext: "Bắt đầu bằng /a/", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Giỏi lắm!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "Aa", speech: "Hẹn gặp lại!",
      },
    ],
  },
  {
    id: "lesson-02",
    title: "Điền chữ CVC",
    mascotVariant: "sister",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "right" },
        speech: "Học cùng chị!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "writing" },
        keyword: "CVC", subtext: "Phụ âm - Nguyên âm - Phụ âm",
        speech: "C - V - C!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "thinking", gesture: "nodding", actionProp: "writing" },
        keyword: "c_t", subtext: "Điền chữ vào chỗ trống",
        keywords: ["c_t", "d_g", "b_d"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Con điền thử!", soundProxy: "thinking",
        answerOptions: ["cat", "cot", "cut"], correctIndex: 0,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "writing" },
        keyword: "cat", subtext: "c + a + t = cat", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Giỏi lắm!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "CVC", speech: "Hẹn gặp lại!",
      },
    ],
  },
  {
    id: "lesson-03",
    title: "Nghe âm /b/",
    mascotVariant: "dad",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
        speech: "Bố dạy nhé!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "pointing-stick" },
        keyword: "Bb", subtext: "Âm /b/",
        speech: "Âm B này!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "pointing-stick" },
        keyword: "ball", subtext: "/b/ - /b/ - ball",
        keywords: ["ball", "bus", "book"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Con chọn nào!", soundProxy: "thinking",
        answerOptions: ["apple", "ball", "egg"], correctIndex: 1,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "pointing-stick" },
        keyword: "ball", subtext: "Bắt đầu bằng /b/", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Tuyệt vời!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "Bb", speech: "Hẹn gặp lại!",
      },
    ],
  },
  {
    id: "lesson-04",
    title: "Vần -at",
    mascotVariant: "small",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "excited", gesture: "waving", enterFrom: "bottom" },
        speech: "Học vần nào!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
        keyword: "-at", subtext: "Vần -at",
        speech: "Nhìn vần này!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "flashcard" },
        keyword: "cat", subtext: "c + at = cat",
        keywords: ["cat", "bat", "hat"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Con đọc thử!", soundProxy: "thinking",
        answerOptions: ["dog", "hat", "bed"], correctIndex: 1,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "flashcard" },
        keyword: "bat", subtext: "b + at = bat", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Xuất sắc!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "-at", speech: "Hẹn gặp lại!",
      },
    ],
  },
  {
    id: "lesson-05",
    title: "Âm ngắn /e/",
    mascotVariant: "duo",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
        speech: "Cùng học nào!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
        keyword: "Ee", subtext: "Âm /e/ ngắn",
        speech: "Âm E này!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "flashcard" },
        keyword: "egg", subtext: "/e/ - /e/ - egg",
        keywords: ["egg", "bed", "red"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Con chọn nào!", soundProxy: "thinking",
        answerOptions: ["apple", "cat", "egg"], correctIndex: 2,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "flashcard" },
        keyword: "bed", subtext: "Có âm /e/ ngắn", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Tuyệt lắm!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "Ee", speech: "Hẹn gặp lại!",
      },
    ],
  },
  {
    id: "lesson-06",
    title: "Blends và Digraphs",
    mascotVariant: "dad",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "proud", gesture: "waving", enterFrom: "left" },
        speech: "Khó hơn nào!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "magnifying-glass" },
        keyword: "sh", subtext: "2 chữ = 1 âm",
        speech: "Digraph này!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "thinking", gesture: "nodding", actionProp: "magnifying-glass" },
        keyword: "ship", subtext: "sh + ip = ship",
        keywords: ["sh", "ch", "th"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Con nhận ra!", soundProxy: "thinking",
        answerOptions: ["ship", "flag", "clock"], correctIndex: 0,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "magnifying-glass" },
        keyword: "chair", subtext: "ch + air = chair", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Thông minh!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "sh/ch/th", speech: "Hẹn gặp lại!",
      },
    ],
  },
  {
    id: "lesson-07",
    title: "Sight Words",
    mascotVariant: "big",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "excited", gesture: "waving", enterFrom: "right" },
        speech: "Ôn tổng kết!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "trophy" },
        keyword: "the", subtext: "Sight Words",
        speech: "Từ quan trọng!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "trophy" },
        keyword: "is", subtext: "Đọc ngay không cần đánh vần",
        keywords: ["the", "is", "and"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Đọc nhanh nào!", soundProxy: "thinking",
        answerOptions: ["the", "fly", "jump"], correctIndex: 0,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "trophy" },
        keyword: "and", subtext: "Sight word quan trọng", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping", actionProp: "trophy" },
        speech: "Chúc mừng!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "love", gesture: "waving" },
        keyword: "the, is, and", speech: "Cảm ơn con!",
      },
    ],
  },
];
