"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import type { AbVariant } from "@/lib/ab-test-constants";
import { COURSE_TRIAL_PREVIEW_LESSON_LIMIT } from "@/modules/courses/course-trial-constants";
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
  variant: AbVariant;
};

type ModalState = { lessonId: string; title: string; objective: string } | null;

export function CourseDetailCurriculum({ lessons, totalLessonCount, courseSlug, isOwned, variant }: Props) {
  const [modal, setModal] = useState<ModalState>(null);

  const previewLessonCount = Math.min(COURSE_TRIAL_PREVIEW_LESSON_LIMIT, totalLessonCount, lessons.length);
  const lockedCount = Math.max(totalLessonCount - previewLessonCount, 0);
  const showTrialBlock = !isOwned;

  return (
    <section id="curriculum-preview" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">
        {isOwned ? `${totalLessonCount} bài học trong khóa` : `Xem học thử ${previewLessonCount} bài đầu`}
      </h2>

      {!isOwned ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Chạm vào từng bài để xem thử nhanh nội dung trước khi quyết định mua.
        </p>
      ) : null}

      {showTrialBlock ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-700">Trial cố định</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-900">
            Bạn xem trước {previewLessonCount} bài đầu để kiểm tra độ phù hợp trước khi mua.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-emerald-800/90">
            {lockedCount > 0
              ? `Sau bài thứ ${previewLessonCount}, ${lockedCount} bài còn lại sẽ mở khi mua.`
              : "Khóa này hiện mở trọn vẹn trong phạm vi học thử."}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {lessons.map((item) => {
          const canPreview = !isOwned;

          return (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 transition-colors ${
                canPreview
                  ? "cursor-pointer border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50"
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
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                    <PlayCircle className={`h-4.5 w-4.5 ${canPreview ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Bài {item.orderNo}</p>
                      {canPreview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <PlayCircle className="h-3 w-3" />
                          Học thử
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{item.lesson.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.lesson.objective}</p>
                  </div>
                </div>
                <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Thời lượng</p>
                  <p className="text-sm font-bold text-slate-900">{item.lesson.estimatedMinutes} phút</p>
                </div>
              </div>
            </article>
          );
        })}

        {!isOwned && lockedCount > 0 ? (
          <p className="text-xs font-semibold text-slate-500">+{lockedCount} bài tiếp theo sẽ mở sau khi mua khóa.</p>
        ) : null}
      </div>

      {modal ? (
        <CourseLessonPreviewModal
          lessonId={modal.lessonId}
          lessonTitle={modal.title}
          lessonObjective={modal.objective}
          courseSlug={courseSlug}
          variant={variant}
          onClose={() => setModal(null)}
        />
      ) : null}
    </section>
  );
}
