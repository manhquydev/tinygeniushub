/**
 * Skill taxonomy seed: Math (Lop 1-3) + English Phonics.
 * Run: npx tsx prisma/seeds/skill-taxonomy-seed.ts
 */

import { PrismaClient, SkillDomain } from "@prisma/client";

const prisma = new PrismaClient();

interface SkillDef {
  code: string;
  domain: SkillDomain;
  nameVi: string;
  nameEn?: string;
  gradeLevel: number;
  orderNo: number;
  parentCode?: string;
  iconEmoji?: string;
  prerequisites?: string[]; // codes
}

const MATH_SKILLS: SkillDef[] = [
  // Root categories
  { code: "MATH_COUNTING", domain: "MATH", nameVi: "Đếm số", nameEn: "Counting", gradeLevel: 1, orderNo: 1, iconEmoji: "🔢" },
  { code: "MATH_ADDITION", domain: "MATH", nameVi: "Phép cộng", nameEn: "Addition", gradeLevel: 1, orderNo: 2, iconEmoji: "➕" },
  { code: "MATH_SUBTRACTION", domain: "MATH", nameVi: "Phép trừ", nameEn: "Subtraction", gradeLevel: 1, orderNo: 3, iconEmoji: "➖" },
  { code: "MATH_MULTIPLICATION", domain: "MATH", nameVi: "Phép nhân", nameEn: "Multiplication", gradeLevel: 2, orderNo: 4, iconEmoji: "✖️" },
  { code: "MATH_DIVISION", domain: "MATH", nameVi: "Phép chia", nameEn: "Division", gradeLevel: 3, orderNo: 5, iconEmoji: "➗" },
  { code: "MATH_GEOMETRY", domain: "MATH", nameVi: "Hình học", nameEn: "Geometry", gradeLevel: 2, orderNo: 6, iconEmoji: "🔷" },
  { code: "MATH_MEASUREMENT", domain: "MATH", nameVi: "Đo lường", nameEn: "Measurement", gradeLevel: 2, orderNo: 7, iconEmoji: "📏" },

  // Counting children
  { code: "MATH_COUNT_1_10", domain: "MATH", nameVi: "Đếm 1-10", nameEn: "Count 1-10", gradeLevel: 1, orderNo: 1, parentCode: "MATH_COUNTING" },
  { code: "MATH_COUNT_11_20", domain: "MATH", nameVi: "Đếm 11-20", nameEn: "Count 11-20", gradeLevel: 1, orderNo: 2, parentCode: "MATH_COUNTING", prerequisites: ["MATH_COUNT_1_10"] },
  { code: "MATH_COUNT_21_100", domain: "MATH", nameVi: "Đếm 21-100", nameEn: "Count 21-100", gradeLevel: 1, orderNo: 3, parentCode: "MATH_COUNTING", prerequisites: ["MATH_COUNT_11_20"] },

  // Addition children
  { code: "MATH_ADD_1DIGIT", domain: "MATH", nameVi: "Cộng số 1 chữ số", nameEn: "Single digit addition", gradeLevel: 1, orderNo: 1, parentCode: "MATH_ADDITION", prerequisites: ["MATH_COUNT_1_10"], iconEmoji: "➕" },
  { code: "MATH_ADD_2DIGIT_NO_CARRY", domain: "MATH", nameVi: "Cộng 2 chữ số không nhớ", nameEn: "2-digit addition without carry", gradeLevel: 1, orderNo: 2, parentCode: "MATH_ADDITION", prerequisites: ["MATH_ADD_1DIGIT"] },
  { code: "MATH_ADD_2DIGIT_CARRY", domain: "MATH", nameVi: "Cộng 2 chữ số có nhớ", nameEn: "2-digit addition with carry", gradeLevel: 2, orderNo: 3, parentCode: "MATH_ADDITION", prerequisites: ["MATH_ADD_2DIGIT_NO_CARRY"] },
  { code: "MATH_ADD_3DIGIT", domain: "MATH", nameVi: "Cộng 3 chữ số", nameEn: "3-digit addition", gradeLevel: 2, orderNo: 4, parentCode: "MATH_ADDITION", prerequisites: ["MATH_ADD_2DIGIT_CARRY"] },

  // Subtraction children
  { code: "MATH_SUB_1DIGIT", domain: "MATH", nameVi: "Trừ số 1 chữ số", nameEn: "Single digit subtraction", gradeLevel: 1, orderNo: 1, parentCode: "MATH_SUBTRACTION", prerequisites: ["MATH_ADD_1DIGIT"] },
  { code: "MATH_SUB_2DIGIT_NO_BORROW", domain: "MATH", nameVi: "Trừ 2 chữ số không mượn", nameEn: "2-digit subtraction without borrow", gradeLevel: 1, orderNo: 2, parentCode: "MATH_SUBTRACTION", prerequisites: ["MATH_SUB_1DIGIT"] },
  { code: "MATH_SUB_2DIGIT_BORROW", domain: "MATH", nameVi: "Trừ 2 chữ số có mượn", nameEn: "2-digit subtraction with borrow", gradeLevel: 2, orderNo: 3, parentCode: "MATH_SUBTRACTION", prerequisites: ["MATH_SUB_2DIGIT_NO_BORROW"] },
  { code: "MATH_SUB_3DIGIT", domain: "MATH", nameVi: "Trừ 3 chữ số", nameEn: "3-digit subtraction", gradeLevel: 2, orderNo: 4, parentCode: "MATH_SUBTRACTION", prerequisites: ["MATH_SUB_2DIGIT_BORROW"] },

  // Multiplication children
  { code: "MATH_MUL_TABLE_2_5", domain: "MATH", nameVi: "Bảng nhân 2-5", nameEn: "Multiplication tables 2-5", gradeLevel: 2, orderNo: 1, parentCode: "MATH_MULTIPLICATION", prerequisites: ["MATH_ADD_2DIGIT_NO_CARRY"] },
  { code: "MATH_MUL_TABLE_6_9", domain: "MATH", nameVi: "Bảng nhân 6-9", nameEn: "Multiplication tables 6-9", gradeLevel: 3, orderNo: 2, parentCode: "MATH_MULTIPLICATION", prerequisites: ["MATH_MUL_TABLE_2_5"] },

  // Division children
  { code: "MATH_DIV_BASIC", domain: "MATH", nameVi: "Chia cơ bản", nameEn: "Basic division", gradeLevel: 3, orderNo: 1, parentCode: "MATH_DIVISION", prerequisites: ["MATH_MUL_TABLE_2_5"] },

  // Geometry children
  { code: "MATH_GEO_2D_SHAPES", domain: "MATH", nameVi: "Hình phẳng 2D", nameEn: "2D shapes", gradeLevel: 2, orderNo: 1, parentCode: "MATH_GEOMETRY" },
  { code: "MATH_GEO_3D_SHAPES", domain: "MATH", nameVi: "Hình khối 3D", nameEn: "3D shapes", gradeLevel: 3, orderNo: 2, parentCode: "MATH_GEOMETRY", prerequisites: ["MATH_GEO_2D_SHAPES"] },

  // Measurement children
  { code: "MATH_MEAS_LENGTH", domain: "MATH", nameVi: "Đo độ dài", nameEn: "Length measurement", gradeLevel: 2, orderNo: 1, parentCode: "MATH_MEASUREMENT" },
  { code: "MATH_MEAS_WEIGHT", domain: "MATH", nameVi: "Đo khối lượng", nameEn: "Weight measurement", gradeLevel: 2, orderNo: 2, parentCode: "MATH_MEASUREMENT" },
  { code: "MATH_MEAS_TIME", domain: "MATH", nameVi: "Đo thời gian", nameEn: "Time measurement", gradeLevel: 2, orderNo: 3, parentCode: "MATH_MEASUREMENT" },
];

