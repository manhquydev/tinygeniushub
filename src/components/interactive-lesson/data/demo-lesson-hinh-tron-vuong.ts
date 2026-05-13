import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 7: Circles and squares — Math, mascot: dad, activity: MULTIPLE_CHOICE
export const demoLessonHinhTronVuong: InteractiveLessonData = {
  id: "hinh-tron-vuong",
  title: "Round and square",
  mascotVariant: "dad",
  steps: [
    {
      type: "hook",
      mascot: { variant: "dad", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "dad", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "○ □",
      speech: "These two pictures!",
      subtext: "Round and square",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-2-concept.mp3",
    },
    {
      type: "demonstrate",
      mascot: { variant: "dad", state: "happy", gesture: "nodding" },
      keywords: ["clock ○", "books □", "cake ○"],
      speech: "Look around!",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "dad", state: "idle" },
      speech: "You choose!",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Which one is round?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Which one is round?",
          options: ["book", "the board", "ball", "box"],
          correctIndex: 2,
          explanation: "The ball is round in shape",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "dad", state: "thinking", gesture: "thinking-scratch" },
      keyword: "○ □",
      speech: "Remember!",
      subtext: "Round = no corners, square = 4 equal corners",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "dad", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/hinh-tron-vuong/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
