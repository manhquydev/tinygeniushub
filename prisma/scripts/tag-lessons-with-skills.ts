/**
 * Semi-auto tagging script: suggests skill tags for existing lessons based on keyword matching.
 * Run: npx tsx prisma/scripts/tag-lessons-with-skills.ts --dry-run
 * Without --dry-run, applies the suggestions to DB.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keyword map: skill code -> keywords to match against lesson title/objective (lowercase)
const KEYWORD_MAP: Record<string, string[]> = {
  MATH_COUNT_1_10: ["count 1", "count 1", "numbers 1-10", "1 to 10"],
  MATH_COUNT_11_20: ["count 11", "numbers 11-20", "11 to 20"],
  MATH_COUNT_21_100: ["count to 100", "number from 21", "21 to 100"],
  MATH_ADD_1DIGIT: ["plus 1 digit", "adds small numbers", "single digit addition", "plus single"],
  MATH_ADD_2DIGIT_NO_CARRY: ["adds 2 digits", "don't remember", "addition without carry"],
  MATH_ADD_2DIGIT_CARRY: ["plus remember", "addition with carry", "plus remember"],
  MATH_ADD_3DIGIT: ["adds 3 digits", "3-digit addition"],
  MATH_SUB_1DIGIT: ["minus 1 digit", "minus application", "subtraction"],
  MATH_SUB_2DIGIT_NO_BORROW: ["except don't borrow", "subtract 2 digits"],
  MATH_SUB_2DIGIT_BORROW: ["except for borrowing", "subtraction with borrow"],
  MATH_SUB_3DIGIT: ["minus 3 digits"],
  MATH_MUL_TABLE_2_5: ["2 times table", "3 times table", "4 times table", "5 times table", "multiplication table"],
  MATH_MUL_TABLE_6_9: ["6 times table", "7 times table", "8 times table", "9 times table"],
  MATH_DIV_BASIC: ["division", "basic division", "division"],
  MATH_GEO_2D_SHAPES: ["square", "circular shape", "triangle", "2d shape", "flat image"],
  MATH_GEO_3D_SHAPES: ["spherical", "cube", "3d shape", "cube"],
  MATH_MEAS_LENGTH: ["measures length", "cm", "met", "length"],
  MATH_MEAS_WEIGHT: ["mass measurement", "kg", "gram", "weight"],
  MATH_MEAS_TIME: ["clock", "now", "minute", "time", "clock"],
  PHONICS_LETTER_RECOGNITION: ["letter recognition", "letter recognition", "alphabet"],
  PHONICS_LETTER_SOUNDS: ["letter sounds", "letter sound", "phonics"],
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

  const limit = 1000;
  let cursorId: string | undefined = undefined;
  let hasMore = true;
  let totalProcessed = 0;

  const suggestions: Suggestion[] = [];
  const unmatched: string[] = [];

  console.log("Processing lessons in batches...");

  while (hasMore) {
    type LessonSummary = { id: string; title: string; objective: string };
    let lessons: LessonSummary[] = [];
    
    lessons = await prisma.lesson.findMany({
      select: { id: true, title: true, objective: true },
      take: limit,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: { id: 'asc' },
    });

    if (lessons.length === 0) {
      hasMore = false;
      break;
    }

    for (const lesson of lessons) {
      const suggestion = await matchLesson(lesson.id, lesson.title, lesson.objective, skillCodeToId);
      if (suggestion) {
        suggestions.push(suggestion);
      } else {
        unmatched.push(lesson.id);
      }
    }

    totalProcessed += lessons.length;
    cursorId = lessons[lessons.length - 1].id;
    console.log(`Processed ${totalProcessed} lessons...`);
  }

  if (!isDryRun) {
    console.log(`Applying ${suggestions.length} lesson skill tags...`);
    let appliedCount = 0;
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
      appliedCount++;
      if (appliedCount % 50 === 0) {
        console.log(`Applied tags for ${appliedCount} lessons...`);
      }
    }
    console.log(`Successfully applied ${suggestions.length} lesson skill tags.`);
  }

  const output = {
    summary: {
      total: totalProcessed,
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
