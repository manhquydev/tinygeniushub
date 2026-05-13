import type { HybridLessonData } from "./hybrid-lesson-types";

/**
 * Sample hybrid lesson data for preview/testing.
 * Uses a placeholder video URL — replace with real CDN URL in production.
 */
export const SAMPLE_HYBRID_LESSON: HybridLessonData = {
  id: "hybrid-am-a",
  title: "Sounds /a/ and /m/ (Hybrid)",
  conceptVideoUrl: "/video/lessons/am-a-teaching.mp4",
  transitionAudioUrl: "/audio/transition-den-luot-con.mp3",
  segments: [
    // Teaching phases as a single video
    {
      type: "video",
      phaseLabel: "concept",
      src: "/video/lessons/am-a-teaching.mp4",
      poster: "/video/lessons/am-a-poster.jpg",
    },
    // Activity — interactive
    {
      type: "interactive",
      step: {
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
    },
    // Reinforce — interactive (only shown when needed)
    {
      type: "interactive",
      step: {
        type: "reinforce",
        mascot: { variant: "big", state: "thinking", gesture: "thinking-scratch" },
        keyword: "/a/",
        speech: "Remember!",
        subtext: "Sound /a/ as in 'ant', 'apple'",
        audioUrl: "/audio/lessons/am-a/step-5-reinforce.mp3",
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
    },
    // Celebrate — interactive
    {
      type: "interactive",
      step: {
        type: "celebrate",
        mascot: { variant: "big", state: "celebrating", gesture: "clapping" },
        speech: "Very good!",
        audioUrl: "/audio/lessons/am-a/step-6-celebrate.mp3",
        autoAdvanceMs: 3000,
      },
    },
  ],
};
