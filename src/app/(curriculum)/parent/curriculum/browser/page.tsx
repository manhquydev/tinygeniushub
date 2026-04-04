"use client";

import React, { useState, useCallback, Suspense } from "react";
import { LessonBrowser } from "@/components/curriculum/parent/lesson-browser";
import { LessonDetailModal } from "@/components/curriculum/parent/lesson-detail-modal";
import { QuickAssignModal } from "@/components/curriculum/parent/quick-assign-modal";
import type { 
  AbekaLesson, 
  AbekaGrade, 
  AbekaGradeCode,
  ChildInfo 
} from "@/components/curriculum/types";

// Mock data for development
const mockGrades: AbekaGrade[] = [
  { id: "1", code: "K4", name: "K4", nameVi: "K4", orderIndex: 1, totalLessons: 170, color: "#FF9F43" },
  { id: "2", code: "K5", name: "K5", nameVi: "K5", orderIndex: 2, totalLessons: 170, color: "#FF9F43" },
  { id: "3", code: "G1", name: "Lớp 1", nameVi: "Lớp 1", orderIndex: 3, totalLessons: 170, color: "#F368E0" },
  { id: "4", code: "G2", name: "Lớp 2", nameVi: "Lớp 2", orderIndex: 4, totalLessons: 170, color: "#F368E0" },
  { id: "5", code: "G3", name: "Lớp 3", nameVi: "Lớp 3", orderIndex: 5, totalLessons: 170, color: "#54A0FF" },
];

const mockLessons: AbekaLesson[] = [
  {
    id: "1",
    lessonNumber: 1,
    title: "Phonics & Arithmetic Basics",
    bibleVerse: "Genesis 1:1",
    memoryWork: "In the beginning, God created the heavens and the earth.",
    gradeId: "1",
    gradeCode: "K4",
    packages: [
      {
        id: "p1",
        subjectCode: "PHONICS",
        subjectName: "Phonics",
        durationMinutes: 15,
        videos: [
          {
            id: "v1",
            title: "Introduction to Letter A",
            teacherName: "Mrs. Smith",
            durationMinutes: 8,
            thumbnailUrl: "https://picsum.photos/200/112",
            videoUrl: "",
            orderIndex: 1,
          },
        ],
        lessonId: "1",
      },
      {
        id: "p2",
        subjectCode: "ARITHMETIC",
        subjectName: "Arithmetic",
        durationMinutes: 20,
        videos: [
          {
            id: "v2",
            title: "Counting 1-10",
            teacherName: "Mr. Johnson",
            durationMinutes: 12,
            thumbnailUrl: "https://picsum.photos/200/112",
            videoUrl: "",
            orderIndex: 1,
          },
        ],
        lessonId: "1",
      },
    ],
    totalDurationMinutes: 35,
    videoCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    lessonNumber: 2,
    title: "Letter B & Counting 11-20",
    bibleVerse: "Psalm 23:1",
    memoryWork: "The Lord is my shepherd, I shall not want.",
    gradeId: "1",
    gradeCode: "K4",
    packages: [
      {
        id: "p3",
        subjectCode: "PHONICS",
        subjectName: "Phonics",
        durationMinutes: 15,
        videos: [],
        lessonId: "2",
      },
      {
        id: "p4",
        subjectCode: "ARITHMETIC",
        subjectName: "Arithmetic",
        durationMinutes: 25,
        videos: [],
        lessonId: "2",
      },
      {
        id: "p5",
        subjectCode: "BIBLE",
        subjectName: "Bible",
        durationMinutes: 10,
        videos: [],
        lessonId: "2",
      },
    ],
    totalDurationMinutes: 50,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    lessonNumber: 3,
    title: "Colors & Shapes",
    bibleVerse: null,
    memoryWork: null,
    gradeId: "1",
    gradeCode: "K4",
    packages: [
      {
        id: "p6",
        subjectCode: "ACTIVITIES",
        subjectName: "Activities",
        durationMinutes: 30,
        videos: [],
        lessonId: "3",
      },
    ],
    totalDurationMinutes: 30,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    lessonNumber: 1,
    title: "Advanced Phonics",
    bibleVerse: "John 3:16",
    memoryWork: "For God so loved the world...",
    gradeId: "3",
    gradeCode: "G1",
    packages: [
      {
        id: "p7",
        subjectCode: "PHONICS",
        subjectName: "Phonics",
        durationMinutes: 20,
        videos: [],
        lessonId: "4",
      },
      {
        id: "p8",
        subjectCode: "READING",
        subjectName: "Reading",
        durationMinutes: 15,
        videos: [],
        lessonId: "4",
      },
    ],
    totalDurationMinutes: 35,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    lessonNumber: 2,
    title: "Addition & Subtraction",
    bibleVerse: null,
    memoryWork: null,
    gradeId: "3",
    gradeCode: "G1",
    packages: [
      {
        id: "p9",
        subjectCode: "ARITHMETIC",
        subjectName: "Arithmetic",
        durationMinutes: 30,
        videos: [],
        lessonId: "5",
      },
    ],
    totalDurationMinutes: 30,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockChildren: ChildInfo[] = [
  {
    id: "1",
    name: "Emma",
    avatar: "",
    grade: "G1",
    overallProgress: 75,
    streakDays: 12,
    lastActive: new Date(),
  },
  {
    id: "2",
    name: "Jack",
    avatar: "",
    grade: "K5",
    overallProgress: 45,
    streakDays: 7,
    lastActive: new Date(),
  },
];

export default function CurriculumBrowserPage() {
  const [selectedLesson, setSelectedLesson] = useState<AbekaLesson | null>(null);
  const [lessonToAssign, setLessonToAssign] = useState<AbekaLesson | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectLesson = useCallback((lesson: AbekaLesson) => {
    setSelectedLesson(lesson);
    setIsDetailOpen(true);
  }, []);

  const handleAddToPlan = useCallback((lesson: AbekaLesson) => {
    setLessonToAssign(lesson);
    setIsAssignOpen(true);
    setIsDetailOpen(false);
  }, []);

  const handleAssign = async (data: {
    childId: string;
    lessonId: string;
    date: Date;
    subjects: string[];
  }) => {
    // Mock API call
    console.log("Assigning lesson:", data);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsAssignOpen(false);
    setLessonToAssign(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={<div className="flex-1 bg-slate-50" />}>
        <LessonBrowser
          lessons={mockLessons}
          grades={mockGrades}
          isLoading={isLoading}
          onSelectLesson={handleSelectLesson}
          onAddToPlan={handleAddToPlan}
        />
      </Suspense>

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        lesson={selectedLesson}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLesson(null);
        }}
        onAddToPlan={() => {
          if (selectedLesson) {
            handleAddToPlan(selectedLesson);
          }
        }}
      />

      {/* Quick Assign Modal */}
      <QuickAssignModal
        lesson={lessonToAssign}
        children={mockChildren}
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          setLessonToAssign(null);
        }}
        onAssign={handleAssign}
      />
    </div>
  );
}
