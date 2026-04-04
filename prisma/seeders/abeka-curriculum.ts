#!/usr/bin/env tsx
/**
 * Abeka Curriculum Database Seeder
 * 
 * This script seeds the database with Abeka curriculum data:
 * - 14 grades (K4-12)
 * - ~170 lessons per grade
 * - ~20,195 videos total
 * 
 * Usage:
 *   pnpm db:seed:abeka
 *   pnpm db:seed:abeka --reset
 */

import { AbekaImportService } from '@/lib/abeka/import';
import { prisma } from '@/lib/prisma';
import { ImportOptions } from '@/lib/abeka/import/types';

async function seedAbekaCurriculum() {
  console.log('🌱 Seeding Abeka Curriculum...');
  console.log('');

  // Check if already seeded
  const existingCount = await prisma.abekaVideo.count();
  if (existingCount > 0) {
    console.log(`   ⚠️  ${existingCount} videos already exist in the database.`);
    console.log('   Use --reset flag to reimport all data.');
    console.log('');
    return;
  }

  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  const verbose = args.includes('--verbose');

  // Reset if requested
  if (reset) {
    console.log('🗑️  Resetting existing Abeka data...');
    await prisma.abekaWatchProgress.deleteMany({});
    await prisma.childEarnedBadge.deleteMany({});
    await prisma.childSkillProgress.deleteMany({});
    await prisma.abekaSkillPrerequisite.deleteMany({});
    await prisma.abekaSkillNode.deleteMany({});
    await prisma.abekaStreakHistory.deleteMany({});
    await prisma.abekaStreak.deleteMany({});
    await prisma.childGradeProgress.deleteMany({});
    await prisma.abekaAssignment.deleteMany({});
    await prisma.abekaDailyPlan.deleteMany({});
    await prisma.abekaWeeklyPlan.deleteMany({});
    await prisma.abekaLearningJourney.deleteMany({});
    await prisma.abekaParentPreferences.deleteMany({});
    await prisma.abekaBadge.deleteMany({});
    await prisma.abekaVideo.deleteMany({});
    await prisma.abekaLessonPackage.deleteMany({});
    await prisma.abekaLesson.deleteMany({});
    await prisma.abekaSubject.deleteMany({});
    await prisma.abekaGrade.deleteMany({});
    console.log('   ✅ Data reset complete');
    console.log('');
  }

  // Run import
  const options: ImportOptions = {
    dryRun: false,
    verbose: verbose || true,
    reset: false,
    batchSize: 100,
    rateLimitMs: 10,
    maxRetries: 3,
    retryDelayMs: 1000,
    skipValidation: false,
    verifyCdnUrls: false,
    cdnTimeoutMs: 5000,
    resumeFromCheckpoint: false,
    parallelGrades: 1,
    abortOnCriticalError: true,
  };
  const service = new AbekaImportService(prisma, options);
  const result = await service.importAll();

  console.log('');
  console.log('📊 Seeding Summary');
  console.log('==================');
  console.log(`Total Videos: ${result.totalVideos}`);
  console.log(`Grades: ${result.gradesProcessed}`);
  console.log(`Lessons: ${result.lessonsProcessed}`);
  console.log(`Errors: ${result.totalErrors}`);

  if (result.totalErrors > 0 && verbose) {
    console.log('');
    console.log('⚠️ Errors:');
    result.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  console.log('');
  console.log('✅ Seeding complete!');
}

async function seedSkillTrees() {
  console.log('🌱 Seeding Skill Trees...');

  const grades = await prisma.abekaGrade.findMany();

  for (const grade of grades) {
    // Get subjects for this grade
    const subjects = await prisma.abekaSubject.findMany({
      where: { gradeId: grade.id },
    });

    for (const subject of subjects) {
      // Create root skill node for each subject
      await prisma.abekaSkillNode.upsert({
        where: {
          id: `${grade.id}-${subject.code}-root`,
        },
        create: {
          id: `${grade.id}-${subject.code}-root`,
          gradeId: grade.id,
          subjectCode: subject.code,
          name: `${subject.name} Fundamentals`,
          nameVi: `${subject.nameVi} Cơ Bản`,
          requiredLessons: [1, 2, 3, 4, 5], // First 5 lessons required
        },
        update: {},
      });
    }
  }

  console.log(`✅ Seeded skill trees for ${grades.length} grades`);
}

async function seedBadges() {
  console.log('🌱 Seeding Badges...');

  const badges = [
    {
      code: 'FIRST_LESSON',
      name: 'First Steps',
      nameVi: 'Bước Đầu Tiên',
      description: 'Complete your first lesson',
      descriptionVi: 'Hoàn thành bài học đầu tiên',
      requirementType: 'lessons',
      requirementValue: 1,
      orderNo: 1,
      iconUrl: '/badges/first-lesson.svg',
    },
    {
      code: 'WEEK_WARRIOR',
      name: 'Week Warrior',
      nameVi: 'Chiến Binh Tuần',
      description: 'Complete all lessons for 7 days',
      descriptionVi: 'Hoàn thành bài học 7 ngày liên tiếp',
      requirementType: 'streak',
      requirementValue: 7,
      orderNo: 2,
      iconUrl: '/badges/week-warrior.svg',
    },
    {
      code: 'MONTH_MASTER',
      name: 'Month Master',
      nameVi: 'Bậc Thầy Tháng',
      description: 'Maintain a 30-day learning streak',
      descriptionVi: 'Duy trì học tập 30 ngày liên tiếp',
      requirementType: 'streak',
      requirementValue: 30,
      orderNo: 3,
      iconUrl: '/badges/month-master.svg',
    },
    {
      code: 'PHONICS_PRO',
      name: 'Phonics Pro',
      nameVi: 'Chuyên Gia Học Vần',
      description: 'Complete 50 Phonics lessons',
      descriptionVi: 'Hoàn thành 50 bài học Học vần',
      requirementType: 'subject_mastery',
      requirementValue: 50,
      orderNo: 4,
      iconUrl: '/badges/phonics-pro.svg',
    },
    {
      code: 'MATH_WHIZ',
      name: 'Math Whiz',
      nameVi: 'Thần Đồng Toán Học',
      description: 'Complete 50 Arithmetic lessons',
      descriptionVi: 'Hoàn thành 50 bài học Toán',
      requirementType: 'subject_mastery',
      requirementValue: 50,
      orderNo: 5,
      iconUrl: '/badges/math-whiz.svg',
    },
    {
      code: 'HUNDRED_HERO',
      name: 'Century Club',
      nameVi: 'Câu Lạc Bộ Trăm',
      description: 'Complete 100 lessons total',
      descriptionVi: 'Hoàn thành 100 bài học',
      requirementType: 'lessons',
      requirementValue: 100,
      orderNo: 6,
      iconUrl: '/badges/hundred-hero.svg',
    },
    {
      code: 'GRADE_GRADUATE',
      name: 'Grade Graduate',
      nameVi: 'Tốt Nghiệp Lớp',
      description: 'Complete all lessons in a grade',
      descriptionVi: 'Hoàn thành tất cả bài học trong một lớp',
      requirementType: 'lessons',
      requirementValue: 170,
      orderNo: 7,
      iconUrl: '/badges/grade-graduate.svg',
    },
    {
      code: 'TIME_TRAVELER',
      name: 'Time Traveler',
      nameVi: 'Nhà Du Hành Thời Gian',
      description: 'Complete 1000 learning minutes',
      descriptionVi: 'Hoàn thành 1000 phút học tập',
      requirementType: 'time',
      requirementValue: 1000,
      orderNo: 8,
      iconUrl: '/badges/time-traveler.svg',
    },
    {
      code: 'SECRET_SCHOLAR',
      name: 'Secret Scholar',
      nameVi: 'Học Giả Bí Mật',
      description: 'Hidden badge - discover it!',
      descriptionVi: 'Huy hiệu ẩn - hãy khám phá!',
      requirementType: 'lessons',
      requirementValue: 50,
      orderNo: 9,
      iconUrl: '/badges/secret-scholar.svg',
      isSecret: true,
    },
  ];

  for (const badge of badges) {
    await prisma.abekaBadge.upsert({
      where: { code: badge.code },
      create: badge,
      update: badge,
    });
  }

  console.log(`✅ Seeded ${badges.length} badges`);
}

async function main() {
  try {
    await seedAbekaCurriculum();
    
    const args = process.argv.slice(2);
    const skipExtras = args.includes('--skip-extras');
    
    if (!skipExtras) {
      await seedSkillTrees();
      await seedBadges();
    }
    
    console.log('');
    console.log('🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
