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

type NavClickParams = {
  state: "guest" | "parent";
  location: "desktop_top" | "mobile_panel" | "footer";
  label: string;
  href: string;
};

type CoursesCatalogViewParams = {
  variant: "A" | "B";
  bundles: number;
  tracks: number;
  lessons: number;
};

type CoursesBundleDetailClickParams = {
  variant: "A" | "B";
  bundle_slug: string;
  cta_label: string;
  position: number;
};

type CoursesBundleDetailViewParams = {
  variant: "A" | "B";
  bundle_slug: string;
  tracks: number;
  lessons: number;
};

type CoursesCheckoutStartParams = {
  variant: "A" | "B";
  source_page: "course_detail";
  bundle_slug: string;
  course_slug: string;
  price_vnd: number;
};

type EventMap = {
  trial_start: TrialStartParams;
  purchase: PurchaseParams;
  lesson_complete: LessonCompleteParams;
  report_viewed: ReportParams;
  report_shared: ReportParams;
  nav_click: NavClickParams;
  courses_catalog_view: CoursesCatalogViewParams;
  courses_bundle_detail_click: CoursesBundleDetailClickParams;
  courses_bundle_detail_view: CoursesBundleDetailViewParams;
  courses_checkout_start: CoursesCheckoutStartParams;
  courses_fit_check_click: Record<string, unknown>;
  courses_outcome_timeline_view: Record<string, unknown>;
  courses_difference_block_view: Record<string, unknown>;
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