const PHONICS_SKILLS: SkillDef[] = [
  // Root categories
  { code: "PHONICS_ALPHABET", domain: "ENGLISH_PHONICS", nameVi: "Bảng chữ cái", nameEn: "Alphabet", gradeLevel: 1, orderNo: 1, iconEmoji: "🔤" },
  { code: "PHONICS_CVC", domain: "ENGLISH_PHONICS", nameVi: "Âm CVC", nameEn: "CVC Words", gradeLevel: 1, orderNo: 2, iconEmoji: "📝" },
  { code: "PHONICS_BLENDS", domain: "ENGLISH_PHONICS", nameVi: "Ghép âm", nameEn: "Blends", gradeLevel: 2, orderNo: 3, iconEmoji: "🔗" },
  { code: "PHONICS_DIGRAPHS", domain: "ENGLISH_PHONICS", nameVi: "Cặp phụ âm", nameEn: "Digraphs", gradeLevel: 2, orderNo: 4, iconEmoji: "🔡" },
  { code: "PHONICS_SIGHT_WORDS", domain: "ENGLISH_PHONICS", nameVi: "Từ nhận dạng", nameEn: "Sight Words", gradeLevel: 1, orderNo: 5, iconEmoji: "👁️" },

  // Alphabet children
  { code: "PHONICS_LETTER_RECOGNITION", domain: "ENGLISH_PHONICS", nameVi: "Nhận dạng chữ cái", nameEn: "Letter Recognition", gradeLevel: 1, orderNo: 1, parentCode: "PHONICS_ALPHABET" },
  { code: "PHONICS_LETTER_SOUNDS", domain: "ENGLISH_PHONICS", nameVi: "Âm của chữ cái", nameEn: "Letter Sounds", gradeLevel: 1, orderNo: 2, parentCode: "PHONICS_ALPHABET", prerequisites: ["PHONICS_LETTER_RECOGNITION"] },

  // CVC children
  { code: "PHONICS_CVC_SHORT_A", domain: "ENGLISH_PHONICS", nameVi: "Âm ngắn A (cat, bat)", nameEn: "Short A CVC", gradeLevel: 1, orderNo: 1, parentCode: "PHONICS_CVC", prerequisites: ["PHONICS_LETTER_SOUNDS"] },
  { code: "PHONICS_CVC_SHORT_E", domain: "ENGLISH_PHONICS", nameVi: "Âm ngắn E (bed, red)", nameEn: "Short E CVC", gradeLevel: 1, orderNo: 2, parentCode: "PHONICS_CVC", prerequisites: ["PHONICS_LETTER_SOUNDS"] },
  { code: "PHONICS_CVC_SHORT_I", domain: "ENGLISH_PHONICS", nameVi: "Âm ngắn I (sit, hit)", nameEn: "Short I CVC", gradeLevel: 1, orderNo: 3, parentCode: "PHONICS_CVC", prerequisites: ["PHONICS_LETTER_SOUNDS"] },
  { code: "PHONICS_CVC_SHORT_O", domain: "ENGLISH_PHONICS", nameVi: "Âm ngắn O (dot, pot)", nameEn: "Short O CVC", gradeLevel: 1, orderNo: 4, parentCode: "PHONICS_CVC", prerequisites: ["PHONICS_LETTER_SOUNDS"] },
  { code: "PHONICS_CVC_SHORT_U", domain: "ENGLISH_PHONICS", nameVi: "Âm ngắn U (cup, bug)", nameEn: "Short U CVC", gradeLevel: 1, orderNo: 5, parentCode: "PHONICS_CVC", prerequisites: ["PHONICS_LETTER_SOUNDS"] },

  // Blends children
  { code: "PHONICS_BLEND_INITIAL", domain: "ENGLISH_PHONICS", nameVi: "Ghép âm đầu (bl, cr, dr)", nameEn: "Initial Blends", gradeLevel: 2, orderNo: 1, parentCode: "PHONICS_BLENDS", prerequisites: ["PHONICS_CVC_SHORT_A"] },
  { code: "PHONICS_BLEND_FINAL", domain: "ENGLISH_PHONICS", nameVi: "Ghép âm cuối (nd, nk, mp)", nameEn: "Final Blends", gradeLevel: 2, orderNo: 2, parentCode: "PHONICS_BLENDS", prerequisites: ["PHONICS_BLEND_INITIAL"] },

  // Digraphs children
  { code: "PHONICS_DIGRAPH_SH", domain: "ENGLISH_PHONICS", nameVi: "Phụ âm đôi SH", nameEn: "SH Digraph", gradeLevel: 2, orderNo: 1, parentCode: "PHONICS_DIGRAPHS", prerequisites: ["PHONICS_BLEND_INITIAL"] },
  { code: "PHONICS_DIGRAPH_CH", domain: "ENGLISH_PHONICS", nameVi: "Phụ âm đôi CH", nameEn: "CH Digraph", gradeLevel: 2, orderNo: 2, parentCode: "PHONICS_DIGRAPHS", prerequisites: ["PHONICS_BLEND_INITIAL"] },
  { code: "PHONICS_DIGRAPH_TH", domain: "ENGLISH_PHONICS", nameVi: "Phụ âm đôi TH", nameEn: "TH Digraph", gradeLevel: 2, orderNo: 3, parentCode: "PHONICS_DIGRAPHS", prerequisites: ["PHONICS_BLEND_INITIAL"] },

  // Sight words children
  { code: "PHONICS_SIGHT_DOLCH_PRE", domain: "ENGLISH_PHONICS", nameVi: "Dolch Pre-Primer", nameEn: "Dolch Pre-Primer", gradeLevel: 1, orderNo: 1, parentCode: "PHONICS_SIGHT_WORDS", prerequisites: ["PHONICS_LETTER_RECOGNITION"] },
  { code: "PHONICS_SIGHT_DOLCH_PRIMER", domain: "ENGLISH_PHONICS", nameVi: "Dolch Primer", nameEn: "Dolch Primer", gradeLevel: 1, orderNo: 2, parentCode: "PHONICS_SIGHT_WORDS", prerequisites: ["PHONICS_SIGHT_DOLCH_PRE"] },
  { code: "PHONICS_SIGHT_DOLCH_1ST", domain: "ENGLISH_PHONICS", nameVi: "Dolch Lớp 1", nameEn: "Dolch 1st Grade", gradeLevel: 2, orderNo: 3, parentCode: "PHONICS_SIGHT_WORDS", prerequisites: ["PHONICS_SIGHT_DOLCH_PRIMER"] },
];

