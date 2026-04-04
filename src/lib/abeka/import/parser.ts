import { AbekaSubjectCode } from '@prisma/client';
import { ParsedVideo } from './types';

/**
 * Subject code mapping from Abeka 2-letter codes to enum values
 */
export const SUBJECT_CODE_MAP: Record<string, AbekaSubjectCode> = {
  'PH': 'PHONICS',
  'AT': 'ARITHMETIC',
  'AB': 'COMBINATION',
  'AC': 'ACTIVITIES',
  'HA': 'ROUTINES',
  'SE': 'SEATWORK_C',
  'SM': 'SEATWORK_M',
  'SP': 'SPELLING',        // Spelling (takes precedence over Speech)
  'CW': 'WRITING_C',
  'MW': 'WRITING_M',
  'BI': 'BIBLE',
  'HI': 'HISTORY',
  'SC': 'SCIENCE',
  'HE': 'HEALTH',
  'LT': 'LITERATURE',
  'CO': 'COMPOSITION',
  'VO': 'VOCABULARY',
  'PO': 'POETRY',
  'RE': 'READING',
  'GR': 'GRAMMAR',
  // Additional codes for K4/K5
  'NU': 'ARITHMETIC',      // K5 Numbers
  'LD': 'ACTIVITIES',      // K4 Language Development
  'SD': 'ACTIVITIES',      // K4 Skills Development
  'ES': 'ACTIVITIES',      // K5 Elementary Spanish
  'EN': 'READING',         // English (various grades)
  'EC': 'ARITHMETIC',      // Economics (G12)
  'PC': 'ARITHMETIC',      // Precalculus (G12)
  'BY': 'SCIENCE',         // Biology
  'WH': 'HISTORY',         // World History
  'A2': 'ARITHMETIC',      // Algebra 2
  'DP': 'ACTIVITIES',      // Document Processing
  'FS': 'ACTIVITIES',      // Culinary Life Skills
  'RV': 'BIBLE',           // Revelation
  'SA': 'ACTIVITIES',      // Spanish 2
  'AG': 'HISTORY',         // American Government
  'OG': 'BIBLE',           // Old Testament
  'EA': 'READING',         // AM Elephants
  'EP': 'READING',         // PM Elephants
  'GA': 'READING',         // AM Giraffes
  'GP': 'READING',         // PM Giraffes
  'MA': 'READING',         // AM Monkeys
  'MP': 'READING',         // PM Monkeys
};

/**
 * Known but unmapped subject codes (for warning purposes)
 */
export const KNOWN_UNMAPPED_CODES = new Set([
  'PE', 'AR', 'MU', 'DR', 'CM', // Specials that don't have video
  'OT', 'NT', // Old/New Testament (handled by BI/RV/OG)
]);

/**
 * Parse Abeka video filename into structured data
 * Format: {grade}{subject}{lesson}{type}
 * Example: "01PH001F" = Grade 1, Phonics, Lesson 1, Full
 */
export function parseVideoId(filename: string): ParsedVideo | null {
  // Extract base name from URL
  const baseName = filename.split('/').pop()?.replace('.m3u8', '');
  if (!baseName) return null;

  // Handle variant codes like "10A2001-AR1.1E"
  const cleanCode = baseName.split('-')[0];
  
  // Pattern: 2 digits grade + 2 chars subject + 3 digits lesson + 1 char type
  // Also handles K4/K5 format: K4 + 2 chars subject + 3 digits lesson + 1 char type
  const match = cleanCode.match(/^((?:\d{2}|K[45]))([A-Z]{2})(\d{3})([A-Z])/);
  if (!match) return null;

  const [, gradeStr, subjectCode, lessonStr] = match;

  // Skip unmapped special codes gracefully
  if (KNOWN_UNMAPPED_CODES.has(subjectCode)) {
    return null;
  }

  // Convert grade string to number
  let gradeLevel: number;
  if (gradeStr.startsWith('K')) {
    gradeLevel = gradeStr === 'K4' ? 0 : 1;
  } else {
    // Numeric grades: 01 = Grade 1 (level 2), 02 = Grade 2 (level 3), etc.
    const gradeNum = parseInt(gradeStr, 10);
    gradeLevel = gradeNum + 1; // 01 -> 2 (Grade 1), 12 -> 13 (Grade 12)
  }

  const mappedSubject = SUBJECT_CODE_MAP[subjectCode];
  if (!mappedSubject) {
    console.warn(`Unknown subject code: ${subjectCode} in ${baseName}`);
    return null;
  }

  return {
    videoId: baseName,
    gradeLevel,
    lessonNumber: parseInt(lessonStr, 10),
    subjectCode: mappedSubject,
    title: '',
    description: '',
    cdnUrl: '',
    teacherName: '',
  };
}

/**
 * Validate if a video ID format is correct
 */
