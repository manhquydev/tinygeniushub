import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 7: Hình tròn và vuông — Math, mascot: dad, activity: MULTIPLE_CHOICE
export const demoLessonHinhTronVuong: InteractiveLessonData = {
  id: "hinh-tron-vuong",
  title: "Hình tròn và vuông",
  mascotVariant: "dad",
  steps: [
    {
      type: "hook",
      mascot: { variant: "dad", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "dad", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "○ □",
      speech: "Hai hình này!",
      subtext: "Hình tròn và hình vuông",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "dad", state: "happy", gesture: "nodding" },
      keywords: ["đồng hồ ○", "sách □", "bánh ○"],
      speech: "Tìm xung quanh!",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "dad", state: "idle" },
      speech: "Con chọn nhé!",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Cái nào có hình tròn?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Cái nào có hình tròn?",
          options: ["quyển sách", "cái bảng", "quả bóng", "cái hộp"],
          correctIndex: 2,
          explanation: "Quả bóng có hình tròn",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "dad", state: "thinking", gesture: "thinking-scratch" },
      keyword: "○ □",
      speech: "Nhớ lại nào!",
      subtext: "Tròn = không có góc, vuông = 4 góc bằng nhau",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "dad", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
