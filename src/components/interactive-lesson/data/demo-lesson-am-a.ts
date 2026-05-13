import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 1: Sounds /a/ and /m/ — English phonics, mascot: big, activity: MULTIPLE_CHOICE
export const demoLessonAmA: InteractiveLessonData = {
  id: "am-a",
  title: "Sounds /a/ and /m/",
  mascotVariant: "big",
  steps: [
    {
      type: "hook",
      mascot: { variant: "big", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/am-a/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "big", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "/a/",
      speech: "This is the A sound",
      subtext: "Pronunciation: 'a' as in 'ant'",
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
      speech: "Listen!",
      audioUrl: "/audio/lessons/am-a/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "big", state: "idle" },
      speech: "Try it!",
      audioUrl: "/audio/lessons/am-a/step-4-activity.mp3",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Which word has the /a/ sound?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Which word has the /a/ sound?",
          options: ["apple", "egg", "ice", "owl"],
          correctIndex: 0,
          explanation: "'apple' has the /a/ sound at the beginning of the word",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
      keyword: "/a/",
      speech: "Remember!",
      subtext: "Sound /a/ as in 'ant', 'apple'",
      audioUrl: "/audio/lessons/am-a/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "big", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/am-a/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
