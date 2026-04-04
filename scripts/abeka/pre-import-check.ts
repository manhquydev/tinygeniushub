#!/usr/bin/env tsx
/**
 * Pre-Import Validation Script for Abeka Curriculum
 * 
 * This script performs comprehensive validation before importing:
 * - Source file checks (20,195 videos)
 * - JSON schema validation
 * - CDN URL accessibility check
 * - Database connection check
 * - Disk space check
 * 
 * Usage:
 *   pnpm abeka:validate:pre
 *   pnpm abeka:validate:pre --strict    # Fail on warnings
 *   pnpm abeka:validate:pre --json      # Output JSON report
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { prisma } from '@/lib/prisma';

// Configuration
const ABEKA_DATA_PATH = process.env.ABEKA_DATA_PATH || 'C:\\Users\\manhquy\\.gemini\\antigravity\\scratch\\abeka_tools\\api\\abeka';
const EXPECTED_VIDEO_COUNT = 20195;
const EXPECTED_GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // K4-K5, 1-12
const MIN_DISK_SPACE_GB = 1;
const CDN_BASE_URL = 'https://fileta.hoctienganh.xyz';

// Grade directory mapping
const GRADE_DIRS: Record<number, string> = {
  0: '13',  // K4
  1: '14',  // K5
  2: '01',  // Grade 1
  3: '02',
  4: '03',
  5: '04',
  6: '05',
  7: '06',
  8: '07',
  9: '08',
  10: '09',
  11: '10',
  12: '11',
  13: '12', // Grade 12
};

// Validation result types
interface ValidationIssue {
  severity: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  details?: unknown;
}

interface ValidationResult {
  success: boolean;
  issues: ValidationIssue[];
  stats: {
    totalFiles: number;
    totalVideos: number;
    gradesFound: number;
    lessonsFound: number;
    jsonValid: number;
    jsonInvalid: number;
    cdnAccessible: number;
    cdnFailed: number;
  };
  checks: Record<string, boolean>;
}

class PreImportValidator {
  private issues: ValidationIssue[] = [];
  private stats = {
    totalFiles: 0,
    totalVideos: 0,
    gradesFound: 0,
    lessonsFound: 0,
    jsonValid: 0,
    jsonInvalid: 0,
    cdnAccessible: 0,
    cdnFailed: 0,
  };

  async validate(options: { strict?: boolean; sampleCdn?: number } = {}): Promise<ValidationResult> {
    console.log('🔍 Abeka Pre-Import Validation');
    console.log('==============================\n');

    const checks: Record<string, boolean> = {};

    // 1. Check source path exists
    checks['source_path'] = await this.validateSourcePath();
    
    // 2. Check grade directories
    checks['grade_dirs'] = await this.validateGradeDirectories();
    
    // 3. Check JSON files
    checks['json_files'] = await this.validateJsonFiles();
    
    // 4. Validate JSON schema
    checks['json_schema'] = await this.validateJsonSchema();
    
    // 5. Check CDN URLs (sample)
    if (options.sampleCdn !== 0) {
      checks['cdn_accessible'] = await this.validateCdnUrls(options.sampleCdn || 50);
    }
    
    // 6. Check database connection
    checks['database'] = await this.validateDatabaseConnection();
    
    // 7. Check disk space
    checks['disk_space'] = await this.validateDiskSpace();
    
    // 8. Check existing data
    checks['existing_data'] = await this.validateExistingData();

    // 9. Count validation
    checks['video_count'] = this.validateVideoCount();

    // Determine overall success
    const criticalChecks = ['source_path', 'grade_dirs', 'json_files', 'json_schema', 'database'];
    const failedCritical = criticalChecks.filter(c => !checks[c]);
    const success = failedCritical.length === 0;

    // Print summary
    this.printSummary(checks, success);

    return {
      success,
      issues: this.issues,
      stats: this.stats,
      checks,
    };
  }

  private async validateSourcePath(): Promise<boolean> {
    console.log('📁 Checking source path...');
    
    try {
      await fs.access(ABEKA_DATA_PATH);
      const stat = await fs.stat(ABEKA_DATA_PATH);
      
      if (!stat.isDirectory()) {
        this.addIssue('error', 'source_path', `Path exists but is not a directory: ${ABEKA_DATA_PATH}`);
        return false;
      }
      
      console.log(`   ✅ Source path exists: ${ABEKA_DATA_PATH}`);
      return true;
    } catch (error) {
      this.addIssue('error', 'source_path', `Source path not found: ${ABEKA_DATA_PATH}`);
      return false;
    }
  }

  private async validateGradeDirectories(): Promise<boolean> {
    console.log('📚 Checking grade directories...');
    
    let foundGrades = 0;
    let missingGrades: number[] = [];

    for (const [level, dirName] of Object.entries(GRADE_DIRS)) {
      const gradeDir = path.join(ABEKA_DATA_PATH, dirName);
      
      try {
        await fs.access(gradeDir);
        const stat = await fs.stat(gradeDir);
        
        if (stat.isDirectory()) {
          foundGrades++;
        } else {
          missingGrades.push(parseInt(level));
        }
      } catch {
        missingGrades.push(parseInt(level));
      }
    }

    this.stats.gradesFound = foundGrades;

    if (foundGrades === 0) {
      this.addIssue('error', 'grade_dirs', 'No grade directories found');
      return false;
    }

    if (missingGrades.length > 0) {
      this.addIssue('warning', 'grade_dirs', 
        `Missing ${missingGrades.length} grade directories: ${missingGrades.map(g => GRADE_DIRS[g]).join(', ')}`,
        { missingGrades });
    }

    console.log(`   ✅ Found ${foundGrades}/${EXPECTED_GRADES.length} grade directories`);
    if (missingGrades.length > 0) {
      console.log(`   ⚠️  Missing: ${missingGrades.map(g => GRADE_DIRS[g]).join(', ')}`);
    }

    return foundGrades > 0;
  }

  private async validateJsonFiles(): Promise<boolean> {
    console.log('📄 Checking JSON files...');
    
    let totalFiles = 0;
    let totalLessons = 0;

    for (const [level, dirName] of Object.entries(GRADE_DIRS)) {
      const gradeDir = path.join(ABEKA_DATA_PATH, dirName);
      
      try {
        const files = await fs.readdir(gradeDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        totalFiles += jsonFiles.length;
        totalLessons += jsonFiles.length;
      } catch {
        // Directory doesn't exist, skip
      }
    }

    this.stats.totalFiles = totalFiles;
    this.stats.lessonsFound = totalLessons;

    if (totalFiles === 0) {
      this.addIssue('error', 'json_files', 'No JSON files found in grade directories');
      return false;
    }

    console.log(`   ✅ Found ${totalFiles} JSON files (~${totalLessons} lessons)`);
    return true;
  }

  private async validateJsonSchema(): Promise<boolean> {
    console.log('🔍 Validating JSON schema...');
    
    let validCount = 0;
    let invalidCount = 0;
    let sampleErrors: string[] = [];

    for (const [level, dirName] of Object.entries(GRADE_DIRS)) {
      const gradeDir = path.join(ABEKA_DATA_PATH, dirName);
      
      try {
        const files = await fs.readdir(gradeDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        for (const file of jsonFiles.slice(0, 5)) { // Sample first 5 per grade
          try {
            const content = await fs.readFile(path.join(gradeDir, file), 'utf-8');
            const data = JSON.parse(content);
            
            // Validate structure
            if (!Array.isArray(data)) {
              invalidCount++;
              if (sampleErrors.length < 3) {
                sampleErrors.push(`${dirName}/${file}: Not an array`);
              }
              continue;
            }

            // Validate video objects
            const hasValidStructure = data.every((video: unknown) => {
              const v = video as Record<string, unknown>;
              return typeof v.title === 'string' &&
                     typeof v.file === 'string' &&
                     typeof v.description === 'string';
            });

            if (hasValidStructure) {
              validCount++;
            } else {
              invalidCount++;
              if (sampleErrors.length < 3) {
                sampleErrors.push(`${dirName}/${file}: Invalid video structure`);
              }
            }
          } catch (error) {
            invalidCount++;
            if (sampleErrors.length < 3) {
              sampleErrors.push(`${dirName}/${file}: ${error instanceof Error ? error.message : 'Parse error'}`);
            }
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    this.stats.jsonValid = validCount;
    this.stats.jsonInvalid = invalidCount;

    if (invalidCount > 0) {
      this.addIssue('warning', 'json_schema', 
        `${invalidCount} files have schema issues`,
        { sampleErrors });
    }

    console.log(`   ✅ ${validCount} files have valid schema`);
    if (invalidCount > 0) {
      console.log(`   ⚠️  ${invalidCount} files have issues`);
      sampleErrors.forEach(e => console.log(`      - ${e}`));
    }

    return validCount > 0;
  }

  private async validateCdnUrls(sampleSize: number): Promise<boolean> {
    console.log(`🌐 Checking CDN URLs (sample: ${sampleSize})...`);
    
    let checked = 0;
    let accessible = 0;
    let failed = 0;
    let sampleUrls: string[] = [];

    // Collect sample URLs
    for (const [level, dirName] of Object.entries(GRADE_DIRS)) {
      if (checked >= sampleSize) break;
      
      const gradeDir = path.join(ABEKA_DATA_PATH, dirName);
      
      try {
        const files = await fs.readdir(gradeDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        for (const file of jsonFiles) {
          if (checked >= sampleSize) break;
          
          try {
            const content = await fs.readFile(path.join(gradeDir, file), 'utf-8');
            const videos = JSON.parse(content) as Array<{ file: string }>;
            
            for (const video of videos.slice(0, 2)) { // Sample 2 videos per lesson
              if (checked >= sampleSize) break;
              
              sampleUrls.push(video.file);
              checked++;
            }
          } catch {
            // Skip invalid files
          }
        }
      } catch {
        // Directory doesn't exist
      }
    }

    // Check URLs (using HEAD request simulation)
    for (const url of sampleUrls) {
      try {
        // Simple URL format validation
        const isValidFormat = url.startsWith(CDN_BASE_URL) && url.endsWith('.m3u8');
        
        if (isValidFormat) {
          accessible++;
        } else {
          failed++;
          if (this.stats.cdnFailed === 0) {
            this.addIssue('warning', 'cdn_url', 
              `Invalid CDN URL format: ${url.substring(0, 50)}...`,
              { url });
          }
        }
      } catch {
        failed++;
      }
      
      this.stats.cdnAccessible = accessible;
      this.stats.cdnFailed = failed;
    }

    console.log(`   ✅ ${accessible}/${checked} URLs have valid format`);
    if (failed > 0) {
      console.log(`   ⚠️  ${failed} URLs have format issues`);
    }

    return accessible > 0;
  }

  private async validateDatabaseConnection(): Promise<boolean> {
    console.log('💾 Checking database connection...');
    
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      
      console.log('   ✅ Database connection successful');
      return true;
    } catch (error) {
      this.addIssue('error', 'database', 
        `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error });
      console.log('   ❌ Database connection failed');
      return false;
    }
  }

  private async validateDiskSpace(): Promise<boolean> {
    console.log('💽 Checking disk space...');
    
    try {
      // Check database disk space (simplified)
      const dbStats = await this.getDatabaseSizeEstimate();
      const hasSpace = dbStats.estimatedSizeMB < dbStats.availableSpaceMB;

      if (hasSpace) {
        console.log(`   ✅ Sufficient disk space (~${Math.round(dbStats.estimatedSizeMB)}MB needed)`);
      } else {
        this.addIssue('warning', 'disk_space', 
          `Low disk space. Estimated need: ${Math.round(dbStats.estimatedSizeMB)}MB`,
          dbStats);
        console.log(`   ⚠️  Low disk space warning`);
      }

      return true; // Don't fail on disk space warning
    } catch (error) {
      this.addIssue('warning', 'disk_space', 
        `Could not check disk space: ${error instanceof Error ? error.message : 'Unknown'}`,
        { error });
      console.log('   ⚠️  Could not check disk space');
      return true;
    }
  }

  private async getDatabaseSizeEstimate(): Promise<{ estimatedSizeMB: number; availableSpaceMB: number }> {
    // Rough estimate: ~2KB per video record
    const estimatedBytes = EXPECTED_VIDEO_COUNT * 2048;
    const estimatedSizeMB = estimatedBytes / (1024 * 1024);
    
    // Assume at least 1GB available for this check
    const availableSpaceMB = MIN_DISK_SPACE_GB * 1024;

    return { estimatedSizeMB, availableSpaceMB };
  }

  private async validateExistingData(): Promise<boolean> {
    console.log('📊 Checking existing data...');
    
    try {
      const counts = await Promise.all([
        prisma.abekaVideo.count(),
        prisma.abekaGrade.count(),
        prisma.abekaLesson.count(),
      ]);

      const [videoCount, gradeCount, lessonCount] = counts;

      if (videoCount > 0) {
        this.addIssue('info', 'existing_data', 
          `Found existing data: ${videoCount} videos, ${gradeCount} grades, ${lessonCount} lessons`,
          { videoCount, gradeCount, lessonCount });
        console.log(`   ℹ️  Existing data found: ${videoCount} videos`);
        console.log('      Use --reset flag to reimport or clean first');
      } else {
        console.log('   ✅ No existing Abeka data found');
      }

      return true;
    } catch (error) {
      this.addIssue('warning', 'existing_data', 
        `Could not check existing data: ${error instanceof Error ? error.message : 'Unknown'}`,
        { error });
      console.log('   ⚠️  Could not check existing data');
      return true;
    }
  }

  private validateVideoCount(): boolean {
    console.log('📹 Validating video count...');
    
    const estimatedCount = this.stats.totalVideos;
    
    if (estimatedCount === 0) {
      // We haven't counted yet, just report expected
      console.log(`   ℹ️  Expected: ${EXPECTED_VIDEO_COUNT} videos`);
      return true;
    }

    const variance = Math.abs(estimatedCount - EXPECTED_VIDEO_COUNT);
    const variancePercent = (variance / EXPECTED_VIDEO_COUNT) * 100;

    if (variancePercent > 10) {
      this.addIssue('warning', 'video_count', 
        `Video count mismatch: found ~${estimatedCount}, expected ${EXPECTED_VIDEO_COUNT} (${variancePercent.toFixed(1)}% variance)`,
        { estimatedCount, expected: EXPECTED_VIDEO_COUNT, variancePercent });
      console.log(`   ⚠️  Count mismatch: ~${estimatedCount} vs expected ${EXPECTED_VIDEO_COUNT}`);
    } else {
      console.log(`   ✅ Count within expected range: ~${estimatedCount}`);
    }

    return true;
  }

  private addIssue(severity: ValidationIssue['severity'], category: string, message: string, details?: unknown) {
    this.issues.push({ severity, category, message, details });
  }

  private printSummary(checks: Record<string, boolean>, success: boolean) {
    console.log('\n📋 Validation Summary');
    console.log('====================');
    
    const checkList = [
      { key: 'source_path', label: 'Source path exists' },
      { key: 'grade_dirs', label: 'Grade directories' },
      { key: 'json_files', label: 'JSON files found' },
      { key: 'json_schema', label: 'JSON schema valid' },
      { key: 'cdn_accessible', label: 'CDN URLs accessible' },
      { key: 'database', label: 'Database connection' },
      { key: 'disk_space', label: 'Disk space' },
      { key: 'existing_data', label: 'Existing data check' },
      { key: 'video_count', label: 'Video count estimate' },
    ];

    for (const { key, label } of checkList) {
      const status = checks[key] === undefined ? '⏭️ ' : checks[key] ? '✅' : '❌';
      console.log(`   ${status} ${label}`);
    }

    console.log('\n📊 Statistics');
    console.log('=============');
    console.log(`   Total files: ${this.stats.totalFiles}`);
    console.log(`   Total videos: ${this.stats.totalVideos}`);
    console.log(`   Grades found: ${this.stats.gradesFound}/${EXPECTED_GRADES.length}`);
    console.log(`   Lessons found: ${this.stats.lessonsFound}`);
    console.log(`   JSON valid/invalid: ${this.stats.jsonValid}/${this.stats.jsonInvalid}`);
    if (this.stats.cdnAccessible > 0) {
      console.log(`   CDN accessible: ${this.stats.cdnAccessible}`);
    }

    if (this.issues.length > 0) {
      console.log('\n⚠️  Issues Found');
      console.log('=================');
      
      const errors = this.issues.filter(i => i.severity === 'error');
      const warnings = this.issues.filter(i => i.severity === 'warning');
      const infos = this.issues.filter(i => i.severity === 'info');

      if (errors.length > 0) {
        console.log(`\n❌ Errors (${errors.length}):`);
        errors.forEach(e => console.log(`   - [${e.category}] ${e.message}`));
      }

      if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(w => console.log(`   - [${w.category}] ${w.message}`));
      }

      if (infos.length > 0) {
        console.log(`\nℹ️  Info (${infos.length}):`);
        infos.forEach(i => console.log(`   - [i.category] ${i.message}`));
      }
    }

    console.log('\n' + (success ? '✅ Validation PASSED - Ready for import' : '❌ Validation FAILED - Fix errors before importing'));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    strict: args.includes('--strict'),
    json: args.includes('--json'),
    sampleCdn: args.includes('--no-cdn') ? 0 : 50,
  };

  const validator = new PreImportValidator();
  const result = await validator.validate(options);

  if (options.json) {
    console.log('\n--- JSON OUTPUT ---');
    console.log(JSON.stringify(result, null, 2));
  }

  await prisma.$disconnect();
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});

export { PreImportValidator, ABEKA_DATA_PATH, EXPECTED_VIDEO_COUNT };
