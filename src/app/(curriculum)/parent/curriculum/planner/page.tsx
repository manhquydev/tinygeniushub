"use client";

import React, { useState, Suspense } from "react";
import { WeeklyPlanner } from "@/components/curriculum/parent/weekly-planner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { 
  AbekaWeeklyPlan, 
  AbekaLesson, 
  AbekaDailyPlan,
  AbekaAssignment,
  AbekaSubjectCode
} from "@/components/curriculum/types";
import { addWeeks, subWeeks, format, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";

// Mock data
const mockAvailableLessons: AbekaLesson[] = [
  {
    id: "lesson-1",
    lessonNumber: 135,
    title: "Phonics & Arithmetic",
    bibleVerse: "Genesis 1:1",
    memoryWork: "In the beginning...",
    gradeId: "grade-1",
    gradeCode: "G1",
    packages: [
      {
        id: "pkg-1",
        subjectCode: "PHONICS",
        subjectName: "Phonics",
        durationMinutes: 15,
        videos: [],
        lessonId: "lesson-1",
      },
      {
        id: "pkg-2",
        subjectCode: "ARITHMETIC",
        subjectName: "Arithmetic",
        durationMinutes: 20,
        videos: [],
        lessonId: "lesson-1",
      },
    ],
    totalDurationMinutes: 35,
    videoCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "lesson-2",
    lessonNumber: 136,
    title: "Reading & Writing",
    bibleVerse: null,
    memoryWork: null,
    gradeId: "grade-1",
    gradeCode: "G1",
    packages: [
      {
        id: "pkg-3",
        subjectCode: "READING",
        subjectName: "Reading",
        durationMinutes: 25,
        videos: [],
        lessonId: "lesson-2",
      },
      {
        id: "pkg-4",
        subjectCode: "WRITING",
        subjectName: "Writing",
        durationMinutes: 15,
        videos: [],
        lessonId: "lesson-2",
      },
    ],
    totalDurationMinutes: 40,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "lesson-3",
    lessonNumber: 137,
    title: "Science & Activities",
    bibleVerse: "Psalm 19:1",
    memoryWork: "The heavens declare...",
    gradeId: "grade-1",
    gradeCode: "G1",
    packages: [
      {
        id: "pkg-5",
        subjectCode: "SCIENCE",
        subjectName: "Science",
        durationMinutes: 20,
        videos: [],
        lessonId: "lesson-3",
      },
      {
        id: "pkg-6",
        subjectCode: "ACTIVITIES",
        subjectName: "Activities",
        durationMinutes: 30,
        videos: [],
        lessonId: "lesson-3",
      },
    ],
    totalDurationMinutes: 50,
    videoCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockWeeklyPlan: AbekaWeeklyPlan = {
  id: "plan-1",
  journeyId: "journey-1",
  childId: "child-1",
  weekNumber: 14,
  weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
  weekEndDate: new Date(),
  dailyPlans: [
    {
      id: "day-1",
      date: new Date(),
      dayOfWeek: 1,
      assignments: [
        {
          id: "assignment-1",
          childId: "child-1",
          lessonId: "lesson-1",
          lessonPackageId: "pkg-1",
          subjectCode: "PHONICS",
          status: "COMPLETED",
          date: new Date(),
          lesson: mockAvailableLessons[0],
          lessonPackage: mockAvailableLessons[0].packages[0],
        },
        {
          id: "assignment-2",
          childId: "child-1",
          lessonId: "lesson-1",
          lessonPackageId: "pkg-2",
          subjectCode: "ARITHMETIC",
          status: "IN_PROGRESS",
          date: new Date(),
          lesson: mockAvailableLessons[0],
          lessonPackage: mockAvailableLessons[0].packages[1],
        },
      ],
      totalMinutes: 35,
      isRestDay: false,
    },
    {
      id: "day-2",
      date: new Date(),
      dayOfWeek: 2,
      assignments: [
        {
          id: "assignment-3",
          childId: "child-1",
          lessonId: "lesson-2",
          lessonPackageId: "pkg-3",
          subjectCode: "READING",
          status: "NOT_STARTED",
          date: new Date(),
          lesson: mockAvailableLessons[1],
          lessonPackage: mockAvailableLessons[1].packages[0],
        },
      ],
      totalMinutes: 25,
      isRestDay: false,
    },
    {
      id: "day-3",
      date: new Date(),
      dayOfWeek: 3,
      assignments: [],
      totalMinutes: 0,
      isRestDay: false,
    },
    {
      id: "day-4",
      date: new Date(),
      dayOfWeek: 4,
      assignments: [],
      totalMinutes: 0,
      isRestDay: false,
    },
    {
      id: "day-5",
      date: new Date(),
      dayOfWeek: 5,
      assignments: [],
      totalMinutes: 0,
      isRestDay: false,
    },
    {
      id: "day-6",
      date: new Date(),
      dayOfWeek: 6,
      assignments: [],
      totalMinutes: 0,
      isRestDay: true,
    },
    {
      id: "day-7",
      date: new Date(),
      dayOfWeek: 0,
      assignments: [],
      totalMinutes: 0,
      isRestDay: true,
    },
  ],
  totalLessons: 2,
  totalMinutes: 60,
  isComplete: false,
};

export default function WeeklyPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weeklyPlan, setWeeklyPlan] = useState<AbekaWeeklyPlan>(mockWeeklyPlan);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrevWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  const handleSave = async (plan: AbekaWeeklyPlan) => {
    setIsLoading(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Saving plan:", plan);
    setIsLoading(false);
  };

  const handleAutoGenerate = () => {
    // Mock auto-generate functionality
    console.log("Auto-generating plan...");
  };

  const handleMoveLesson = (assignmentId: string, fromDay: number, toDay: number) => {
    setWeeklyPlan((prev) => {
      const newDailyPlans = [...prev.dailyPlans];
      const assignment = newDailyPlans[fromDay].assignments.find(
        (a) => a.id === assignmentId
      );
      
      if (assignment) {
        newDailyPlans[fromDay].assignments = newDailyPlans[fromDay].assignments.filter(
          (a) => a.id !== assignmentId
        );
        newDailyPlans[toDay].assignments = [...newDailyPlans[toDay].assignments, assignment];
      }
      
      return { ...prev, dailyPlans: newDailyPlans };
    });
  };

  const handleAddLesson = (
    dayIndex: number,
    lesson: AbekaLesson,
    subjects: AbekaSubjectCode[]
  ) => {
    setWeeklyPlan((prev) => {
      const newDailyPlans = [...prev.dailyPlans];
      
      subjects.forEach((subjectCode) => {
        const pkg = lesson.packages.find((p) => p.subjectCode === subjectCode);
        if (pkg) {
          const newAssignment: AbekaAssignment = {
            id: `new-${Date.now()}-${subjectCode}`,
            childId: prev.childId,
            lessonId: lesson.id,
            lessonPackageId: pkg.id,
            subjectCode,
            status: "NOT_STARTED",
            date: newDailyPlans[dayIndex].date,
            lesson,
            lessonPackage: pkg,
          };
          newDailyPlans[dayIndex].assignments.push(newAssignment);
        }
      });
      
      return { ...prev, dailyPlans: newDailyPlans };
    });
  };

  const handleRemoveLesson = (dayIndex: number, assignmentId: string) => {
    setWeeklyPlan((prev) => {
      const newDailyPlans = [...prev.dailyPlans];
      newDailyPlans[dayIndex].assignments = newDailyPlans[dayIndex].assignments.filter(
        (a) => a.id !== assignmentId
      );
      return { ...prev, dailyPlans: newDailyPlans };
    });
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            📅 Kế Hoạch Học Tập
          </h1>
          <p className="text-slate-500">
            Lập lịch học tập hàng tuần cho con
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentWeek, "MMMM yyyy", { locale: vi })}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 bg-slate-100 rounded-xl animate-pulse" />}>
        <WeeklyPlanner
          weeklyPlan={weeklyPlan}
          availableLessons={mockAvailableLessons}
          onSave={handleSave}
          onAutoGenerate={handleAutoGenerate}
          onMoveLesson={handleMoveLesson}
          onAddLesson={handleAddLesson}
          onRemoveLesson={handleRemoveLesson}
        />
      </Suspense>
    </div>
  );
}
