import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 4: Rhyme -at — English phonics, mascot: small, activity: SORT_ORDER
export const demoLessonVanAt: InteractiveLessonData = {
  id: "van-at",
  title: "Rhyme -at",
  mascotVariant: "small",
  steps: [
    {
      type: "hook",
      mascot: { variant: "small", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/van-at/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "small", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "-at",
      speech: "This is the AT rhyme",
      subtext: "Consonant combination + at = new word",
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
      speech: "Let's see!",
      audioUrl: "/audio/lessons/van-at/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "small", state: "idle" },
      speech: "Arrange it!",
      audioUrl: "/audio/lessons/van-at/step-4-activity.mp3",
      activity: {
        type: "SORT_ORDER",
        prompt: "Sort from short to long",
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
      speech: "Remember!",
      subtext: "cat, bat, hat, flat all rhyme -at",
      audioUrl: "/audio/lessons/van-at/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "small", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/van-at/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
