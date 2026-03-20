import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 2: Điền chữ CVC — English phonics, mascot: sister, activity: FILL_BLANK
export const demoLessonDienChuCvc: InteractiveLessonData = {
  id: "dien-chu-cvc",
  title: "Điền chữ CVC",
  mascotVariant: "sister",
  steps: [
    {
      type: "hook",
      mascot: { variant: "sister", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "sister", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "CVC",
      speech: "Cấu trúc CVC",
      subtext: "Phụ âm - Nguyên âm - Phụ âm",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "sister", state: "happy", gesture: "nodding" },
      keywords: ["cat", "bed", "sit"],
      keywordsWithAudio: [
        { word: "cat", audioUrl: "/audio/lessons/dien-chu-cvc/kw-cat.mp3" },
        { word: "bed", audioUrl: "/audio/lessons/dien-chu-cvc/kw-bed.mp3" },
        { word: "sit", audioUrl: "/audio/lessons/dien-chu-cvc/kw-sit.mp3" },
      ],
      speech: "Ví dụ nào!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "sister", state: "idle", actionProp: "writing" },
      speech: "Con điền nhé!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-4-activity.mp3",
      activity: {
        type: "FILL_BLANK",
        prompt: "Điền vào chỗ trống",
        spec: {
          type: "FILL_BLANK",
          sentence: "c_t",
          answer: "a",
          hint: "Nguyên âm giữa là /a/",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "sister", state: "thinking", gesture: "thinking-scratch" },
      keyword: "CVC",
      speech: "Nhớ lại nào!",
      subtext: "Phụ âm - Nguyên âm - Phụ âm",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "sister", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
