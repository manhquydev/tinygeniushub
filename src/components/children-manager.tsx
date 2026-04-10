"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronUp, Pencil, PlayCircle, PlusCircle, Trash2, TriangleAlert, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Mascot } from "@/components/mascot";
import { KID_AVATAR_OPTIONS, type KidAvatarId } from "@/components/mascot/kid-avatar-options";
import type { MascotVariant } from "@/components/mascot/types";
import type { ApiSuccess, ChildProfileDTO } from "@/lib/api-types";

type AgeBand = "2-3" | "3-4" | "4-5" | "5-6";
type ChildSummary = Pick<ChildProfileDTO, "id" | "nickname" | "ageBand" | "avatarId">;

type ApiResponse<T> = {
  ok: boolean;
  data?: ApiSuccess<T>["data"];
  error?: {
    message?: string;
  };
};

interface ChildrenManagerProps {
  initialChildren: ChildSummary[];
  childLimit: number;
}

const ageBandOptions: AgeBand[] = ["2-3", "3-4", "4-5", "5-6"];
const defaultAvatarId = KID_AVATAR_OPTIONS[0].id;
const inputBaseClass =
  "min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

const AVATAR_MASCOT_BY_ID: Record<KidAvatarId, MascotVariant> = {
  basic: "small",
  "girl-bow": "sister",
  "nerdy-glasses": "big",
  "sporty-cap": "dad",
  "astro-helmet": "baby",
};

function resolveAvatarId(avatarId: string | null | undefined): KidAvatarId {
  const matched = KID_AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId);
  return matched?.id ?? defaultAvatarId;
}

function resolveMascotVariant(avatarId: KidAvatarId): MascotVariant {
  return AVATAR_MASCOT_BY_ID[avatarId] ?? "small";
}

interface AvatarPickerProps {
  disabled?: boolean;
  compact?: boolean;
  label: string;
  prefersReducedMotion: boolean;
  selectedAvatarId: KidAvatarId;
  onSelectAvatar: (avatarId: KidAvatarId) => void;
}

