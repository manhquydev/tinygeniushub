import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 3: Nghe âm /b/ — English phonics, mascot: dad, activity: MULTIPLE_CHOICE
export const demoLessonNgheAmB: InteractiveLessonData = {
  id: "nghe-am-b",
  title: "Nghe âm /b/",
  mascotVariant: "dad",
  steps: [
    {
      type: "hook",
      mascot: { variant: "dad", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/nghe-am-b/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "dad", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "/b/",
      speech: "Âm B này!",
      subtext: "Phát âm môi khép lại: 'b'",
      audioUrl: "/audio/lessons/nghe-am-b/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "dad", state: "happy", gesture: "nodding" },
      keywords: ["ball", "bat", "bus"],
      keywordsWithAudio: [
        { word: "ball", audioUrl: "/audio/lessons/nghe-am-b/kw-ball.mp3" },
        { word: "bat", audioUrl: "/audio/lessons/nghe-am-b/kw-bat.mp3" },
        { word: "bus", audioUrl: "/audio/lessons/nghe-am-b/kw-bus.mp3" },
      ],
      speech: "Nghe đây!",
      audioUrl: "/audio/lessons/nghe-am-b/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "dad", state: "idle" },
      speech: "Chọn đúng nhé!",
      audioUrl: "/audio/lessons/nghe-am-b/step-4-activity.mp3",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Từ nào bắt đầu bằng âm /b/?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Từ nào bắt đầu bằng âm /b/?",
          options: ["cat", "ball", "dog", "fish"],
          correctIndex: 1,
          explanation: "'ball' bắt đầu với âm /b/",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "dad", state: "thinking", gesture: "thinking-scratch" },
      keyword: "/b/",
      speech: "Nhớ lại nào!",
      subtext: "Âm /b/ như trong 'ball', 'bat'",
      audioUrl: "/audio/lessons/nghe-am-b/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "dad", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/nghe-am-b/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
