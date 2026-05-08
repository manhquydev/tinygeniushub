#!/usr/bin/env tsx
/**
 * Simple Abeka Video Import Script
 * Reads abeka_database.json and imports to database
 */

import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

interface AbekaVideoJson {
  title: string;
  description: string;
  video_url: string;
  grade: string;
  lesson: number;
}

const SUBJECT_ORDER: Record<string, number> = {
  PHONICS: 1,
  ARITHMETIC: 2,
  COMBINATION: 3,
  ACTIVITIES: 4,
  ROUTINES: 5,
  SEATWORK_C: 6,
  SEATWORK_M: 7,
  SPELLING: 8,
  WRITING_C: 9,
  WRITING_M: 10,
  BIBLE: 11,
  HISTORY: 12,
  SCIENCE: 13,
  HEALTH: 14,
  LITERATURE: 15,
  COMPOSITION: 16,
  VOCABULARY: 17,
  POETRY: 18,
  READING: 19,
  GRAMMAR: 20,
};

// Subject mapping from title
function getSubjectFromTitle(title: string): { code: string; name: string; nameVi: string } {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('phonics')) return { code: 'PHONICS', name: 'Phonics', nameVi: 'Phonics' };
  if (lowerTitle.includes('arithmetic') || lowerTitle.includes('combination')) return { code: 'ARITHMETIC', name: 'Arithmetic', nameVi: 'Số học' };
  if (lowerTitle.includes('activities')) return { code: 'ACTIVITIES', name: 'Activities', nameVi: 'Hoạt động' };
  if (lowerTitle.includes('routines')) return { code: 'ROUTINES', name: 'Routines', nameVi: 'Thói quen' };
  if (lowerTitle.includes('seatwork')) return { code: 'SEATWORK_C', name: 'Seatwork', nameVi: 'Bài tập' };
  if (lowerTitle.includes('spelling')) return { code: 'SPELLING', name: 'Spelling', nameVi: 'Chính tả' };
  if (lowerTitle.includes('writing') || lowerTitle.includes('cursive') || lowerTitle.includes('manuscript')) return { code: 'WRITING_C', name: 'Writing', nameVi: 'Viết' };
  if (lowerTitle.includes('bible')) return { code: 'BIBLE', name: 'Bible', nameVi: 'Kinh thánh' };
  if (lowerTitle.includes('reading')) return { code: 'READING', name: 'Reading', nameVi: 'Đọc hiểu' };
  if (lowerTitle.includes('history')) return { code: 'HISTORY', name: 'History', nameVi: 'Lịch sử' };
  if (lowerTitle.includes('science')) return { code: 'SCIENCE', name: 'Science', nameVi: 'Khoa học' };
  if (lowerTitle.includes('health')) return { code: 'HEALTH', name: 'Health', nameVi: 'Sức khỏe' };
  if (lowerTitle.includes('literature')) return { code: 'LITERATURE', name: 'Literature', nameVi: 'Văn học' };
  if (lowerTitle.includes('composition')) return { code: 'COMPOSITION', name: 'Composition', nameVi: 'Viết văn' };
  if (lowerTitle.includes('vocabulary')) return { code: 'VOCABULARY', name: 'Vocabulary', nameVi: 'Từ vựng' };
  if (lowerTitle.includes('poetry')) return { code: 'POETRY', name: 'Poetry', nameVi: 'Thơ' };
  if (lowerTitle.includes('grammar')) return { code: 'GRAMMAR', name: 'Grammar', nameVi: 'Ngữ pháp' };
  
  return { code: 'ACTIVITIES', name: 'General', nameVi: 'Chung' };
}

// Parse grade from string using canonical mapping:
// K4 -> 0, K5 -> 1, G1 -> 2 ... G12 -> 13
function parseGradeLevel(grade: string): number {
  const normalized = grade.toLowerCase().trim();
  if (normalized === 'k4') return 0;
  if (normalized === 'k5') return 1;
  if (normalized.startsWith('g')) {
    const gradeNo = parseInt(normalized.replace('g', ''), 10);
    if (Number.isFinite(gradeNo)) {
      return gradeNo + 1; // G1 -> 2 ... G12 -> 13
    }
  }
  return 0;
}

// Parse video ID from URL
function parseVideoId(url: string): string {
  const match = url.match(/\/([^\/]+)\.m3u8$/);
  return match ? match[1] : url.split('/').pop() || 'unknown';
}

// Extract teacher from description
function parseTeacher(description: string): string | undefined {
  const match = description.match(/Teacher:\s*([^\s-]+)/);
  return match ? match[1] : undefined;
}

