/**
 * Semi-auto tagging script: suggests skill tags for existing lessons based on keyword matching.
 * Run: npx tsx prisma/scripts/tag-lessons-with-skills.ts --dry-run
 * Without --dry-run, applies the suggestions to DB.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keyword map: skill code -> keywords to match against lesson title/objective (lowercase)
const KEYWORD_MAP: Record<string, string[]> = {
  MATH_COUNT_1_10: ["đếm 1", "count 1", "số 1-10", "1 đến 10"],
  MATH_COUNT_11_20: ["đếm 11", "số 11-20", "11 đến 20"],
  MATH_COUNT_21_100: ["đếm đến 100", "số từ 21", "21 đến 100"],
  MATH_ADD_1DIGIT: ["cộng 1 chữ số", "cộng số nhỏ", "single digit addition", "cộng đơn"],
  MATH_ADD_2DIGIT_NO_CARRY: ["cộng 2 chữ số", "cộng không nhớ", "addition without carry"],
  MATH_ADD_2DIGIT_CARRY: ["cộng có nhớ", "addition with carry", "cộng nhớ"],
  MATH_ADD_3DIGIT: ["cộng 3 chữ số", "3-digit addition"],
  MATH_SUB_1DIGIT: ["trừ 1 chữ số", "trừ đơn", "subtraction"],
  MATH_SUB_2DIGIT_NO_BORROW: ["trừ không mượn", "trừ 2 chữ số"],
  MATH_SUB_2DIGIT_BORROW: ["trừ có mượn", "subtraction with borrow"],
  MATH_SUB_3DIGIT: ["trừ 3 chữ số"],
  MATH_MUL_TABLE_2_5: ["bảng nhân 2", "bảng nhân 3", "bảng nhân 4", "bảng nhân 5", "multiplication table"],
  MATH_MUL_TABLE_6_9: ["bảng nhân 6", "bảng nhân 7", "bảng nhân 8", "bảng nhân 9"],
  MATH_DIV_BASIC: ["phép chia", "chia cơ bản", "division"],
  MATH_GEO_2D_SHAPES: ["hình vuông", "hình tròn", "hình tam giác", "2d shape", "hình phẳng"],
  MATH_GEO_3D_SHAPES: ["hình cầu", "hình lập phương", "3d shape", "hình khối"],
  MATH_MEAS_LENGTH: ["đo độ dài", "cm", "met", "length"],
  MATH_MEAS_WEIGHT: ["đo khối lượng", "kg", "gram", "weight"],
  MATH_MEAS_TIME: ["đồng hồ", "giờ", "phút", "time", "clock"],
  PHONICS_LETTER_RECOGNITION: ["nhận dạng chữ cái", "letter recognition", "alphabet"],
  PHONICS_LETTER_SOUNDS: ["âm chữ cái", "letter sound", "phonics"],
  PHONICS_CVC_SHORT_A: ["short a", "cat", "bat", "hat", "man", "can"],
  PHONICS_CVC_SHORT_E: ["short e", "bed", "red", "hen", "ten"],
  PHONICS_CVC_SHORT_I: ["short i", "sit", "hit", "pig", "big"],
  PHONICS_CVC_SHORT_O: ["short o", "dot", "pot", "dog", "log"],
  PHONICS_CVC_SHORT_U: ["short u", "cup", "bug", "run", "fun"],
  PHONICS_BLEND_INITIAL: ["initial blend", "bl ", "cr ", "dr ", "fl ", "gr "],
  PHONICS_BLEND_FINAL: ["final blend", "nd ", "nk ", "mp "],
  PHONICS_DIGRAPH_SH: ["digraph sh", " sh ", "ship", "shop"],
  PHONICS_DIGRAPH_CH: ["digraph ch", " ch ", "chin", "chat"],
  PHONICS_DIGRAPH_TH: ["digraph th", " th ", "the ", "this"],
  PHONICS_SIGHT_DOLCH_PRE: ["sight word", "pre-primer", "dolch"],
  PHONICS_SIGHT_DOLCH_PRIMER: ["primer", "dolch primer"],
  PHONICS_SIGHT_DOLCH_1ST: ["dolch 1st", "sight words grade 1"],
};

interface Suggestion {
  lessonId: string;
  lessonTitle: string;
  suggestedSkills: string[];
  confidence: number;
}

async function matchLesson(
  lessonId: string,
  title: string,
  objective: string,
  skillCodeToId: Map<string, string>
): Promise<Suggestion | null> {
  const text = `${title} ${objective}`.toLowerCase();
  const matches: string[] = [];

  for (const [code, keywords] of Object.entries(KEYWORD_MAP)) {
    if (!skillCodeToId.has(code)) continue;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matches.push(code);
        break;
      }
    }
  }

  if (matches.length === 0) return null;

  return {
    lessonId,
    lessonTitle: title,
    suggestedSkills: matches,
    confidence: Math.min(1, 0.5 + matches.length * 0.1),
  };
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  console.log(`Running in ${isDryRun ? "DRY RUN" : "APPLY"} mode\n`);

  // Load skills map
  const skills = await prisma.skill.findMany({ select: { code: true, id: true } });
  const skillCodeToId = new Map(skills.map((s) => [s.code, s.id]));

  // Load all lessons
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true, objective: true },
  });

  const suggestions: Suggestion[] = [];
  const unmatched: string[] = [];

  for (const lesson of lessons) {
    const suggestion = await matchLesson(lesson.id, lesson.title, lesson.objective, skillCodeToId);
    if (suggestion) {
      suggestions.push(suggestion);
    } else {
      unmatched.push(lesson.id);
    }
  }

  if (!isDryRun) {
    for (const s of suggestions) {
      const isPrimary = s.suggestedSkills.length === 1;
      for (let i = 0; i < s.suggestedSkills.length; i++) {
        const skillId = skillCodeToId.get(s.suggestedSkills[i])!;
        await prisma.lessonSkill.upsert({
          where: { lessonId_skillId: { lessonId: s.lessonId, skillId } },
          update: {},
          create: { lessonId: s.lessonId, skillId, isPrimary: isPrimary || i === 0 },
        });
      }
    }
    console.log(`Applied ${suggestions.length} lesson skill tags.`);
  }

  const output = {
    suggestions,
    unmatched,
    summary: {
      total: lessons.length,
      matched: suggestions.length,
      unmatched: unmatched.length,
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
