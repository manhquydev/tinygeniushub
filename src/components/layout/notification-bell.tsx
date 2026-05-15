"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ReaderNotification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ReaderNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchUnreadCount() {
      const response = await fetch("/api/reader/notifications/unread-count", {
        cache: "no-store",
      });
      if (!response.ok || !mounted) {
        return;
      }
      const payload = (await response.json()) as {
        data?: { count?: number };
      };
      setUnreadCount(payload.data?.count ?? 0);
    }

    void fetchUnreadCount();
    const timer = window.setInterval(() => {
      void fetchUnreadCount();
    }, 60_000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function openDropdown() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/reader/notifications?limit=10", {
        cache: "no-store",
      });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as {
        data?: { notifications?: ReaderNotification[] };
      };
      setNotifications(payload.data?.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function markNotificationRead(notificationId: string) {
    const response = await fetch(`/api/reader/notifications/${notificationId}/read`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      return;
    }
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    const response = await fetch("/api/reader/notifications", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    if (!response.ok) {
      return;
    }
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );
    setUnreadCount(0);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
        aria-label="Notification"
        onClick={() => void openDropdown()}
      >
        <Bell size={16} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[150] w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.16)]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900">Notification</p>
            <button
              type="button"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <p className="py-4 text-center text-sm text-slate-500">Loading...</p>
          ) : null}

          {!loading && notifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              There are no new announcements yet.
            </p>
          ) : null}

          <div className="max-h-96 space-y-2 overflow-auto">
            {notifications.map((notification) => {
              const content = (
                <article
                  className={`rounded-xl border p-2 transition ${
                    notification.isRead
                      ? "border-slate-200 bg-white"
                      : "border-teal-200 bg-teal-50"
                  }`}
                  onClick={() => void markNotificationRead(notification.id)}
                >
                  <p className="text-xs font-semibold text-slate-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </article>
              );

              if (!notification.link) {
                return <div key={notification.id}>{content}</div>;
              }

              return (
                <Link key={notification.id} href={notification.link}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
