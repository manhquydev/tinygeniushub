"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubjectIcon, getSubjectColor } from "../shared/subject-icon";
import { LessonCard } from "../shared/lesson-card";
import { abekaColors } from "../design-tokens";
import type { 
  AbekaLesson, 
  AbekaAssignment, 
  AbekaDailyPlan,
  AbekaWeeklyPlan,
  AbekaSubjectCode
} from "../types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Wand2, 
  Save, 
  X, 
  GripVertical,
  Clock
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";

interface WeeklyPlannerProps {
  weeklyPlan: AbekaWeeklyPlan;
  availableLessons: AbekaLesson[];
  onSave: (plan: AbekaWeeklyPlan) => Promise<void>;
  onAutoGenerate: () => void;
  onMoveLesson: (assignmentId: string, fromDay: number, toDay: number) => void;
  onAddLesson: (dayIndex: number, lesson: AbekaLesson, subjects: AbekaSubjectCode[]) => void;
  onRemoveLesson: (dayIndex: number, assignmentId: string) => void;
}

const DAYS = [
  { key: "mon", label: "T2", fullLabel: "Thứ 2" },
  { key: "tue", label: "T3", fullLabel: "Thứ 3" },
  { key: "wed", label: "T4", fullLabel: "Thứ 4" },
  { key: "thu", label: "T5", fullLabel: "Thứ 5" },
  { key: "fri", label: "T6", fullLabel: "Thứ 6" },
  { key: "sat", label: "T7", fullLabel: "Thứ 7" },
  { key: "sun", label: "CN", fullLabel: "Chủ nhật" },
];

interface SortableAssignmentProps {
  assignment: AbekaAssignment;
  onRemove: () => void;
}

function SortableAssignment({ assignment, onRemove }: SortableAssignmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusColors = {
    NOT_STARTED: "bg-slate-100 text-slate-600",
    IN_PROGRESS: "bg-blue-100 text-blue-600",
    COMPLETED: "bg-green-100 text-green-600",
    OVERDUE: "bg-red-100 text-red-600",
  };

  const statusLabels = {
    NOT_STARTED: "Chưa bắt đầu",
    IN_PROGRESS: "Đang học",
    COMPLETED: "Hoàn thành",
    OVERDUE: "Quá hạn",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className="cursor-grab active:cursor-grabbing p-0.5"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>

        <SubjectIcon
          code={assignment.subjectCode}
          size={16}
        />

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            Bài {assignment.lesson?.lessonNumber || "--"}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            <span>{assignment.lessonPackage?.durationMinutes || "--"} phút</span>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0.5 ${statusColors[assignment.status]}`}
        >
          {statusLabels[assignment.status]}
        </Badge>
      </div>

      <button
        onClick={onRemove}
        className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 group-hover:flex"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

interface DayColumnProps {
  day: typeof DAYS[0];
  dayIndex: number;
  date: Date;
  assignments: AbekaAssignment[];
  onRemove: (assignmentId: string) => void;
}

function DayColumn({ day, dayIndex, date, assignments, onRemove }: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`,
  });

  const totalMinutes = assignments.reduce(
    (sum, a) => sum + (a.lessonPackage?.durationMinutes || 0),
    0
  );

  const isWeekend = dayIndex >= 5;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 transition-colors min-h-[200px] ${
        isOver
          ? "border-amber-500 bg-amber-50"
          : isWeekend
          ? "border-slate-200 bg-slate-50/50"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Day Header */}
      <div className={`p-3 text-center border-b ${isWeekend ? "bg-slate-100/50" : ""}`}>
        <div className="font-semibold text-slate-800">{day.label}</div>
        <div className="text-xs text-slate-500">
          {format(date, "d/M")}
        </div>
      </div>

      {/* Assignments */}
      <div className="flex-1 p-2 space-y-2">
        <SortableContext
          items={assignments.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {assignments.map((assignment) => (
            <SortableAssignment
              key={assignment.id}
              assignment={assignment}
              onRemove={() => onRemove(assignment.id)}
            />
          ))}
        </SortableContext>

        {assignments.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200">
            <span className="text-xs text-slate-400">Kéo bài học vào đây</span>
          </div>
        )}
      </div>

      {/* Day Footer */}
      <div className="p-2 border-t bg-slate-50/50">
        <div
          className={`text-center text-xs font-medium ${
            totalMinutes > 180 ? "text-orange-600" : "text-slate-600"
          }`}
        >
          ⏱️ {Math.round(totalMinutes / 60 * 10) / 10}h
        </div>
      </div>
    </div>
  );
}

