"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ActivityRow } from "./admin-content-types";
import { getActivityTypeLabel, shortText } from "./admin-content-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AdminContentLessonActivitiesListProps = {
  lessonId: string;
  activities: ActivityRow[];
  loadingActivitiesLessonId: string | null;
  onCreateActivity: (lessonId: string) => void;
  onEditActivity: (lessonId: string, activity: ActivityRow) => void;
  onDeleteActivity: (lessonId: string, activity: ActivityRow) => Promise<void>;
};

export function AdminContentLessonActivitiesList(props: AdminContentLessonActivitiesListProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Activities</p>
        <Button size="sm" onClick={() => props.onCreateActivity(props.lessonId)} className="h-7 text-xs gap-1 bg-teal-600 hover:bg-teal-700">
          <Plus size={12} />
          Thêm câu hỏi
        </Button>
      </div>

      {props.loadingActivitiesLessonId === props.lessonId ? (
        <p className="text-xs text-slate-500">Đang tải activities...</p>
      ) : null}

      <ul className="space-y-1.5 p-0">
        {props.activities.map((activity) => (
          <li
            key={activity.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">{getActivityTypeLabel(activity.type)}</Badge>
                <span className="text-xs font-semibold text-slate-500">{activity.passCriteria}%</span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{shortText(activity.prompt, 50)}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => props.onEditActivity(props.lessonId, activity)}>
                <Pencil size={12} />
              </Button>
              <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => void props.onDeleteActivity(props.lessonId, activity)}>
                <Trash2 size={12} />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {props.activities.length === 0 && props.loadingActivitiesLessonId !== props.lessonId ? (
        <p className="text-xs text-slate-500">Chưa có hoạt động.</p>
      ) : null}
    </div>
  );
}