function AvatarPicker({
  disabled = false,
  compact = false,
  label,
  prefersReducedMotion,
  selectedAvatarId,
  onSelectAvatar,
}: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <div className={`grid gap-2 ${compact ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
        {KID_AVATAR_OPTIONS.map((avatar) => {
          const selected = avatar.id === selectedAvatarId;
          const mascotVariant = resolveMascotVariant(avatar.id);
          const mascotState = selected ? "playful" : "happy";

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelectAvatar(avatar.id)}
              disabled={disabled}
              aria-label={`Chọn nhân vật ${avatar.label}`}
              className={`rounded-2xl border bg-white p-2 text-left transition ${
                selected
                  ? "border-teal-400 shadow-[0_10px_20px_rgba(13,148,136,0.18)] ring-2 ring-teal-300/70"
                  : "border-slate-200 hover:border-slate-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <m.div
                animate={
                  prefersReducedMotion
                    ? { y: 0, scale: 1 }
                    : { y: selected ? -4 : 0, scale: selected ? [1, 1.05, 1.02] : 1 }
                }
                transition={
                  prefersReducedMotion
                    ? undefined
                    : selected
                      ? { type: "spring", stiffness: 360, damping: 20 }
                      : { type: "spring", stiffness: 320, damping: 24 }
                }
                className="mx-auto flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-1"
              >
                <Mascot
                  variant={mascotVariant}
                  state={mascotState}
                  size={86}
                  motionLevel={prefersReducedMotion ? "minimal" : "full"}
                  showBaseGlow={false}
                  title={avatar.label}
                />
              </m.div>

              {!compact ? (
                <>
                  <p className="mt-2 truncate text-xs font-semibold text-slate-800">{avatar.label}</p>
                  <p className="truncate text-[11px] text-slate-500">{avatar.description}</p>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChildAvatar({
  avatarId,
  nickname,
  prefersReducedMotion,
}: {
  avatarId: string | null;
  nickname: string;
  prefersReducedMotion: boolean;
}) {
  const resolvedAvatarId = resolveAvatarId(avatarId);
  const mascotVariant = resolveMascotVariant(resolvedAvatarId);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-cyan-100 to-emerald-100 shadow-inner">      <Mascot
        variant={mascotVariant}
        state="happy"
        size={60}
        motionLevel={prefersReducedMotion ? "minimal" : "soft"}
        showBaseGlow={false}
        title={`Nhân vật đại diện của ${nickname}`}
      />
    </div>
  );
}

export function ChildrenManager({ initialChildren, childLimit }: ChildrenManagerProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [children, setChildren] = useState(initialChildren);
  const [nickname, setNickname] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand>("3-4");
  const [avatarId, setAvatarId] = useState<KidAvatarId>(defaultAvatarId);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editAgeBand, setEditAgeBand] = useState<AgeBand>("3-4");
  const [editAvatarId, setEditAvatarId] = useState<KidAvatarId>(defaultAvatarId);
  const [pendingDeleteChild, setPendingDeleteChild] = useState<ChildSummary | null>(null);
  const [scrollToChildId, setScrollToChildId] = useState<string | null>(null);
  const [highlightedChildId, setHighlightedChildId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createSectionRef = useRef<HTMLElement | null>(null);
  const listSectionRef = useRef<HTMLElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const createNicknameRef = useRef<HTMLInputElement | null>(null);
  const editNicknameRef = useRef<HTMLInputElement | null>(null);
  const childCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const highlightTimerRef = useRef<number | null>(null);

  const reachedLimit = useMemo(() => children.length >= childLimit, [children.length, childLimit]);
  const selectedCreateAvatar = useMemo(
    () => KID_AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId) ?? KID_AVATAR_OPTIONS[0],
    [avatarId],
  );
  const selectedEditAvatar = useMemo(
    () => KID_AVATAR_OPTIONS.find((avatar) => avatar.id === editAvatarId) ?? KID_AVATAR_OPTIONS[0],
    [editAvatarId],
  );

  function scrollToElement(target: Element | null, block: ScrollLogicalPosition = "start") {
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block });
  }

  function revealFeedback() {
    if (typeof window === "undefined") {
      return;
    }
    window.requestAnimationFrame(() => {
      scrollToElement(feedbackRef.current, "start");
    });
  }

  function focusCreateSection() {
    if (typeof window === "undefined") {
      return;
    }
    window.requestAnimationFrame(() => {
      scrollToElement(createSectionRef.current, "start");
      createNicknameRef.current?.focus();
    });
  }

  function spotlightChild(childId: string) {
    setScrollToChildId(childId);
    setHighlightedChildId(childId);

    if (typeof window === "undefined") {
      return;
    }

    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedChildId((current) => (current === childId ? null : current));
      highlightTimerRef.current = null;
    }, 2100);
  }

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scrollToChildId || typeof window === "undefined") {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const targetCard = childCardRefs.current[scrollToChildId];
      if (targetCard) {
        scrollToElement(targetCard, "center");
        targetCard.focus();
      }
      setScrollToChildId(null);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [children, scrollToChildId]);

  useEffect(() => {
    if (!editingChildId || typeof window === "undefined") {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      scrollToElement(childCardRefs.current[editingChildId], "center");
      editNicknameRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [editingChildId]);

  useEffect(() => {
    if (!pendingDeleteChild) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setPendingDeleteChild(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loading, pendingDeleteChild]);

  function beginEdit(child: ChildSummary) {
    const safeAgeBand = ageBandOptions.includes(child.ageBand as AgeBand) ? (child.ageBand as AgeBand) : "3-4";
    setEditingChildId(child.id);
    setEditNickname(child.nickname);
    setEditAgeBand(safeAgeBand);
    setEditAvatarId(resolveAvatarId(child.avatarId));
    setError(null);
    setInfo(null);
  }

  function cancelEdit() {
    setEditingChildId(null);
    setEditNickname("");
    setEditAgeBand("3-4");
    setEditAvatarId(defaultAvatarId);
  }

  function askDelete(child: ChildSummary) {
    setPendingDeleteChild(child);
    setError(null);
    setInfo(null);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nicknameTrimmed = nickname.trim();
    if (!nicknameTrimmed) {
      setError("Vui lòng nhập tên gọi thân mật của bé.");
      setInfo(null);
      focusCreateSection();
      return;
    }
    if (reachedLimit) {
      setError("Tài khoản đã có hồ sơ bé chính. Vui lòng chỉnh sửa hồ sơ hiện tại.");
      setInfo(null);
      focusCreateSection();
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: nicknameTrimmed, ageBand, avatarId }),
      });

      const body = (await response.json()) as ApiResponse<{ child: ChildSummary }>;
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể tạo hồ sơ bé.");
        revealFeedback();
        return;
      }

      if (!body.data?.child) {
        setError("Không thể tạo hồ sơ bé.");
        revealFeedback();
        return;
      }

      const created = body.data.child as ChildSummary;
      setChildren((current) => [...current, created]);
      setNickname("");
      setAgeBand("3-4");
      setAvatarId(defaultAvatarId);
      setInfo("Đã tạo hồ sơ bé thành công.");
      spotlightChild(created.id);
      revealFeedback();

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          scrollToElement(listSectionRef.current, "start");
        });
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Lỗi không xác định.");
      revealFeedback();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingChildId) {
      return;
    }

    const editNicknameTrimmed = editNickname.trim();
    if (!editNicknameTrimmed) {
      setError("Vui lòng nhập tên gọi thân mật của bé.");
      setInfo(null);
      revealFeedback();
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/children/${editingChildId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: editNicknameTrimmed, ageBand: editAgeBand, avatarId: editAvatarId }),
      });

      const body = (await response.json()) as ApiResponse<{ child: ChildSummary }>;
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể cập nhật hồ sơ bé.");
        revealFeedback();
        return;
      }

      if (!body.data?.child) {
        setError("Không thể cập nhật hồ sơ bé.");
        revealFeedback();
        return;
      }

      const updated = body.data.child as ChildSummary;
      setChildren((current) => current.map((child) => (child.id === updated.id ? updated : child)));
      cancelEdit();
      setInfo("Đã cập nhật hồ sơ bé.");
      spotlightChild(updated.id);
      revealFeedback();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Lỗi không xác định.");
      revealFeedback();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!pendingDeleteChild) {
      return;
    }

    const deletingChildId = pendingDeleteChild.id;
    const remainingCount = children.filter((child) => child.id !== deletingChildId).length;
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/children/${deletingChildId}`, {
        method: "DELETE",
      });

      const body = (await response.json()) as ApiResponse<{ success: boolean }>;
      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể xóa hồ sơ bé.");
        revealFeedback();
        return;
      }

      setChildren((current) => current.filter((child) => child.id !== deletingChildId));
      if (editingChildId === deletingChildId) {
        cancelEdit();
      }
      setPendingDeleteChild(null);
      setInfo("Đã xóa hồ sơ bé.");
      revealFeedback();

      if (remainingCount === 0) {
        focusCreateSection();
      } else if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          scrollToElement(listSectionRef.current, "start");
        });
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Lỗi không xác định.");
      revealFeedback();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5" aria-live="polite">
      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Quản lý hồ sơ bé</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Mỗi tài khoản có {childLimit} hồ sơ bé chính, sử dụng xuyên suốt hành trình học tập.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {children.length}/{childLimit} hồ sơ
            </span>
            <button
              type="button"
              onClick={focusCreateSection}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5"
            >
              <ChevronUp size={14} />
              Đến form thêm hồ sơ
            </button>
          </div>
        </div>
      </section>

      <section
        ref={createSectionRef}
        className="rounded-3xl border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="text-lg font-black tracking-[-0.01em] text-slate-900">Thêm tài khoản con</h3>
          <p className="mt-1 text-sm text-slate-500">
            Điền thông tin cơ bản để tạo hồ sơ học tập mới cho bé. Bước này đồng bộ với luồng thiết lập ban đầu.
          </p>

          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <AvatarPicker
              label="Chọn nhân vật đại diện"
              selectedAvatarId={avatarId}
              onSelectAvatar={setAvatarId}
              disabled={reachedLimit || loading}
              compact={false}
              prefersReducedMotion={prefersReducedMotion}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              Nhân vật đã chọn: <span className="font-bold text-slate-900">{selectedCreateAvatar.label}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <input
                ref={createNicknameRef}
                className={inputBaseClass}
                placeholder="Tên gọi ở nhà"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                required
                disabled={reachedLimit || loading}
              />

              <select
                className={inputBaseClass}
                value={ageBand}
                onChange={(event) => setAgeBand(event.target.value as AgeBand)}
                disabled={reachedLimit || loading}
              >
                {ageBandOptions.map((option) => (
                  <option value={option} key={option}>
                    {option} tuổi
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {reachedLimit
                  ? "Bạn đã có hồ sơ chính. Có thể chỉnh sửa tên, độ tuổi và avatar ở danh sách bên dưới."
                  : "Bạn có thể chỉnh sửa tên tuổi và avatar sau khi tạo hồ sơ."}
              </p>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={reachedLimit || loading}
              >
                <PlusCircle size={18} />
                {reachedLimit ? "Đã có hồ sơ chính" : loading ? "Đang tạo..." : "Thêm hồ sơ"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <div ref={feedbackRef} className="space-y-2">
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" role="status">
            {info}
          </p>
        ) : null}
      </div>

      <section
        ref={listSectionRef}
        className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
      >
        <h3 className="text-lg font-black tracking-[-0.01em] text-slate-900">Danh sách bé</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Bấm vào từng thẻ để chỉnh sửa nhanh, cập nhật nhân vật hoặc đưa bé vào bài học ngay.
        </p>

        {children.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
            Chưa có hồ sơ bé nào. Hãy tạo hồ sơ đầu tiên ở phần trên.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => {
              const isEditing = editingChildId === child.id;
              const isHighlighted = highlightedChildId === child.id;

              return (
                <article
                  key={child.id}
                  ref={(node) => {
                    childCardRefs.current[child.id] = node;
                  }}
                  tabIndex={-1}
                  className={`rounded-2xl border bg-slate-50/70 p-4 outline-none transition ${
                    isHighlighted ? "border-teal-300 ring-2 ring-teal-200/80" : "border-slate-200"
                  }`}
                >
                  {isEditing ? (
                    <form className="space-y-3" onSubmit={handleUpdate}>
                      <AvatarPicker
                        label="Đổi nhân vật đại diện"
                        selectedAvatarId={editAvatarId}
                        onSelectAvatar={setEditAvatarId}
                        disabled={loading}
                        compact
                        prefersReducedMotion={prefersReducedMotion}
                      />

                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        Đang chọn: <span className="font-semibold text-slate-900">{selectedEditAvatar.label}</span>
                      </div>

                      <input
                        ref={editNicknameRef}
                        className={inputBaseClass}
                        value={editNickname}
                        onChange={(event) => setEditNickname(event.target.value)}
                        required
                        disabled={loading}
                        placeholder="Tên gọi ở nhà"
                      />

                      <select
                        className={inputBaseClass}
                        value={editAgeBand}
                        onChange={(event) => setEditAgeBand(event.target.value as AgeBand)}
                        disabled={loading}
                      >
                        {ageBandOptions.map((option) => (
                          <option value={option} key={option}>
                            {option} tuổi
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 text-sm font-bold text-white disabled:opacity-60"
                          disabled={loading}
                        >
                          <Check size={16} />
                          {loading ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-60"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          <X size={16} />
                          Hủy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <ChildAvatar avatarId={child.avatarId} nickname={child.nickname} prefersReducedMotion={prefersReducedMotion} />
                          <div className="min-w-0">
                            <p className="truncate text-lg font-black tracking-[-0.01em] text-slate-900">{child.nickname}</p>
                            <p className="text-sm text-slate-500">Độ tuổi: {child.ageBand}</p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:-translate-y-0.5"
                            onClick={() => beginEdit(child)}
                            disabled={loading}
                            title="Sửa hồ sơ"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:-translate-y-0.5"
                            onClick={() => askDelete(child)}
                            disabled={loading}
                            title="Xóa hồ sơ"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <Link
                        href={`/kid/courses?childId=${encodeURIComponent(child.id)}`}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
                      >
                        <PlayCircle size={16} />
                        Vào bài học
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pendingDeleteChild ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            onClick={() => {
              if (!loading) {
                setPendingDeleteChild(null);
              }
            }}
            aria-label="Đóng xác nhận xóa"
          />
          <div className="relative z-[1] w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_48px_rgba(15,23,42,0.28)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <TriangleAlert size={18} />
              </span>
              <div>
                <h4 className="text-lg font-black text-slate-900">Xác nhận xóa hồ sơ</h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Bạn sắp xóa hồ sơ của <span className="font-bold text-slate-900">{pendingDeleteChild.nickname}</span>.
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setPendingDeleteChild(null)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-600 px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(225,29,72,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleDeleteConfirmed}
                disabled={loading}
              >
                {loading ? "Đang xóa..." : "Xóa hồ sơ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