async function seedSkills(skills: SkillDef[]): Promise<Map<string, string>> {
  const codeToId = new Map<string, string>();

  // First pass: create all skills (without prerequisites)
  for (const skill of skills) {
    const parentId = skill.parentCode ? codeToId.get(skill.parentCode) : undefined;
    const existing = await prisma.skill.findUnique({ where: { code: skill.code } });
    if (existing) {
      codeToId.set(skill.code, existing.id);
      console.log(`  Skipped (exists): ${skill.code}`);
      continue;
    }
    const created = await prisma.skill.create({
      data: {
        code: skill.code,
        domain: skill.domain,
        nameVi: skill.nameVi,
        nameEn: skill.nameEn,
        gradeLevel: skill.gradeLevel,
        orderNo: skill.orderNo,
        parentId,
        iconEmoji: skill.iconEmoji,
      },
    });
    codeToId.set(skill.code, created.id);
    console.log(`  Created: ${skill.code}`);
  }

  // Second pass: add prerequisites
  for (const skill of skills) {
    if (!skill.prerequisites?.length) continue;
    const skillId = codeToId.get(skill.code);
    if (!skillId) continue;
    for (const prereqCode of skill.prerequisites) {
      const prerequisiteId = codeToId.get(prereqCode);
      if (!prerequisiteId) {
        console.warn(`  Warning: prerequisite ${prereqCode} not found for ${skill.code}`);
        continue;
      }
      await prisma.skillPrerequisite.upsert({
        where: { skillId_prerequisiteId: { skillId, prerequisiteId } },
        update: {},
        create: { skillId, prerequisiteId },
      });
    }
  }

  return codeToId;
}

async function main() {
  console.log("Seeding skill taxonomy...");
  console.log("\nMath skills:");
  await seedSkills(MATH_SKILLS);
  console.log("\nPhonics skills:");
  await seedSkills(PHONICS_SKILLS);
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
