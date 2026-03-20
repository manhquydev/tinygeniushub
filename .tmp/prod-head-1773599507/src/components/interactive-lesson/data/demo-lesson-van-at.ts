import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 4: Vần -at — English phonics, mascot: small, activity: SORT_ORDER
export const demoLessonVanAt: InteractiveLessonData = {
  id: "van-at",
  title: "Vần -at",
  mascotVariant: "small",
  steps: [
    {
      type: "hook",
      mascot: { variant: "small", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/van-at/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "small", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "-at",
      speech: "Đây là vần AT",
      subtext: "Ghép phụ âm + at = từ mới",
      audioUrl: "/audio/lessons/van-at/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "small", state: "happy", gesture: "nodding" },
      keywords: ["cat", "bat", "hat"],
      keywordsWithAudio: [
        { word: "cat", audioUrl: "/audio/lessons/van-at/kw-cat.mp3" },
        { word: "bat", audioUrl: "/audio/lessons/van-at/kw-bat.mp3" },
        { word: "hat", audioUrl: "/audio/lessons/van-at/kw-hat.mp3" },
      ],
      speech: "Xem nào!",
      audioUrl: "/audio/lessons/van-at/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "small", state: "idle" },
      speech: "Sắp xếp nhé!",
      audioUrl: "/audio/lessons/van-at/step-4-activity.mp3",
      activity: {
        type: "SORT_ORDER",
        prompt: "Sắp xếp từ ngắn đến dài",
        spec: {
          type: "SORT_ORDER",
          items: ["flat", "at", "cat", "that"],
          correctOrder: [1, 2, 0, 3],
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "small", state: "thinking", gesture: "thinking-scratch" },
      keyword: "-at",
      speech: "Nhớ lại nào!",
      subtext: "cat, bat, hat, flat đều có vần -at",
      audioUrl: "/audio/lessons/van-at/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "small", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/van-at/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
