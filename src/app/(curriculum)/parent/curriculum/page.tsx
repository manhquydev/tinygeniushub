"use client";

import React, { Suspense, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChildProgressCards, 
  StatsCards, 
  SubjectProgressList 
} from "@/components/curriculum/parent/child-progress-cards";
import { StreakDisplay } from "@/components/curriculum/shared/streak-display";
import { ProgressBar } from "@/components/curriculum/shared/progress-bar";
import type { 
  ChildInfo, 
  ProgressDashboardData, 
  SubjectProgress,
  ActivityItem,
  AbekaGradeCode 
} from "@/components/curriculum/types";
import { abekaColors } from "@/components/curriculum/design-tokens";
import { 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Users,
  ChevronRight,
  Flame,
  Clock,
  Target
} from "lucide-react";
import Link from "next/link";

// Mock data for development
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
    lastActive: new Date(Date.now() - 86400000),
  },
];

const mockSubjectProgress: SubjectProgress[] = [
  {
    subjectCode: "PHONICS",
    subjectName: "Phonics",
    lessonsCompleted: 65,
    totalLessons: 100,
    progressPercentage: 65,
    timeSpentMinutes: 1200,
    masteryScore: 85,
  },
  {
    subjectCode: "ARITHMETIC",
    subjectName: "Toán",
    lessonsCompleted: 45,
    totalLessons: 100,
    progressPercentage: 45,
    timeSpentMinutes: 980,
    masteryScore: 70,
  },
  {
    subjectCode: "BIBLE",
    subjectName: "Kinh Thánh",
    lessonsCompleted: 70,
    totalLessons: 100,
    progressPercentage: 70,
    timeSpentMinutes: 800,
    masteryScore: 90,
  },
  {
    subjectCode: "WRITING",
    subjectName: "Viết",
    lessonsCompleted: 35,
    totalLessons: 100,
    progressPercentage: 35,
    timeSpentMinutes: 600,
    masteryScore: 60,
  },
];

const mockRecentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "lesson_completed",
    description: "Hoàn thành Bài 45 - Phonics",
    subjectCode: "PHONICS",
    lessonNumber: 45,
    timestamp: new Date(),
    status: "completed",
  },
  {
    id: "2",
    type: "lesson_started",
    description: "Đang học Bài 45 - Arithmetic",
    subjectCode: "ARITHMETIC",
    lessonNumber: 45,
    timestamp: new Date(Date.now() - 3600000),
    status: "in_progress",
  },
  {
    id: "3",
    type: "lesson_completed",
    description: "Hoàn thành Bài 44 - Tất cả môn",
    timestamp: new Date(Date.now() - 86400000),
    status: "completed",
  },
];

const mockStats = {
  currentStreak: 12,
  longestStreak: 15,
  completedLessons: 215,
  totalLessons: 1700,
  totalMinutes: 3580,
  overallProgress: 26,
};

function ActivityItem({ activity }: { activity: ActivityItem }) {
  const statusIcons = {
    completed: "✅",
    in_progress: "⏱️",
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <span className="text-lg">{statusIcons[activity.status]}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{activity.description}</p>
        <p className="text-xs text-slate-500">
          {activity.timestamp.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-10 w-10 bg-slate-200 rounded-lg mb-3" />
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ParentCurriculumDashboard() {
  const [selectedChildId, setSelectedChildId] = useState<string>(mockChildren[0].id);
  
  const selectedChild = mockChildren.find((c) => c.id === selectedChildId);

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            📊 Tiến Độ Học Tập
          </h1>
          <p className="text-slate-500">
            Theo dõi tiến độ và quản lý lịch học của con
          </p>
        </div>

        {/* Child Selector */}
        <div className="flex items-center gap-2">
          {mockChildren.map((child) => (
            <Button
              key={child.id}
              variant={selectedChildId === child.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChildId(child.id)}
              className="gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
                {child.name.charAt(0)}
              </div>
              {child.name}
            </Button>
          ))}
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        {/* Stats Cards */}
        <StatsCards stats={mockStats} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Subject Progress & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Tiến độ theo môn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubjectProgressList subjects={mockSubjectProgress} />
              </CardContent>
            </Card>

            {/* Weekly Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Lịch tuần này
                </CardTitle>
                <Link href="/parent/curriculum/planner">
                  <Button variant="ghost" size="sm">
                    Chỉnh sửa
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => (
                    <div key={day} className="text-center">
                      <div className="text-xs text-slate-500 mb-1">{day}</div>
                      <div
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                          i < 3
                            ? "bg-green-100 text-green-700"
                            : i === 3
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {i < 3 ? "✓" : i === 3 ? "○" : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {mockRecentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Actions & Child Progress */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">🎯 Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/parent/curriculum/browser" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BookOpen className="h-4 w-4" />
                    Duyệt giáo trình
                  </Button>
                </Link>
                <Link href="/parent/curriculum/planner" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    Lập kế hoạch tuần
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Chuyển đổi học sinh
                </Button>
              </CardContent>
            </Card>

            {/* Current Streak */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Chuỗi ngày học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <StreakDisplay 
                    streak={mockStats.currentStreak} 
                    longestStreak={mockStats.longestStreak}
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Children Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tất cả con
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChildProgressCards
                  children={mockChildren}
                  selectedChildId={selectedChildId}
                  onSelectChild={setSelectedChildId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </Suspense>
    </div>
  );
}
