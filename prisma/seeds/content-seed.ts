import { Prisma, PrismaClient, TrackCode } from "@prisma/client";
import type { ActivitySpec } from "../../src/modules/content/activity-types";

type SeedActivityType = "MULTIPLE_CHOICE" | "FILL_BLANK" | "LISTEN_IDENTIFY" | "DRAG_SORT";

type LessonSeed = {
  orderNo: number;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  skillCodes: string[];
  activity: {
    type: SeedActivityType;
    prompt: string;
    spec: ActivitySpec;
  };
};

type UnitSeed = {
  orderNo: number;
  title: string;
  lessons: LessonSeed[];
};

type LevelSeed = {
  orderNo: number;
  title: string;
  units: UnitSeed[];
};

type TrackSeed = {
  code: TrackCode;
  title: string;
  levels: LevelSeed[];
};

type UpsertCounter = {
  created: number;
  updated: number;
};

export type ContentSeedSummary = {
  tracks: UpsertCounter;
  levels: UpsertCounter;
  units: UpsertCounter;
  lessons: UpsertCounter;
  activities: UpsertCounter;
  lessonSkills: { linked: number; skippedMissingSkill: number };
  totals: {
    tracks: number;
    levels: number;
    units: number;
    lessons: number;
    activities: number;
  };
};

function toActivitySpecJson(spec: ActivitySpec): Prisma.InputJsonValue {
  return spec as unknown as Prisma.InputJsonValue;
}

function mapActivityType(type: SeedActivityType): string {
  // Product requirement names this interaction "DRAG_SORT";
  // runtime engine stores sortable activities as "SORT_ORDER".
  if (type === "DRAG_SORT") return "SORT_ORDER";
  return type;
}

function buildOfflineCardMarkdown(seed: LessonSeed): string {
  return [
    `## ${seed.title}`,
    "",
    `**Goal:**${seed.objective}`,
    "",
    "**Suggested offline activities:**",
    "- Prepare magnetic cards/number cards and familiar objects in the house.",
    "- Let your baby do 2-3 short sessions, each session lasting 3-5 minutes.",
    "- Praise efforts and repeat key words at the end of the session.",
  ].join("\n");
}

function buildParentScriptMarkdown(seed: LessonSeed): string {
  return [
    "## Companion script for parents",
    "",
    "1. Open the lesson and listen to the beginning instructions with your child.",
    `2. Emphasize the goal: "${seed.objective}".`,
    "3. When your child answers incorrectly, suggest a short question instead of a direct answer.",
    "4. End the lesson with a repetition to help your child gain confidence.",
  ].join("\n");
}

