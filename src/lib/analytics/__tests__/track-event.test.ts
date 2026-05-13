import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackEvent } from "../track-event";

describe("trackEvent", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      gtag: vi.fn(),
      fbq: vi.fn(),
    });
  });

  it("fires gtag with event name and params", () => {
    trackEvent("trial_start", { plan: "annual" });
    expect(window.gtag).toHaveBeenCalledWith("event", "trial_start", {
      plan: "annual",
    });
  });

  it("fires fbq Lead event for trial_start", () => {
    trackEvent("trial_start");
    expect(window.fbq).toHaveBeenCalledWith("track", "Lead");
  });

  it("fires fbq Purchase with value/currency for purchase event", () => {
    trackEvent("purchase", { value: 120000, currency: "VND", transaction_id: "t1" });
    expect(window.fbq).toHaveBeenCalledWith("track", "Purchase", {
      value: 120000,
      currency: "VND",
    });
  });

  it("does not fire fbq for events without FB mapping", () => {
    trackEvent("referral_sent");
    expect(window.gtag).toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("fires fbq ViewContent for lesson_complete (not StartTrial)", () => {
    trackEvent("lesson_complete", { lesson_id: "l1", child_id: "c1" });
    expect(window.fbq).toHaveBeenCalledWith("track", "ViewContent");
  });

  it("fires fbq CompleteRegistration for complete_registration", () => {
    trackEvent("complete_registration");
    expect(window.fbq).toHaveBeenCalledWith("track", "CompleteRegistration");
  });

  it("does not fire fbq for report_viewed or report_shared", () => {
    trackEvent("report_viewed", { child_id: "c1" });
    trackEvent("report_shared", { child_id: "c1" });
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("supports nav_click tracking without fbq mapping", () => {
    trackEvent("nav_click", {
      state: "parent",
      location: "footer",
      label: "Price list",
      href: "/pricing",
    });
    expect(window.gtag).toHaveBeenCalledWith("event", "nav_click", {
      state: "parent",
      location: "footer",
      label: "Price list",
      href: "/pricing",
    });
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("supports courses funnel event tracking without fbq mapping", () => {
    trackEvent("courses_catalog_view", {
      variant: "B",
      bundles: 3,
      tracks: 28,
      lessons: 13081,
    });
    expect(window.gtag).toHaveBeenCalledWith("event", "courses_catalog_view", {
      variant: "B",
      bundles: 3,
      tracks: 28,
      lessons: 13081,
    });
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("is a no-op when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(() => trackEvent("trial_start")).not.toThrow();
  });
});
