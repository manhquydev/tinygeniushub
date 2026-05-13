"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubjectIcon, getSubjectNameVi } from "../shared/subject-icon";
import { VideoRow } from "../shared/lesson-card";
import type { AbekaLesson } from "../types";
import { Plus, BookOpen, Clock } from "lucide-react";

interface LessonDetailModalProps {
  lesson: AbekaLesson | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToPlan: () => void;
}

export function LessonDetailModal({
  lesson,
  isOpen,
  onClose,
  onAddToPlan,
}: LessonDetailModalProps) {
  if (!lesson) return null;

  const totalDuration = lesson.packages.reduce(
    (sum, pkg) => sum + (pkg.durationMinutes || 0),
    0
  );
  const videoCount = lesson.packages.reduce(
    (sum, pkg) => sum + pkg.videos.length,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">Lesson {lesson.lessonNumber}</Badge>
            {lesson.bibleVerse && (
              <Badge variant="secondary" className="text-xs">
                📖 {lesson.bibleVerse}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">
            {lesson.title || `Lesson${lesson.lessonNumber}`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 py-4 max-h-[calc(85vh-200px)]">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{lesson.packages.length} subjects</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{totalDuration} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🎥 {videoCount} videos</span>
              </div>
            </div>

            {/* Subject Videos */}
            {lesson.packages.map((pkg) => (
              <div key={pkg.subjectCode} className="space-y-3">
                <div className="flex items-center gap-2">
                  <SubjectIcon code={pkg.subjectCode} size={20} />
                  <h3 className="font-semibold text-slate-800">
                    {getSubjectNameVi(pkg.subjectCode)}
                  </h3>
                  <span className="text-sm text-slate-500">
                    ({pkg.durationMinutes} minutes)
                  </span>
                </div>

                <div className="space-y-2">
                  {pkg.videos.map((video) => (
                    <VideoRow
                      key={video.id}
                      title={video.title}
                      teacher={video.teacherName}
                      duration={video.durationMinutes}
                      thumbnail={video.thumbnailUrl}
                      onPlay={() => {
                        // Open video player
                        console.log("Play video:", video.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Memory Work */}
            {lesson.memoryWork && (
              <div className="rounded-lg p-4 bg-amber-50 border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  📝 Memory exercises
                </h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {lesson.memoryWork}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onAddToPlan} className="gap-2">
            <Plus className="h-4 w-4" />
            Add to Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
