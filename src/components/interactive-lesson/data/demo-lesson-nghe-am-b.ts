import type { InteractiveLessonData } from "../interactive-lesson-types";

// Lesson 3: Listen to the sound /b/ — English phonics, mascot: dad, activity: MULTIPLE_CHOICE
export const demoLessonNgheAmB: InteractiveLessonData = {
  id: "nghe-am-b",
  title: "Listen to the sound /b/",
  mascotVariant: "dad",
  steps: [
    {
      type: "hook",
      mascot: { variant: "dad", state: "happy", gesture: "waving" },
      speech: "Hello child!",
      audioUrl: "/audio/lessons/nghe-am-b/step-1-hook.mp3",
      autoAdvanceMs: 2500,
    },
    {
      type: "concept",
      mascot: { variant: "dad", state: "thinking", gesture: "pointing", actionProp: "pointing-stick" },
      keyword: "/b/",
      speech: "This B sound!",
      subtext: "Closed lips pronunciation: 'b'",
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
      speech: "Hark!",
      audioUrl: "/audio/lessons/nghe-am-b/step-3-demonstrate.mp3",
    },
    {
      type: "activity",
      mascot: { variant: "dad", state: "idle" },
      speech: "Choose right!",
      audioUrl: "/audio/lessons/nghe-am-b/step-4-activity.mp3",
      activity: {
        type: "MULTIPLE_CHOICE",
        prompt: "Which word starts with the sound /b/?",
        spec: {
          type: "MULTIPLE_CHOICE",
          question: "Which word starts with the sound /b/?",
          options: ["cat", "ball", "dog", "fish"],
          correctIndex: 1,
          explanation: "'ball' starts with the sound /b/",
        },
        passCriteria: 1,
      },
    },
    {
      type: "reinforce",
      mascot: { variant: "dad", state: "thinking", gesture: "thinking-scratch" },
      keyword: "/b/",
      speech: "Remember!",
      subtext: "Sound /b/ as in 'ball', 'bat'",
      audioUrl: "/audio/lessons/nghe-am-b/step-5-reinforce.mp3",
    },
    {
      type: "celebrate",
      mascot: { variant: "dad", state: "celebrating", gesture: "clapping" },
      speech: "Very good!",
      audioUrl: "/audio/lessons/nghe-am-b/step-6-celebrate.mp3",
      autoAdvanceMs: 3000,
    },
  ],
};