const TRACKS: TrackSeed[] = [
  {
    code: TrackCode.ENGLISH,
    title: "English Phonics Class 1-2",
    levels: [
      {
        orderNo: 1,
        title: "Grade 1 - Phonics Foundation",
        units: [
          {
            orderNo: 1,
            title: "Basic Sounds and Letters",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g1-u1-letter-sounds-a-m",
                title: "Sounds /a/ and /m/",
                objective: "Baby recognizes the first sounds of the letters a and m in familiar words.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["PHONICS_LETTER_SOUNDS"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose a word that begins with the sound /m/",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Which word begins with the sound /m/?",
                    options: ["moon", "apple", "egg", "orange"],
                    correctIndex: 0,
                    explanation: "moon begins with the sound /m/.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g1-u1-fill-cat",
                title: "Fill in the missing letters in the word CVC",
                objective: "The child completes the word cat with the appropriate letter.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["PHONICS_CVC_SHORT_A"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Fill in the correct letters to create the word cat",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "c _ t",
                    answer: "a",
                    hint: "The short sound /a/ is in the middle of the word.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g1-u1-listen-begin-b",
                title: "Listen and choose words that start with /b/",
                objective: "Children listen and distinguish the initial sound /b/ in groups of short words.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["PHONICS_LETTER_SOUNDS"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Listen to the sound and choose the correct word",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/nghe-am-b/kw-ball.mp3",
                    question: "Which word does the sound you just heard match?",
                    options: ["ball", "sun", "fish", "tree"],
                    correctIndex: 0,
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "From CVC Short Sound",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g1-u2-drag-sort-rhyme-at",
                title: "Arrange the -at rhyme group",
                objective: "The child arranges the words that rhyme -at in the correct order.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["PHONICS_CVC_SHORT_A"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Drag and drop to sort by rhyme from short to long",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["bat", "at", "hat", "cat"],
                    correctOrder: [1, 0, 2, 3],
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g1-u2-short-e-choice",
                title: "Short sound /e/ with bed-red",
                objective: "Children identify groups of words containing the short sound /e/.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["PHONICS_CVC_SHORT_E"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose the word with the /e/ sound",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Which word has the short sound /e/?",
                    options: ["bed", "big", "hot", "cup"],
                    correctIndex: 0,
                    explanation: "bed pronounces the short sound /e/.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g1-u2-fill-blank-short-i",
                title: "Fill in the short sound /i/",
                objective: "The child completes the word sit with the sound /i/ in the correct position.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["PHONICS_CVC_SHORT_I"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Fill in the letters that make up the word sit",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "s _ t",
                    answer: "i",
                    hint: "The short sound /i/ is in the middle of the word.",
                  },
                },
              },
            ],
          },
        ],
      },
      {
        orderNo: 2,
        title: "Grade 2 - Matching Sounds and Reading Short Sentences",
        units: [
          {
            orderNo: 1,
            title: "Blends and Digraphs",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g2-u1-drag-sort-blends",
                title: "Arrange initial consonant clusters",
                objective: "Children arrange the blends in the correct order from easy to difficult.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_BLEND_INITIAL"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Drag and drop to arrange blends in learning order",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["dr", "bl", "cl", "fl"],
                    correctOrder: [1, 2, 3, 0],
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g2-u1-listen-sh-ch",
                title: "Listen and distinguish between sh/ch",
                objective: "Children distinguish /sh/ and /ch/ sounds through familiar words.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_DIGRAPH_SH", "PHONICS_DIGRAPH_CH"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Listen and choose the word with the /sh/ sound",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/dien-chu-cvc/kw-sit.mp3",
                    question: "Which word has the /sh/ sound?",
                    options: ["ship", "chair", "thumb", "drum"],
                    correctIndex: 0,
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g2-u1-th-choice",
                title: "The th sound in the word think",
                objective: "Children recognize the /th/ sound at the beginning of the word think.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_DIGRAPH_TH"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose words starting with /th/",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Which word begins with the /th/ sound?",
                    options: ["think", "ship", "cat", "blue"],
                    correctIndex: 0,
                    explanation: "think begins with the /th/ sound.",
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Sight Words and Simple Sentences",
            lessons: [
              {
                orderNo: 1,
                slug: "phonics-g2-u2-fill-sight-words",
                title: "Fill in the sight word in a short sentence",
                objective: "Please fill in the correct common sight word in the sentence.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_SIGHT_DOLCH_PRE"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Fill in the appropriate sight word",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "I ___ a red ball.",
                    answer: "see",
                    hint: "The word to fill in describes the action of seeing.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "phonics-g2-u2-listen-sentence-word",
                title: "Listen to the sentence and choose the missing word",
                objective: "Children listen to short sentences and choose words appropriate to the context.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["PHONICS_SIGHT_DOLCH_PRIMER"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Listen to the sentence and choose the correct word",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/dien-chu-cvc/step-4-activity.mp3",
                    question: "Which word completes the sentence you just heard?",
                    options: ["the", "run", "dog", "blue"],
                    correctIndex: 0,
                  },
                },
              },
              {
                orderNo: 3,
                slug: "phonics-g2-u2-drag-sort-simple-sentence",
                title: "Arrange words into simple sentences",
                objective: "Children arrange the words in the correct order to create complete simple sentences.",
                estimatedMinutes: 20,
                trialEnabled: false,
                skillCodes: ["PHONICS_SIGHT_DOLCH_1ST"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Drag and drop words to create complete sentences",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["plays", "Nam", "outside"],
                    correctOrder: [1, 0, 2],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: TrackCode.MATH,
    title: "Math Class 1-2",
    levels: [
      {
        orderNo: 1,
        title: "Grade 1 - Numbers and Basic Calculations",
        units: [
          {
            orderNo: 1,
            title: "Counting and Recognizing Numbers",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g1-u1-count-1-10",
                title: "Count numbers from 1 to 10",
                objective: "The child counts the numbers 1-10 correctly in the context of familiar objects.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["MATH_COUNT_1_10"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose the correct counting answer",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "How many stars are there: ⭐⭐⭐⭐⭐⭐",
                    options: ["4", "5", "6", "7"],
                    correctIndex: 2,
                    explanation: "There are 6 stars.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g1-u1-fill-missing-number",
                title: "Fill in the missing number",
                objective: "The child fills in the correct missing number in the consecutive sequence.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["MATH_COUNT_11_20"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Fill in the missing number in the sequence",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "11, 12, 13, __, 15",
                    answer: "14",
                    hint: "The number to be filled in is between 13 and 15.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g1-u1-listen-number-identify",
                title: "Listen to the number and choose the digit",
                objective: "Children listen to the number read and choose the correct corresponding digit.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["MATH_COUNT_1_10"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Listen and choose the correct number",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/so-1-5/step-4-activity.mp3",
                    question: "What is the number you just heard?",
                    options: ["6", "7", "8", "9"],
                    correctIndex: 1,
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Add Minus Within 20",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g1-u2-add-single-digit",
                title: "Add single-digit numbers",
                objective: "The child correctly solves one-digit addition within 20.",
                estimatedMinutes: 15,
                trialEnabled: true,
                skillCodes: ["MATH_ADD_1DIGIT"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose the correct result of addition",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "8 + 5 = ?",
                    options: ["11", "12", "13", "14"],
                    correctIndex: 2,
                    explanation: "8 + 5 = 13.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g1-u2-fill-subtraction",
                title: "Enter the subtraction result",
                objective: "Child completes basic subtraction within 20.",
                estimatedMinutes: 15,
                trialEnabled: false,
                skillCodes: ["MATH_SUB_1DIGIT"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Fill in the missing number",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "14 - 6 = __",
                    answer: "8",
                    hint: "Reduce 6 from 14 to 8.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g1-u2-drag-sort-subtraction-steps",
                title: "Arrange the steps to solve subtraction",
                objective: "The child arranges the steps to solve short subtraction problems in the correct order.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_SUB_1DIGIT"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Drag and drop the steps in the correct order",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["Set calculation", "Subtract units", "Write the results"],
                    correctOrder: [0, 1, 2],
                  },
                },
              },
            ],
          },
        ],
      },
      {
        orderNo: 2,
        title: "Grade 2 - Consolidate Addition and Subtraction, Get Familiar with Multiplication and Division",
        units: [
          {
            orderNo: 1,
            title: "Addition and Subtraction of 2 Digits and Multiplication Table 2-5",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g2-u1-add-two-digit-no-carry",
                title: "Adding 2 digits I don't remember",
                objective: "The child correctly calculated 2-digit addition without remembering it.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_ADD_2DIGIT_NO_CARRY"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose the correct answer",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "23 + 14 = ?",
                    options: ["35", "36", "37", "38"],
                    correctIndex: 2,
                    explanation: "23 + 14 = 37.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g2-u1-drag-sort-multiplication",
                title: "Arrange the multiplication table 2-5",
                objective: "The child correctly arranges the results according to the 2-5 multiplication table.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_MUL_TABLE_2_5"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Drag and drop to sort results from small to large",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["2 x 5 = 10", "2 x 2 = 4", "2 x 4 = 8", "2 x 3 = 6"],
                    correctOrder: [1, 3, 2, 0],
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g2-u1-listen-word-problem",
                title: "Listen to the math problem and choose the calculation",
                objective: "Children listen to simple math problems and choose the appropriate calculation.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_ADD_2DIGIT_NO_CARRY", "MATH_SUB_2DIGIT_NO_BORROW"],
                activity: {
                  type: "LISTEN_IDENTIFY",
                  prompt: "Listen to the problem and choose the correct calculation",
                  spec: {
                    type: "LISTEN_IDENTIFY",
                    audioUrl: "/audio/lessons/hinh-tron-vuong/step-4-activity.mp3",
                    question: "Lan has 12 candies, mother gives her 5 more. Choose the correct calculation:",
                    options: ["12 + 5", "12 - 5", "5 - 12", "12 x 5"],
                    correctIndex: 0,
                  },
                },
              },
            ],
          },
          {
            orderNo: 2,
            title: "Basic Geometry and Measurement",
            lessons: [
              {
                orderNo: 1,
                slug: "math-g2-u2-shapes-identify",
                title: "Recognize 2D images",
                objective: "Children recognize circles, squares, and triangles in reality.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_GEO_2D_SHAPES"],
                activity: {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Choose the correct image name",
                  spec: {
                    type: "MULTIPLE_CHOICE",
                    question: "Which shape group does a triangular sign belong to?",
                    options: ["Circle", "Square", "Triangle", "Rectangle"],
                    correctIndex: 2,
                    explanation: "The above sign is triangular.",
                  },
                },
              },
              {
                orderNo: 2,
                slug: "math-g2-u2-fill-measurement-unit",
                title: "Fill in the appropriate unit of measurement",
                objective: "The child chooses the correct unit cm/m in familiar situations.",
                estimatedMinutes: 18,
                trialEnabled: false,
                skillCodes: ["MATH_MEAS_LENGTH"],
                activity: {
                  type: "FILL_BLANK",
                  prompt: "Fill in the blank with unit of measurement",
                  spec: {
                    type: "FILL_BLANK",
                    sentence: "Pencil length is about 15 __",
                    answer: "cm",
                    hint: "Commonly used length of small objects cm.",
                  },
                },
              },
              {
                orderNo: 3,
                slug: "math-g2-u2-drag-sort-time",
                title: "Arrange the time of the day",
                objective: "Children arrange activities in the correct order according to time from morning to night.",
                estimatedMinutes: 20,
                trialEnabled: false,
                skillCodes: ["MATH_MEAS_TIME"],
                activity: {
                  type: "DRAG_SORT",
                  prompt: "Drag and drop works in chronological order",
                  spec: {
                    type: "SORT_ORDER",
                    items: ["Dinner at 6pm", "Go to school at 7am", "Take a nap at 12 o'clock"],
                    correctOrder: [1, 2, 0],
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

export async function seedLearningContent(prisma: PrismaClient): Promise<ContentSeedSummary> {
  const summary: ContentSeedSummary = {
    tracks: { created: 0, updated: 0 },
    levels: { created: 0, updated: 0 },
    units: { created: 0, updated: 0 },
    lessons: { created: 0, updated: 0 },
    activities: { created: 0, updated: 0 },
    lessonSkills: { linked: 0, skippedMissingSkill: 0 },
    totals: {
      tracks: TRACKS.length,
      levels: TRACKS.reduce((acc, track) => acc + track.levels.length, 0),
      units: TRACKS.reduce((acc, track) => acc + track.levels.reduce((sum, level) => sum + level.units.length, 0), 0),
      lessons: TRACKS.reduce(
        (acc, track) =>
          acc +
          track.levels.reduce(
            (lvSum, level) => lvSum + level.units.reduce((uSum, unit) => uSum + unit.lessons.length, 0),
            0,
          ),
        0,
      ),
      activities: TRACKS.reduce(
        (acc, track) =>
          acc +
          track.levels.reduce(
            (lvSum, level) => lvSum + level.units.reduce((uSum, unit) => uSum + unit.lessons.length, 0),
            0,
          ),
        0,
      ),
    },
  };

  const requestedSkillCodes = new Set<string>();
  for (const track of TRACKS) {
    for (const level of track.levels) {
      for (const unit of level.units) {
        for (const lesson of unit.lessons) {
          for (const code of lesson.skillCodes) requestedSkillCodes.add(code);
        }
      }
    }
  }

  const requestedSkillList = Array.from(requestedSkillCodes);
  const existingSkills = requestedSkillList.length
    ? await prisma.skill.findMany({ where: { code: { in: requestedSkillList } }, select: { id: true, code: true } })
    : [];
  const skillByCode = new Map(existingSkills.map((skill) => [skill.code, skill.id]));

  for (const trackSeed of TRACKS) {
    const trackExisting = await prisma.track.findUnique({ where: { code: trackSeed.code }, select: { id: true } });
    const track = await prisma.track.upsert({
      where: { code: trackSeed.code },
      update: { title: trackSeed.title, isTrialEnabled: true },
      create: { code: trackSeed.code, title: trackSeed.title, isTrialEnabled: true },
    });
    if (trackExisting) summary.tracks.updated += 1;
    else summary.tracks.created += 1;

    for (const levelSeed of trackSeed.levels) {
      const levelExisting = await prisma.level.findUnique({
        where: { trackId_orderNo: { trackId: track.id, orderNo: levelSeed.orderNo } },
        select: { id: true },
      });
      const level = await prisma.level.upsert({
        where: { trackId_orderNo: { trackId: track.id, orderNo: levelSeed.orderNo } },
        update: { title: levelSeed.title },
        create: {
          trackId: track.id,
          orderNo: levelSeed.orderNo,
          title: levelSeed.title,
        },
      });
      if (levelExisting) summary.levels.updated += 1;
      else summary.levels.created += 1;

      for (const unitSeed of levelSeed.units) {
        const unitExisting = await prisma.unit.findUnique({
          where: { levelId_orderNo: { levelId: level.id, orderNo: unitSeed.orderNo } },
          select: { id: true },
        });
        const unit = await prisma.unit.upsert({
          where: { levelId_orderNo: { levelId: level.id, orderNo: unitSeed.orderNo } },
          update: { title: unitSeed.title },
          create: {
            levelId: level.id,
            orderNo: unitSeed.orderNo,
            title: unitSeed.title,
          },
        });
        if (unitExisting) summary.units.updated += 1;
        else summary.units.created += 1;

        for (const lessonSeed of unitSeed.lessons) {
          const lessonExisting = await prisma.lesson.findUnique({
            where: { unitId_orderNo: { unitId: unit.id, orderNo: lessonSeed.orderNo } },
            select: { id: true },
          });
          const lesson = await prisma.lesson.upsert({
            where: { unitId_orderNo: { unitId: unit.id, orderNo: lessonSeed.orderNo } },
            update: {
              slug: lessonSeed.slug,
              title: lessonSeed.title,
              objective: lessonSeed.objective,
              estimatedMinutes: lessonSeed.estimatedMinutes,
              trialEnabled: lessonSeed.trialEnabled,
              offlineCardMarkdown: buildOfflineCardMarkdown(lessonSeed),
              parentScriptMarkdown: buildParentScriptMarkdown(lessonSeed),
            },
            create: {
              unitId: unit.id,
              orderNo: lessonSeed.orderNo,
              slug: lessonSeed.slug,
              title: lessonSeed.title,
              objective: lessonSeed.objective,
              estimatedMinutes: lessonSeed.estimatedMinutes,
              trialEnabled: lessonSeed.trialEnabled,
              offlineCardMarkdown: buildOfflineCardMarkdown(lessonSeed),
              parentScriptMarkdown: buildParentScriptMarkdown(lessonSeed),
            },
          });
          if (lessonExisting) summary.lessons.updated += 1;
          else summary.lessons.created += 1;

          const activityId = `activity-${lessonSeed.slug}`;
          const activityType = mapActivityType(lessonSeed.activity.type);

          await prisma.activity.deleteMany({
            where: {
              lessonId: lesson.id,
              id: { not: activityId },
            },
          });

          const activityExisting = await prisma.activity.findUnique({
            where: { id: activityId },
            select: { id: true },
          });
          await prisma.activity.upsert({
            where: { id: activityId },
            update: {
              lessonId: lesson.id,
              type: activityType,
              prompt: lessonSeed.activity.prompt,
              spec: toActivitySpecJson(lessonSeed.activity.spec),
              passCriteria: 80,
              skillId: skillByCode.get(lessonSeed.skillCodes[0] ?? "") ?? null,
            },
            create: {
              id: activityId,
              lessonId: lesson.id,
              type: activityType,
              prompt: lessonSeed.activity.prompt,
              spec: toActivitySpecJson(lessonSeed.activity.spec),
              passCriteria: 80,
              skillId: skillByCode.get(lessonSeed.skillCodes[0] ?? "") ?? null,
            },
          });
          if (activityExisting) summary.activities.updated += 1;
          else summary.activities.created += 1;

          for (const skillCode of lessonSeed.skillCodes) {
            const skillId = skillByCode.get(skillCode);
            if (!skillId) {
              summary.lessonSkills.skippedMissingSkill += 1;
              continue;
            }
            await prisma.lessonSkill.upsert({
              where: { lessonId_skillId: { lessonId: lesson.id, skillId } },
              update: { isPrimary: skillCode === lessonSeed.skillCodes[0] },
              create: {
                lessonId: lesson.id,
                skillId,
                isPrimary: skillCode === lessonSeed.skillCodes[0],
              },
            });
            summary.lessonSkills.linked += 1;
          }
        }
      }
    }
  }

  return summary;
}
