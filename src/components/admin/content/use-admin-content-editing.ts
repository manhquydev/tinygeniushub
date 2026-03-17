"use client";

import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { buildActivitySpec, buildDefaultActivityForm, buildDefaultLessonForm, parseActivityToForm } from "./admin-content-utils";
import type { ActivityFormState, ActivityRow, LessonFormState, LessonRow } from "./admin-content-types";

type UseAdminContentEditingInput = {
  selectedUnitId: string | null;
  lessons: LessonRow[];
  fetchJson: <TData>(url: string, init?: RequestInit) => Promise<TData>;
  loadLessons: (unitId: string) => Promise<void>;
  loadActivitiesForLesson: (lessonId: string) => Promise<void>;
  setLessons: Dispatch<SetStateAction<LessonRow[]>>;
  setActivitiesByLessonId: Dispatch<SetStateAction<Record<string, ActivityRow[]>>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setInfo: Dispatch<SetStateAction<string | null>>;
};

export function useAdminContentEditing(input: UseAdminContentEditingInput) {
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonModalMode, setLessonModalMode] = useState<"create" | "edit">("create");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonBunny, setEditingLessonBunny] = useState<{ bunnyVideoId: string | null; videoStatus: string } | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(buildDefaultLessonForm());
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalMode, setActivityModalMode] = useState<"create" | "edit">("create");
  const [activityTargetLessonId, setActivityTargetLessonId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityFormState>(buildDefaultActivityForm());
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  const editingLesson = useMemo(() => input.lessons.find((lesson) => lesson.id === editingLessonId) ?? null, [editingLessonId, input.lessons]);
  const lessonModalTitle = lessonModalMode === "create" ? "Tạo bài học mới" : "Chỉnh sửa bài học";
  const activityModalTitle = activityModalMode === "create" ? "Tạo activity mới" : "Chỉnh sửa activity";

  function openCreateLessonModal() {
    if (!input.selectedUnitId) { input.setError("Vui lòng chọn đơn vị trước khi tạo bài học."); return; }
    const nextOrderNo = input.lessons.length > 0 ? Math.max(...input.lessons.map((lesson) => lesson.orderNo)) + 1 : 1;
    setLessonModalMode("create"); setEditingLessonId(null); setLessonForm(buildDefaultLessonForm(nextOrderNo)); setLessonModalOpen(true);
  }
  function openEditLessonModal(lesson: LessonRow) {
    setLessonModalMode("edit"); setEditingLessonId(lesson.id); setEditingLessonBunny({ bunnyVideoId: lesson.bunnyVideoId, videoStatus: lesson.videoStatus });
    setLessonForm({ orderNo: String(lesson.orderNo), slug: lesson.slug, title: lesson.title, objective: lesson.objective, estimatedMinutes: String(lesson.estimatedMinutes), trialEnabled: lesson.trialEnabled, videoSource: lesson.videoSource ?? "", offlineCardMarkdown: lesson.offlineCardMarkdown ?? "", parentScriptMarkdown: lesson.parentScriptMarkdown ?? "" });
    setLessonModalOpen(true);
  }
  function closeLessonModal() { setLessonModalOpen(false); }

  async function submitLessonForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.selectedUnitId && lessonModalMode === "create") { input.setError("Vui lòng chọn đơn vị trước khi lưu bài học."); return; }
    setLessonSubmitting(true); input.setError(null); input.setInfo(null);
    try {
      const payload = { unitId: input.selectedUnitId, orderNo: Number.parseInt(lessonForm.orderNo, 10), slug: lessonForm.slug.trim(), title: lessonForm.title.trim(), objective: lessonForm.objective.trim(), estimatedMinutes: Number.parseInt(lessonForm.estimatedMinutes, 10), trialEnabled: lessonForm.trialEnabled, videoSource: lessonForm.videoSource.trim() || null, offlineCardMarkdown: lessonForm.offlineCardMarkdown.trim() || null, parentScriptMarkdown: lessonForm.parentScriptMarkdown.trim() || null };
      if (lessonModalMode === "create") {
        await input.fetchJson<{ lesson: LessonRow }>("/api/admin/content/lessons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      } else if (editingLessonId) {
        await input.fetchJson<{ lesson: LessonRow }>(`/api/admin/content/lessons/${encodeURIComponent(editingLessonId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      }
      if (input.selectedUnitId) await input.loadLessons(input.selectedUnitId);
      closeLessonModal(); input.setInfo(lessonModalMode === "create" ? "Đã tạo bài học." : "Đã cập nhật bài học.");
    } catch (e) { input.setError(e instanceof Error ? e.message : "Lỗi không xác định."); }
    finally { setLessonSubmitting(false); }
  }

  async function handleDeleteLesson(lesson: LessonRow) {
    if (!window.confirm(`Xóa bài học "${lesson.title}"?`)) return;
    input.setError(null); input.setInfo(null);
    try { await input.fetchJson<{ deleted: boolean }>(`/api/admin/content/lessons/${encodeURIComponent(lesson.id)}`, { method: "DELETE" }); if (input.selectedUnitId) await input.loadLessons(input.selectedUnitId); input.setInfo("Đã xóa bài học."); }
    catch (e) { input.setError(e instanceof Error ? e.message : "Lỗi không xác định."); }
  }
  async function handleToggleTrial(lesson: LessonRow) {
    input.setError(null); input.setInfo(null);
    try {
      await input.fetchJson<{ lesson: LessonRow }>(`/api/admin/content/lessons/${encodeURIComponent(lesson.id)}/trial-toggle`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ trialEnabled: !lesson.trialEnabled }) });
      input.setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, trialEnabled: !item.trialEnabled } : item));
    } catch (e) { input.setError(e instanceof Error ? e.message : "Lỗi không xác định."); }
  }

  function openCreateActivityModal(lessonId: string) { setActivityModalMode("create"); setActivityTargetLessonId(lessonId); setEditingActivityId(null); setActivityForm(buildDefaultActivityForm()); setActivityModalOpen(true); }
  function openEditActivityModal(lessonId: string, activity: ActivityRow) { setActivityModalMode("edit"); setActivityTargetLessonId(lessonId); setEditingActivityId(activity.id); setActivityForm(parseActivityToForm(activity)); setActivityModalOpen(true); }
  function closeActivityModal() { setActivityModalOpen(false); }

  async function submitActivityForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityTargetLessonId) { input.setError("Không xác định bài học cho activity."); return; }
    setActivitySubmitting(true); input.setError(null); input.setInfo(null);
    try {
      const payload = { lessonId: activityTargetLessonId, type: activityForm.type, prompt: activityForm.prompt.trim(), passCriteria: Number.parseInt(activityForm.passCriteria, 10), spec: buildActivitySpec(activityForm) };
      if (activityModalMode === "create") await input.fetchJson<{ activity: ActivityRow }>("/api/admin/content/activities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      else if (editingActivityId) await input.fetchJson<{ activity: ActivityRow }>(`/api/admin/content/activities/${encodeURIComponent(editingActivityId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      await input.loadActivitiesForLesson(activityTargetLessonId); closeActivityModal(); input.setInfo(activityModalMode === "create" ? "Đã tạo activity." : "Đã cập nhật activity.");
    } catch (e) { input.setError(e instanceof Error ? e.message : "Lỗi không xác định."); }
    finally { setActivitySubmitting(false); }
  }

  async function handleDeleteActivity(lessonId: string, activity: ActivityRow) {
    if (!window.confirm(`Xóa activity "${activity.prompt}"?`)) return;
    input.setError(null); input.setInfo(null);
    try { await input.fetchJson<{ deleted: boolean }>(`/api/admin/content/activities/${encodeURIComponent(activity.id)}`, { method: "DELETE" }); await input.loadActivitiesForLesson(lessonId); input.setInfo("Đã xóa activity."); }
    catch (e) { input.setError(e instanceof Error ? e.message : "Lỗi không xác định."); }
  }

  async function handleCreateBunnyVideo() {
    if (!editingLessonId) return;
    input.setError(null);
    input.setInfo(null);
    try {
      const title = lessonForm.title.trim() || editingLessonId;
      const response = await fetch("/api/admin/videos/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId: editingLessonId, title }),
      });
      const body = (await response.json()) as { ok: boolean; data?: { videoId: string; uploadUrl: string } };
      if (body.ok && body.data) {
        setEditingLessonBunny({ bunnyVideoId: body.data.videoId, videoStatus: "uploading" });
        return;
      }
      input.setError("Không thể tạo video Bunny. Kiểm tra cấu hình Bunny Stream.");
    } catch (error) {
      input.setError(error instanceof Error ? error.message : "Không thể tạo video Bunny.");
    }
  }

  return {
    lessonModalOpen, lessonModalMode, editingLessonId, editingLessonBunny, lessonForm, lessonSubmitting, activityModalOpen, activityModalMode,
    activityTargetLessonId, editingActivityId, activityForm, activitySubmitting, editingLesson, lessonModalTitle, activityModalTitle,
    setLessonForm, setEditingLessonBunny, setActivityForm, openCreateLessonModal, openEditLessonModal, closeLessonModal, submitLessonForm,
    handleDeleteLesson, handleToggleTrial, handleCreateBunnyVideo, openCreateActivityModal, openEditActivityModal, closeActivityModal, submitActivityForm, handleDeleteActivity,
  };
}
