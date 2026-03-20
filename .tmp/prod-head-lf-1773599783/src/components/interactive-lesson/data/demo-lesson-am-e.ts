import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 5: Âm ngắn /e/ — English phonics, mascot: baby, activity: MULTIPLE_CHOICE
export const demoLessonAmE: InteractiveLessonData = {
  id: "am-e",
  title: "Âm ngắn /e/",
  mascotVariant: "baby",
  steps: [
    {
      type: "hook",
      mascot: { variant: "baby", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/am-e/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "baby", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "/e/",
      speech: "Âm E ngắn",
      subtext: "Phát âm: 'e' như trong 'egg'",
      audioUrl: "/audio/lessons/am-e/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "baby", state: "happy", gesture: "nodding" },
      keywords: ["egg", "bed", "pen"],
      keywordsWithAudio: [
        { word: "egg", audioUrl: "/audio/lessons/am-e/kw-egg.mp3" },
        { word: "bed", audioUrl: "/audio/lessons/am-e/kw-bed.mp3" },
        { word: "pen", audioUrl: "/audio/lessons/am-e/kw-pen.mp3" },
      ],
      speech: "Nghe nào!",
      audioUrl: "/audio/lessons/am-e/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "baby", state: "idle" },
      speech: "Con chọn nhé!",
      audioUrl: "/audio/lessons/am-e/step-4-activity.mp3",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Từ nào có âm /e/ ngắn?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Từ nào có âm /e/ ngắn?",
          options: ["eat", "egg", "ice", "open"],
          correctIndex: 1,
          explanation: "'egg' có âm /e/ ngắn ở đầu từ",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "baby", state: "thinking", gesture: "thinking-scratch" },
      keyword: "/e/",
      speech: "Nhớ lại nào!",
      subtext: "Âm /e/ ngắn: egg, bed, pen",
      audioUrl: "/audio/lessons/am-e/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "baby", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/am-e/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
