#!/usr/bin/env tsx
/**
 * Abeka Curriculum Import Validation Tool
 * 
 * Validates JSON files before or after import:
 * - JSON schema validation
 * - Duplicate video detection
 * - CDN URL verification
 * - Count verification
 * 
 * Usage:
 *   tsx scripts/abeka/validate-import.ts [options]
 * 
 * Options:
 *   --data-path=PATH       Path to Abeka JSON data (default: env.ABEKA_DATA_PATH)
 *   --verify-cdn           Verify CDN URLs are accessible
 *   --cdn-timeout=MS       CDN check timeout (default: 5000ms)
 *   --strict               Fail on warnings
 *   --verbose              Show detailed output
 *   --grade=N              Validate specific grade only
 *   --expected=N           Expected total video count (default: 20195)
 *   --db-verify            Verify against database
 * 
 * Examples:
 *   # Validate all JSON files
 *   tsx scripts/abeka/validate-import.ts --verbose
 * 
 *   # Validate with CDN verification
 *   tsx scripts/abeka/validate-import.ts --verify-cdn --strict
 * 
 *   # Verify database import
 *   tsx scripts/abeka/validate-import.ts --db-verify --expected=20195
 */

import { AbekaVideoJson, ValidationResult, ValidationStats, ABEKA_EXPECTED_TOTAL } from '@/lib/abeka/import/types';
import { parseVideoId, getGradeName, formatGradeName, generateVideoKey, isValidVideoId } from '@/lib/abeka/import/parser';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ValidationOptions {
  dataPath: string;
  verifyCdn: boolean;
  cdnTimeout: number;
  strict: boolean;
  verbose: boolean;
  grade?: number;
  expectedTotal: number;
  dbVerify: boolean;
}

class AbekaValidator {
  private options: ValidationOptions;
  private stats: ValidationStats = {
    totalVideos: 0,
    validVideos: 0,
    invalidVideos: 0,
    duplicateVideos: 0,
    cdnErrors: 0,
    cdnSuccess: 0,
    cdnSlow: 0,
    subjectBreakdown: {},
    gradeBreakdown: {},
  };
  private seenKeys: Set<string> = new Set();
  private results: ValidationResult[] = [];

  constructor(options: ValidationOptions) {
    this.options = options;
  }

  async validate(): Promise<boolean> {
    console.log('🔍 Starting Abeka Curriculum Validation\n');
    console.log(`📋 Options:`);
    console.log(`   Data Path: ${this.options.dataPath}`);
    console.log(`   CDN Verify: ${this.options.verifyCdn ? 'YES' : 'NO'}`);
    console.log(`   Strict Mode: ${this.options.strict ? 'YES' : 'NO'}`);
    console.log(`   Expected Total: ${this.options.expectedTotal.toLocaleString()}`);
    console.log('');

    // Check data path
    try {
      await fs.access(this.options.dataPath);
    } catch {
      console.error(`❌ Data path not accessible: ${this.options.dataPath}`);
      return false;
    }

    // Determine grades to process
    const grades = this.options.grade !== undefined 
      ? [this.options.grade]
      : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    // Validate each grade
    for (const grade of grades) {
      const result = await this.validateGrade(grade);
      this.results.push(result);
    }

    // Print summary
    this.printSummary();

    // DB verification if requested
    if (this.options.dbVerify) {
      await this.verifyDatabase();
    }

    // Return success/failure
    const hasErrors = this.results.some(r => r.errors.length > 0);
    const hasWarnings = this.results.some(r => r.warnings.length > 0);

    if (hasErrors) {
      console.log('\n❌ VALIDATION FAILED - Errors found');
      return false;
    }

    if (hasWarnings && this.options.strict) {
      console.log('\n⚠️  VALIDATION FAILED - Warnings in strict mode');
      return false;
    }

    if (this.stats.totalVideos < this.options.expectedTotal * 0.95) {
      console.log(`\n⚠️  VALIDATION WARNING - Video count (${this.stats.totalVideos}) below expected (${this.options.expectedTotal})`);
      return !this.options.strict;
    }

    console.log('\n✅ VALIDATION PASSED');
    return true;
  }

