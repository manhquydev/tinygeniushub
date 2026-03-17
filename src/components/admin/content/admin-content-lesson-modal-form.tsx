"use client";

import { VideoTusUploader } from "@/components/admin/video-tus-uploader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormEvent } from "react";
import { AdminContentModalShell } from "./admin-content-modal-shell";
import type { LessonFormState, LessonRow } from "./admin-content-types";

type AdminContentLessonModalFormProps = {
  open: boolean;
  title: string;
  mode: "create" | "edit";
  editingLessonId: string | null;
  editingLesson: LessonRow | null;
  editingLessonBunny: { bunnyVideoId: string | null; videoStatus: string } | null;
  form: LessonFormState;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onFormChange: (updater: (current: LessonFormState) => LessonFormState) => void;
  onEditingLessonBunnyChange: (
    updater: (
      current: { bunnyVideoId: string | null; videoStatus: string } | null,
    ) => { bunnyVideoId: string | null; videoStatus: string } | null,
  ) => void;
  onCreateBunnyVideo: () => Promise<void>;
};

export function AdminContentLessonModalForm(props: AdminContentLessonModalFormProps) {
  return (
    <AdminContentModalShell title={props.title} open={props.open} onClose={props.onClose}>
      <form className="grid gap-3" onSubmit={(event) => void props.onSubmit(event)}>
        {props.mode === "create" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="lesson-order">Thứ tự (orderNo)</Label>
              <Input
                id="lesson-order"
                value={props.form.orderNo}
                onChange={(event) => props.onFormChange((current) => ({ ...current, orderNo: event.target.value }))}
                type="number"
                min={1}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lesson-slug">Slug</Label>
              <Input
                id="lesson-slug"
                value={props.form.slug}
                onChange={(event) => props.onFormChange((current) => ({ ...current, slug: event.target.value }))}
                type="text"
                placeholder="unit-1-bai-1"
                required
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
            <p><span className="font-semibold">Thứ tự:</span> {props.editingLesson?.orderNo ?? "-"}</p>
            <p><span className="font-semibold">Slug:</span> {props.editingLesson?.slug ?? "-"}</p>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="lesson-title">Tên bài học</Label>
          <Input id="lesson-title" value={props.form.title} onChange={(event) => props.onFormChange((current) => ({ ...current, title: event.target.value }))} type="text" required />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="lesson-objective">Mục tiêu</Label>
          <Textarea id="lesson-objective" value={props.form.objective} onChange={(event) => props.onFormChange((current) => ({ ...current, objective: event.target.value }))} rows={3} required />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="lesson-minutes">Số phút</Label>
            <Input id="lesson-minutes" value={props.form.estimatedMinutes} onChange={(event) => props.onFormChange((current) => ({ ...current, estimatedMinutes: event.target.value }))} type="number" min={1} max={180} required />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Checkbox
              id="lesson-trial"
              checked={props.form.trialEnabled}
              onCheckedChange={(checked) => props.onFormChange((current) => ({ ...current, trialEnabled: !!checked }))}
            />
            <Label htmlFor="lesson-trial" className="text-sm cursor-pointer">Bật bài học dùng thử</Label>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="lesson-video">Nguồn video</Label>
          <Input id="lesson-video" value={props.form.videoSource} onChange={(event) => props.onFormChange((current) => ({ ...current, videoSource: event.target.value }))} type="text" placeholder="https://..." />
        </div>

        {props.mode === "edit" && props.editingLessonId ? (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">Video Bunny Stream</p>
            {props.editingLessonBunny?.bunnyVideoId ? (
              <p className="text-xs text-slate-600">
                ID: <code>{props.editingLessonBunny.bunnyVideoId}</code> · Trạng thái: <strong>{props.editingLessonBunny.videoStatus}</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500">Chưa có video Bunny</p>
            )}

            {props.editingLessonBunny?.bunnyVideoId ? (
              <VideoTusUploader
                videoId={props.editingLessonBunny.bunnyVideoId}
                lessonId={props.editingLessonId}
                onComplete={() => props.onEditingLessonBunnyChange((current) => (current ? { ...current, videoStatus: "ready" } : current))}
              />
            ) : (
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => void props.onCreateBunnyVideo()}>
                Tạo video Bunny
              </Button>
            )}
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <Label htmlFor="lesson-offline">Nội dung thẻ offline (Markdown)</Label>
          <Textarea id="lesson-offline" value={props.form.offlineCardMarkdown} onChange={(event) => props.onFormChange((current) => ({ ...current, offlineCardMarkdown: event.target.value }))} rows={4} />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="lesson-script">Kịch bản phụ huynh (Markdown)</Label>
          <Textarea id="lesson-script" value={props.form.parentScriptMarkdown} onChange={(event) => props.onFormChange((current) => ({ ...current, parentScriptMarkdown: event.target.value }))} rows={4} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={props.onClose}>Hủy</Button>
          <Button type="submit" disabled={props.submitting} className="bg-teal-600 hover:bg-teal-700">
            {props.submitting ? "Đang lưu..." : props.mode === "create" ? "Tạo bài học" : "Lưu cập nhật"}
          </Button>
        </div>
      </form>
    </AdminContentModalShell>
  );
}