interface LessonPoolProps {
  lessons: AbekaLesson[];
  usedLessonIds: string[];
}

function LessonPool({ lessons, usedLessonIds }: LessonPoolProps) {
  const availableLessons = lessons.filter(
    (lesson) => !usedLessonIds.includes(lesson.id)
  );

  return (
    <Card className="w-72 flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📚 Kho Bài Học</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
          {availableLessons.length > 0 ? (
            availableLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="cursor-grab active:cursor-grabbing"
              >
                <LessonCard
                  lesson={lesson}
                  showAddButton={false}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Tất cả bài học đã được thêm vào lịch</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeeklyPlanner({
  weeklyPlan,
  availableLessons,
  onSave,
  onAutoGenerate,
  onMoveLesson,
  onAddLesson,
  onRemoveLesson,
}: WeeklyPlannerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const weekStart = new Date(weeklyPlan.weekStartDate);
  const weekDates = DAYS.map((_, i) => addDays(weekStart, i));

  const usedLessonIds = weeklyPlan.dailyPlans.flatMap((day) =>
    day.assignments.map((a) => a.lessonId)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Moving between days
    if (activeId.startsWith("assignment-") && overId.startsWith("day-")) {
      const assignmentId = activeId.replace("assignment-", "");
      const toDayIndex = parseInt(overId.replace("day-", ""), 10);
      
      // Find which day the assignment is currently in
      const fromDayIndex = weeklyPlan.dailyPlans.findIndex((day) =>
        day.assignments.some((a) => a.id === assignmentId)
      );

      if (fromDayIndex !== -1 && fromDayIndex !== toDayIndex) {
        onMoveLesson(assignmentId, fromDayIndex, toDayIndex);
      }
    }

    setActiveId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(weeklyPlan);
    } finally {
      setIsSaving(false);
    }
  };

  const totalWeekMinutes = weeklyPlan.dailyPlans.reduce(
    (sum, day) =>
      sum +
      day.assignments.reduce(
        (daySum, a) => daySum + (a.lessonPackage?.durationMinutes || 0),
        0
      ),
    0
  );

  const targetHours = 10;
  const actualHours = totalWeekMinutes / 60;
  const isOnTarget = actualHours >= targetHours;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            📅 Tuần {weeklyPlan.weekNumber}
          </h2>
          <p className="text-sm text-slate-500">
            {format(weekStart, "dd/MM/yyyy")} -{" "}
            {format(addDays(weekStart, 6), "dd/MM/yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onAutoGenerate} className="gap-2">
            <Wand2 className="h-4 w-4" />
            Tự động tạo
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Đang lưu..." : "Lưu kế hoạch"}
          </Button>
        </div>
      </div>

      {/* Week Summary */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">
            Tổng: <strong>{actualHours.toFixed(1)} giờ/tuần</strong>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">
            Mục tiêu: <strong>{targetHours} giờ/tuần</strong>
          </span>
        </div>
        <Badge variant={isOnTarget ? "default" : "secondary"}>
          {isOnTarget ? "✅ Đạt mục tiêu" : `Cần thêm ${(targetHours - actualHours).toFixed(1)} giờ`}
        </Badge>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {/* Lesson Pool */}
          <LessonPool lessons={availableLessons} usedLessonIds={usedLessonIds} />

          {/* Weekly Calendar */}
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <DayColumn
                  key={day.key}
                  day={day}
                  dayIndex={index}
                  date={weekDates[index]}
                  assignments={weeklyPlan.dailyPlans[index]?.assignments || []}
                  onRemove={(assignmentId) => onRemoveLesson(index, assignmentId)}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-80 rotate-2 scale-105">
              {/* Drag overlay content */}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