async function main() {
  const dataPath = process.argv[2] || '/var/www/tinygeniushub/data/abeka_database.json';
  
  console.log('🎓 Abeka Video Import');
  console.log('======================');
  console.log(`Data path: ${dataPath}`);
  console.log('');

  // Check if file exists
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ File not found: ${dataPath}`);
    console.log('');
    console.log('Usage: npx tsx scripts/import-abeka-videos.ts [path-to-abeka_database.json]');
    process.exit(1);
  }

  // Read and parse JSON
  console.log('📖 Reading data file...');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const videos: AbekaVideoJson[] = JSON.parse(rawData);
  console.log(`   ✅ Loaded ${videos.length} videos`);
  console.log('');

  // Group by grade
  const gradeMap = new Map<string, AbekaVideoJson[]>();
  for (const video of videos) {
    const list = gradeMap.get(video.grade) || [];
    list.push(video);
    gradeMap.set(video.grade, list);
  }
  console.log(`📊 Found ${gradeMap.size} grades`);
  console.log('');

  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Process each grade
  for (const [gradeStr, gradeVideos] of gradeMap) {
    const gradeLevel = parseGradeLevel(gradeStr);
    console.log(`📚 Processing ${gradeStr} (${gradeVideos.length} videos)...`);

    // Create or find grade
    const normalizedGrade = gradeStr.toLowerCase();
    const gradeName = normalizedGrade === 'k4'
      ? 'K4'
      : normalizedGrade === 'k5'
        ? 'K5'
        : `Grade ${gradeLevel - 1}`;
    const gradeNameVi = normalizedGrade === 'k4'
      ? 'Mầm non K4'
      : normalizedGrade === 'k5'
        ? 'Mầm non K5'
        : `Lớp ${gradeLevel - 1}`;
    
    const grade = await prisma.abekaGrade.upsert({
      where: { level: gradeLevel },
      create: {
        level: gradeLevel,
        name: gradeName,
        nameVi: gradeNameVi,
        totalLessons: 170,
      },
      update: {},
    });

    // Group videos by subject
    const subjectMap = new Map<string, AbekaVideoJson[]>();
    for (const video of gradeVideos) {
      const subjectInfo = getSubjectFromTitle(video.title);
      const key = subjectInfo.code;
      const list = subjectMap.get(key) || [];
      list.push(video);
      subjectMap.set(key, list);
    }

    // Create subjects
    for (const [subjectCode, subjectVideos] of subjectMap) {
      const subjectInfo = getSubjectFromTitle(subjectVideos[0].title);
      
      await prisma.abekaSubject.upsert({
        where: { 
          gradeId_code: {
            gradeId: grade.id,
            code: subjectCode as any,
          }
        },
        create: {
          code: subjectCode as any,
          name: subjectInfo.name,
          nameVi: subjectInfo.nameVi,
          gradeId: grade.id,
          orderNo: SUBJECT_ORDER[subjectCode] ?? 999,
          isCore: true,
        },
        update: {
          name: subjectInfo.name,
          nameVi: subjectInfo.nameVi,
          orderNo: SUBJECT_ORDER[subjectCode] ?? 999,
        },
      });
    }

    // Import videos
    for (const video of gradeVideos) {
      try {
        const subjectInfo = getSubjectFromTitle(video.title);
        const videoId = parseVideoId(video.video_url);
        const teacherName = parseTeacher(video.description);
        const lessonNumber = Number(video.lesson);

        if (!Number.isFinite(lessonNumber) || lessonNumber <= 0) {
          totalSkipped++;
          continue;
        }

        const subject = await prisma.abekaSubject.findUnique({
          where: {
            gradeId_code: {
              gradeId: grade.id,
              code: subjectInfo.code as any,
            },
          },
        });

        if (!subject) {
          totalErrors++;
          continue;
        }

        const lesson = await prisma.abekaLesson.upsert({
          where: {
            gradeId_lessonNumber: {
              gradeId: grade.id,
              lessonNumber,
            },
          },
          create: {
            gradeId: grade.id,
            lessonNumber,
            title: `Lesson ${lessonNumber}`,
          },
          update: {},
        });

        const lessonPackage = await prisma.abekaLessonPackage.upsert({
          where: {
            lessonId_subjectCode: {
              lessonId: lesson.id,
              subjectCode: subjectInfo.code as any,
            },
          },
          create: {
            lessonId: lesson.id,
            subjectCode: subjectInfo.code as any,
            orderNo: subject.orderNo,
          },
          update: {
            orderNo: subject.orderNo,
          },
        });

        // Check if video exists
        const existing = await prisma.abekaVideo.findUnique({
          where: { videoId },
        });

        const data = {
          title: video.title,
          description: video.description,
          gradeLevel,
          lessonNumber,
          subjectCode: subjectInfo.code as any,
          cdnUrl: video.video_url,
          m3u8Path: video.video_url.replace('https://fileta.hoctienganh.xyz', ''),
          teacherName,
          lessonPackageId: lessonPackage.id,
          status: 'PUBLISHED' as const,
        };

        if (existing) {
          await prisma.abekaVideo.update({
            where: { videoId },
            data,
          });
          totalUpdated++;
        } else {
          await prisma.abekaVideo.create({
            data: {
              videoId,
              ...data,
            },
          });
          totalImported++;
        }

        // Progress log every 100
        const processed = totalImported + totalUpdated;
        if (processed > 0 && processed % 100 === 0) {
          process.stdout.write(`\r   📥 Imported: ${totalImported} | Updated: ${totalUpdated} | Skipped: ${totalSkipped} | Errors: ${totalErrors}`);
        }
      } catch (error) {
        totalErrors++;
        console.error(`\n   ❌ Error importing ${video.title}: ${error}`);
      }
    }

    console.log(`   ✅ ${gradeStr} complete`);
  }

  console.log('');
  console.log('📊 Import Summary');
  console.log('==================');
  console.log(`Total Imported: ${totalImported}`);
  console.log(`Total Updated: ${totalUpdated}`);
  console.log(`Total Skipped: ${totalSkipped}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log('');
  console.log('✅ Import complete!');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
