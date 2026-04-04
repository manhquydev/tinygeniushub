"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressBar, CircularProgress } from "../shared/progress-bar";
import { StreakDisplay } from "../shared/streak-display";
import { getGradeName } from "../shared/grade-badge";
import { abekaColors } from "../design-tokens";
import type { ChildInfo, SubjectProgress } from "../types";
import { ChevronRight, Clock, BookOpen, Target } from "lucide-react";

interface ChildProgressCardProps {
  child: ChildInfo;
  onClick?: () => void;
  isSelected?: boolean;
}

export function ChildProgressCard({
  child,
  onClick,
  isSelected = false,
}: ChildProgressCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? "ring-2 ring-amber-500 shadow-md"
          : "hover:-translate-y-0.5"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage src={child.avatar} alt={child.name} />
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              {child.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">
              {child.name}
            </h3>
            <p className="text-sm text-slate-500">{getGradeName(child.grade)}</p>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-slate-800">
              {Math.round(child.overallProgress)}%
            </div>
            <div className="text-xs text-slate-500">hoàn thành</div>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar value={child.overallProgress} size="sm" />
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-500">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: abekaColors.amberDiep }}
            />
            <span>{child.streakDays} ngày streak</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ChildProgressCardsProps {
  children: ChildInfo[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
}

export function ChildProgressCards({
  children,
  selectedChildId,
  onSelectChild,
}: ChildProgressCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => (
        <ChildProgressCard
          key={child.id}
          child={child}
          isSelected={selectedChildId === child.id}
          onClick={() => onSelectChild(child.id)}
        />
      ))}
    </div>
  );
}

interface SubjectProgressBarProps {
  subject: SubjectProgress;
}

export function SubjectProgressBar({ subject }: SubjectProgressBarProps) {
  const hoursSpent = Math.round(subject.timeSpentMinutes / 60 * 10) / 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{subject.subjectName}</span>
          {subject.masteryScore >= 80 && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
              ⭐ Xuất sắc
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-slate-600">
          {subject.progressPercentage}%
        </span>
      </div>

      <ProgressBar
        value={subject.progressPercentage}
        size="md"
        showLabel={false}
      />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {subject.lessonsCompleted}/{subject.totalLessons} bài học
        </span>
        <span>⏱️ {hoursSpent} giờ</span>
      </div>
    </div>
  );
}

interface SubjectProgressListProps {
  subjects: SubjectProgress[];
}

export function SubjectProgressList({ subjects }: SubjectProgressListProps) {
  return (
    <div className="space-y-4">
      {subjects.map((subject) => (
        <SubjectProgressBar key={subject.subjectCode} subject={subject} />
      ))}
    </div>
  );
}

interface StatsCardsProps {
  stats: {
    currentStreak: number;
    longestStreak: number;
    completedLessons: number;
    totalLessons: number;
    totalMinutes: number;
    overallProgress: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: <StreakDisplay streak={stats.currentStreak} showLabel={false} size="sm" />,
      label: "Chuỗi ngày",
      value: stats.currentStreak,
      subtext: `Kỷ lục: ${stats.longestStreak}`,
      color: abekaColors.amberDiep,
    },
    {
      icon: <BookOpen className="h-5 w-5" style={{ color: abekaColors.inkBlue }} />,
      label: "Bài đã học",
      value: stats.completedLessons,
      subtext: `/${stats.totalLessons} bài`,
      color: abekaColors.inkBlue,
    },
    {
      icon: <Clock className="h-5 w-5" style={{ color: abekaColors.chamJade }} />,
      label: "Tổng thời gian",
      value: `${(stats.totalMinutes / 60).toFixed(1)}h`,
      subtext: "từ ngày bắt đầu",
      color: abekaColors.chamJade,
    },
    {
      icon: <Target className="h-5 w-5" style={{ color: abekaColors.grades.G5 }} />,
      label: "Tiến độ",
      value: `${Math.round(stats.overallProgress)}%`,
      subtext: "tổng thể",
      color: abekaColors.grades.G5,
      showProgress: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: `${card.color}15` }}
              >
                {card.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
              </div>
            </div>
            {card.showProgress && (
              <div className="mt-3">
                <ProgressBar value={stats.overallProgress} size="sm" />
              </div>
            )}
            <p className="mt-2 text-xs text-slate-400">{card.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
