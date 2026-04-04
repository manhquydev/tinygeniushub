import { AbekaSubjectCode } from '@prisma/client';

export interface AbekaVideoJson {
  title: string;
  file: string;        // Full CDN URL
  description: string; // "Subject - Lesson: X - Teacher: Name"
  image: string;       // Thumbnail path
}

export interface ParsedVideo {
  videoId: string;     // e.g., "01PH001F"
  gradeLevel: number;  // 0=K4, 1=K5, 2=Grade1...
  lessonNumber: number;
  subjectCode: AbekaSubjectCode;
  title: string;
  description: string;
  cdnUrl: string;
  teacherName: string;
}

export interface ImportResult {
  grade: number;
  lesson: number;
  videosImported: number;
  videosUpdated: number;
  videosSkipped: number;
  errors: ImportError[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
}

export interface ImportError {
  file: string;
  videoTitle: string;
  videoId?: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;
}

export interface ImportSummary {
  totalVideos: number;
  totalVideosProcessed: number;
  totalVideosCreated: number;
  totalVideosUpdated: number;
  totalVideosSkipped: number;
  gradesProcessed: number;
  lessonsProcessed: number;
  totalErrors: number;
  criticalErrors: number;
  warnings: number;
  errors: ImportError[];
  results: ImportResult[];
  startTime: Date;
  endTime: Date;
  durationMs: number;
  status: 'completed' | 'failed' | 'partial';
  checkpoint?: ImportCheckpoint;
}

export interface ImportOptions {
  dryRun: boolean;
  verbose: boolean;
  grade?: number;
  reset: boolean;
  batchSize: number;
  rateLimitMs: number;
  maxRetries: number;
  retryDelayMs: number;
  skipValidation: boolean;
  verifyCdnUrls: boolean;
  cdnTimeoutMs: number;
  checkpointFile?: string;
  resumeFromCheckpoint: boolean;
  parallelGrades: number;
  abortOnCriticalError: boolean;
  dataPath?: string;
}

export interface ImportCheckpoint {
  version: string;
  startedAt: Date;
  lastUpdatedAt: Date;
  completedGrades: number[];
  failedGrades: Array<{ grade: number; error: string; retryCount: number }>;
  currentGrade?: number;
  currentLesson?: number;
  processedVideos: number;
  totalVideos: number;
  errors: ImportError[];
  status: 'running' | 'paused' | 'completed' | 'failed';
}

export interface ValidationResult {
  isValid: boolean;
  file: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  type: 'schema' | 'duplicate' | 'cdn' | 'parsing' | 'missing_field';
  field?: string;
  message: string;
  videoId?: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  type: 'cdn_slow' | 'cdn_redirect' | 'deprecated' | 'format';
  field?: string;
  message: string;
  videoId?: string;
}

export interface ValidationStats {
  totalVideos: number;
  validVideos: number;
  invalidVideos: number;
  duplicateVideos: number;
  cdnErrors: number;
  cdnSuccess: number;
  cdnSlow: number;
  subjectBreakdown: Record<string, number>;
  gradeBreakdown: Record<string, number>;
}

export interface CdnVerificationResult {
  url: string;
  status: 'ok' | 'error' | 'slow' | 'redirect';
  statusCode?: number;
  responseTimeMs: number;
  error?: string;
  headers?: Record<string, string>;
}

export interface ImportMetrics {
  videosPerSecond: number;
  averageGradeTimeMs: number;
  dbOperations: number;
  cdnChecks: number;
  cacheHits: number;
  memoryPeakMb: number;
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  dryRun: false,
  verbose: false,
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

export const ABEKA_EXPECTED_TOTAL = 20195;

export const GRADE_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // K4-K5, 1-12
