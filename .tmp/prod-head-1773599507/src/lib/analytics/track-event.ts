/**
 * Analytics event tracking utility.
 * Fires events to GA4 (gtag) and Meta Pixel (fbq) when available.
 * Safe to call server-side — both guards check typeof window.
 */

type PurchaseParams = {
  value: number;
  currency: string;
  transaction_id?: string;
};

type TrialStartParams = {
  plan?: string;
};

type LessonCompleteParams = {
  lesson_id?: string;
  child_id?: string;
};

type ReportParams = {
  child_id?: string;
  week?: string;
};

type EventMap = {
  trial_start: TrialStartParams;
  purchase: PurchaseParams;
  lesson_complete: LessonCompleteParams;
  report_viewed: ReportParams;
  report_shared: ReportParams;
  referral_sent: Record<string, never>;
  complete_registration: Record<string, never>;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const FB_EVENT_MAP: Partial<Record<keyof EventMap, string>> = {
  trial_start: "Lead",
  purchase: "Purchase",
  // ViewContent: lesson engagement — not StartTrial (which implies subscription initiation)
  lesson_complete: "ViewContent",
  complete_registration: "CompleteRegistration",
  // report_viewed / report_shared intentionally omitted (no FB standard mapping needed)
};

export function trackEvent<K extends keyof EventMap>(
  event: K,
  params?: EventMap[K]
) {
  if (typeof window === "undefined") return;

  // GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params ?? {});
  }

  // Meta Pixel
  const fbEvent = FB_EVENT_MAP[event];
  if (fbEvent && typeof window.fbq === "function") {
    if (event === "purchase" && params && "value" in params) {
      const p = params as PurchaseParams;
      window.fbq("track", fbEvent, {
        value: p.value,
        currency: p.currency,
      });
    } else {
      window.fbq("track", fbEvent);
    }
  }
}
