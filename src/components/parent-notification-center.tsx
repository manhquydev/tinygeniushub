"use client";

import Link from "next/link";
import { Bell, BookOpenCheck, CheckCheck, Flame, Sparkles, Trophy } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiSuccess, NotificationDTO } from "@/lib/api-types";

type NotificationType = NotificationDTO["type"];
type NotificationItem = NotificationDTO;

type NotificationResponse = {
  ok: boolean;
  data?: ApiSuccess<{ notifications: NotificationItem[] }>["data"];
  error?: {
    message?: string;
  };
};

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "ACHIEVEMENT":
      return <Trophy size={14} />;
    case "REPORT":
      return <BookOpenCheck size={14} />;
    case "TIP":
      return <Sparkles size={14} />;
    case "STREAK":
      return <Flame size={14} />;
    default:
      return <Bell size={14} />;
  }
}

function getNotificationTone(type: NotificationType) {
  switch (type) {
    case "ACHIEVEMENT":
      return "bg-amber-100 text-amber-700";
    case "REPORT":
      return "bg-sky-100 text-sky-700";
    case "TIP":
      return "bg-teal-100 text-teal-700";
    case "STREAK":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatRelativeTime(timestamp: string) {
  const createdAt = new Date(timestamp);
  const diffMs = Date.now() - createdAt.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return "Vừa xong";
  }

  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) {
    return "Vừa xong";
  }

  if (diffMs < hourMs) {
    return `${Math.floor(diffMs / minuteMs)} phút trước`;
  }

  if (diffMs < dayMs) {
    return `${Math.floor(diffMs / hourMs)} giờ trước`;
  }

  return createdAt.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function NotificationLoadingSkeleton() {
  return (
    <div className="space-y-1.5">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-3 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ParentNotificationCenter() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as NotificationResponse;

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể tải thông báo");
        setNotifications([]);
        return;
      }

      setNotifications(body.data?.notifications ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Lỗi không xác định");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void fetchNotifications();
    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!shellRef.current) return;
      const path = event.composedPath();
      if (path.includes(shellRef.current)) return;
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function markOneAsRead(notificationId: string) {
    const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const body = (await response.json()) as NotificationResponse;
    if (!response.ok || !body.ok) {
      throw new Error(body.error?.message ?? "Không thể cập nhật trạng thái thông báo");
    }
  }

  async function markAsRead(notificationId: string) {
    const target = notifications.find((item) => item.id === notificationId);
    if (!target || target.read) {
      return;
    }

    setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)));

    try {
      await markOneAsRead(notificationId);
    } catch (markError) {
      setNotifications((current) => current.map((item) => (item.id === notificationId ? { ...item, read: false } : item)));
      setError(markError instanceof Error ? markError.message : "Lỗi không xác định");
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }

    setNotifications((current) => current.map((item) => ({ ...item, read: true })));

    const results = await Promise.allSettled(unreadIds.map((notificationId) => markOneAsRead(notificationId)));
    const failedIds = unreadIds.filter((_, index) => results[index]?.status === "rejected");

    if (failedIds.length > 0) {
      setNotifications((current) =>
        current.map((item) => (failedIds.includes(item.id) ? { ...item, read: false } : item)),
      );
      setError("Một số thông báo chưa thể cập nhật trạng thái đã đọc.");
    }
  }

  return (
    <div
      ref={shellRef}
      className="relative z-[100] shrink-0"
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-900"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Mở trung tâm thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <m.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+0.65rem)] z-[120] w-[min(90vw,22rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_44px_rgba(15,23,42,0.18)]"
          >
            <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3 py-2.5">
              <div>
                <p className="text-sm font-black text-slate-900">Thông báo</p>
                <p className="text-xs text-slate-500">Cập nhật mới nhất cho phụ huynh</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void markAllAsRead();
                }}
                disabled={loading || unreadCount === 0}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCheck size={13} />
                Đã đọc hết
              </button>
            </header>

            <div className="max-h-[min(60vh,20rem)] overflow-y-auto p-2">
              {error ? (
                <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                  <p className="text-sm font-semibold">{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void fetchNotifications();
                    }}
                    className="mt-2 inline-flex items-center rounded-full border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5"
                  >
                    Thử lại
                  </button>
                </div>
              ) : null}

              {loading ? <NotificationLoadingSkeleton /> : null}

              {!loading && notifications.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  Chưa có thông báo nào.
                </p>
              ) : null}

              {!loading && notifications.length > 0 ? (
                <div className="space-y-1.5">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => {
                        void markAsRead(notification.id);
                        setOpen(false);
                      }}
                      className={`block rounded-xl border px-3 py-2.5 transition ${
                        notification.read
                          ? "border-slate-200 bg-white hover:border-slate-300"
                          : "border-teal-200/90 bg-teal-50/60 hover:border-teal-300"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${getNotificationTone(
                            notification.type,
                          )}`}
                        >
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-5 text-slate-900">{notification.title}</p>
                            {!notification.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" /> : null}
                          </div>
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{notification.message}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{formatRelativeTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
