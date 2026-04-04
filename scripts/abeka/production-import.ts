#!/usr/bin/env tsx
/**
 * Production Abeka Curriculum Import Script
 * 
 * Usage:
 *   tsx scripts/abeka/production-import.ts [options]
 * 
 * Options:
 *   --dry-run              Preview import without writing to DB
 *   --verbose              Show detailed progress and errors
 *   --grade=N              Import specific grade only (0-13)
 *   --reset                Clear existing data before import
 *   --batch-size=N         Process N lessons per batch (default: 100)
 *   --rate-limit=MS        Delay between batches in ms (default: 10)
 *   --max-retries=N        Retry failed grades N times (default: 3)
 *   --checkpoint=FILE      Save progress to file for resume capability
 *   --resume               Resume from checkpoint file
 *   --verify-cdn           Verify CDN URLs are accessible
 *   --cdn-timeout=MS       CDN check timeout in ms (default: 5000)
 *   --skip-validation      Skip JSON schema validation
 *   --continue-on-error    Don't abort on critical errors
 *   --data-path=PATH       Custom data directory path
 * 
 * Examples:
 *   # Full production import with verification
 *   tsx scripts/abeka/production-import.ts --verbose --checkpoint=import.chk
 * 
 *   # Resume failed import
 *   tsx scripts/abeka/production-import.ts --resume --checkpoint=import.chk
 * 
 *   # Import single grade with CDN verification
 *   tsx scripts/abeka/production-import.ts --grade=5 --verify-cdn --verbose
 * 
 *   # Dry run to preview changes
 *   tsx scripts/abeka/production-import.ts --dry-run --verbose
 */

import { AbekaImportService } from '@/lib/abeka/import';
import { prisma } from '@/lib/prisma';
import { ImportOptions, ABEKA_EXPECTED_TOTAL } from '@/lib/abeka/import/types';

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  
  return {
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
    dataPath: args.find(arg => arg.startsWith('--data-path='))?.split('=')[1] || process.env.ABEKA_DATA_PATH,
  };
}