  private async validateGrade(gradeLevel: number): Promise<ValidationResult> {
    const gradeName = getGradeName(gradeLevel);
    const gradeDir = path.join(this.options.dataPath, gradeName);

    console.log(`📚 Validating Grade ${formatGradeName(gradeLevel)}...`);

    // Check directory
    try {
      await fs.access(gradeDir);
    } catch {
      console.log(`   ⚠️ Directory not found: ${gradeDir}`);
      return {
        isValid: true,
        file: gradeDir,
        errors: [],
        warnings: [{
          type: 'format',
          message: `Directory not found for grade ${gradeLevel}`,
        }],
        stats: {
          totalVideos: 0,
          validVideos: 0,
          invalidVideos: 0,
          duplicateVideos: 0,
          cdnErrors: 0,
          cdnSuccess: 0,
          cdnSlow: 0,
          subjectBreakdown: {},
          gradeBreakdown: {},
        },
      };
    }

    // Read lesson files
    const files = (await fs.readdir(gradeDir))
      .filter(f => f.endsWith('.json'))
      .sort();

    const errors: any[] = [];
    const warnings: any[] = [];
    let totalVideos = 0;
    let validVideos = 0;

    for (const file of files) {
      const filePath = path.join(gradeDir, file);
      const fileResult = await this.validateLessonFile(filePath, gradeLevel);
      
      totalVideos += fileResult.total;
      validVideos += fileResult.valid;
      errors.push(...fileResult.errors);
      warnings.push(...fileResult.warnings);
    }

    this.stats.totalVideos += totalVideos;
    this.stats.validVideos += validVideos;
    this.stats.invalidVideos += errors.length;

    const isValid = errors.length === 0;

    console.log(`   ${isValid ? '✅' : '❌'} ${files.length} files, ${totalVideos} videos, ${errors.length} errors`);

    return {
      isValid,
      file: gradeDir,
      errors,
      warnings,
      stats: {
        totalVideos,
        validVideos,
        invalidVideos: errors.length,
        duplicateVideos: 0,
        cdnErrors: warnings.filter(w => w.type === 'cdn_slow').length,
        cdnSuccess: this.stats.cdnSuccess,
        cdnSlow: this.stats.cdnSlow,
        subjectBreakdown: {},
        gradeBreakdown: { [gradeLevel]: totalVideos },
      },
    };
  }

