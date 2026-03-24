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

type CoursesPreviewModalOpenParams = {
  variant: "A" | "B";
  bundle_slug: string;
  lesson_id: string;
  lesson_title: string;
  source_page: "course_detail";
};

type CoursesPreviewPlaySuccessParams = CoursesPreviewModalOpenParams & {
  stream_type: "embed" | "secure";
};

type CoursesPreviewWatchQualifiedParams = CoursesPreviewModalOpenParams & {
  stream_type: "embed" | "secure";
  confidence_level: "high" | "medium";
  qualified_seconds: number;
};

type CoursesPreviewModalCloseParams = CoursesPreviewModalOpenParams & {
  stream_type: "embed" | "secure" | "unknown";
  watched_seconds: number;
  qualified: boolean;
  close_reason: "button" | "backdrop" | "escape" | "cta" | "unmount";
};

type CoursesPreviewPlayFailParams = CoursesPreviewModalOpenParams & {
  reason: "auth_required" | "unavailable" | "network_error";
  status?: number;
};

type CoursesPreviewAuthRequiredParams = CoursesPreviewModalOpenParams;

type LevelChangeRequestCreatedParams = {
  request_id: string;
  course_slug: string;
  reason_code: "too_easy" | "too_hard" | "pace_mismatch" | "wrong_track" | "other";
  reason_family: "wrong_level" | "other";
  request_channel: "ui" | "support" | "api";
};

type LevelChangeRequestDecidedParams = {
  request_id: string;
  decision: "approved" | "rejected" | "cancelled";
  decision_reason_code: string;
  reviewer_role: "admin" | "agent" | "system";
  time_to_decision_sec: number;
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
  courses_preview_modal_open: CoursesPreviewModalOpenParams;
  courses_preview_play_success: CoursesPreviewPlaySuccessParams;
  courses_preview_watch_qualified: CoursesPreviewWatchQualifiedParams;
  courses_preview_modal_close: CoursesPreviewModalCloseParams;
  courses_preview_play_fail: CoursesPreviewPlayFailParams;
  courses_preview_auth_required: CoursesPreviewAuthRequiredParams;
  level_change_request_created: LevelChangeRequestCreatedParams;
  level_change_request_decided: LevelChangeRequestDecidedParams;
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
