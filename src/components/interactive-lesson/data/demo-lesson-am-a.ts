import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 1: Âm /a/ và /m/ — English phonics, mascot: big, activity: MULTIPLE_CHOICE
export const demoLessonAmA: InteractiveLessonData = {
  id: "am-a",
  title: "Âm /a/ và /m/",
  mascotVariant: "big",
  steps: [
    {
      type: "hook",
      mascot: { variant: "big", state: "happy", gesture: "waving" },
      speech: "Chào con!",
      audioUrl: "/audio/lessons/am-a/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "big", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "/a/",
      speech: "Đây là âm A",
      subtext: "Phát âm: 'a' như trong 'ant'",
      audioUrl: "/audio/lessons/am-a/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "big", state: "happy", gesture: "nodding" },
      keywords: ["ant", "apple", "map"],
      keywordsWithAudio: [
        { word: "ant", audioUrl: "/audio/lessons/am-a/kw-ant.mp3" },
        { word: "apple", audioUrl: "/audio/lessons/am-a/kw-apple.mp3" },
        { word: "map", audioUrl: "/audio/lessons/am-a/kw-map.mp3" },
      ],
      speech: "Nghe nào!",
      audioUrl: "/audio/lessons/am-a/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "big", state: "idle" },
      speech: "Con thử nhé!",
      audioUrl: "/audio/lessons/am-a/step-4-activity.mp3",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Từ nào có âm /a/?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Từ nào có âm /a/?",
          options: ["apple", "egg", "ice", "owl"],
          correctIndex: 0,
          explanation: "'apple' có âm /a/ ở đầu từ",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
      keyword: "/a/",
      speech: "Nhớ lại nào!",
      subtext: "Âm /a/ như trong 'ant', 'apple'",
      audioUrl: "/audio/lessons/am-a/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "big", state: "celebrating", gesture: "clapping" },
      speech: "Giỏi lắm!",
      audioUrl: "/audio/lessons/am-a/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
