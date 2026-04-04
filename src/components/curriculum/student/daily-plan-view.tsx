"use client";

/**
 * DailyPlanView Component
 * Shows today's assignments with progress tracking
 * Integrated with Lesson Wizard for video playback
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Play, RotateCcw, Trophy, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDailyPlan, useCompleteLesson } from "../shared/api";
import { SubjectIcon, getSubjectNameVi, getSubjectColor } from "../shared/subject-icon";
import { LessonWizardBridge } from "../lesson-wizard-bridge";
import type { AbekaAssignment, AbekaSubjectCode } from "../types";
import { cn } from "@/lib/utils";

interface DailyPlanViewProps {
  childId: string;
  childName?: string;
  onAssignmentClick?: (assignment: AbekaAssignment) => void;
}

export function DailyPlanView({
  childId,
  childName,
  onAssignmentClick,
}: DailyPlanViewProps) {
  const today = new Date();
  const { data: plan, isLoading, error } = useDailyPlan(childId, today);
  const completeLesson = useCompleteLesson();
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [showCompletionConfetti, setShowCompletionConfetti] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<AbekaAssignment | null>(null);

  // Trigger confetti when all assignments are completed
  useEffect(() => {
    if (plan?.isCompleted && !showCompletionConfetti && !plan.celebratedAt) {
      setShowCompletionConfetti(true);
      // Trigger celebration confetti
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#FF9F43", "#F368E0", "#54A0FF", "#4ECDC4", "#FFD700"];
      
      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [plan?.isCompleted, plan?.celebratedAt, showCompletionConfetti]);

  const handleAssignmentClick = (assignment: AbekaAssignment) => {
    if (assignment.status === "COMPLETED") {
      // Re-watch completed lessons
      setActiveAssignment(assignment);
    } else {
      // Start new lesson
      setActiveAssignment(assignment);
    }
    onAssignmentClick?.(assignment);
  };

  const handleLessonComplete = () => {
    setActiveAssignment(null);
    // Trigger confetti for lesson completion
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#22c55e", "#4ECDC4"],
    });
  };

  const handleCloseLesson = () => {
    setActiveAssignment(null);
  };

  const handleComplete = async (assignmentId: string) => {
    setCelebratingId(assignmentId);
    try {
      await completeLesson.mutateAsync(assignmentId);
      // Small confetti burst for single completion
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#22c55e", "#4ECDC4"],
      });
    } catch (error) {
      console.error("Failed to complete lesson:", error);
    } finally {
      setTimeout(() => setCelebratingId(null), 1000);
    }
  };

  if (isLoading) {
    return <DailyPlanSkeleton />;
  }

  if (error || !plan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Không thể tải kế hoạch hôm nay</p>
          <p className="text-sm text-slate-400">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }

  const completedCount = plan.assignments.filter(
    (a: AbekaAssignment) => a.status === "COMPLETED"
  ).length;
  const progress = Math.round((completedCount / plan.assignments.length) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            🌅 Chào{childName ? ` ${childName}` : ""}!
          </h1>
          <p className="text-slate-500">
            {format(today, "EEEE, d MMMM", { locale: vi })}
          </p>
        </div>
        {plan.isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-green-100 p-2"
          >
            <Trophy className="h-6 w-6 text-green-600" />
          </motion.div>
        )}
      </div>

      {/* Progress Overview */}
      <Card className="overflow-hidden">
        <div
          className={cn(
            "p-4 text-white",
            plan.isCompleted
              ? "bg-gradient-to-r from-green-500 to-emerald-600"
              : "bg-gradient-to-r from-sky-500 to-blue-600"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Tiến độ hôm nay</p>
              <p className="text-2xl font-bold">
                {completedCount}/{plan.assignments.length} môn học
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Thời gian</p>
              <p className="text-2xl font-bold">
                {Math.round((plan.actualMinutes || 0) / 60 * 10) / 10}h
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={progress} className="h-3 bg-white/30" />
          </div>
        </div>
      </Card>

      {/* Assignments List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {plan.assignments.map((assignment: AbekaAssignment, index: number) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              <AssignmentCard
              assignment={assignment}
              onStart={() => handleAssignmentClick(assignment)}
              isCelebrating={celebratingId === assignment.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Daily Reward Preview */}
      {!plan.isCompleted && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  🏆 Phần thưởng đang chờ!
                </p>
                <p className="text-sm text-amber-700">
                  Hoàn thành tất cả để nhận huy hiệu &quot;Ngày Siêng Năng&quot;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {plan.isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-green-50 p-4 text-center"
        >
          <p className="text-lg font-bold text-green-800">
            🎉 Chúc mừng! Hôm nay con đã hoàn thành tất cả bài học!
          </p>
          <p className="text-green-600">Nghỉ ngơi và tận hưởng thành tích này nhé!</p>
        </motion.div>
      )}
      {/* Lesson Wizard Modal */}
      {activeAssignment && (
        <LessonWizardBridge
          childId={childId}
          assignment={activeAssignment}
          onClose={handleCloseLesson}
          onComplete={handleLessonComplete}
        />
      )}
    </div>
  );
}

// Assignment Card Component
interface AssignmentCardProps {
  assignment: AbekaAssignment;
  onStart: () => void;
  isCelebrating: boolean;
}

function AssignmentCard({
  assignment,
  onStart,
  isCelebrating,
}: AssignmentCardProps) {
  const isCompleted = assignment.status === "COMPLETED";
  const isInProgress = assignment.status === "IN_PROGRESS";
  const subjectCode = assignment.subjectCode as AbekaSubjectCode;
  const subjectColor = getSubjectColor(subjectCode);
  const estimatedMinutes = assignment.lessonPackage?.durationMinutes || 15;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isCompleted && "opacity-75",
        isCelebrating && "animate-bounce"
      )}
    >
      <div
        className="h-1"
        style={{ backgroundColor: subjectColor }}
      />
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Subject Icon */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${subjectColor}20` }}
          >
            <SubjectIcon
              code={subjectCode}
              size={28}
              style={{ color: subjectColor }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">
                {getSubjectNameVi(subjectCode)}
              </h3>
              {isCompleted && (
                <Badge variant="default" className="bg-green-500 shrink-0">
                  <Check className="mr-1 h-3 w-3" />
                  Xong
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Bài {assignment.lesson?.lessonNumber || "--"}
            </p>

            {/* Progress Bar - placeholder since AbekaAssignment doesn't have progressPercent */}
            <div className="mt-2">
              <Progress
                value={isCompleted ? 100 : isInProgress ? 50 : 0}
                className="h-2"
              />
            </div>

            {/* Time estimate */}
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{estimatedMinutes} phút</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            size="lg"
            className={cn(
              "rounded-full px-4 shrink-0",
              isCompleted && "bg-green-500 hover:bg-green-600"
            )}
            style={{
              backgroundColor: isCompleted ? undefined : subjectColor,
            }}
            onClick={onStart}
          >
            {isCompleted ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Xem lại
              </>
            ) : isInProgress ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Tiếp tục
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Bắt đầu
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loading state
function DailyPlanSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200"></div>
      <div className="h-32 animate-pulse rounded-xl bg-slate-200"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200"></div>
      ))}
    </div>
  );
}
