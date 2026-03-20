import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 6: Số 1 đến 5 — Math, mascot: big, activity: MULTIPLE_CHOICE
export const demoLessonSo15: InteractiveLessonData = {
  id: "so-1-5",
  title: "Số 1 đến 5",
  mascotVariant: "big",
  steps: [
    {
      type: "hook",
      mascot: { variant: "big", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/so-1-5/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "big", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "1 2 3 4 5",
      speech: "Đếm từ 1 đến 5",
      subtext: "Mỗi số ứng với một số lượng",
      audioUrl: "/audio/lessons/so-1-5/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "big", state: "happy", gesture: "nodding" },
      keywords: ["1 táo", "3 bóng", "5 sao"],
      speech: "Xem đây!",
      audioUrl: "/audio/lessons/so-1-5/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "big", state: "idle" },
      speech: "Con đếm nhé!",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Có mấy chấm tròn? ● ● ●",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Có mấy chấm tròn? ● ● ●",
          options: ["2", "3", "4", "5"],
          correctIndex: 1,
          explanation: "Đếm: một, hai, ba — có 3 chấm tròn",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
      keyword: "1 2 3 4 5",
      speech: "Nhớ lại nào!",
      subtext: "Đếm chậm và chỉ vào từng vật",
      audioUrl: "/audio/lessons/so-1-5/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "big", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/so-1-5/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
