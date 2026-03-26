"use client";

import Link from "next/link";
import { useState } from "react";
import { CookieConsentActions } from "@/components/legal/cookie-consent-actions";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  parseCookieConsent,
  isCookieConsentCurrentVersion,
} from "@/lib/legal/cookie-consent";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const encodedName = `${encodeURIComponent(name)}=`;
  const segments = document.cookie.split(";");
  for (const segment of segments) {
    const value = segment.trim();
    if (value.startsWith(encodedName)) {
      return value.slice(encodedName.length);
    }
  }
  return null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    const rawConsent = readCookie(COOKIE_CONSENT_COOKIE_NAME);
    const parsed = parseCookieConsent(rawConsent);
    return !parsed || !isCookieConsentCurrentVersion(parsed);
  });

  if (!visible) {
    return null;
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[320] mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.22)] sm:inset-x-6 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Cài đặt cookie</h2>
          <p className="mt-1 text-sm text-slate-700">
            Chúng tôi luôn dùng cookie cần thiết để vận hành đăng nhập và bảo mật. Cookie phân tích/tiếp thị chỉ bật
            khi bạn đồng ý.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Xem chi tiết tại{" "}
            <Link href="/cookie-policy" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Chính sách Cookie
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          aria-label="Đóng thông báo cookie"
          onClick={() => setVisible(false)}
          className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          Đóng
        </button>
      </div>

      <CookieConsentActions className="mt-3" />
    </aside>
  );
}
