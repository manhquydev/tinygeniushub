"use client";

import { Fragment, useState } from "react";
import { Lock, PlayCircle } from "lucide-react";
import { CourseLessonPreviewModal } from "@/components/courses/course-lesson-preview-modal";

type Lesson = {
  id: string;
  orderNo: number;
  lesson: {
    id: string;
    title: string;
    estimatedMinutes: number;
    objective: string;
    isPreview: boolean;
  };
};

type Props = {
  lessons: Lesson[];
  totalLessonCount: number;
  courseSlug: string;
  isOwned: boolean;
};

type ModalState = { lessonId: string; title: string; objective: string } | null;

export function CourseDetailCurriculum({ lessons, totalLessonCount, courseSlug, isOwned }: Props) {
  const [modal, setModal] = useState<ModalState>(null);

  const previewCount = lessons.filter((l) => l.lesson.isPreview).length;
  const lockedCount = totalLessonCount - previewCount;
  const showIndicators = !isOwned && previewCount > 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">
        {isOwned ? `${totalLessonCount} bài học trong khóa` : `Xem trước ${lessons.length} bài học đầu tiên`}
      </h2>

      {!isOwned && (
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Tổng {totalLessonCount} bài học — {totalLessonCount - lessons.length} bài còn lại mở ngay sau khi mua.
        </p>
      )}

      {/* Progress dots timeline */}
      {showIndicators && (
        <div className="mt-3 space-y-1.5">
          <div
            className="flex items-center gap-1 overflow-x-auto py-1"
            role="progressbar"
            aria-label={`${previewCount} bài miễn phí, ${lockedCount} bài sau khi mua`}
          >
            {lessons.map((item, i) => (
              <Fragment key={item.id}>
                {i > 0 && <span className="h-px w-3 shrink-0 bg-slate-300" />}
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.lesson.isPreview ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </Fragment>
            ))}
            {totalLessonCount > lessons.length && (
              <>
                <span className="h-px w-3 shrink-0 bg-slate-300" />
                <span className="whitespace-nowrap text-xs text-slate-400">
                  +{totalLessonCount - lessons.length}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-emerald-600">{previewCount} bài đầu miễn phí</span>
            {" · "}
            <span>{lockedCount} bài còn lại sau khi mua</span>
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3">
        {lessons.map((item) => {
          const canPreview = !isOwned && item.lesson.isPreview;
          const isLocked = !isOwned && !item.lesson.isPreview;

          return (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 transition-colors ${
                canPreview
                  ? "cursor-pointer border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
                  : isLocked
                    ? "border-slate-200 bg-slate-50/60 opacity-70"
                    : "border-slate-200 bg-slate-50"
              }`}
              onClick={
                canPreview
                  ? () =>
                      setModal({
                        lessonId: item.lesson.id,
                        title: item.lesson.title,
                        objective: item.lesson.objective,
                      })
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Bài {item.orderNo}
                    </p>
                    {canPreview && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <PlayCircle className="h-3 w-3" />
                        Học thử
                      </span>
                    )}
                    {isLocked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900">{item.lesson.title}</h3>
                  {!isLocked && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.lesson.objective}</p>
                  )}
                </div>
                {!isLocked && (
                  <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right ring-1 ring-slate-200">
                    <p className="text-xs text-slate-500">Thời lượng</p>
                    <p className="text-sm font-bold text-slate-900">{item.lesson.estimatedMinutes} phút</p>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {totalLessonCount > lessons.length ? (
          <p className="text-xs font-semibold text-slate-500">
            +{totalLessonCount - lessons.length} bài tiếp theo sẽ mở sau khi mua khóa.
          </p>
        ) : null}
      </div>

      {modal && (
        <CourseLessonPreviewModal
          lessonId={modal.lessonId}
          lessonTitle={modal.title}
          lessonObjective={modal.objective}
          courseSlug={courseSlug}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
