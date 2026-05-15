/**
 * Placement test seed: Math (Lop 1-3) + English Phonics (K-3).
 * Creates PlacementTest records and PlacementTestItems (30+ per domain).
 * Run: npx tsx prisma/seeds/placement-test-seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Math items definition ────────────────────────────────────────────────────

const MATH_ITEMS = [
  // EASY - Grade 1 counting/addition basics
  {
    skillCode: "MATH_COUNTING",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 1,
    activitySpec: {
      question: "How many apples are there? 🍎🍎🍎",
      options: ["2", "3", "4", "5"],
      correctAnswer: "3",
    },
  },
  {
    skillCode: "MATH_COUNTING",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 2,
    activitySpec: {
      question: "Which number comes after 5?",
      options: ["4", "6", "7", "8"],
      correctAnswer: "6",
    },
  },
  {
    skillCode: "MATH_ADDITION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 3,
    activitySpec: {
      question: "2 + 3 = ?",
      options: ["4", "5", "6", "7"],
      correctAnswer: "5",
    },
  },
  {
    skillCode: "MATH_ADDITION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 4,
    activitySpec: {
      question: "1 + 4 = ?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "5",
    },
  },
  {
    skillCode: "MATH_SUBTRACTION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 5,
    activitySpec: {
      question: "5 - 2 = ?",
      options: ["1", "2", "3", "4"],
      correctAnswer: "3",
    },
  },
  {
    skillCode: "MATH_SUBTRACTION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 6,
    activitySpec: {
      question: "7 - 3 = ?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
    },
  },
  {
    skillCode: "MATH_COUNTING",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 7,
    activitySpec: {
      question: "Which number is bigger? 3 or 7?",
      options: ["3", "7", "Equal", "Don't know"],
      correctAnswer: "7",
    },
  },
  {
    skillCode: "MATH_ADDITION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 8,
    activitySpec: {
      question: "0 + 6 = ?",
      options: ["0", "5", "6", "7"],
      correctAnswer: "6",
    },
  },
  {
    skillCode: "MATH_SUBTRACTION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 9,
    activitySpec: {
      question: "10 - 5 = ?",
      options: ["4", "5", "6", "7"],
      correctAnswer: "5",
    },
  },
  {
    skillCode: "MATH_COUNTING",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 10,
    activitySpec: {
      question: "Count: 1, 2, 3, _, 5. What is the missing number?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
    },
  },

  // MEDIUM - Grade 2 addition/subtraction, start multiplication
  {
    skillCode: "MATH_ADDITION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 11,
    activitySpec: {
      question: "15 + 7 = ?",
      options: ["20", "21", "22", "23"],
      correctAnswer: "22",
    },
  },
  {
    skillCode: "MATH_ADDITION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 12,
    activitySpec: {
      question: "36 + 24 = ?",
      options: ["58", "59", "60", "61"],
      correctAnswer: "60",
    },
  },
  {
    skillCode: "MATH_SUBTRACTION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 13,
    activitySpec: {
      question: "50 - 18 = ?",
      options: ["30", "31", "32", "33"],
      correctAnswer: "32",
    },
  },
  {
    skillCode: "MATH_MULTIPLICATION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 14,
    activitySpec: {
      question: "3 x 4 = ?",
      options: ["10", "11", "12", "13"],
      correctAnswer: "12",
    },
  },
  {
    skillCode: "MATH_MULTIPLICATION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 15,
    activitySpec: {
      question: "5 x 6 = ?",
      options: ["28", "30", "32", "35"],
      correctAnswer: "30",
    },
  },
  {
    skillCode: "MATH_GEOMETRY",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 16,
    activitySpec: {
      question: "How many sides does a rectangle have?",
      options: ["2", "3", "4", "5"],
      correctAnswer: "4",
    },
  },
  {
    skillCode: "MATH_MEASUREMENT",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 17,
    activitySpec: {
      question: "1 hour = ? minutes",
      options: ["30", "60", "100", "120"],
      correctAnswer: "60",
    },
  },
  {
    skillCode: "MATH_SUBTRACTION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 18,
    activitySpec: {
      question: "100 - 43 = ?",
      options: ["55", "56", "57", "58"],
      correctAnswer: "57",
    },
  },
  {
    skillCode: "MATH_MULTIPLICATION",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 19,
    activitySpec: {
      question: "7 x 8 = ?",
      options: ["54", "56", "58", "60"],
      correctAnswer: "56",
    },
  },
  {
    skillCode: "MATH_GEOMETRY",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 20,
    activitySpec: {
      question: "How many angles does a triangle have?",
      options: ["2", "3", "4", "6"],
      correctAnswer: "3",
    },
  },

  // HARD - Grade 3 division, complex operations
  {
    skillCode: "MATH_DIVISION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 21,
    activitySpec: {
      question: "24 / 6 = ?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4",
    },
  },
  {
    skillCode: "MATH_DIVISION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 22,
    activitySpec: {
      question: "56 / 7 = ?",
      options: ["6", "7", "8", "9"],
      correctAnswer: "8",
    },
  },
  {
    skillCode: "MATH_MULTIPLICATION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 23,
    activitySpec: {
      question: "Buy 4 books, each book is 15,000 VND. How much is the total amount?",
      options: ["50,000 VND", "55,000 VND", "60,000 VND", "65,000 VND"],
      correctAnswer: "60,000 VND",
    },
  },
  {
    skillCode: "MATH_DIVISION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 24,
    activitySpec: {
      question: "Divide 72 candies among 9 people. How much does each of you get?",
      options: ["6", "7", "8", "9"],
      correctAnswer: "8",
    },
  },
  {
    skillCode: "MATH_MEASUREMENT",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 25,
    activitySpec: {
      question: "1km = ? m",
      options: ["100", "500", "1000", "10000"],
      correctAnswer: "1000",
    },
  },
  {
    skillCode: "MATH_ADDITION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 26,
    activitySpec: {
      question: "245 + 368 = ?",
      options: ["601", "611", "613", "621"],
      correctAnswer: "613",
    },
  },
  {
    skillCode: "MATH_SUBTRACTION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 27,
    activitySpec: {
      question: "500 - 247 = ?",
      options: ["251", "252", "253", "254"],
      correctAnswer: "253",
    },
  },
  {
    skillCode: "MATH_GEOMETRY",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 28,
    activitySpec: {
      question: "What is the perimeter of a square with side 5cm?",
      options: ["15cm", "20cm", "25cm", "30cm"],
      correctAnswer: "20cm",
    },
  },
  {
    skillCode: "MATH_DIVISION",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 29,
    activitySpec: {
      question: "100 / 4 = ?",
      options: ["20", "25", "30", "40"],
      correctAnswer: "25",
    },
  },
  {
    skillCode: "MATH_MEASUREMENT",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 30,
    activitySpec: {
      question: "1 kg = ? g",
      options: ["100", "500", "1000", "10000"],
      correctAnswer: "1000",
    },
  },
];

// ─── Phonics items definition ─────────────────────────────────────────────────

const PHONICS_ITEMS = [
  // EASY - Letter sounds, basic CVC words
  {
    skillCode: "PHONICS_CVC_SHORT_A",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 1,
    audioText: "cat",
    activitySpec: {
      question: "Which word has the /a/ sound like in 'cat'?",
      options: ["hat", "hot", "hut", "hit"],
      correctAnswer: "hat",
      audioPrompt: "cat",
    },
  },
  {
    skillCode: "PHONICS_CVC_SHORT_O",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 2,
    audioText: "dog",
    activitySpec: {
      question: "What sound does the letter 'o' make in 'dog'?",
      options: ["/a/", "/o/", "/u/", "/i/"],
      correctAnswer: "/o/",
      audioPrompt: "dog",
    },
  },
  {
    skillCode: "PHONICS_LETTER_SOUNDS",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 3,
    audioText: "ball",
    activitySpec: {
      question: "What letter does 'ball' start with?",
      options: ["p", "b", "d", "q"],
      correctAnswer: "b",
      audioPrompt: "ball",
    },
  },
  {
    skillCode: "PHONICS_LETTER_SOUNDS",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 4,
    audioText: "sun",
    activitySpec: {
      question: "What letter does 'sun' start with?",
      options: ["s", "c", "z", "x"],
      correctAnswer: "s",
      audioPrompt: "sun",
    },
  },
  {
    skillCode: "PHONICS_CVC_SHORT_I",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 5,
    audioText: "big",
    activitySpec: {
      question: "Listen: 'big'. What vowel sound do you hear?",
      options: ["/a/", "/e/", "/i/", "/o/"],
      correctAnswer: "/i/",
      audioPrompt: "big",
    },
  },
  {
    skillCode: "PHONICS_CVC_SHORT_E",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 6,
    audioText: "bed",
    activitySpec: {
      question: "What word rhymes with 'bed'?",
      options: ["bad", "red", "rid", "rod"],
      correctAnswer: "red",
      audioPrompt: "bed",
    },
  },
  {
    skillCode: "PHONICS_CVC_SHORT_U",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 7,
    audioText: "cup",
    activitySpec: {
      question: "How many sounds are in the word 'cup'?",
      options: ["1", "2", "3", "4"],
      correctAnswer: "3",
      audioPrompt: "cup",
    },
  },
  {
    skillCode: "PHONICS_LETTER_RECOGNITION",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 8,
    audioText: "fish",
    activitySpec: {
      question: "What letter does 'fish' end with?",
      options: ["s", "h", "k", "ch"],
      correctAnswer: "h",
      audioPrompt: "fish",
    },
  },
  {
    skillCode: "PHONICS_CVC_SHORT_O",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 9,
    audioText: "hop",
    activitySpec: {
      question: "Which word has the same vowel sound as 'hop'?",
      options: ["help", "hump", "hot", "hip"],
      correctAnswer: "hot",
      audioPrompt: "hop",
    },
  },
  {
    skillCode: "PHONICS_CVC_SHORT_A",
    difficulty: "EASY" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 10,
    audioText: "map",
    activitySpec: {
      question: "Change the 'm' in 'map' to 'c'. What new word do you get?",
      options: ["cap", "cup", "cop", "cep"],
      correctAnswer: "cap",
      audioPrompt: "map",
    },
  },

  // MEDIUM - Blends, digraphs, vowel teams
  {
    skillCode: "PHONICS_BLEND_INITIAL",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 11,
    audioText: "flag",
    activitySpec: {
      question: "What blend do you hear at the start of 'flag'?",
      options: ["fl", "fr", "bl", "br"],
      correctAnswer: "fl",
      audioPrompt: "flag",
    },
  },
  {
    skillCode: "PHONICS_BLEND_INITIAL",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 12,
    audioText: "stop",
    activitySpec: {
      question: "What blend starts 'stop'?",
      options: ["sp", "sl", "st", "sk"],
      correctAnswer: "st",
      audioPrompt: "stop",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 13,
    audioText: "ship",
    activitySpec: {
      question: "What sound do 'sh' make together in 'ship'?",
      options: ["/s/", "/sh/", "/ch/", "/h/"],
      correctAnswer: "/sh/",
      audioPrompt: "ship",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 14,
    audioText: "chair",
    activitySpec: {
      question: "What sound starts 'chair'?",
      options: ["/s/", "/sh/", "/ch/", "/c/"],
      correctAnswer: "/ch/",
      audioPrompt: "chair",
    },
  },
  {
    skillCode: "PHONICS_CVC",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 15,
    audioText: "cake",
    activitySpec: {
      question: "In 'cake', what is the vowel sound?",
      options: ["/a/ (short)", "/ay/ (long a)", "/e/ (short)", "/i/ (short)"],
      correctAnswer: "/ay/ (long a)",
      audioPrompt: "cake",
    },
  },
  {
    skillCode: "PHONICS_CVC",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 16,
    audioText: "ride",
    activitySpec: {
      question: "What makes the vowel long in 'ride'?",
      options: ["The r", "The i", "The silent e", "The d"],
      correctAnswer: "The silent e",
      audioPrompt: "ride",
    },
  },
  {
    skillCode: "PHONICS_BLEND_INITIAL",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 17,
    audioText: "crab",
    activitySpec: {
      question: "What blend starts 'crab'?",
      options: ["cl", "cr", "dr", "gr"],
      correctAnswer: "cr",
      audioPrompt: "crab",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 18,
    audioText: "think",
    activitySpec: {
      question: "What sound do 'th' make in 'think'?",
      options: ["/t/", "/h/", "/th/", "/sh/"],
      correctAnswer: "/th/",
      audioPrompt: "think",
    },
  },
  {
    skillCode: "PHONICS_CVC",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 19,
    audioText: "boat",
    activitySpec: {
      question: "What vowel team makes the long /o/ sound in 'boat'?",
      options: ["bo", "oa", "at", "oat"],
      correctAnswer: "oa",
      audioPrompt: "boat",
    },
  },
  {
    skillCode: "PHONICS_CVC",
    difficulty: "MEDIUM" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 20,
    audioText: "blend",
    activitySpec: {
      question: "How many syllables does 'butterfly' have?",
      options: ["2", "3", "4", "1"],
      correctAnswer: "3",
    },
  },

  // HARD - Complex phonics patterns, multisyllabic
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 21,
    audioText: "night",
    activitySpec: {
      question: "What makes the long /i/ sound in 'night'?",
      options: ["ni", "igh", "ght", "nig"],
      correctAnswer: "igh",
      audioPrompt: "night",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 22,
    audioText: "cloud",
    activitySpec: {
      question: "What vowel team makes the sound in 'cloud'?",
      options: ["cl", "lo", "ou", "ud"],
      correctAnswer: "ou",
      audioPrompt: "cloud",
    },
  },
  {
    skillCode: "PHONICS_SIGHT_DOLCH_1ST",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 23,
    activitySpec: {
      question: "Which word is spelled correctly?",
      options: ["thay", "they", "thei", "thay"],
      correctAnswer: "they",
    },
  },
  {
    skillCode: "PHONICS_BLEND_INITIAL",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 24,
    audioText: "splash",
    activitySpec: {
      question: "How many blended consonant sounds start 'splash'?",
      options: ["1", "2", "3", "4"],
      correctAnswer: "3",
      audioPrompt: "splash",
    },
  },
  {
    skillCode: "PHONICS_CVC",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 25,
    audioText: "train",
    activitySpec: {
      question: "What vowel team creates the long /a/ sound in 'train'?",
      options: ["tr", "ai", "an", "ain"],
      correctAnswer: "ai",
      audioPrompt: "train",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 26,
    audioText: "caught",
    activitySpec: {
      question: "What vowel sound do you hear in 'caught'?",
      options: ["/au/", "/aw/", "/oo/", "/ou/"],
      correctAnswer: "/aw/",
      audioPrompt: "caught",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 27,
    audioText: "phone",
    activitySpec: {
      question: "In 'phone', the letters 'ph' make which sound?",
      options: ["/p/", "/h/", "/f/", "/ph/"],
      correctAnswer: "/f/",
      audioPrompt: "phone",
    },
  },
  {
    skillCode: "PHONICS_SIGHT_DOLCH_1ST",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 28,
    activitySpec: {
      question: "Choose the correct sentence: ____ is my favorite color.",
      options: ["Blu", "Blue", "Bleu", "Bluw"],
      correctAnswer: "Blue",
    },
  },
  {
    skillCode: "PHONICS_CVC",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 29,
    audioText: "cube",
    activitySpec: {
      question: "What type of vowel sound is in 'cube'?",
      options: ["Short /u/", "Long /u/", "Short /o/", "Long /o/"],
      correctAnswer: "Long /u/",
      audioPrompt: "cube",
    },
  },
  {
    skillCode: "PHONICS_DIGRAPH_TH",
    difficulty: "HARD" as const,
    activityType: "MULTIPLE_CHOICE",
    orderHint: 30,
    audioText: "flower",
    activitySpec: {
      question: "How many syllables does 'sunflower' have?",
      options: ["2", "3", "4", "1"],
      correctAnswer: "3",
    },
  },
];

async function main() {
  console.log("Seeding placement tests...");

  // ─── Math Placement Test ──────────────────────────────────────────────────
  const mathTest = await prisma.placementTest.upsert({
    where: { domain_isActive: { domain: "MATH", isActive: true } },
    update: { title: "Math entrance test", description: "Determine Math level for grades 1-3" },
    create: {
      domain: "MATH",
      title: "Math entrance test",
      description: "Determine Math level for grades 1-3",
      minItems: 10,
      maxItems: 15,
    },
  });

  console.log(`Math test: ${mathTest.id}`);

  for (const item of MATH_ITEMS) {
    const skill = await prisma.skill.findUnique({ where: { code: item.skillCode } });
    if (!skill) {
      console.warn(`Skill not found: ${item.skillCode}, skipping`);
      continue;
    }

    // Check if item already exists (by testId + skillId + difficulty + orderHint)
    const existing = await prisma.placementTestItem.findFirst({
      where: { testId: mathTest.id, skillId: skill.id, difficulty: item.difficulty, orderHint: item.orderHint },
    });

    if (!existing) {
      await prisma.placementTestItem.create({
        data: {
          testId: mathTest.id,
          skillId: skill.id,
          difficulty: item.difficulty,
          activityType: item.activityType,
          activitySpec: item.activitySpec,
          orderHint: item.orderHint,
        },
      });
      console.log(`  Created Math item ${item.orderHint} (${item.difficulty})`);
    } else {
      console.log(`  Skipping Math item ${item.orderHint} (already exists)`);
    }
  }

  // ─── Phonics Placement Test ───────────────────────────────────────────────
  const phonicsTest = await prisma.placementTest.upsert({
    where: { domain_isActive: { domain: "ENGLISH_PHONICS", isActive: true } },
    update: { title: "Check Phonics input", description: "Determine K-3 Phonics level" },
    create: {
      domain: "ENGLISH_PHONICS",
      title: "Check Phonics input",
      description: "Determine K-3 Phonics level",
      minItems: 10,
      maxItems: 15,
    },
  });

  console.log(`Phonics test: ${phonicsTest.id}`);

  for (const item of PHONICS_ITEMS) {
    const skill = await prisma.skill.findUnique({ where: { code: item.skillCode } });
    if (!skill) {
      console.warn(`Skill not found: ${item.skillCode}, skipping`);
      continue;
    }

    const existing = await prisma.placementTestItem.findFirst({
      where: { testId: phonicsTest.id, skillId: skill.id, difficulty: item.difficulty, orderHint: item.orderHint },
    });

    if (!existing) {
      await prisma.placementTestItem.create({
        data: {
          testId: phonicsTest.id,
          skillId: skill.id,
          difficulty: item.difficulty,
          activityType: item.activityType,
          activitySpec: item.activitySpec,
          orderHint: item.orderHint,
        },
      });
      console.log(`  Created Phonics item ${item.orderHint} (${item.difficulty})`);
    } else {
      console.log(`  Skipping Phonics item ${item.orderHint} (already exists)`);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
