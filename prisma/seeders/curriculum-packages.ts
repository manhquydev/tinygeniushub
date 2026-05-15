#!/usr/bin/env tsx
/**
 * Curriculum Package Database Seeder
 *
 * This script seeds the database with 8 curriculum packages:
 * 1. PREMIUM Preschool (K4-K5) - 199K
 * 2. Primary School PRO (G1-G5) - 349K
 * 3. ADVANCED High School (G6-G9) - 349K
 * 4. THPT ELITE (G10-G12) - 449K
 * 5. English MASTER (K4-G5) - 249K
 * 6. Mental Math MATH (K4-G8) - 199K
 * 7. STEM INNOVATOR (G3-G8) - 299K
 * 8. ULTIMATE (K4-G12) - 699K
 *
 * Usage:
 *   pnpm db:seed:packages
 *   pnpm db:seed:packages --reset
 */

import { prisma } from '@/lib/prisma';

interface PackageSeed {
  code: string;
  name: string;
  description: string;
  grades: string[];
  subjects: string[]; // Empty = all subjects
  videoCount: number;
  monthlyPrice: number; // VND
  yearlyPrice: number;  // VND (typically 10x monthly with discount)
  displayOrder: number;
}

const CURRICULUM_PACKAGES: PackageSeed[] = [
  {
    code: 'PRESCHOOL_PREMIUM',
    name: 'PREMIUM Preschool',
    description: 'Comprehensive preschool program for children K4-K5 (4-5 years old). Includes Phonics, Arithmetic, Bible, and skill development activities.',
    grades: ['k4', 'k5'],
    subjects: [], // All subjects
    videoCount: 680, // ~170 lessons x 2 grades x 2 subjects avg
    monthlyPrice: 199000,
    yearlyPrice: 1990000, // 10 months = 2 months free
    displayOrder: 1,
  },
  {
    code: 'ELEMENTARY_PRO',
    name: 'Primary School PRO',
    description: 'Full elementary school program from grades 1 to 5. Includes Phonics, Arithmetic, Bible, History, Science and auxiliary subjects.',
    grades: ['g1', 'g2', 'g3', 'g4', 'g5'],
    subjects: [], // All subjects
    videoCount: 2550, // ~170 lessons x 5 grades x 3 subjects avg
    monthlyPrice: 349000,
    yearlyPrice: 3490000, // 10 months = 2 months free
    displayOrder: 2,
  },
  {
    code: 'MIDDLE_ADVANCED',
    name: 'ADVANCED High School',
    description: 'Intensive high school program from grades 6 to 9. Focuses on critical thinking and solid foundational knowledge.',
    grades: ['g6', 'g7', 'g8', 'g9'],
    subjects: [], // All subjects
    videoCount: 2040, // ~170 lessons x 4 grades x 3 subjects avg
    monthlyPrice: 349000,
    yearlyPrice: 3490000, // 10 months = 2 months free
    displayOrder: 3,
  },
  {
    code: 'HIGH_ELITE',
    name: 'THPT ELITE',
    description: 'High school program to prepare for college from grades 10 to 12. Improve critical thinking and research skills.',
    grades: ['g10', 'g11', 'g12'],
    subjects: [], // All subjects
    videoCount: 1530, // ~170 lessons x 3 grades x 3 subjects avg
    monthlyPrice: 449000,
    yearlyPrice: 4490000, // 10 months = 2 months free
    displayOrder: 4,
  },
  {
    code: 'ENGLISH_MASTER',
    name: 'English MASTER',
    description: 'Intensive English from K4 to grade 5. Including Phonics, Reading, Literature, Grammar and Vocabulary.',
    grades: ['k4', 'k5', 'g1', 'g2', 'g3', 'g4', 'g5'],
    subjects: ['PHONICS', 'READING', 'LITERATURE', 'GRAMMAR', 'VOCABULARY', 'COMPOSITION', 'SPELLING'],
    videoCount: 1190, // ~170 lessons x 7 grades x 1 subject
    monthlyPrice: 249000,
    yearlyPrice: 2490000, // 10 months = 2 months free
    displayOrder: 5,
  },
  {
    code: 'MATH_THINKING',
    name: 'Mental Math MATH',
    description: 'Develop mathematical thinking from K4 to grade 8. Focus on Arithmetic, logical thinking and problem solving.',
    grades: ['k4', 'k5', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    subjects: ['ARITHMETIC', 'COMBINATION'],
    videoCount: 1700, // ~170 lessons x 10 grades x 1 subject
    monthlyPrice: 199000,
    yearlyPrice: 1990000, // 10 months = 2 months free
    displayOrder: 6,
  },
  {
    code: 'STEM_INNOVATOR',
    name: 'STEM INNOVATOR',
    description: 'STEM program for grades 3 to 8. Combining Science, Arithmetic and creative projects.',
    grades: ['g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    subjects: ['SCIENCE', 'ARITHMETIC', 'HISTORY', 'HEALTH'],
    videoCount: 2040, // ~170 lessons x 6 grades x 2 subjects
    monthlyPrice: 299000,
    yearlyPrice: 2990000, // 10 months = 2 months free
    displayOrder: 7,
  },
  {
    code: 'ULTIMATE',
    name: 'ULTIMATE',
    description: 'The most comprehensive package from K4 to grade 12. Unlimited access to all subjects and grades.',
    grades: ['k4', 'k5', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10', 'g11', 'g12'],
    subjects: [], // All subjects
    videoCount: 8500, // ~170 lessons x 14 grades x 3.5 subjects avg
    monthlyPrice: 699000,
    yearlyPrice: 6990000, // 10 months = 2 months free
    displayOrder: 8,
  },
];

async function seedCurriculumPackages() {
  console.log('🌱 Seeding Curriculum Packages...\n');

  const args = process.argv.slice(2);
  const reset = args.includes('--reset');

  // Reset if requested
  if (reset) {
    console.log('🗑️  Resetting existing package data...');
    await prisma.packageSubscription.deleteMany({});
    await prisma.curriculumPackage.deleteMany({});
    console.log('   ✅ Package data reset complete\n');
  }

  // Check if already seeded
  const existingCount = await prisma.curriculumPackage.count();
  if (existingCount > 0 && !reset) {
    console.log(`   ⚠️  ${existingCount} packages already exist.`);
    console.log('   Use --reset flag to reseed all data.\n');
    return;
  }

  let created = 0;
  let updated = 0;

  for (const pkg of CURRICULUM_PACKAGES) {
    const existing = await prisma.curriculumPackage.findUnique({
      where: { code: pkg.code },
    });

    const data = {
      name: pkg.name,
      description: pkg.description,
      grades: pkg.grades,
      subjects: pkg.subjects,
      videoCount: pkg.videoCount,
      monthlyPrice: pkg.monthlyPrice,
      yearlyPrice: pkg.yearlyPrice,
      displayOrder: pkg.displayOrder,
      isActive: true,
    };

    if (existing) {
      await prisma.curriculumPackage.update({
        where: { code: pkg.code },
        data,
      });
      updated++;
      console.log(`   🔄 Updated: ${pkg.name}`);
    } else {
      await prisma.curriculumPackage.create({
        data: {
          code: pkg.code,
          ...data,
        },
      });
      created++;
      console.log(`   ✅ Created: ${pkg.name}`);
    }
  }

  console.log('\n📊 Seeding Summary');
  console.log('==================');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total: ${created + updated}`);
  console.log('\n✅ Curriculum packages seeded successfully!');
}

async function main() {
  try {
    await seedCurriculumPackages();
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
