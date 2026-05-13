"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCookieConsentState,
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  parseCookieConsent,
  serializeCookieConsent,
  type CookieConsentState,
} from "@/lib/legal/cookie-consent";

type CookieConsentActionsProps = {
  reloadAfterSave?: boolean;
  className?: string;
};

const PENDING_COOKIE_AUDIT_STORAGE_KEY = "ccth_pending_cookie_audit_v1";

type PendingCookieAuditPayload = {
  consent: CookieConsentState;
  source: "necessary" | "all";
  savedAt: string;
};

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

const TRACKING_COOKIE_NAMES = new Set([
  "_ga",
  "_gid",
  "_gat",
  "_fbp",
  "_fbc",
  "ab_pricing_v",
  "ab_courses_v",
  "ccth_attr_v1",
]);
const TRACKING_COOKIE_PREFIXES = ["_ga_"];

function shouldClearTrackingCookie(name: string) {
  if (TRACKING_COOKIE_NAMES.has(name)) return true;
  return TRACKING_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function collectTrackingCookieNamesFromDocument() {
  if (typeof document === "undefined") return [];
  const names = new Set<string>();
  const segments = document.cookie.split(";");
  for (const segment of segments) {
    const [rawName] = segment.trim().split("=");
    const decodedName = decodeURIComponent(rawName ?? "").trim();
    if (decodedName.length === 0) continue;
    if (shouldClearTrackingCookie(decodedName)) {
      names.add(decodedName);
    }
  }
  return [...names];
}

function getDomainCandidates(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (
    normalized.length === 0 ||
    normalized === "localhost" ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(normalized)
  ) {
    return [] as string[];
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length < 2) return [normalized];

  const candidates = new Set<string>([normalized]);
  for (let index = 0; index <= parts.length - 2; index += 1) {
    const domain = parts.slice(index).join(".");
    candidates.add(domain);
    candidates.add(`.${domain}`);
  }
  return [...candidates];
}

function expireCookie(name: string, path: string, domain: string | null, secure: boolean) {
  const encodedName = encodeURIComponent(name);
  const domainPart = domain ? `; domain=${domain}` : "";
  const securePart = secure ? "; Secure" : "";
  document.cookie = `${encodedName}=; Max-Age=0; path=${path}; SameSite=Lax${domainPart}${securePart}`;
}

function clearKnownTrackingCookies() {
  if (typeof document === "undefined") return;

  const namesToClear = collectTrackingCookieNamesFromDocument();
  if (namesToClear.length === 0) return;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const domains = getDomainCandidates(window.location.hostname);
  for (const key of namesToClear) {
    expireCookie(key, "/", null, secure);
    for (const domain of domains) {
      expireCookie(key, "/", domain, secure);
    }
  }
}

async function persistConsentAudit(
  consent: CookieConsentState,
  source: "necessary" | "all",
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch("/api/legal/cookie-consent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        consent,
        source,
      }),
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function readPendingCookieAuditPayload(): PendingCookieAuditPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const rawValue = window.localStorage.getItem(PENDING_COOKIE_AUDIT_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<PendingCookieAuditPayload>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.source !== "necessary" && parsed.source !== "all") return null;
    if (!parsed.consent || typeof parsed.consent !== "object") return null;

    const consent = parsed.consent as Partial<CookieConsentState>;
    if (
      typeof consent.version !== "string" ||
      consent.necessary !== true ||
      typeof consent.analytics !== "boolean" ||
      typeof consent.marketing !== "boolean" ||
      typeof consent.updatedAt !== "string"
    ) {
      return null;
    }

    return {
      consent: {
        version: consent.version,
        necessary: true,
        analytics: consent.analytics,
        marketing: consent.marketing,
        updatedAt: consent.updatedAt,
      },
      source: parsed.source,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function savePendingCookieAuditPayload(payload: PendingCookieAuditPayload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_COOKIE_AUDIT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Intentionally ignored: consent state remains restrictive on client regardless.
  }
}

function clearPendingCookieAuditPayload() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_COOKIE_AUDIT_STORAGE_KEY);
  } catch {
    // Best-effort cleanup.
  }
}

export function CookieConsentActions({ reloadAfterSave = true, className }: CookieConsentActionsProps) {
  const initialConsent = useMemo(() => parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE_NAME)), []);
  const [currentConsent, setCurrentConsent] = useState<CookieConsentState | null>(initialConsent);
  const [saving, setSaving] = useState<"necessary" | "all" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function flushPendingCookieAudit() {
      const pending = readPendingCookieAuditPayload();
      if (!pending) return;

      const recorded = await persistConsentAudit(pending.consent, pending.source);
      if (!active || !recorded) return;
      clearPendingCookieAuditPayload();
    }

    void flushPendingCookieAudit();
    return () => {
      active = false;
    };
  }, []);

  async function saveConsent(input: { analytics: boolean; marketing: boolean }, source: "necessary" | "all") {
    setSaving(source);
    setErrorMessage(null);

    const nextConsent = buildCookieConsentState(input);
    const restrictiveConsent = !input.analytics && !input.marketing;
    const recorded = await persistConsentAudit(nextConsent, source);
    if (!recorded && !restrictiveConsent) {
      setSaving(null);
      setErrorMessage("Cookie selection cannot be saved at this time. Please try again.");
      return;
    }

    const serialized = serializeCookieConsent(nextConsent);
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${serialized}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; path=/; SameSite=Lax${secure}`;

    if (restrictiveConsent) {
      clearKnownTrackingCookies();
    }

    setCurrentConsent(nextConsent);
    if (recorded) {
      clearPendingCookieAuditPayload();
    }
    if (!recorded && restrictiveConsent) {
      savePendingCookieAuditPayload({
        consent: nextConsent,
        source,
        savedAt: new Date().toISOString(),
      });
      setErrorMessage(
        "Only necessary cookies are applied on this device; The forensic log will automatically re-sync when the connection is stable.",
      );
    }
    setSaving(null);

    if (reloadAfterSave && recorded) {
      window.setTimeout(() => {
        window.location.reload();
      }, 120);
    }
  }

  return (
    <div className={className}>
      <p className="text-sm text-slate-700">
        Current status:{" "}
        <strong>
          {currentConsent
            ? currentConsent.analytics || currentConsent.marketing
              ? "Non-essential cookies are allowed"
              : "Only necessary cookies"
            : "Not selected yet"}
        </strong>
      </p>
      {errorMessage ? <p className="mt-2 text-sm text-rose-700">{errorMessage}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => saveConsent({ analytics: false, marketing: false }, "necessary")}
          disabled={saving !== null}
        >
          {saving === "necessary" ? "Saving..." : "Only necessary cookies"}
        </button>
        <button
          type="button"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => saveConsent({ analytics: true, marketing: true }, "all")}
          disabled={saving !== null}
        >
          {saving === "all" ? "Saving..." : "Accept all"}
        </button>
      </div>
    </div>
  );
}
