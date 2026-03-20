"use client";

import { BookOpen, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoTusUploader } from "@/components/admin/video-tus-uploader";

type ApiResponse<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message?: string;
  };
};

type TrackRow = {
  id: string;
  code: "ENGLISH" | "MATH" | "HABIT" | string;
  title: string;
  isTrialEnabled: boolean;
  _count: {
    levels: number;
    units: number;
    lessons: number;
  };
};

type LevelRow = {
  id: string;
  trackId: string;
  orderNo: number;
  title: string;
  _count: {
    units: number;
  };
};

type UnitRow = {
  id: string;
  levelId: string;
  orderNo: number;
  title: string;
  _count: {
    lessons: number;
  };
};

type LessonRow = {
  id: string;
  unitId: string;
  orderNo: number;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  videoSource: string | null;
  bunnyVideoId: string | null;
  videoStatus: string;
  offlineCardMarkdown: string | null;
  parentScriptMarkdown: string | null;
  _count: {
    activities: number;
    completions: number;
  };
};

type ActivityType = "MCQ" | "TRUE_FALSE" | "WORD_MATCH" | "FILL_BLANK";

type ActivityRow = {
  id: string;
  lessonId: string;
  type: ActivityType;
  prompt: string;
  passCriteria: number;
  spec: unknown;
};

type LessonFormState = {
  orderNo: string;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: string;
  trialEnabled: boolean;
  videoSource: string;
  offlineCardMarkdown: string;
  parentScriptMarkdown: string;
};

type McqChoiceForm = {
  id: string;
  text: string;
};

type WordPairForm = {
  id: string;
  left: string;
  right: string;
};

type ActivityFormState = {
  type: ActivityType;
  prompt: string;
  passCriteria: string;
  mcqChoices: McqChoiceForm[];
  mcqCorrectChoiceId: string;
  trueFalseAnswer: boolean;
  wordPairs: WordPairForm[];
  fillSentence: string;
  fillAnswer: string;
  fillHint: string;
};

