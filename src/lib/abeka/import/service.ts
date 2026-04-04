import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  AbekaVideoJson, 
  ImportResult, 
  ImportError, 
  ImportSummary, 
  ImportOptions,
  ImportCheckpoint,
  DEFAULT_IMPORT_OPTIONS,
  GRADE_LEVELS,
  ImportMetrics,
} from './types';
import { 
  parseVideoId, 
  parseTeacherName,
  getGradeName, 
  formatGradeName, 
  formatGradeNameVi,
  getSubjectName,
  getSubjectNameVi,
  getSubjectOrder,
  generateVideoKey,
} from './parser';

// Get data path from environment or use default
function getDataPath(): string {
  return process.env.ABEKA_DATA_PATH || 'C:\\Users\\manhquy\\.gemini\\antigravity\\scratch\\abeka_tools\\api\\abeka';
}

// Production-ready Abeka Import Service
export class AbekaImportService {
  private metrics: ImportMetrics = {
    videosPerSecond: 0,
    averageGradeTimeMs: 0,
    dbOperations: 0,
    cdnChecks: 0,
    cacheHits: 0,
    memoryPeakMb: 0,
  };

  private startTime: number = 0;
  private checkpoint: ImportCheckpoint | null = null;
  private seenVideos: Set<string> = new Set();

  constructor(
    private prisma: PrismaClient,
    private options: ImportOptions = DEFAULT_IMPORT_OPTIONS
  ) {
    this.options = { ...DEFAULT_IMPORT_OPTIONS, ...options };
  }

  /**
   * Import all Abeka data from JSON files with full transaction safety
   */
  async importAll(): Promise<ImportSummary> {
    this.startTime = Date.now();
    const startTimeDate = new Date();
    
    console.log('🎓 Starting Abeka Curriculum Import (Production Mode)...');
    console.log(`   Options: dryRun=${this.options.dryRun}, verbose=${this.options.verbose}`);
    console.log(`   Data path: ${getDataPath()}`);
    console.log(`   Batch size: ${this.options.batchSize}`);
    console.log('');

    // Load checkpoint if resuming
    if (this.options.resumeFromCheckpoint && this.options.checkpointFile) {
      await this.loadCheckpoint();
    }

    // Initialize checkpoint
    this.checkpoint = {
      version: '1.0.0',
      startedAt: startTimeDate,
      lastUpdatedAt: startTimeDate,
      completedGrades: this.checkpoint?.completedGrades || [],
      failedGrades: this.checkpoint?.failedGrades || [],
      processedVideos: 0,
      totalVideos: 0,
      errors: [],
      status: 'running',
    };

    const results: ImportResult[] = [];
    let totalVideos = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let criticalErrors = 0;
    const allErrors: ImportError[] = [];

    const gradesToProcess = this.options.grade !== undefined 
      ? [this.options.grade]
      : GRADE_LEVELS.filter(g => !this.checkpoint?.completedGrades.includes(g));

    try {
      for (const grade of gradesToProcess) {
        const gradeStartTime = Date.now();
        
        try {
          this.checkpoint.currentGrade = grade;
          await this.saveCheckpoint();

          const result = await this.importGradeWithRetry(grade);
          results.push(result);
          
          totalVideos += result.videosImported;
          totalCreated += result.videosImported;
          totalUpdated += result.videosUpdated;
          totalSkipped += result.videosSkipped;
          allErrors.push(...result.errors);
          
          // Count critical errors
          criticalErrors += result.errors.filter(e => e.severity === 'critical').length;

          // Mark grade as completed
          if (!this.checkpoint.completedGrades.includes(grade)) {
            this.checkpoint.completedGrades.push(grade);
          }
          
          // Remove from failed if it was there
          this.checkpoint.failedGrades = this.checkpoint.failedGrades.filter(
            f => f.grade !== grade
          );

          this.checkpoint.processedVideos += result.videosImported;
          this.checkpoint.lastUpdatedAt = new Date();
          await this.saveCheckpoint();

          if (this.options.verbose) {
            const duration = Date.now() - gradeStartTime;
            console.log(`   ✅ Grade ${formatGradeName(grade)}: ${result.videosImported} videos in ${duration}ms`);
          }

          // Abort on critical errors if configured
          if (criticalErrors > 0 && this.options.abortOnCriticalError) {
            console.error(`   ❌ Aborting due to ${criticalErrors} critical errors`);
            break;
          }

          // Rate limiting between grades
          if (this.options.rateLimitMs > 0) {
            await this.sleep(this.options.rateLimitMs);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`   ❌ Failed to import grade ${grade}:`, errorMsg);
          
          const importError: ImportError = {
            file: `grade-${grade}`,
            videoTitle: '',
            error: errorMsg,
            severity: 'critical',
            recoverable: false,
          };
          
          allErrors.push(importError);
          criticalErrors++;

          // Track failed grade
          const existing = this.checkpoint.failedGrades.find(f => f.grade === grade);
          if (existing) {
            existing.retryCount++;
            existing.error = errorMsg;
          } else {
            this.checkpoint.failedGrades.push({
              grade,
              error: errorMsg,
              retryCount: 1,
            });
          }

          await this.saveCheckpoint();

          if (this.options.abortOnCriticalError) {
            break;
          }
        }
      }

      const endTime = Date.now();
      const durationMs = endTime - this.startTime;
      
      // Update checkpoint to completed
      this.checkpoint.status = criticalErrors > 0 ? 'failed' : 'completed';
      this.checkpoint.lastUpdatedAt = new Date();
      await this.saveCheckpoint();

      return {
        totalVideos,
        totalVideosProcessed: totalVideos + totalSkipped,
        totalVideosCreated: totalCreated,
        totalVideosUpdated: totalUpdated,
        totalVideosSkipped: totalSkipped,
        gradesProcessed: results.length,
        lessonsProcessed: results.reduce((sum, r) => sum + r.lesson, 0),
        totalErrors: allErrors.length,
        criticalErrors,
        warnings: allErrors.filter(e => e.severity === 'warning').length,
        errors: allErrors,
        results,
        startTime: startTimeDate,
        endTime: new Date(),
        durationMs,
        status: criticalErrors > 0 ? (criticalErrors > 5 ? 'failed' : 'partial') : 'completed',
        checkpoint: this.checkpoint,
      };
    } catch (error) {
      // Update checkpoint to failed
      if (this.checkpoint) {
        this.checkpoint.status = 'failed';
        this.checkpoint.lastUpdatedAt = new Date();
        await this.saveCheckpoint();
      }

      throw error;
    }
  }

