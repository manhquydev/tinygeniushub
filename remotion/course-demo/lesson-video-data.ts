import type {
  MascotVariant,
  MascotSequenceStep,
} from "../../src/components/mascot/types";

export interface VideoSection {
  type: "intro" | "teach" | "activity" | "celebrate" | "outro";
  durationMs: number;
  label: string;
  sublabel?: string;
  mascotSequence: MascotSequenceStep[];
}

export interface LessonVideoData {
  id: string;
  title: string;
  objective: string;
  mascotVariant: MascotVariant;
  durationSeconds: number;
  sections: VideoSection[];
}

export const lessonVideoData: LessonVideoData[] = [
  {
    id: "lesson-01",
    title: "Sounds /a/ and /m/",
    objective: "Recognize and pronounce sounds /a/ and /m/ correctly",
    mascotVariant: "big",
    durationSeconds: 28,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 1: Sounds /a/ and /m/",
        sublabel: "Let's study with Mother Owl!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 10000,
        label: "Learn the /a/ sound",
        sublabel: "Mouth wide open, pronunciation: A - A - A",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "flashcard", duration: 4000 },
          { state: "thinking", gesture: "nodding", actionProp: "flashcard", duration: 3000 },
          { state: "happy", gesture: "raise-hand", actionProp: "flashcard", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 9000,
        label: "Practice",
        sublabel: "Please repeat after Mother Owl: /a/ /m/ /am/",
        mascotSequence: [
          { state: "playful", gesture: "clapping", duration: 3000 },
          { state: "excited", gesture: "nodding", actionProp: "flashcard", duration: 3000 },
          { state: "proud", gesture: "raise-hand", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Excellent!",
        sublabel: "I have learned the sounds /a/ and /m/",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "See you soon!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-02",
    title: "Fill in the letters CVC",
    objective: "Practice filling in letters in the consonant - vowel - consonant pattern",
    mascotVariant: "sister",
    durationSeconds: 30,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 2: Fill in CVC",
        sublabel: "Owl Please guide me!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 11000,
        label: "CVC structure",
        sublabel: "C - V - C: consonant + vowel + consonant",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "writing", duration: 4000 },
          { state: "thinking", gesture: "thinking-scratch", actionProp: "writing", duration: 4000 },
          { state: "happy", gesture: "nodding", actionProp: "writing", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 10000,
        label: "Fill in the blanks",
        sublabel: "c_t → cat, d_g → dog, b_d → bed",
        mascotSequence: [
          { state: "playful", gesture: "pointing", actionProp: "writing", duration: 4000 },
          { state: "excited", gesture: "raise-hand", duration: 3000 },
          { state: "proud", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Very good!",
        sublabel: "I already know how to fill in CVC!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "See you soon!",
        mascotSequence: [
          { state: "love", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-03",
    title: "Listen to the sound /b/",
    objective: "Recognize the /b/ sound in English words",
    mascotVariant: "dad",
    durationSeconds: 29,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 3: Listen to the sound /b/",
        sublabel: "Owl Dad, let's practice your ears with me!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 10000,
        label: "How does the /b/ sound sound?",
        sublabel: "Ball - Bus - Book - Baby",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "pointing-stick", duration: 4000 },
          { state: "thinking", gesture: "nodding", actionProp: "pointing-stick", duration: 3000 },
          { state: "proud", gesture: "raise-hand", actionProp: "pointing-stick", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 10000,
        label: "I listen and choose",
        sublabel: "Which word starts with the sound /b/?",
        mascotSequence: [
          { state: "playful", gesture: "pointing", duration: 3000 },
          { state: "surprised", gesture: "nodding", duration: 4000 },
          { state: "excited", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Great!",
        sublabel: "I recognized the /b/ sound!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "See you soon!",
        mascotSequence: [
          { state: "proud", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-04",
    title: "Rhyme -at",
    objective: "Read and write words that rhyme -at",
    mascotVariant: "small",
    durationSeconds: 27,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 4: Rhyme -at",
        sublabel: "Owl Let's learn rhymes together!",
        mascotSequence: [
          { state: "excited", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 9000,
        label: "Rhyme -at",
        sublabel: "cat - bat - hat - mat - rat",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "flashcard", duration: 3000 },
          { state: "happy", gesture: "nodding", actionProp: "flashcard", duration: 3000 },
          { state: "playful", gesture: "raise-hand", actionProp: "flashcard", duration: 3000 },
        ],
      },
      {
        type: "activity",
        durationMs: 9000,
        label: "Read it out loud!",
        sublabel: "I read each word out loud: cat, bat, hat",
        mascotSequence: [
          { state: "excited", gesture: "pointing", duration: 3000 },
          { state: "happy", gesture: "clapping", duration: 3000 },
          { state: "proud", gesture: "nodding", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Excellent!",
        sublabel: "You read the -at rhyme very well!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "See you soon!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-05",
    title: "Short sound /e/",
    objective: "Recognize and pronounce the short vowel /e/ correctly",
    mascotVariant: "duo",
    durationSeconds: 32,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 5: Short sound /e/",
        sublabel: "Mom Owl and Baby Owl, please teach me!",
        mascotSequence: [
          { state: "happy", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 12000,
        label: "Vowel /e/",
        sublabel: "egg - bed - red - ten - hen",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "flashcard", duration: 4000 },
          { state: "thinking", gesture: "nodding", duration: 4000 },
          { state: "excited", gesture: "raise-hand", actionProp: "flashcard", duration: 4000 },
        ],
      },
      {
        type: "activity",
        durationMs: 11000,
        label: "Find words with /e/ sound",
        sublabel: "egg, apple, bed, cat, ten → choose the word with /e/ sound",
        mascotSequence: [
          { state: "playful", gesture: "thinking-scratch", duration: 4000 },
          { state: "surprised", gesture: "pointing", duration: 4000 },
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Great!",
        sublabel: "I already memorize the /e/ sound!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "See you soon!",
        mascotSequence: [
          { state: "love", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-06",
    title: "Blends and Digraphs",
    objective: "Distinguish between blends (ch, sh, th) and digraphs (bl, cl, fl)",
    mascotVariant: "dad",
    durationSeconds: 33,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 6: Blends and Digraphs",
        sublabel: "Owl Dad explains the difference!",
        mascotSequence: [
          { state: "proud", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 12000,
        label: "Blends: 2 sounds combined",
        sublabel: "bl → black, cl → clock, fl → flag",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "magnifying-glass", duration: 4000 },
          { state: "thinking", gesture: "thinking-scratch", actionProp: "magnifying-glass", duration: 4000 },
          { state: "happy", gesture: "nodding", actionProp: "magnifying-glass", duration: 4000 },
        ],
      },
      {
        type: "activity",
        durationMs: 12000,
        label: "Digraphs: 2 words = 1 new sound",
        sublabel: "ch → chair, sh → ship, th → three",
        mascotSequence: [
          { state: "excited", gesture: "pointing", actionProp: "magnifying-glass", duration: 4000 },
          { state: "playful", gesture: "raise-hand", duration: 4000 },
          { state: "proud", gesture: "clapping", duration: 4000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "So smart!",
        sublabel: "I can distinguish between blends and digraphs!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "See you soon!",
        mascotSequence: [
          { state: "proud", gesture: "waving", duration: 3000 },
        ],
      },
    ],
  },
  {
    id: "lesson-07",
    title: "Sight Words",
    objective: "Instantly identify common sight words",
    mascotVariant: "big",
    durationSeconds: 34,
    sections: [
      {
        type: "intro",
        durationMs: 3000,
        label: "Lesson 7: Sight Words",
        sublabel: "Let's review the summary together!",
        mascotSequence: [
          { state: "excited", gesture: "waving", duration: 3000 },
        ],
      },
      {
        type: "teach",
        durationMs: 12000,
        label: "What are Sight Words?",
        sublabel: "the, a, and, is, it, in, on, at, to, of",
        mascotSequence: [
          { state: "idle", gesture: "pointing", actionProp: "trophy", duration: 4000 },
          { state: "happy", gesture: "nodding", actionProp: "flashcard", duration: 4000 },
          { state: "proud", gesture: "raise-hand", actionProp: "trophy", duration: 4000 },
        ],
      },
      {
        type: "activity",
        durationMs: 13000,
        label: "Read lightning fast!",
        sublabel: "Look and read now: the - is - and - to - a",
        mascotSequence: [
          { state: "excited", gesture: "clapping", duration: 4000 },
          { state: "playful", gesture: "pointing", actionProp: "trophy", duration: 5000 },
          { state: "celebrating", gesture: "raise-hand", duration: 4000 },
        ],
      },
      {
        type: "celebrate",
        durationMs: 3000,
        label: "Congratulations!",
        sublabel: "I have completed the course!",
        mascotSequence: [
          { state: "celebrating", gesture: "clapping", actionProp: "trophy", duration: 3000 },
        ],
      },
      {
        type: "outro",
        durationMs: 3000,
        label: "Thank you and see you again!",
        mascotSequence: [
          { state: "love", gesture: "waving", actionProp: "trophy", duration: 3000 },
        ],
      },
    ],
  },
];
