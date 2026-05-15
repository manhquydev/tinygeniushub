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
      <h3 className="text-sm font-semibold text-[var(--admin-text-primary)]">Trial lesson</h3>
      <div className="space-y-2">
        {props.lessons.map((lesson) => (
          <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--admin-text-primary)] truncate">{lesson.title}</p>
              <p className="text-xs text-[var(--admin-text-secondary)]">{lesson.slug} - {lesson.trackCode}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant="outline" className={lesson.trialEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" : "bg-slate-800 text-slate-400 border-slate-700 text-xs"}>
                {lesson.trialEnabled ? "ON" : "TURN OFF"}
              </Badge>
              <Button
                variant={lesson.trialEnabled ? "destructive" : "default"}
                size="sm"
                onClick={() => void props.onToggleTrial(lesson.id, lesson.trialEnabled)}
                disabled={props.updatingLessonId === lesson.id}
                className="h-7 text-xs"
              >
                {props.updatingLessonId === lesson.id ? "Updating..." : lesson.trialEnabled ? "Turn off trial" : "Enable trial"}
              </Button>
            </div>
          </div>
        ))}
        {props.lessons.length === 0 && <p className="text-sm text-slate-500">There are no lessons yet.</p>}
      </div>
    </div>
  );
}
