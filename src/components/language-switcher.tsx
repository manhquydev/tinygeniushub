"use client";

import { useRouter } from "next/navigation";
import { localeCookieName, supportedLocales, type AppLocale } from "@/i18n/locales";

type LanguageSwitcherLabels = {
  ariaLabel: string;
  english: string;
  vietnamese: string;
};

type LanguageSwitcherProps = {
  currentLocale: AppLocale;
  labels: LanguageSwitcherLabels;
  className?: string;
};

const localeButtonText: Record<AppLocale, string> = {
  en: "EN",
  vi: "VI",
};

function setLocaleCookie(locale: AppLocale) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${localeCookieName}=${locale}; Max-Age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax${secure}`;
}

export function LanguageSwitcher({ currentLocale, labels, className }: LanguageSwitcherProps) {
  const router = useRouter();

  const switchLocale = (locale: AppLocale) => {
    if (locale === currentLocale) return;
    setLocaleCookie(locale);
    router.refresh();
  };

  return (
    <div
      className={["language-switcher", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={labels.ariaLabel}
    >
      {supportedLocales.map((locale) => {
        const active = locale === currentLocale;
        const label = locale === "en" ? labels.english : labels.vietnamese;

        return (
          <button
            key={locale}
            type="button"
            className={["language-switcher-option", active ? "language-switcher-option-active" : ""]
              .filter(Boolean)
              .join(" ")}
            aria-label={label}
            aria-pressed={active}
            onClick={() => switchLocale(locale)}
          >
            {localeButtonText[locale]}
          </button>
        );
      })}
    </div>
  );
}