  /**
   * Import single grade with transaction safety and retry logic
   */
  private async importGradeWithRetry(gradeLevel: number): Promise<ImportResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await this.importGrade(gradeLevel);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.options.maxRetries) {
          console.warn(`   ⚠️ Grade ${gradeLevel} attempt ${attempt} failed, retrying in ${this.options.retryDelayMs}ms...`);
          await this.sleep(this.options.retryDelayMs * attempt);
        }
      }
    }
    
    throw lastError || new Error(`Failed to import grade ${gradeLevel} after ${this.options.maxRetries} attempts`);
  }

  /**
   * Import single grade with full transaction safety
   */
  async importGrade(gradeLevel: number): Promise<ImportResult> {
    const gradeStartTime = Date.now();
    const gradeName = getGradeName(gradeLevel);
    const gradeDir = path.join(getDataPath(), gradeName);

    console.log(`📚 Importing Grade ${formatGradeName(gradeLevel)}...`);

    // Check if directory exists
    try {
      await fs.access(gradeDir);
    } catch {
      return {
        grade: gradeLevel,
        lesson: 0,
        videosImported: 0,
        videosUpdated: 0,
        videosSkipped: 0,
        errors: [{
          file: gradeDir,
          videoTitle: '',
          error: 'Directory not found',
          severity: 'warning',
          recoverable: true,
        }],
        startTime: new Date(),
        endTime: new Date(),
        durationMs: 0,
      };
    }

    // Read all lesson files
    const lessonFiles = (await fs.readdir(gradeDir))
      .filter(f => f.endsWith('.json'))
      .sort();

    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: ImportError[] = [];

    if (this.options.dryRun) {
      console.log(`   [DRY RUN] Would import ${lessonFiles.length} lessons`);
    }

    // Process in batches for better performance
    const batches = this.chunkArray(lessonFiles, this.options.batchSize);
    
    for (const batch of batches) {
      try {
        // Use transaction for each batch
        await this.prisma.$transaction(async (tx) => {
          for (const file of batch) {
            try {
              const lessonNum = parseInt(file.replace('.json', ''), 10);
              
              if (isNaN(lessonNum)) {
                errors.push({
                  file,
                  videoTitle: '',
                  error: `Invalid lesson number in filename`,
                  severity: 'warning',
                  recoverable: true,
                });
                continue;
              }

              this.checkpoint!.currentLesson = lessonNum;

              const result = await this.importLessonFile(
                path.join(gradeDir, file),
                lessonNum,
                gradeLevel,
                tx
              );
              
              totalImported += result.imported;
              totalUpdated += result.updated;
              totalSkipped += result.skipped;
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              errors.push({
                file,
                videoTitle: '',
                error: errorMsg,
                severity: 'error',
                recoverable: false,
              });
            }
          }
        }, {
          maxWait: 10000,
          timeout: 60000,
        });

        // Rate limiting between batches
        if (this.options.rateLimitMs > 0) {
          await this.sleep(this.options.rateLimitMs);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`   ❌ Batch transaction failed:`, errorMsg);
        
        // Mark all files in batch as failed
        for (const file of batch) {
          errors.push({
            file,
            videoTitle: '',
            error: `Transaction failed: ${errorMsg}`,
            severity: 'error',
            recoverable: false,
          });
        }
      }
    }

    const durationMs = Date.now() - gradeStartTime;
    console.log(`   ✅ Imported ${totalImported} videos (${totalUpdated} updated, ${totalSkipped} skipped) from ${lessonFiles.length} lessons in ${durationMs}ms`);

    return {
      grade: gradeLevel,
      lesson: lessonFiles.length,
      videosImported: totalImported,
      videosUpdated: totalUpdated,
      videosSkipped: totalSkipped,
      errors,
      startTime: new Date(gradeStartTime),
      endTime: new Date(),
      durationMs,
    };
  }

  private async importLessonFile(
    filePath: string,
    lessonNumber: number,
    gradeLevel: number,
    tx: any
  ): Promise<{ imported: number; updated: number; skipped: number }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const videos: AbekaVideoJson[] = JSON.parse(content);

    if (this.options.dryRun) {
      return { imported: videos.length, updated: 0, skipped: 0 };
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Get or create grade
    const grade = await tx.abekaGrade.upsert({
      where: { level: gradeLevel },
      create: {
        level: gradeLevel,
        name: formatGradeName(gradeLevel),
        nameVi: formatGradeNameVi(gradeLevel),
        totalLessons: 170,
      },
      update: {},
    });

    // Get or create lesson
    const lesson = await tx.abekaLesson.upsert({
      where: { 
        gradeId_lessonNumber: { gradeId: grade.id, lessonNumber } 
      },
      create: {
        gradeId: grade.id,
        lessonNumber,
        title: `Lesson ${lessonNumber}`,
      },
      update: {},
    });

    for (const video of videos) {
      try {
        const parsed = parseVideoId(video.file);
        if (!parsed) {
          skippedCount++;
          continue;
        }

        // Check for duplicates
        const videoKey = generateVideoKey(parsed);
        if (this.seenVideos.has(videoKey)) {
          skippedCount++;
          continue;
        }
        this.seenVideos.add(videoKey);

        // Get or create subject
        const subject = await tx.abekaSubject.upsert({
          where: {
            gradeId_code: { gradeId: grade.id, code: parsed.subjectCode },
          },
          create: {
            gradeId: grade.id,
            code: parsed.subjectCode,
            name: getSubjectName(parsed.subjectCode),
            nameVi: getSubjectNameVi(parsed.subjectCode),
            orderNo: getSubjectOrder(parsed.subjectCode),
          },
          update: {},
        });

        // Get or create lesson package
        const lessonPackage = await tx.abekaLessonPackage.upsert({
          where: {
            lessonId_subjectCode: {
              lessonId: lesson.id,
              subjectCode: parsed.subjectCode,
            },
          },
          create: {
            lessonId: lesson.id,
            subjectCode: parsed.subjectCode,
            orderNo: subject.orderNo,
          },
          update: {},
        });

        // Extract m3u8 path from CDN URL
        const m3u8Path = video.file.replace('https://fileta.hoctienganh.xyz/', '');
        const teacherName = parseTeacherName(video.description);

        // Check if video exists
        const existingVideo = await tx.abekaVideo.findUnique({
          where: { videoId: parsed.videoId },
        });

        // Create or update video
        await tx.abekaVideo.upsert({
          where: { videoId: parsed.videoId },
          create: {
            videoId: parsed.videoId,
            gradeLevel,
            lessonNumber,
            subjectCode: parsed.subjectCode,
            title: video.title,
            description: video.description,
            cdnUrl: video.file,
            m3u8Path,
            teacherName,
            lessonPackageId: lessonPackage.id,
          },
          update: {
            title: video.title,
            description: video.description,
            cdnUrl: video.file,
            m3u8Path,
            teacherName,
          },
        });

        if (existingVideo) {
          updatedCount++;
        } else {
          importedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error importing video: ${video.file}`, error);
      }
    }

    return { imported: importedCount, updated: updatedCount, skipped: skippedCount };
  }

  // Helper methods
  private async loadCheckpoint(): Promise<void> {
    if (!this.options.checkpointFile) return;
    
    try {
      const content = await fs.readFile(this.options.checkpointFile, 'utf-8');
      this.checkpoint = JSON.parse(content);
      console.log(`📋 Resumed from checkpoint: ${this.checkpoint?.completedGrades.length} grades completed`);
    } catch {
      console.log('📋 No checkpoint found, starting fresh');
    }
  }

  private async saveCheckpoint(): Promise<void> {
    if (!this.options.checkpointFile || !this.checkpoint) return;
    
    try {
      await fs.writeFile(
        this.options.checkpointFile,
        JSON.stringify(this.checkpoint, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('⚠️ Failed to save checkpoint:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getMetrics(): ImportMetrics {
    return { ...this.metrics };
  }
}
