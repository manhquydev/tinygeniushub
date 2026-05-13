import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 6: Numbers 1 to 5 — Math, mascot: big, activity: MULTIPLE_CHOICE
export const demoLessonSo15: InteractiveLessonData = {
  id: "so-1-5",
  title: "Numbers 1 to 5",
  mascotVariant: "big",
  steps: [
    {
      type: "hook",
      mascot: { variant: "big", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/so-1-5/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "big", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "1 2 3 4 5",
      speech: "Count from 1 to 5",
      subtext: "Each number corresponds to a quantity",
      audioUrl: "/audio/lessons/so-1-5/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "big", state: "happy", gesture: "nodding" },
      keywords: ["1 apple", "3 balls", "5 sao"],
      speech: "See here!",
      audioUrl: "/audio/lessons/so-1-5/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "big", state: "idle" },
      speech: "Let's count!",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "How many dots are there? ● ● ●",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "How many dots are there? ● ● ●",
          options: ["2", "3", "4", "5"],
          correctIndex: 1,
          explanation: "Count: one, two, three — there are 3 dots",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
      keyword: "1 2 3 4 5",
      speech: "Remember!",
      subtext: "Count slowly and point to each object",
      audioUrl: "/audio/lessons/so-1-5/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "big", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/so-1-5/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
