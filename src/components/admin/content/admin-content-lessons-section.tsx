"use client";

import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Fragment } from "react";
import { AdminContentLessonActivitiesList } from "./admin-content-lesson-activities-list";
import type { ActivityRow, LessonRow, LevelRow, TrackRow, UnitRow } from "./admin-content-types";
import { toTrackLabel } from "./admin-content-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminContentLessonsSectionProps = {
  lessons: LessonRow[];
  activitiesByLessonId: Record<string, ActivityRow[]>;
  loadingLessons: boolean;
  loadingActivitiesLessonId: string | null;
  selectedTrack: TrackRow | null;
  selectedLevel: LevelRow | null;
  selectedUnit: UnitRow | null;
  expandedLessonId: string | null;
  onToggleLessonExpanded: (lesson: LessonRow) => void;
  onOpenCreateLessonModal: () => void;
  onOpenEditLessonModal: (lesson: LessonRow) => void;
  onToggleTrial: (lesson: LessonRow) => Promise<void>;
  onDeleteLesson: (lesson: LessonRow) => Promise<void>;
  onOpenCreateActivityModal: (lessonId: string) => void;
  onOpenEditActivityModal: (lessonId: string, activity: ActivityRow) => void;
  onDeleteActivity: (lessonId: string, activity: ActivityRow) => Promise<void>;
};

export function AdminContentLessonsSection(props: AdminContentLessonsSectionProps) {
  return (
    <article className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Panel 4 · Lessons</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--admin-text-secondary)]">
            <span>{props.selectedTrack ? toTrackLabel(props.selectedTrack.code) : "Track"}</span>
            <ChevronRight size={12} className="shrink-0" />
            <span>{props.selectedLevel ? `Level ${props.selectedLevel.orderNo}` : "Level"}</span>
            <ChevronRight size={12} className="shrink-0" />
            <span>{props.selectedUnit ? `Unit ${props.selectedUnit.orderNo}` : "Unit"}</span>
          </p>
        </div>
        <Button size="sm" onClick={props.onOpenCreateLessonModal} className="h-8 text-xs gap-1 bg-teal-600 hover:bg-teal-700">
          <Plus size={13} />
          More lessons
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--admin-card-border)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs w-8">#</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Minute</TableHead>
              <TableHead className="text-xs">Try it out</TableHead>
              <TableHead className="text-xs">Activities</TableHead>
              <TableHead className="text-xs">Act</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.lessons.map((lesson) => {
              const isExpanded = props.expandedLessonId === lesson.id;
              const activities = props.activitiesByLessonId[lesson.id] ?? [];
              return (
                <Fragment key={lesson.id}>
                  <TableRow
                    onClick={() => props.onToggleLessonExpanded(lesson)}
                    className={cn("cursor-pointer", isExpanded && "bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]")}
                  >
                    <TableCell className="text-xs">{lesson.orderNo}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-[var(--admin-text-primary)]">{lesson.title}</p>
                      <p className="text-xs text-[var(--admin-text-secondary)]">{lesson.slug}</p>
                    </TableCell>
                    <TableCell className="text-xs">{lesson.estimatedMinutes}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs border", lesson.trialEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)] border-[var(--admin-card-border)]")}>
                        {lesson.trialEnabled ? "Turn on" : "Turn off"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{lesson._count.activities}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => props.onOpenEditLessonModal(lesson)}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => void props.onToggleTrial(lesson)}>
                          Try it out
                        </Button>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => void props.onDeleteLesson(lesson)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-[var(--admin-sidebar-accent)] p-2">
                        <AdminContentLessonActivitiesList
                          lessonId={lesson.id}
                          activities={activities}
                          loadingActivitiesLessonId={props.loadingActivitiesLessonId}
                          onCreateActivity={props.onOpenCreateActivityModal}
                          onEditActivity={props.onOpenEditActivityModal}
                          onDeleteActivity={props.onDeleteActivity}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            {props.loadingLessons && (
              <TableRow><TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">Loading lessons...</TableCell></TableRow>
            )}
            {!props.loadingLessons && props.lessons.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-xs text-[var(--admin-text-secondary)]">{props.selectedUnit ? "No lessons yet." : "Select a unit to view lessons."}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </article>
  );
}
