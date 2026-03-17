"use client";

import type { LessonTrialRow } from "./admin-operations-types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type AdminOperationsTrialsSectionProps = {
  lessons: LessonTrialRow[];
  updatingLessonId: string | null;
  onToggleTrial: (lessonId: string, trialEnabled: boolean) => Promise<void>;
};

export function AdminOperationsTrialsSection(props: AdminOperationsTrialsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Bài học dùng thử</h3>
      <div className="space-y-2">
        {props.lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{lesson.title}</p>
              <p className="text-xs text-slate-500">{lesson.slug} - {lesson.trackCode}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="outline" className={lesson.trialEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" : "bg-slate-100 text-slate-600 border-slate-200 text-xs"}>
                {lesson.trialEnabled ? "BẬT" : "TẮT"}
              </Badge>
              <Button
                variant={lesson.trialEnabled ? "destructive" : "default"}
                size="sm"
                onClick={() => void props.onToggleTrial(lesson.id, lesson.trialEnabled)}
                disabled={props.updatingLessonId === lesson.id}
                className="h-7 text-xs"
              >
                {props.updatingLessonId === lesson.id ? "Đang cập nhật..." : lesson.trialEnabled ? "Tắt dùng thử" : "Bật dùng thử"}
              </Button>
            </div>
          </div>
        ))}
        {props.lessons.length === 0 && <p className="text-sm text-slate-500">Chưa có bài học nào.</p>}
      </div>
    </div>
  );
}
