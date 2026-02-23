"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ActiveAnnouncement = {
  id: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS";
};

function getAnnouncementStyle(type: ActiveAnnouncement["type"]) {
  switch (type) {
    case "WARNING":
      return {
        wrapper: "border-amber-300 bg-amber-50 text-amber-900",
        icon: AlertTriangle,
      };
    case "SUCCESS":
      return {
        wrapper: "border-emerald-300 bg-emerald-50 text-emerald-900",
        icon: CheckCircle2,
      };
    default:
      return {
        wrapper: "border-sky-300 bg-sky-50 text-sky-900",
        icon: Info,
      };
  }
}

export function SystemAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<ActiveAnnouncement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await fetch("/api/announcements/active", {
          method: "GET",
          cache: "no-store",
        });
        const body = (await response.json()) as {
          ok?: boolean;
          data?: ActiveAnnouncement | null;
        };

        if (!isMounted || !response.ok || !body.ok) {
          return;
        }

        const next = body.data ?? null;
        setAnnouncement(next);
        if (!next) {
          return;
        }

        const dismissedKey = `dismissed_announcement_${next.id}`;
        const storedDismissed = window.localStorage.getItem(dismissedKey);
        setDismissed(storedDismissed === "1");
      } catch {
        // Không chặn render trang khi API thông báo lỗi.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const style = useMemo(() => {
    if (!announcement) {
      return null;
    }

    return getAnnouncementStyle(announcement.type);
  }, [announcement]);

  if (!announcement || dismissed || !style) {
    return null;
  }

  const Icon = style.icon;

  return (
    <div className="sticky top-0 z-[55] border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
      <div className={`mx-auto flex w-full max-w-6xl items-start gap-2 rounded-xl border px-3 py-2 text-sm ${style.wrapper}`}>
        <Icon size={16} className="mt-0.5 shrink-0" />
        <p className="flex-1 font-medium">{announcement.message}</p>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/30 bg-white/40"
          onClick={() => {
            window.localStorage.setItem(`dismissed_announcement_${announcement.id}`, "1");
            setDismissed(true);
          }}
          aria-label="Đóng thông báo"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