  private async validateLessonFile(filePath: string, gradeLevel: number): Promise<{ total: number; valid: number; errors: any[]; warnings: any[] }> {
    const errors: any[] = [];
    const warnings: any[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let videos: AbekaVideoJson[];
      
      try {
        videos = JSON.parse(content);
      } catch {
        errors.push({
          type: 'schema',
          message: 'Invalid JSON format',
        });
        return { total: 0, valid: 0, errors, warnings };
      }

      if (!Array.isArray(videos)) {
        errors.push({
          type: 'schema',
          message: 'JSON root must be an array',
        });
        return { total: 0, valid: 0, errors, warnings };
      }

      let validCount = 0;

      for (const video of videos) {
        // Schema validation
        if (!video.title || typeof video.title !== 'string') {
          errors.push({
            type: 'missing_field',
            field: 'title',
            message: 'Missing or invalid title',
          });
          continue;
        }

        if (!video.file || typeof video.file !== 'string') {
          errors.push({
            type: 'missing_field',
            field: 'file',
            message: 'Missing or invalid file URL',
          });
          continue;
        }

        if (!video.description || typeof video.description !== 'string') {
          errors.push({
            type: 'missing_field',
            field: 'description',
            message: 'Missing or invalid description',
          });
          continue;
        }

        // Parse validation
        if (!isValidVideoId(video.file)) {
          errors.push({
            type: 'parsing',
            message: `Invalid video ID format: ${video.file}`,
          });
          continue;
        }

        const parsed = parseVideoId(video.file);
        if (!parsed) {
          errors.push({
            type: 'parsing',
            message: `Failed to parse video: ${video.file}`,
          });
          continue;
        }

        // Duplicate check
        const videoKey = generateVideoKey(parsed);
        if (this.seenKeys.has(videoKey)) {
          warnings.push({
            type: 'deprecated',
            message: `Duplicate video: ${parsed.videoId}`,
            videoId: parsed.videoId,
          });
          this.stats.duplicateVideos++;
        } else {
          this.seenKeys.add(videoKey);
        }

        // Update subject breakdown
        const subject = parsed.subjectCode;
        this.stats.subjectBreakdown[subject] = (this.stats.subjectBreakdown[subject] || 0) + 1;

        // CDN verification
        if (this.options.verifyCdn) {
          const cdnResult = await this.verifyCdnUrl(video.file);
          if (cdnResult.status === 'error') {
            errors.push({
              type: 'cdn',
              message: `CDN error: ${cdnResult.error}`,
              videoId: parsed.videoId,
            });
            this.stats.cdnErrors++;
          } else if (cdnResult.status === 'slow') {
            warnings.push({
              type: 'cdn_slow',
              message: `CDN slow response: ${cdnResult.responseTimeMs}ms`,
              videoId: parsed.videoId,
            });
            this.stats.cdnSlow++;
          } else {
            this.stats.cdnSuccess++;
          }
        }

        validCount++;
      }

      return { total: videos.length, valid: validCount, errors, warnings };
    } catch (error) {
      errors.push({
        type: 'schema',
        message: `File read error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
      return { total: 0, valid: 0, errors, warnings };
    }
  }

  private async verifyCdnUrl(url: string): Promise<{ status: 'ok' | 'error' | 'slow'; responseTimeMs: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.cdnTimeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return { status: 'error', responseTimeMs: responseTime, error: `HTTP ${response.status}` };
      }
      
      if (responseTime > 2000) {
        return { status: 'slow', responseTimeMs: responseTime };
      }
      
      return { status: 'ok', responseTimeMs: responseTime };
    } catch (error) {
      return { 
        status: 'error', 
        responseTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async verifyDatabase(): Promise<void> {
    console.log('\n📊 Database Verification:');
    
    const counts = {
      videos: await prisma.abekaVideo.count() || 0,
      grades: await prisma.abekaGrade.count() || 0,
      subjects: await prisma.abekaSubject.count() || 0,
      lessons: await prisma.abekaLesson.count() || 0,
      packages: await prisma.abekaLessonPackage.count() || 0,
    };
    
    console.log(`   Videos:   ${counts.videos.toLocaleString().padStart(8)} / ${this.options.expectedTotal.toLocaleString()}`);
    console.log(`   Grades:   ${counts.grades.toString().padStart(8)} / 14`);
    console.log(`   Subjects: ${counts.subjects.toString().padStart(8)}`);
    console.log(`   Lessons:  ${counts.lessons.toString().padStart(8)}`);
    console.log(`   Packages: ${counts.packages.toString().padStart(8)}`);
    
    const coverage = (counts.videos / this.options.expectedTotal) * 100;
    if (coverage >= 95) {
      console.log(`   ✅ Coverage: ${coverage.toFixed(1)}%`);
    } else if (coverage >= 90) {
      console.log(`   ⚠️ Coverage: ${coverage.toFixed(1)}%`);
    } else {
      console.log(`   ❌ Coverage: ${coverage.toFixed(1)}%`);
    }
  }

  private printSummary(): void {
    console.log('\n' + '═'.repeat(56));
    console.log('                VALIDATION SUMMARY');
    console.log('═'.repeat(56));
    console.log(`Total Videos:     ${this.stats.totalVideos.toLocaleString().padStart(12)}`);
    console.log(`Valid Videos:     ${this.stats.validVideos.toLocaleString().padStart(12)}`);
    console.log(`Invalid Videos:   ${this.stats.invalidVideos.toLocaleString().padStart(12)}`);
    console.log(`Duplicates:       ${this.stats.duplicateVideos.toLocaleString().padStart(12)}`);
    if (this.options.verifyCdn) {
      console.log(`CDN Success:      ${this.stats.cdnSuccess.toLocaleString().padStart(12)}`);
      console.log(`CDN Errors:       ${this.stats.cdnErrors.toLocaleString().padStart(12)}`);
      console.log(`CDN Slow:         ${this.stats.cdnSlow.toLocaleString().padStart(12)}`);
    }
    console.log('═'.repeat(56));
    
    if (this.options.verbose) {
      console.log('\n📊 Subject Breakdown:');
      Object.entries(this.stats.subjectBreakdown)
        .sort(([, a], [, b]) => b - a)
        .forEach(([subject, count]) => {
          console.log(`   ${subject.padEnd(15)} ${count.toString().padStart(6)}`);
        });
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  
  const options: ValidationOptions = {
    dataPath: args.find(arg => arg.startsWith('--data-path='))?.split('=')[1] || process.env.ABEKA_DATA_PATH || '',
    verifyCdn: args.includes('--verify-cdn'),
    cdnTimeout: parseInt(args.find(arg => arg.startsWith('--cdn-timeout='))?.split('=')[1] || '5000'),
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose'),
    grade: parseInt(args.find(arg => arg.startsWith('--grade='))?.split('=')[1] || '-1'),
    expectedTotal: parseInt(args.find(arg => arg.startsWith('--expected='))?.split('=')[1] || ABEKA_EXPECTED_TOTAL.toString()),
    dbVerify: args.includes('--db-verify'),
  };

  if (!options.dataPath && !options.dbVerify) {
    console.error('❌ Error: --data-path required or use --db-verify');
    console.log('\nUsage: tsx scripts/abeka/validate-import.ts --data-path=/path/to/abeka');
    process.exit(1);
  }

  const validator = new AbekaValidator(options);
  const success = await validator.validate();
  
  await prisma.$disconnect();
  process.exit(success ? 0 : 1);
}

main();
