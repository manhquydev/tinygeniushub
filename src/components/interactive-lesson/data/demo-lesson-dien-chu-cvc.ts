import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 2: Fill in CVC — English phonics, mascot: sister, activity: FILL_BLANK
export const demoLessonDienChuCvc: InteractiveLessonData = {
  id: "dien-chu-cvc",
  title: "Fill in the letters CVC",
  mascotVariant: "sister",
  steps: [
    {
      type: "hook",
      mascot: { variant: "sister", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "sister", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "CVC",
      speech: "CVC structure",
      subtext: "Consonants - Vowels - Consonants",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "sister", state: "happy", gesture: "nodding" },
      keywords: ["cat", "bed", "sit"],
      keywordsWithAudio: [
        { word: "cat", audioUrl: "/audio/lessons/dien-chu-cvc/kw-cat.mp3" },
        { word: "bed", audioUrl: "/audio/lessons/dien-chu-cvc/kw-bed.mp3" },
        { word: "sit", audioUrl: "/audio/lessons/dien-chu-cvc/kw-sit.mp3" },
      ],
      speech: "What an example!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "sister", state: "idle", actionProp: "writing" },
      speech: "Please fill in!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-4-activity.mp3",
      activity: {
        type: "FILL_BLANK",
        prompt: "Fill in the blanks",
        spec: {
          type: "FILL_BLANK",
          sentence: "c_t",
          answer: "a",
          hint: "The middle vowel is /a/",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "sister", state: "thinking", gesture: "thinking-scratch" },
      keyword: "CVC",
      speech: "Remember!",
      subtext: "Consonants - Vowels - Consonants",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "sister", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/dien-chu-cvc/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
