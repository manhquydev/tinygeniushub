"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CookieConsentActions } from "@/components/legal/cookie-consent-actions";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  shouldShowCookieConsentBanner,
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
  const t = useTranslations("cookie.banner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const rawConsent = readCookie(COOKIE_CONSENT_COOKIE_NAME);
    setVisible(shouldShowCookieConsentBanner(rawConsent));
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[320] mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_38px_rgba(15,23,42,0.22)] sm:inset-x-6 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t("heading")}</h2>
          <p className="mt-1 text-sm text-slate-700">{t("body")}</p>
          <p className="mt-2 text-sm text-slate-600">
            {t("detailPrefix")}{" "}
            <Link href="/cookie-policy" className="font-semibold text-emerald-700 hover:text-emerald-800">
              {t("policyLink")}
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          aria-label={t("closeAriaLabel")}
          onClick={() => setVisible(false)}
          className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          {t("close")}
        </button>
      </div>

      <CookieConsentActions className="mt-3" />
    </aside>
  );
}
