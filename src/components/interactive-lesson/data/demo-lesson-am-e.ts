import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 5: Short sounds /e/ — English phonics, mascot: baby, activity: MULTIPLE_CHOICE
export const demoLessonAmE: InteractiveLessonData = {
  id: "am-e",
  title: "Short sound /e/",
  mascotVariant: "baby",
  steps: [
    {
      type: "hook",
      mascot: { variant: "baby", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/am-e/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "baby", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "/e/",
      speech: "The E sound is short",
      subtext: "Pronunciation: 'e' as in 'egg'",
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
      speech: "Listen!",
      audioUrl: "/audio/lessons/am-e/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "baby", state: "idle" },
      speech: "You choose!",
      audioUrl: "/audio/lessons/am-e/step-4-activity.mp3",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Which word has the short /e/ sound?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Which word has the short /e/ sound?",
          options: ["eat", "egg", "ice", "open"],
          correctIndex: 1,
          explanation: "'egg' has a short /e/ sound at the beginning of the word",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "baby", state: "thinking", gesture: "thinking-scratch" },
      keyword: "/e/",
      speech: "Remember!",
      subtext: "Short /e/ sounds: egg, bed, pen",
      audioUrl: "/audio/lessons/am-e/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "baby", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/am-e/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
