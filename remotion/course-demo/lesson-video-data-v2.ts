import type { LessonVideoDataV2 } from "./lesson-phase-types";

// 7 English Phonics lessons using the 7-phase arc. Each lesson = 900 frames (30s).
// Phase frame allocation: hook=90, concept=120, demonstrate=210, your-turn=120, reinforce=180, celebrate=120, recap=60

export const lessonVideoDataV2: LessonVideoDataV2[] = [
  {
    id: "lesson-01",
    title: "Sounds /a/ and /m/",
    mascotVariant: "big",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
        speech: "Hello child!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
        keyword: "Aa", subtext: "Sound /a/",
        speech: "Look here!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "idle", midState: "happy", gesture: "nodding", actionProp: "flashcard" },
        keyword: "apple", subtext: "/a/ - /a/ - apple",
        keywords: ["apple", "ant", "arm"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", midState: "thinking", gesture: "pointing" },
        speech: "Try it!", soundProxy: "thinking",
        answerOptions: ["moon", "apple", "egg"], correctIndex: 1,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", midState: "happy", gesture: "nodding" },
        keyword: "apple", subtext: "Starts with /a/", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Very good!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "Aa", speech: "See you soon!",
      },
    ],
  },
  {
    id: "lesson-02",
    title: "Fill in the letters CVC",
    mascotVariant: "sister",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "right" },
        speech: "Study with me!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "writing" },
        keyword: "CVC", subtext: "Consonants - Vowels - Consonants",
        speech: "C - V - C!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "thinking", gesture: "nodding", actionProp: "writing" },
        keyword: "c_t", subtext: "Fill in the blanks",
        keywords: ["c_t", "d_g", "b_d"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Try filling it out!", soundProxy: "thinking",
        answerOptions: ["cat", "cot", "cut"], correctIndex: 0,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "writing" },
        keyword: "cat", subtext: "c + a + t = cat", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Very good!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "CVC", speech: "See you soon!",
      },
    ],
  },
  {
    id: "lesson-03",
    title: "Listen to the sound /b/",
    mascotVariant: "dad",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
        speech: "Dad, teach me!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "pointing-stick" },
        keyword: "Bb", subtext: "Sound /b/",
        speech: "This B sound!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "pointing-stick" },
        keyword: "ball", subtext: "/b/ - /b/ - ball",
        keywords: ["ball", "bus", "book"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Which one do you choose?", soundProxy: "thinking",
        answerOptions: ["apple", "ball", "egg"], correctIndex: 1,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "pointing-stick" },
        keyword: "ball", subtext: "Starts with /b/", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Great!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "Bb", speech: "See you soon!",
      },
    ],
  },
  {
    id: "lesson-04",
    title: "Rhyme -at",
    mascotVariant: "small",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "excited", gesture: "waving", enterFrom: "bottom" },
        speech: "Let's learn rhymes!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
        keyword: "-at", subtext: "Rhyme -at",
        speech: "Look at this rhyme!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "flashcard" },
        keyword: "cat", subtext: "c + at = cat",
        keywords: ["cat", "bat", "hat"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Please read it!", soundProxy: "thinking",
        answerOptions: ["dog", "hat", "bed"], correctIndex: 1,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "flashcard" },
        keyword: "bat", subtext: "b + at = bat", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Excellent!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "-at", speech: "See you soon!",
      },
    ],
  },
  {
    id: "lesson-05",
    title: "Short sound /e/",
    mascotVariant: "duo",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "happy", gesture: "waving", enterFrom: "left" },
        speech: "Let's study together!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "flashcard" },
        keyword: "Ee", subtext: "Short /e/ sound",
        speech: "This E sound!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "flashcard" },
        keyword: "egg", subtext: "/e/ - /e/ - egg",
        keywords: ["egg", "bed", "red"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Which one do you choose?", soundProxy: "thinking",
        answerOptions: ["apple", "cat", "egg"], correctIndex: 2,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "flashcard" },
        keyword: "bed", subtext: "Has a short /e/ sound", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Great!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "Ee", speech: "See you soon!",
      },
    ],
  },
  {
    id: "lesson-06",
    title: "Blends and Digraphs",
    mascotVariant: "dad",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "proud", gesture: "waving", enterFrom: "left" },
        speech: "Let's get harder!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "magnifying-glass" },
        keyword: "sh", subtext: "2 letters = 1 sound",
        speech: "Digraph hey!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "thinking", gesture: "nodding", actionProp: "magnifying-glass" },
        keyword: "ship", subtext: "sh + ip = ship",
        keywords: ["sh", "ch", "th"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "I realize!", soundProxy: "thinking",
        answerOptions: ["ship", "flag", "clock"], correctIndex: 0,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "magnifying-glass" },
        keyword: "chair", subtext: "ch + air = chair", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping" },
        speech: "Smart!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "happy", gesture: "waving" },
        keyword: "sh/ch/th", speech: "See you soon!",
      },
    ],
  },
  {
    id: "lesson-07",
    title: "Sight Words",
    mascotVariant: "big",
    phases: [
      {
        type: "hook", durationFrames: 90,
        mascot: { state: "excited", gesture: "waving", enterFrom: "right" },
        speech: "Review summary!", soundProxy: "music",
      },
      {
        type: "concept", durationFrames: 120,
        mascot: { state: "idle", gesture: "pointing", actionProp: "trophy" },
        keyword: "the", subtext: "Sight Words",
        speech: "Important words!",
      },
      {
        type: "demonstrate", durationFrames: 210,
        mascot: { state: "happy", gesture: "nodding", actionProp: "trophy" },
        keyword: "is", subtext: "Read immediately without spelling",
        keywords: ["the", "is", "and"], soundProxy: "music",
      },
      {
        type: "your-turn", durationFrames: 120,
        mascot: { state: "playful", gesture: "pointing" },
        speech: "Read quickly!", soundProxy: "thinking",
        answerOptions: ["the", "fly", "jump"], correctIndex: 0,
      },
      {
        type: "reinforce", durationFrames: 180,
        mascot: { state: "proud", gesture: "nodding", actionProp: "trophy" },
        keyword: "and", subtext: "Sight word is important", soundProxy: "glow",
      },
      {
        type: "celebrate", durationFrames: 120,
        mascot: { state: "celebrating", gesture: "clapping", actionProp: "trophy" },
        speech: "Congratulations!", soundProxy: "surprise",
      },
      {
        type: "recap", durationFrames: 60,
        mascot: { state: "love", gesture: "waving" },
        keyword: "the, is, and", speech: "Thank you!",
      },
    ],
  },
];