export function isValidVideoId(filename: string): boolean {
  const baseName = filename.split('/').pop()?.replace('.m3u8', '');
  if (!baseName) return false;

  const cleanCode = baseName.split('-')[0];
  const match = cleanCode.match(/^((?:\d{2}|K[45]))([A-Z]{2})(\d{3})([A-Z])/);
  if (!match) return false;

  const [, gradeStr, subjectCode] = match;
  
  // Validate grade exists
  if (gradeStr.startsWith('K')) {
    if (!['K4', 'K5'].includes(gradeStr)) return false;
  } else {
    const gradeNum = parseInt(gradeStr, 10);
    if (gradeNum < 1 || gradeNum > 12) return false;
  }

  // Validate subject is known (either mapped or known unmapped)
  return !!SUBJECT_CODE_MAP[subjectCode] || KNOWN_UNMAPPED_CODES.has(subjectCode);
}

/**
 * Extract teacher name from description
 * Format: "Subject - Lesson: X - Teacher: Name"
 */
export function parseTeacherName(description: string): string {
  const match = description.match(/Teacher:\s*([^-]+)/i);
  return match ? match[1].trim() : 'Unknown';
}

/**
 * Extract lesson number from description as fallback
 */
export function parseLessonNumber(description: string): number | null {
  const match = description.match(/Lesson:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get grade name from level for directory path
 */
export function getGradeName(level: number): string {
  if (level === 0) return '13'; // K4 directory
  if (level === 1) return '14'; // K5 directory
  return String(level - 1).padStart(2, '0'); // Grade 1 = 01, Grade 2 = 02, etc.
}

/**
 * Get display name for grade
 */
export function formatGradeName(level: number): string {
  if (level === 0) return 'K4';
  if (level === 1) return 'K5';
  return `Grade ${level - 1}`;
}

/**
 * Get Vietnamese display name for grade
 */
export function formatGradeNameVi(level: number): string {
  if (level === 0) return 'Mầm 4 tuổi';
  if (level === 1) return 'Mầm 5 tuổi';
  return `Lớp ${level - 1}`;
}

/**
 * Get subject name from code
 */
export function getSubjectName(code: AbekaSubjectCode): string {
  const names: Record<AbekaSubjectCode, string> = {
    'PHONICS': 'Phonics',
    'ARITHMETIC': 'Arithmetic',
    'COMBINATION': 'Combination Practice',
    'ACTIVITIES': 'Activities',
    'ROUTINES': 'Classroom Routines',
    'SEATWORK_C': 'Seatwork (Cursive)',
    'SEATWORK_M': 'Seatwork (Manuscript)',
    'SPELLING': 'Spelling',
    'WRITING_C': 'Writing (Cursive)',
    'WRITING_M': 'Writing (Manuscript)',
    'BIBLE': 'Bible',
    'HISTORY': 'History',
    'SCIENCE': 'Science',
    'HEALTH': 'Health',
    'LITERATURE': 'Literature',
    'COMPOSITION': 'Composition',
    'VOCABULARY': 'Vocabulary',
    'POETRY': 'Poetry',
    'READING': 'Reading',
    'GRAMMAR': 'Grammar',
  };
  return names[code] || code;
}

/**
 * Get Vietnamese subject name from code
 */
export function getSubjectNameVi(code: AbekaSubjectCode): string {
  const names: Record<AbekaSubjectCode, string> = {
    'PHONICS': 'Học vần',
    'ARITHMETIC': 'Toán học',
    'COMBINATION': 'Luyện tập Toán',
    'ACTIVITIES': 'Hoạt động',
    'ROUTINES': 'Thói quen lớp học',
    'SEATWORK_C': 'Bài tập (Chữ viết tắt)',
    'SEATWORK_M': 'Bài tập (Chữ in)',
    'SPELLING': 'Chính tả',
    'WRITING_C': 'Viết (Chữ viết tắt)',
    'WRITING_M': 'Viết (Chữ in)',
    'BIBLE': 'Kinh Thánh',
    'HISTORY': 'Lịch sử',
    'SCIENCE': 'Khoa học',
    'HEALTH': 'Sức khỏe',
    'LITERATURE': 'Văn học',
    'COMPOSITION': 'Viết văn',
    'VOCABULARY': 'Từ vựng',
    'POETRY': 'Thơ',
    'READING': 'Đọc hiểu',
    'GRAMMAR': 'Ngữ pháp',
  };
  return names[code] || code;
}

/**
 * Get display order for subject
 */
export function getSubjectOrder(code: AbekaSubjectCode): number {
  const orders: Record<AbekaSubjectCode, number> = {
    'BIBLE': 1,
    'PHONICS': 2,
    'READING': 3,
    'ARITHMETIC': 4,
    'COMBINATION': 5,
    'ACTIVITIES': 6,
    'ROUTINES': 7,
    'SEATWORK_C': 8,
    'SEATWORK_M': 9,
    'SPELLING': 10,
    'WRITING_C': 11,
    'WRITING_M': 12,
    'HISTORY': 13,
    'SCIENCE': 14,
    'HEALTH': 15,
    'LITERATURE': 16,
    'COMPOSITION': 17,
    'VOCABULARY': 18,
    'POETRY': 19,
    'GRAMMAR': 20,
  };
  return orders[code] || 99;
}

/**
 * Generate a unique video key for deduplication
 */
export function generateVideoKey(parsed: ParsedVideo): string {
  return `${parsed.gradeLevel}-${parsed.subjectCode}-${parsed.lessonNumber}-${parsed.videoId}`;
}
