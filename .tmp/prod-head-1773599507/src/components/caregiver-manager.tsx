"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Trash2, UserRoundPlus } from "lucide-react";

type CaregiverStatus = "pending" | "accepted" | "expired";

type CaregiverInviteItem = {
  id: string;
  email: string;
  accepted: boolean;
  createdAt: string;
  expiresAt: string;
  status: CaregiverStatus;
};

type CaregiverMutationResponse = {
  ok: boolean;
  data?: {
    caregivers: CaregiverInviteItem[];
    caregiverLimit: number;
    usedSlots: number;
    inviteId?: string;
    emailDelivery?: {
      provider: string;
      attempted: boolean;
      sent: boolean;
    };
  };
  error?: {
    message?: string;
  };
};

interface CaregiverManagerProps {
  initialCaregivers: CaregiverInviteItem[];
  initialCaregiverLimit: number;
  initialUsedSlots: number;
}

const inputBaseClass =
  "min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function resolveStatusLabel(status: CaregiverStatus) {
  if (status === "accepted") {
    return "Đã chấp nhận";
  }

  if (status === "expired") {
    return "Đã hết hạn";
  }

  return "Đang chờ";
}

function resolveStatusClass(status: CaregiverStatus) {
  if (status === "accepted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "expired") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

export function CaregiverManager({
  initialCaregivers,
  initialCaregiverLimit,
  initialUsedSlots,
}: CaregiverManagerProps) {
  const [caregivers, setCaregivers] = useState(initialCaregivers);
  const [caregiverLimit, setCaregiverLimit] = useState(initialCaregiverLimit);
  const [usedSlots, setUsedSlots] = useState(initialUsedSlots);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reachedLimit = useMemo(() => usedSlots >= caregiverLimit, [usedSlots, caregiverLimit]);

  function applySnapshot(data: { caregivers: CaregiverInviteItem[]; caregiverLimit: number; usedSlots: number }) {
    setCaregivers(data.caregivers);
    setCaregiverLimit(data.caregiverLimit);
    setUsedSlots(data.usedSlots);
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Vui lòng nhập email caregiver.");
      setInfo(null);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/caregivers/invite", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });
      const body = (await response.json()) as CaregiverMutationResponse;

      if (!response.ok || !body.ok || !body.data) {
        setError(body.error?.message ?? "Không thể gửi lời mời caregiver");
        return;
      }

      applySnapshot({
        caregivers: body.data.caregivers,
        caregiverLimit: body.data.caregiverLimit,
        usedSlots: body.data.usedSlots,
      });
      setEmail("");

      if (body.data.emailDelivery && body.data.emailDelivery.attempted && !body.data.emailDelivery.sent) {
        setInfo("Đã tạo lời mời, nhưng gửi email thất bại. Vui lòng thử lại sau.");
      } else {
        setInfo("Đã gửi lời mời caregiver.");
      }
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/caregivers/${encodeURIComponent(inviteId)}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as CaregiverMutationResponse;

      if (!response.ok || !body.ok || !body.data) {
        setError(body.error?.message ?? "Không thể thu hồi lời mời");
        return;
      }

      applySnapshot({
        caregivers: body.data.caregivers,
        caregiverLimit: body.data.caregiverLimit,
        usedSlots: body.data.usedSlots,
      });
      setInfo("Đã thu hồi lời mời caregiver.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Quản lý caregiver</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Mời người thân cùng theo dõi tiến độ học tập và đồng hành với bé.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {usedSlots}/{caregiverLimit} đã dùng
        </span>
      </div>

      <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]" onSubmit={handleInvite}>
        <input
          type="email"
          className={inputBaseClass}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email caregiver"
          disabled={loading || reachedLimit}
          required
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || reachedLimit}
        >
          <UserRoundPlus size={18} />
          {loading ? "Đang gửi..." : reachedLimit ? "Đã hết slot" : "Mời caregiver"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" role="status">
          {info}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {caregivers.map((invite) => (
          <article key={invite.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail size={15} />
                  <p className="truncate text-sm font-bold">{invite.email}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Mời: {formatDate(invite.createdAt)} - Hết hạn: {formatDate(invite.expiresAt)}
                </p>
              </div>

              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${resolveStatusClass(invite.status)}`}>
                {resolveStatusLabel(invite.status)}
              </span>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void handleRevoke(invite.id);
                }}
                disabled={loading}
              >
                <Trash2 size={14} />
                Thu hồi
              </button>
            </div>
          </article>
        ))}
      </div>

      {caregivers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
          Chưa có caregiver nào được mời.
        </div>
      ) : null}

      <div className="mt-4 text-xs text-slate-500">
        Liên kết mời caregiver sẽ có dạng <code>/accept-invite?token=...</code> và hết hạn theo thời gian quy định.
      </div>
    </section>
  );
}
