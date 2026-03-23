"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";

type ReaderTopBarProps = {
  displayName: string;
};

export function ReaderTopBar({ displayName }: ReaderTopBarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/reader/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/blog");
    router.refresh();
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50/90">
      <div className="container flex flex-wrap items-center justify-between gap-2 py-2">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="font-semibold">Xin chào, {displayName}</span>
          <Link href="/reader/bookmarks" className="font-semibold text-teal-700 hover:text-teal-800">
            Bài viết đã lưu
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => void logout()}
            disabled={loggingOut}
          >
            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>
  );
}