function shortText(value: string, max = 50) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1)}…`;
}

function toTrackLabel(code: string) {
  if (code === "ENGLISH") {
    return "Tiếng Anh";
  }

  if (code === "MATH") {
    return "Toán";
  }

  if (code === "HABIT") {
    return "Thói quen";
  }

  return code;
}

function buildDefaultLessonForm(nextOrderNo = 1): LessonFormState {
  return {
    orderNo: String(nextOrderNo),
    slug: "",
    title: "",
    objective: "",
    estimatedMinutes: "15",
    trialEnabled: false,
    videoSource: "",
    offlineCardMarkdown: "",
    parentScriptMarkdown: "",
  };
}

function buildDefaultActivityForm(): ActivityFormState {
  return {
    type: "MCQ",
    prompt: "",
    passCriteria: "80",
    mcqChoices: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    mcqCorrectChoiceId: "a",
    trueFalseAnswer: true,
    wordPairs: [{ id: "p1", left: "", right: "" }],
    fillSentence: "",
    fillAnswer: "",
    fillHint: "",
  };
}

function parseActivityToForm(activity: ActivityRow): ActivityFormState {
  const fallback = buildDefaultActivityForm();
  fallback.type = activity.type;
  fallback.prompt = activity.prompt;
  fallback.passCriteria = String(activity.passCriteria);

  if (activity.type === "MCQ") {
    const spec =
      activity.spec && typeof activity.spec === "object" && "choices" in activity.spec
        ? (activity.spec as {
            choices?: Array<{ id?: string; text?: string; isCorrect?: boolean }>;
          })
        : null;
    const rawChoices = Array.isArray(spec?.choices) ? spec.choices : [];
    const fixedChoices =
      rawChoices.length === 4
        ? rawChoices.map((choice, index) => ({
            id: typeof choice.id === "string" ? choice.id : String.fromCharCode(97 + index),
            text: typeof choice.text === "string" ? choice.text : "",
            isCorrect: Boolean(choice.isCorrect),
          }))
        : [
            { id: "a", text: "", isCorrect: true },
            { id: "b", text: "", isCorrect: false },
            { id: "c", text: "", isCorrect: false },
            { id: "d", text: "", isCorrect: false },
          ];

    fallback.mcqChoices = fixedChoices.map((choice) => ({ id: choice.id, text: choice.text }));
    fallback.mcqCorrectChoiceId =
      fixedChoices.find((choice) => choice.isCorrect)?.id ?? fixedChoices[0]?.id ?? "a";
  }

  if (activity.type === "TRUE_FALSE") {
    const spec =
      activity.spec && typeof activity.spec === "object" && "answer" in activity.spec
        ? (activity.spec as { answer?: unknown })
        : null;
    fallback.trueFalseAnswer = spec?.answer === true;
  }

  if (activity.type === "WORD_MATCH") {
    const spec =
      activity.spec && typeof activity.spec === "object" && "pairs" in activity.spec
        ? (activity.spec as {
            pairs?: Array<{ id?: string; left?: string; right?: string }>;
          })
        : null;
    const pairs = Array.isArray(spec?.pairs) ? spec.pairs : [];
    fallback.wordPairs =
      pairs.length > 0
        ? pairs.slice(0, 4).map((pair, index) => ({
            id: typeof pair.id === "string" ? pair.id : `p${index + 1}`,
            left: typeof pair.left === "string" ? pair.left : "",
            right: typeof pair.right === "string" ? pair.right : "",
          }))
        : [{ id: "p1", left: "", right: "" }];
  }

  if (activity.type === "FILL_BLANK") {
    const spec =
      activity.spec && typeof activity.spec === "object"
        ? (activity.spec as { sentence?: unknown; answer?: unknown; hint?: unknown })
        : null;
    fallback.fillSentence = typeof spec?.sentence === "string" ? spec.sentence : "";
    fallback.fillAnswer = typeof spec?.answer === "string" ? spec.answer : "";
    fallback.fillHint = typeof spec?.hint === "string" ? spec.hint : "";
  }

  return fallback;
}

function buildActivitySpec(form: ActivityFormState): Record<string, unknown> {
  if (form.type === "MCQ") {
    return {
      choices: form.mcqChoices.map((choice) => ({
        id: choice.id,
        text: choice.text.trim(),
        isCorrect: choice.id === form.mcqCorrectChoiceId,
      })),
    };
  }

  if (form.type === "TRUE_FALSE") {
    return {
      answer: form.trueFalseAnswer,
    };
  }

  if (form.type === "WORD_MATCH") {
    return {
      pairs: form.wordPairs.map((pair) => ({
        id: pair.id,
        left: pair.left.trim(),
        right: pair.right.trim(),
      })),
    };
  }

  return {
    sentence: form.fillSentence.trim(),
    answer: form.fillAnswer.trim(),
    hint: form.fillHint.trim() || null,
  };
}

function ModalShell(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900">{props.title}</h3>
          <button type="button" onClick={props.onClose} className="ghost-button min-h-9 px-3">
            Đóng
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

export function AdminContentPanel() {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [activitiesByLessonId, setActivitiesByLessonId] = useState<Record<string, ActivityRow[]>>({});
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingActivitiesLessonId, setLoadingActivitiesLessonId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId, tracks],
  );
  const selectedLevel = useMemo(
    () => levels.find((level) => level.id === selectedLevelId) ?? null,
    [levels, selectedLevelId],
  );
  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId, units],
  );
  const editingLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === editingLessonId) ?? null,
    [editingLessonId, lessons],
  );

  const fetchJson = useCallback(async <TData,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, init);
    const body = (await response.json()) as ApiResponse<TData>;
    if (!response.ok || !body.ok || !body.data) {
      throw new Error(body.error?.message ?? "Không tải được dữ liệu.");
    }

    return body.data;
  }, []);

  const loadTracks = useCallback(async () => {
    setLoadingTracks(true);
    setError(null);
    try {
      const data = await fetchJson<{ tracks: TrackRow[] }>("/api/admin/content/tracks", {
        method: "GET",
        cache: "no-store",
      });
      setTracks(data.tracks);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
    } finally {
      setLoadingTracks(false);
    }
  }, [fetchJson]);

  async function loadLevels(trackId: string) {
    setLoadingLevels(true);
    setError(null);
    try {
      const params = new URLSearchParams({ trackId });
      const data = await fetchJson<{ levels: LevelRow[] }>(`/api/admin/content/levels?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      setLevels(data.levels);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
      setLevels([]);
    } finally {
      setLoadingLevels(false);
    }
  }

  async function loadUnits(levelId: string) {
    setLoadingUnits(true);
    setError(null);
    try {
      const params = new URLSearchParams({ levelId });
      const data = await fetchJson<{ units: UnitRow[] }>(`/api/admin/content/units?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      setUnits(data.units);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }

  async function loadLessons(unitId: string) {
    setLoadingLessons(true);
    setError(null);
    try {
      const params = new URLSearchParams({ unitId });
      const data = await fetchJson<{ lessons: LessonRow[] }>(`/api/admin/content/lessons?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      setLessons(data.lessons);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  }

  async function loadActivitiesForLesson(lessonId: string) {
    setLoadingActivitiesLessonId(lessonId);
    setError(null);
    try {
      const params = new URLSearchParams({ lessonId });
      const data = await fetchJson<{ activities: ActivityRow[] }>(`/api/admin/content/activities?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      setActivitiesByLessonId((current) => ({
        ...current,
        [lessonId]: data.activities,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
    } finally {
      setLoadingActivitiesLessonId(null);
    }
  }

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  function selectTrack(track: TrackRow) {
    setSelectedTrackId(track.id);
    setSelectedLevelId(null);
    setSelectedUnitId(null);
    setLevels([]);
    setUnits([]);
    setLessons([]);
    setExpandedLessonId(null);
    setActivitiesByLessonId({});
    void loadLevels(track.id);
  }

  function selectLevel(level: LevelRow) {
    setSelectedLevelId(level.id);
    setSelectedUnitId(null);
    setUnits([]);
    setLessons([]);
    setExpandedLessonId(null);
    setActivitiesByLessonId({});
    void loadUnits(level.id);
  }

  function selectUnit(unit: UnitRow) {
    setSelectedUnitId(unit.id);
    setLessons([]);
    setExpandedLessonId(null);
    setActivitiesByLessonId({});
    void loadLessons(unit.id);
  }

  function toggleLessonExpanded(lesson: LessonRow) {
    const nextExpanded = expandedLessonId === lesson.id ? null : lesson.id;
    setExpandedLessonId(nextExpanded);
    if (nextExpanded && !activitiesByLessonId[nextExpanded]) {
      void loadActivitiesForLesson(nextExpanded);
    }
  }

  function openCreateLessonModal() {
    if (!selectedUnitId) {
      setError("Vui lòng chọn unit trước khi tạo bài học.");
      return;
    }

    const nextOrderNo = lessons.length > 0 ? Math.max(...lessons.map((lesson) => lesson.orderNo)) + 1 : 1;
    setLessonModalMode("create");
    setEditingLessonId(null);
    setLessonForm(buildDefaultLessonForm(nextOrderNo));
    setLessonModalOpen(true);
  }

  function openEditLessonModal(lesson: LessonRow) {
    setLessonModalMode("edit");
    setEditingLessonId(lesson.id);
    setEditingLessonBunny({ bunnyVideoId: lesson.bunnyVideoId, videoStatus: lesson.videoStatus });
    setLessonForm({
      orderNo: String(lesson.orderNo),
      slug: lesson.slug,
      title: lesson.title,
      objective: lesson.objective,
      estimatedMinutes: String(lesson.estimatedMinutes),
      trialEnabled: lesson.trialEnabled,
      videoSource: lesson.videoSource ?? "",
      offlineCardMarkdown: lesson.offlineCardMarkdown ?? "",
      parentScriptMarkdown: lesson.parentScriptMarkdown ?? "",
    });
    setLessonModalOpen(true);
  }

  function closeLessonModal() {
    setLessonModalOpen(false);
    setLessonSubmitting(false);
  }

  async function submitLessonForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUnitId && lessonModalMode === "create") {
      setError("Vui lòng chọn unit trước khi tạo bài học.");
      return;
    }

    setLessonSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      if (lessonModalMode === "create") {
        await fetchJson<{ lesson: LessonRow }>("/api/admin/content/lessons", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            unitId: selectedUnitId,
            orderNo: Number(lessonForm.orderNo),
            slug: lessonForm.slug.trim(),
            title: lessonForm.title.trim(),
            objective: lessonForm.objective.trim(),
            estimatedMinutes: Number(lessonForm.estimatedMinutes),
            trialEnabled: lessonForm.trialEnabled,
            videoSource: lessonForm.videoSource.trim() || null,
            offlineCardMarkdown: lessonForm.offlineCardMarkdown.trim() || null,
            parentScriptMarkdown: lessonForm.parentScriptMarkdown.trim() || null,
          }),
        });
        setInfo("Đã tạo bài học mới.");
      } else if (editingLessonId) {
        await fetchJson<{ lesson: LessonRow }>(`/api/admin/content/lessons/${encodeURIComponent(editingLessonId)}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            title: lessonForm.title.trim(),
            objective: lessonForm.objective.trim(),
            estimatedMinutes: Number(lessonForm.estimatedMinutes),
            trialEnabled: lessonForm.trialEnabled,
            videoSource: lessonForm.videoSource.trim() || null,
            offlineCardMarkdown: lessonForm.offlineCardMarkdown.trim() || null,
            parentScriptMarkdown: lessonForm.parentScriptMarkdown.trim() || null,
          }),
        });
        setInfo("Đã cập nhật bài học.");
      }

      closeLessonModal();
      if (selectedUnitId) {
        await loadLessons(selectedUnitId);
      }
      await loadTracks();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Lỗi không xác định.");
    } finally {
      setLessonSubmitting(false);
    }
  }

  async function handleDeleteLesson(lesson: LessonRow) {
    const confirmDelete = window.confirm(`Xóa bài "${lesson.title}"?`);
    if (!confirmDelete) {
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await fetchJson<{ deleted: boolean }>(`/api/admin/content/lessons/${encodeURIComponent(lesson.id)}`, {
        method: "DELETE",
      });
      setInfo("Đã xóa bài học.");
      if (selectedUnitId) {
        await loadLessons(selectedUnitId);
      }
      await loadTracks();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Lỗi không xác định.");
    }
  }

  async function handleToggleTrial(lesson: LessonRow) {
    setError(null);
    setInfo(null);

    try {
      await fetchJson<{ lesson: { id: string; trialEnabled: boolean } }>(
        `/api/admin/content/lessons/${encodeURIComponent(lesson.id)}/trial-toggle`,
        {
          method: "POST",
        },
      );
      setInfo("Đã cập nhật trạng thái trial.");
      if (selectedUnitId) {
        await loadLessons(selectedUnitId);
      }
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Lỗi không xác định.");
    }
  }

  function openCreateActivityModal(lessonId: string) {
    setActivityModalMode("create");
    setActivityTargetLessonId(lessonId);
    setEditingActivityId(null);
    setActivityForm(buildDefaultActivityForm());
    setActivityModalOpen(true);
  }

  function openEditActivityModal(lessonId: string, activity: ActivityRow) {
    setActivityModalMode("edit");
    setActivityTargetLessonId(lessonId);
    setEditingActivityId(activity.id);
    setActivityForm(parseActivityToForm(activity));
    setActivityModalOpen(true);
  }

  function closeActivityModal() {
    setActivityModalOpen(false);
    setActivitySubmitting(false);
  }

  async function submitActivityForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityTargetLessonId) {
      setError("Không xác định bài học cho câu hỏi.");
      return;
    }

    setActivitySubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const spec = buildActivitySpec(activityForm);

      if (activityModalMode === "create") {
        await fetchJson<{ activity: ActivityRow }>("/api/admin/content/activities", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            lessonId: activityTargetLessonId,
            type: activityForm.type,
            prompt: activityForm.prompt.trim(),
            spec,
            passCriteria: Number(activityForm.passCriteria),
          }),
        });
        setInfo("Đã tạo câu hỏi.");
      } else if (editingActivityId) {
        await fetchJson<{ activity: ActivityRow }>(`/api/admin/content/activities/${encodeURIComponent(editingActivityId)}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            prompt: activityForm.prompt.trim(),
            spec,
            passCriteria: Number(activityForm.passCriteria),
          }),
        });
        setInfo("Đã cập nhật câu hỏi.");
      }

      closeActivityModal();
      await loadActivitiesForLesson(activityTargetLessonId);
      if (selectedUnitId) {
        await loadLessons(selectedUnitId);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Lỗi không xác định.");
    } finally {
      setActivitySubmitting(false);
    }
  }

  async function handleDeleteActivity(lessonId: string, activity: ActivityRow) {
    const confirmDelete = window.confirm("Xóa câu hỏi này?");
    if (!confirmDelete) {
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await fetchJson<{ deleted: boolean }>(`/api/admin/content/activities/${encodeURIComponent(activity.id)}`, {
        method: "DELETE",
      });
      setInfo("Đã xóa câu hỏi.");
      await loadActivitiesForLesson(lessonId);
      if (selectedUnitId) {
        await loadLessons(selectedUnitId);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Lỗi không xác định.");
    }
  }

  const lessonModalTitle = lessonModalMode === "create" ? "Thêm bài học" : "Sửa bài học";
  const activityModalTitle = activityModalMode === "create" ? "Thêm câu hỏi" : "Sửa câu hỏi";

  return (
    <section className="card page-stack">
      <h1 className="flex items-center gap-2">
        <BookOpen size={18} className="shrink-0 text-teal-600" />
        Quản trị nội dung học tập
      </h1>
      <p className="muted-text">
        Drill-down theo Track → Level → Unit → Lesson → Activity. Hỗ trợ tạo, sửa, xóa bài học và câu hỏi tương tác.
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-600">Panel 1 · Tracks</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {tracks.map((track) => {
              const active = selectedTrackId === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => selectTrack(track)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{track.code}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{toTrackLabel(track.code)}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    {track._count.levels} level · {track._count.units} unit · {track._count.lessons} bài
                  </p>
                </button>
              );
            })}
            {loadingTracks ? <p className="text-sm text-slate-500">Đang tải tracks...</p> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-600">Panel 2 · Levels</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <span>{selectedTrack ? toTrackLabel(selectedTrack.code) : "Chưa chọn track"}</span>
            <ChevronRight size={12} className="shrink-0" />
            <span>Levels</span>
          </p>
          <div className="mt-3 admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên level</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr
                    key={level.id}
                    onClick={() => selectLevel(level)}
                    className={`cursor-pointer ${selectedLevelId === level.id ? "bg-teal-50/60" : ""}`}
                  >
                    <td>{level.orderNo}</td>
                    <td>{level.title}</td>
                    <td>{level._count.units}</td>
                  </tr>
                ))}
                {loadingLevels ? (
                  <tr>
                    <td colSpan={3}>Đang tải levels...</td>
                  </tr>
                ) : null}
                {!loadingLevels && levels.length === 0 ? (
                  <tr>
                    <td colSpan={3}>{selectedTrack ? "Chưa có level." : "Chọn track để xem levels."}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-600">Panel 3 · Units</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <span>{selectedTrack ? toTrackLabel(selectedTrack.code) : "Track"}</span>
            <ChevronRight size={12} className="shrink-0" />
            <span>{selectedLevel ? `Level ${selectedLevel.orderNo}` : "Level"}</span>
            <ChevronRight size={12} className="shrink-0" />
            <span>Units</span>
          </p>
          <div className="mt-3 admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên unit</th>
                  <th>Lessons</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr
                    key={unit.id}
                    onClick={() => selectUnit(unit)}
                    className={`cursor-pointer ${selectedUnitId === unit.id ? "bg-teal-50/60" : ""}`}
                  >
                    <td>{unit.orderNo}</td>
                    <td>{unit.title}</td>
                    <td>{unit._count.lessons}</td>
                  </tr>
                ))}
                {loadingUnits ? (
                  <tr>
                    <td colSpan={3}>Đang tải units...</td>
                  </tr>
                ) : null}
                {!loadingUnits && units.length === 0 ? (
                  <tr>
                    <td colSpan={3}>{selectedLevel ? "Chưa có unit." : "Chọn level để xem units."}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-600">Panel 4 · Lessons</h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <span>{selectedTrack ? toTrackLabel(selectedTrack.code) : "Track"}</span>
                <ChevronRight size={12} className="shrink-0" />
                <span>{selectedLevel ? `Level ${selectedLevel.orderNo}` : "Level"}</span>
                <ChevronRight size={12} className="shrink-0" />
                <span>{selectedUnit ? `Unit ${selectedUnit.orderNo}` : "Unit"}</span>
              </p>
            </div>
            <button type="button" className="solid-button min-h-9 gap-1 px-3 text-sm" onClick={openCreateLessonModal}>
              <Plus size={14} />
              Thêm bài học
            </button>
          </div>

          <div className="mt-3 admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Phút</th>
                  <th>Trial</th>
                  <th>Activities</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => {
                  const isExpanded = expandedLessonId === lesson.id;
                  const activities = activitiesByLessonId[lesson.id] ?? [];
                  return (
                    <>
                      <tr
                        key={lesson.id}
                        onClick={() => toggleLessonExpanded(lesson)}
                        className={`cursor-pointer ${isExpanded ? "bg-slate-50" : ""}`}
                      >
                        <td>{lesson.orderNo}</td>
                        <td>
                          <p className="font-semibold text-slate-800">{lesson.title}</p>
                          <p className="text-xs text-slate-500">{lesson.slug}</p>
                        </td>
                        <td>{lesson.estimatedMinutes}</td>
                        <td>
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                              lesson.trialEnabled
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {lesson.trialEnabled ? "Bật" : "Tắt"}
                          </span>
                        </td>
                        <td>{lesson._count.activities}</td>
                        <td>
                          <div className="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              className="ghost-button min-h-8 px-2.5"
                              onClick={() => openEditLessonModal(lesson)}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="ghost-button min-h-8 px-2.5 text-xs"
                              onClick={() => {
                                void handleToggleTrial(lesson);
                              }}
                            >
                              Trial
                            </button>
                            <button
                              type="button"
                              className="danger-button min-h-8 px-2.5"
                              onClick={() => {
                                void handleDeleteLesson(lesson);
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr key={`${lesson.id}-activities`}>
                          <td colSpan={6}>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Activities
                                </p>
                                <button
                                  type="button"
                                  className="solid-button min-h-8 gap-1 px-2.5 text-xs"
                                  onClick={() => openCreateActivityModal(lesson.id)}
                                >
                                  <Plus size={12} />
                                  Thêm câu hỏi
                                </button>
                              </div>

                              {loadingActivitiesLessonId === lesson.id ? (
                                <p className="text-xs text-slate-500">Đang tải activities...</p>
                              ) : null}

                              <ul className="space-y-1.5 p-0">
                                {activities.map((activity) => (
                                  <li
                                    key={activity.id}
                                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                          {activity.type}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">
                                          {activity.passCriteria}%
                                        </span>
                                      </div>
                                      <p className="mt-1 text-sm text-slate-700">{shortText(activity.prompt, 50)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        className="ghost-button min-h-8 px-2.5"
                                        onClick={() => openEditActivityModal(lesson.id, activity)}
                                      >
                                        <Pencil size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        className="danger-button min-h-8 px-2.5"
                                        onClick={() => {
                                          void handleDeleteActivity(lesson.id, activity);
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>

                              {activities.length === 0 && loadingActivitiesLessonId !== lesson.id ? (
                                <p className="text-xs text-slate-500">Chưa có activity.</p>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })}
                {loadingLessons ? (
                  <tr>
                    <td colSpan={6}>Đang tải lessons...</td>
                  </tr>
                ) : null}
                {!loadingLessons && lessons.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{selectedUnit ? "Chưa có bài học." : "Chọn unit để xem lessons."}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}

      <ModalShell title={lessonModalTitle} open={lessonModalOpen} onClose={closeLessonModal}>
        <form className="grid gap-3" onSubmit={submitLessonForm}>
          {lessonModalMode === "create" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="stack-field">
                Thứ tự (orderNo)
                <input
                  value={lessonForm.orderNo}
                  onChange={(event) => setLessonForm((current) => ({ ...current, orderNo: event.target.value }))}
                  type="number"
                  min={1}
                  required
                />
              </label>
              <label className="stack-field">
                Slug
                <input
                  value={lessonForm.slug}
                  onChange={(event) => setLessonForm((current) => ({ ...current, slug: event.target.value }))}
                  type="text"
                  placeholder="unit-1-bai-1"
                  required
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
              <p>
                <span className="font-semibold">Order:</span> {editingLesson?.orderNo ?? "-"}
              </p>
              <p>
                <span className="font-semibold">Slug:</span> {editingLesson?.slug ?? "-"}
              </p>
            </div>
          )}

          <label className="stack-field">
            Tên bài học
            <input
              value={lessonForm.title}
              onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))}
              type="text"
              required
            />
          </label>

          <label className="stack-field">
            Mục tiêu
            <textarea
              value={lessonForm.objective}
              onChange={(event) => setLessonForm((current) => ({ ...current, objective: event.target.value }))}
              rows={3}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="stack-field">
              Số phút
              <input
                value={lessonForm.estimatedMinutes}
                onChange={(event) => setLessonForm((current) => ({ ...current, estimatedMinutes: event.target.value }))}
                type="number"
                min={1}
                max={180}
                required
              />
            </label>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <input
                checked={lessonForm.trialEnabled}
                onChange={(event) => setLessonForm((current) => ({ ...current, trialEnabled: event.target.checked }))}
                type="checkbox"
              />
              Trial enabled
            </label>
          </div>

          <label className="stack-field">
            Video source
            <input
              value={lessonForm.videoSource}
              onChange={(event) => setLessonForm((current) => ({ ...current, videoSource: event.target.value }))}
              type="text"
              placeholder="https://..."
            />
          </label>

          {lessonModalMode === "edit" && editingLessonId && (
            <div className="stack-field">
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-500)" }}>Bunny Stream video</span>
              {editingLessonBunny?.bunnyVideoId ? (
                <p style={{ fontSize: "0.82rem", color: "var(--ink-600)" }}>
                  ID: <code>{editingLessonBunny.bunnyVideoId}</code> &nbsp;·&nbsp;
                  Trạng thái: <strong>{editingLessonBunny.videoStatus}</strong>
                </p>
              ) : (
                <p className="muted-text" style={{ fontSize: "0.82rem" }}>Chưa có video Bunny</p>
              )}

              {editingLessonBunny?.bunnyVideoId ? (
                // Show TUS uploader for direct browser upload
                <VideoTusUploader
                  videoId={editingLessonBunny.bunnyVideoId}
                  lessonId={editingLessonId}
                  onComplete={() => setEditingLessonBunny((current) => current ? { ...current, videoStatus: "ready" } : current)}
                />
              ) : (
                <button
                  type="button"
                  className="ghost-button"
                  style={{ fontSize: "0.82rem", padding: "0.3rem 0.75rem" }}
                  onClick={async () => {
                    if (!editingLessonId) return;
                    const title = lessonForm.title || editingLessonId;
                    const res = await fetch("/api/admin/videos/upload", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ lessonId: editingLessonId, title }),
                    });
                    const json = (await res.json()) as { ok: boolean; data?: { videoId: string; uploadUrl: string } };
                    if (json.ok && json.data) {
                      setEditingLessonBunny({ bunnyVideoId: json.data.videoId, videoStatus: "uploading" });
                    } else {
                      alert("Không thể tạo video Bunny. Kiểm tra BUNNY_STREAM_API_KEY trong .env");
                    }
                  }}
                >
                  Tạo video Bunny
                </button>
              )}
            </div>
          )}

          <label className="stack-field">
            Offline card markdown
            <textarea
              value={lessonForm.offlineCardMarkdown}
              onChange={(event) => setLessonForm((current) => ({ ...current, offlineCardMarkdown: event.target.value }))}
              rows={4}
            />
          </label>

          <label className="stack-field">
            Parent script markdown
            <textarea
              value={lessonForm.parentScriptMarkdown}
              onChange={(event) => setLessonForm((current) => ({ ...current, parentScriptMarkdown: event.target.value }))}
              rows={4}
            />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="ghost-button" onClick={closeLessonModal}>
              Hủy
            </button>
            <button type="submit" className="solid-button" disabled={lessonSubmitting}>
              {lessonSubmitting ? "Đang lưu..." : lessonModalMode === "create" ? "Tạo bài học" : "Lưu cập nhật"}
            </button>
          </div>
        </form>
      </ModalShell>

      <ModalShell title={activityModalTitle} open={activityModalOpen} onClose={closeActivityModal}>
        <form className="grid gap-3" onSubmit={submitActivityForm}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="stack-field">
              Loại activity
              <select
                value={activityForm.type}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    type: event.target.value as ActivityType,
                  }))
                }
              >
                <option value="MCQ">MCQ</option>
                <option value="TRUE_FALSE">TRUE_FALSE</option>
                <option value="WORD_MATCH">WORD_MATCH</option>
                <option value="FILL_BLANK">FILL_BLANK</option>
              </select>
            </label>

            <label className="stack-field">
              Pass criteria (%)
              <input
                value={activityForm.passCriteria}
                onChange={(event) => setActivityForm((current) => ({ ...current, passCriteria: event.target.value }))}
                type="number"
                min={0}
                max={100}
                required
              />
            </label>
          </div>

          <label className="stack-field">
            Prompt / chủ đề
            <textarea
              value={activityForm.prompt}
              onChange={(event) => setActivityForm((current) => ({ ...current, prompt: event.target.value }))}
              rows={3}
              required
            />
          </label>

          {activityForm.type === "MCQ" ? (
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">4 lựa chọn</p>
              {activityForm.mcqChoices.map((choice, index) => (
                <div key={choice.id} className="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    value={choice.text}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        mcqChoices: current.mcqChoices.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, text: event.target.value } : item,
                        ),
                      }))
                    }
                    type="text"
                    placeholder={`Lựa chọn ${index + 1}`}
                    required
                  />
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      checked={activityForm.mcqCorrectChoiceId === choice.id}
                      onChange={() => setActivityForm((current) => ({ ...current, mcqCorrectChoiceId: choice.id }))}
                      type="radio"
                      name="mcq-correct"
                    />
                    Đáp án đúng
                  </label>
                </div>
              ))}
            </div>
          ) : null}

          {activityForm.type === "TRUE_FALSE" ? (
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Đáp án đúng</p>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setActivityForm((current) => ({ ...current, trueFalseAnswer: true }))}
                  className={`rounded-md px-3 py-1 text-sm font-semibold ${
                    activityForm.trueFalseAnswer ? "bg-emerald-100 text-emerald-700" : "text-slate-600"
                  }`}
                >
                  Đúng
                </button>
                <button
                  type="button"
                  onClick={() => setActivityForm((current) => ({ ...current, trueFalseAnswer: false }))}
                  className={`rounded-md px-3 py-1 text-sm font-semibold ${
                    !activityForm.trueFalseAnswer ? "bg-rose-100 text-rose-700" : "text-slate-600"
                  }`}
                >
                  Sai
                </button>
              </div>
            </div>
          ) : null}

          {activityForm.type === "WORD_MATCH" ? (
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Các cặp từ</p>
                <button
                  type="button"
                  className="ghost-button min-h-8 px-2.5 text-xs"
                  onClick={() =>
                    setActivityForm((current) => {
                      if (current.wordPairs.length >= 4) {
                        return current;
                      }

                      const nextIndex = current.wordPairs.length + 1;
                      return {
                        ...current,
                        wordPairs: [...current.wordPairs, { id: `p${nextIndex}`, left: "", right: "" }],
                      };
                    })
                  }
                >
                  + Thêm cặp
                </button>
              </div>

              {activityForm.wordPairs.map((pair, index) => (
                <div key={pair.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    value={pair.left}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        wordPairs: current.wordPairs.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, left: event.target.value } : item,
                        ),
                      }))
                    }
                    type="text"
                    placeholder="Từ"
                    required
                  />
                  <input
                    value={pair.right}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        wordPairs: current.wordPairs.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, right: event.target.value } : item,
                        ),
                      }))
                    }
                    type="text"
                    placeholder="Nghĩa"
                    required
                  />
                  <button
                    type="button"
                    className="danger-button min-h-9 px-2.5"
                    onClick={() =>
                      setActivityForm((current) => {
                        if (current.wordPairs.length <= 1) {
                          return current;
                        }

                        return {
                          ...current,
                          wordPairs: current.wordPairs.filter((_, itemIndex) => itemIndex !== index),
                        };
                      })
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {activityForm.type === "FILL_BLANK" ? (
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="stack-field">
                Câu có chỗ trống (dùng ___)
                <input
                  value={activityForm.fillSentence}
                  onChange={(event) => setActivityForm((current) => ({ ...current, fillSentence: event.target.value }))}
                  type="text"
                  placeholder="Con mèo có ___ chân"
                  required
                />
              </label>
              <label className="stack-field">
                Đáp án
                <input
                  value={activityForm.fillAnswer}
                  onChange={(event) => setActivityForm((current) => ({ ...current, fillAnswer: event.target.value }))}
                  type="text"
                  required
                />
              </label>
              <label className="stack-field">
                Gợi ý
                <input
                  value={activityForm.fillHint}
                  onChange={(event) => setActivityForm((current) => ({ ...current, fillHint: event.target.value }))}
                  type="text"
                />
              </label>
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button type="button" className="ghost-button" onClick={closeActivityModal}>
              Hủy
            </button>
            <button type="submit" className="solid-button" disabled={activitySubmitting}>
              {activitySubmitting ? "Đang lưu..." : activityModalMode === "create" ? "Tạo câu hỏi" : "Lưu cập nhật"}
            </button>
          </div>
        </form>
      </ModalShell>
    </section>
  );
}
