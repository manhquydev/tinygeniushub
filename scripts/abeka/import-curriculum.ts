#!/usr/bin/env tsx

import { AbekaImportService } from '@/lib/abeka/import';
import { prisma } from '@/lib/prisma';
import { ImportOptions } from '@/lib/abeka/import/types';

async function main() {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    grade: parseInt(args.find(arg => arg.startsWith('--grade='))?.split('=')[1] || '-1'),
    reset: args.includes('--reset'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100'),
    rateLimitMs: parseInt(args.find(arg => arg.startsWith('--rate-limit='))?.split('=')[1] || '10'),
    maxRetries: parseInt(args.find(arg => arg.startsWith('--max-retries='))?.split('=')[1] || '3'),
    retryDelayMs: parseInt(args.find(arg => arg.startsWith('--retry-delay='))?.split('=')[1] || '1000'),
    skipValidation: args.includes('--skip-validation'),
    verifyCdnUrls: args.includes('--verify-cdn'),
    cdnTimeoutMs: parseInt(args.find(arg => arg.startsWith('--cdn-timeout='))?.split('=')[1] || '5000'),
    checkpointFile: args.find(arg => arg.startsWith('--checkpoint='))?.split('=')[1],
    resumeFromCheckpoint: args.includes('--resume'),
    parallelGrades: parseInt(args.find(arg => arg.startsWith('--parallel='))?.split('=')[1] || '1'),
    abortOnCriticalError: !args.includes('--continue-on-error'),
    dataPath: args.find(arg => arg.startsWith('--data-path='))?.split('=')[1],
  };

  console.log('🎓 Abeka Curriculum Import');
  console.log('==========================');

  // Reset if requested
  if (options.reset) {
    console.log('🗑️  Resetting existing data...');
    await prisma.abekaVideo.deleteMany({});
    await prisma.abekaLessonPackage.deleteMany({});
    await prisma.abekaLesson.deleteMany({});
    await prisma.abekaSubject.deleteMany({});
    await prisma.abekaGrade.deleteMany({});
    console.log('   ✅ Data reset complete');
    console.log('');
  }

  const service = new AbekaImportService(prisma, options);

  let result;

  if (options.grade && options.grade >= 0) {
    console.log(`📚 Importing Grade ${options.grade}...`);
    const gradeResult = await service.importGrade(options.grade);
    result = {
      totalVideos: gradeResult.videosImported,
      totalVideosProcessed: gradeResult.videosImported,
      totalVideosCreated: gradeResult.videosImported,
      totalVideosUpdated: gradeResult.videosUpdated,
      totalVideosSkipped: gradeResult.videosSkipped,
      gradesProcessed: 1,
      lessonsProcessed: gradeResult.lesson,
      totalErrors: gradeResult.errors.length,
      criticalErrors: gradeResult.errors.filter(e => e.severity === 'critical').length,
      warnings: gradeResult.errors.filter(e => e.severity === 'warning').length,
      errors: gradeResult.errors,
      results: [gradeResult],
      startTime: gradeResult.startTime,
      endTime: gradeResult.endTime,
      durationMs: gradeResult.durationMs,
      status: gradeResult.errors.some(e => e.severity === 'critical') ? 'partial' : 'completed',
    };
  } else {
    console.log('📚 Importing all grades (K4-12)...');
    result = await service.importAll();
  }

  console.log('');
  console.log('📊 Import Summary');
  console.log('==================');
  console.log(`Total Videos: ${result.totalVideos}`);
  console.log(`Created: ${result.totalVideosCreated}`);
  console.log(`Updated: ${result.totalVideosUpdated}`);
  console.log(`Skipped: ${result.totalVideosSkipped}`);
  console.log(`Grades: ${result.gradesProcessed}`);
  console.log(`Lessons: ${result.lessonsProcessed}`);
  console.log(`Errors: ${result.totalErrors} (${result.criticalErrors} critical)`);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log(`Status: ${result.status}`);

  if (result.errors.length > 0 && options.verbose) {
    console.log('');
    console.log('⚠️ Errors:');
    result.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  if (result.totalErrors > 0 && !options.verbose) {
    console.log('');
    console.log('💡 Run with --verbose to see all errors');
  }

  console.log('');
  console.log('✅ Import complete!');

  await prisma.$disconnect();
  process.exit(result.status === 'failed' ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
