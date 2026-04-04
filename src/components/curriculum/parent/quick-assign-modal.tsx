"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { SubjectIcon, getSubjectNameVi } from "../shared/subject-icon";
import type { AbekaLesson, AbekaSubjectCode, ChildInfo } from "../types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, Check, CalendarDays, BookOpen } from "lucide-react";

interface QuickAssignModalProps {
  lesson: AbekaLesson | null;
  children: ChildInfo[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: {
    childId: string;
    lessonId: string;
    date: Date;
    subjects: AbekaSubjectCode[];
  }) => Promise<void>;
}

type AssignStep = "child" | "date" | "subjects" | "confirm";

export function QuickAssignModal({
  lesson,
  children,
  isOpen,
  onClose,
  onAssign,
}: QuickAssignModalProps) {
  const [step, setStep] = useState<AssignStep>("child");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubjects, setSelectedSubjects] = useState<AbekaSubjectCode[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lesson) return null;

  const reset = () => {
    setStep("child");
    setSelectedChildId("");
    setSelectedDate(new Date());
    setSelectedSubjects([]);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleNext = () => {
    if (step === "child") setStep("date");
    else if (step === "date") {
      // Pre-select all subjects by default
      setSelectedSubjects(lesson.packages.map((p) => p.subjectCode));
      setStep("subjects");
    } else if (step === "subjects") setStep("confirm");
  };

  const handleBack = () => {
    if (step === "date") setStep("child");
    else if (step === "subjects") setStep("date");
    else if (step === "confirm") setStep("subjects");
  };

  const handleAssign = async () => {
    if (!selectedChildId || selectedSubjects.length === 0) return;

    setIsSubmitting(true);
    try {
      await onAssign({
        childId: selectedChildId,
        lessonId: lesson.id,
        date: selectedDate,
        subjects: selectedSubjects,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to assign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubject = (subject: AbekaSubjectCode) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const stepProgress = {
    child: 1,
    date: 2,
    subjects: 3,
    confirm: 4,
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>📝 Thêm vào lịch học</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Bước {stepProgress[step]}/4</span>
            <span>
              {step === "child" && "Chọn con"}
              {step === "date" && "Chọn ngày"}
              {step === "subjects" && "Chọn môn"}
              {step === "confirm" && "Xác nhận"}
            </span>
          </div>
          <div className="flex gap-1">
            {["child", "date", "subjects", "confirm"].map((s, i) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  stepProgress[step] > i
                    ? "bg-amber-500"
                    : stepProgress[step] === i + 1
                    ? "bg-amber-300"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step: Select Child */}
        {step === "child" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Chọn con để giao bài học:</p>
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedChildId === child.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                    {child.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{child.name}</div>
                    <div className="text-sm text-slate-500">{child.grade}</div>
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={handleNext}
              disabled={!selectedChildId}
              className="w-full"
            >
              Tiếp theo
            </Button>
          </div>
        )}

        {/* Step: Select Date */}
        {step === "date" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Chọn ngày cho bài học:</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date < new Date()}
              className="rounded-md border mx-auto"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Tiếp theo
              </Button>
            </div>
          </div>
        )}

        {/* Step: Select Subjects */}
        {step === "subjects" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Chọn môn học muốn giao:</p>
            <div className="grid grid-cols-2 gap-2">
              {lesson.packages.map((pkg) => (
                <label
                  key={pkg.subjectCode}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                    selectedSubjects.includes(pkg.subjectCode)
                      ? "border-amber-500 bg-amber-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <Checkbox
                    checked={selectedSubjects.includes(pkg.subjectCode)}
                    onCheckedChange={() => toggleSubject(pkg.subjectCode)}
                  />
                  <SubjectIcon code={pkg.subjectCode} size={18} />
                  <span className="text-sm">{getSubjectNameVi(pkg.subjectCode)}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedSubjects.length === 0}
                className="flex-1"
              >
                Tiếp theo
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Xác nhận giao việc:</p>

            <div className="rounded-lg bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Bài học</div>
                  <div className="font-medium">
                    Bài {lesson.lessonNumber}: {lesson.title || `Bài học ${lesson.lessonNumber}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs">
                  {selectedChild?.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-slate-500">Học sinh</div>
                  <div className="font-medium">{selectedChild?.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-500">Ngày</div>
                  <div className="font-medium">
                    {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 mb-1">Môn học</div>
                <div className="flex flex-wrap gap-1">
                  {selectedSubjects.map((code) => (
                    <Badge key={code} variant="secondary">
                      {getSubjectNameVi(code)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
              <Button
                onClick={handleAssign}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  "Đang lưu..."
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Xác nhận
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