async function validatePreconditions(options: ImportOptions): Promise<boolean> {
  console.log('🔍 Validating preconditions...\n');
  
  // Check environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    return false;
  }
  
  // Check data path
  const fs = await import('fs/promises');
  const dataPath = options.dataPath || process.env.ABEKA_DATA_PATH;
  
  if (!dataPath) {
    console.error('❌ No data path specified. Set ABEKA_DATA_PATH env var or use --data-path');
    return false;
  }
  
  try {
    await fs.access(dataPath);
    console.log(`✅ Data path accessible: ${dataPath}`);
  } catch {
    console.error(`❌ Data path not accessible: ${dataPath}`);
    return false;
  }
  
  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection OK');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
  
  // Check if data already exists
  if (!options.reset) {
    const existingCount = await prisma.abekaVideo.count() || 0;
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing videos. Use --reset to clear or --continue to update.`);
    }
  }
  
  console.log('');
  return true;
}

async function main() {
  const options = parseArgs();
  const startTime = Date.now();
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     ABEKA CURRICULUM IMPORT - PRODUCTION MODE          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Validate preconditions
  if (!await validatePreconditions(options)) {
    process.exit(1);
  }
  
  // Show configuration
  console.log('📋 Configuration:');
  console.log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`   Batch Size: ${options.batchSize}`);
  console.log(`   Rate Limit: ${options.rateLimitMs}ms`);
  console.log(`   Max Retries: ${options.maxRetries}`);
  console.log(`   CDN Verify: ${options.verifyCdnUrls ? 'YES' : 'NO'}`);
  console.log(`   Checkpoint: ${options.checkpointFile || 'NONE'}`);
  console.log(`   Resume: ${options.resumeFromCheckpoint ? 'YES' : 'NO'}`);
  console.log('');
  
  // Reset if requested
  if (options.reset && !options.dryRun) {
    console.log('🗑️  Resetting existing data...');
    await prisma.abekaVideo.deleteMany({});
    await prisma.abekaLessonPackage.deleteMany({});
    await prisma.abekaLesson.deleteMany({});
    await prisma.abekaSubject.deleteMany({});
    await prisma.abekaGrade.deleteMany({});
    console.log('   ✅ Data reset complete\n');
  }
  
  // Initialize service
  const service = new AbekaImportService(prisma, options);
  
  // Run import
  let result;
  
  try {
    if (options.grade && options.grade >= 0) {
      console.log(`📚 Importing Grade ${options.grade}...`);
      const gradeResult = await service.importGrade(options.grade);
      
      result = {
        totalVideos: gradeResult.videosImported,
        totalVideosProcessed: gradeResult.videosImported + gradeResult.videosSkipped,
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
      console.log('📚 Starting full curriculum import (K4-12)...');
      console.log(`   Expected: ${ABEKA_EXPECTED_TOTAL.toLocaleString()} videos\n`);
      result = await service.importAll();
    }
  } catch (error) {
    console.error('\n❌ Import failed with error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Print summary
  console.log('\n' + '═'.repeat(56));
  console.log('                  IMPORT SUMMARY');
  console.log('═'.repeat(56));
  console.log(`Total Videos:        ${result.totalVideos.toLocaleString().padStart(10)}`);
  console.log(`Created:             ${result.totalVideosCreated.toLocaleString().padStart(10)}`);
  console.log(`Updated:             ${result.totalVideosUpdated.toLocaleString().padStart(10)}`);
  console.log(`Skipped:             ${result.totalVideosSkipped.toLocaleString().padStart(10)}`);
  console.log(`Grades Processed:    ${result.gradesProcessed.toString().padStart(10)}`);
  console.log(`Lessons Processed:   ${result.lessonsProcessed.toString().padStart(10)}`);
  console.log(`Duration:            ${(result.durationMs / 1000).toFixed(2).padStart(8)}s`);
  console.log(`Status:              ${result.status.toUpperCase().padStart(10)}`);
  console.log('─'.repeat(56));
  console.log(`Errors:              ${result.totalErrors.toString().padStart(10)}`);
  console.log(`  Critical:          ${result.criticalErrors?.toString().padStart(10) || '0'}`);
  console.log(`  Warnings:          ${result.warnings?.toString().padStart(10) || '0'}`);
  console.log('═'.repeat(56));
  
  // Verification
  if (!options.dryRun && result.status !== 'failed') {
    const finalCount = await prisma.abekaVideo.count() || 0;
    console.log(`\n📊 Verification: ${finalCount.toLocaleString()} videos in database`);
    
    if (finalCount >= ABEKA_EXPECTED_TOTAL * 0.95) {
      console.log('   ✅ Within expected range (95%+ of 20,195)');
    } else if (finalCount >= ABEKA_EXPECTED_TOTAL * 0.90) {
      console.log('   ⚠️ Below expected range (90-95% of 20,195)');
    } else {
      console.log('   ❌ Significantly below expected (< 90% of 20,195)');
    }
  }
  
  // Error details
  if (result.errors.length > 0 && options.verbose) {
    console.log('\n⚠️  Error Details:');
    result.errors.slice(0, 20).forEach(e => {
      const icon = e.severity === 'critical' ? '🔴' : e.severity === 'error' ? '🟡' : '🔵';
      console.log(`   ${icon} ${e.file}: ${e.error}`);
    });
    
    if (result.errors.length > 20) {
      console.log(`   ... and ${result.errors.length - 20} more errors`);
    }
  }
  
  // Next steps
  console.log('\n📌 Next Steps:');
  if (result.checkpoint && result.checkpoint.failedGrades.length > 0) {
    console.log(`   • Retry failed grades: --resume --checkpoint=${options.checkpointFile}`);
  }
  if (result.errors.length > 0 && !options.verbose) {
    console.log('   • Run with --verbose for full error details');
  }
  console.log('   • Verify import: npx tsx scripts/abeka/validate-import.ts');
  console.log('   • Create backup: pnpm backup:create');
  
  await prisma.$disconnect();
  
  const exitCode = result.status === 'failed' ? 1 : result.status === 'partial' ? 2 : 0;
  process.exit(exitCode);
}

main();
