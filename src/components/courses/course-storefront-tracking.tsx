"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track-event";
import type { AbVariant } from "@/lib/ab-test-constants";

type CourseCatalogViewTrackerProps = {
  variant: AbVariant;
  bundles: number;
  tracks: number;
  lessons: number;
};

type BundleDetailViewTrackerProps = {
  variant: AbVariant;
  bundleSlug: string;
  tracks: number;
  lessons: number;
};

type FitCheckTrackedLinkProps = {
  href: string;
  className?: string;
  variant: AbVariant;
  bundleSlug: string;
  sourcePage: string;
  ctaLabel: string;
  children: ReactNode;
};

type OutcomeTimelineViewTrackerProps = {
  variant: AbVariant;
  bundleSlug: string;
  milestones: number;
};

type DifferenceBlockViewTrackerProps = {
  variant: AbVariant;
  bundleSlug: string;
  comparedBundleSlug: string;
};

type BundleDetailTrackedLinkProps = {
  href: string;
  className?: string;
  variant: AbVariant;
  bundleSlug: string;
  ctaLabel: string;
  position: number;
  children: ReactNode;
};

type PreviewEventBase = {
  variant: AbVariant;
  bundleSlug: string;
  lessonId: string;
  lessonTitle: string;
  sourcePage: "course_detail";
};

type PreviewStreamType = "embed" | "secure";

export function CourseCatalogViewTracker({
  variant,
  bundles,
  tracks,
  lessons,
}: CourseCatalogViewTrackerProps) {
  useEffect(() => {
    trackEvent("courses_catalog_view", {
      variant,
      bundles,
      tracks,
      lessons,
    });
  }, [variant, bundles, tracks, lessons]);

  return null;
}

export function BundleDetailViewTracker({
  variant,
  bundleSlug,
  tracks,
  lessons,
}: BundleDetailViewTrackerProps) {
  useEffect(() => {
    trackEvent("courses_bundle_detail_view", {
      variant,
      bundle_slug: bundleSlug,
      tracks,
      lessons,
    });
  }, [variant, bundleSlug, tracks, lessons]);

  return null;
}

export function FitCheckTrackedLink({
  href,
  className,
  variant,
  bundleSlug,
  sourcePage,
  ctaLabel,
  children,
}: FitCheckTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackEvent("courses_fit_check_click", {
          variant,
          bundle_slug: bundleSlug,
          source_page: sourcePage,
          cta_label: ctaLabel,
        });
      }}
    >
      {children}
    </Link>
  );
}

export function OutcomeTimelineViewTracker({
  variant,
  bundleSlug,
  milestones,
}: OutcomeTimelineViewTrackerProps) {
  useEffect(() => {
    trackEvent("courses_outcome_timeline_view", {
      variant,
      bundle_slug: bundleSlug,
      milestones,
    });
  }, [variant, bundleSlug, milestones]);

  return null;
}

export function DifferenceBlockViewTracker({
  variant,
  bundleSlug,
  comparedBundleSlug,
}: DifferenceBlockViewTrackerProps) {
  useEffect(() => {
    trackEvent("courses_difference_block_view", {
      variant,
      bundle_slug: bundleSlug,
      compared_bundle_slug: comparedBundleSlug,
    });
  }, [variant, bundleSlug, comparedBundleSlug]);

  return null;
}

export function BundleDetailTrackedLink({
  href,
  className,
  variant,
  bundleSlug,
  ctaLabel,
  position,
  children,
}: BundleDetailTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackEvent("courses_bundle_detail_click", {
          variant,
          bundle_slug: bundleSlug,
          cta_label: ctaLabel,
          position,
        });
      }}
    >
      {children}
    </Link>
  );
}

export function trackCoursePreviewModalOpen(input: PreviewEventBase) {
  trackEvent("courses_preview_modal_open", {
    variant: input.variant,
    bundle_slug: input.bundleSlug,
    lesson_id: input.lessonId,
    lesson_title: input.lessonTitle,
    source_page: input.sourcePage,
  });
}

export function trackCoursePreviewPlaySuccess(
  input: PreviewEventBase & { streamType: PreviewStreamType },
) {
  trackEvent("courses_preview_play_success", {
    variant: input.variant,
    bundle_slug: input.bundleSlug,
    lesson_id: input.lessonId,
    lesson_title: input.lessonTitle,
    source_page: input.sourcePage,
    stream_type: input.streamType,
  });
}

export function trackCoursePreviewWatchQualified(
  input: PreviewEventBase & {
    streamType: PreviewStreamType;
    confidenceLevel: "high" | "medium";
    qualifiedSeconds: number;
  },
) {
  trackEvent("courses_preview_watch_qualified", {
    variant: input.variant,
    bundle_slug: input.bundleSlug,
    lesson_id: input.lessonId,
    lesson_title: input.lessonTitle,
    source_page: input.sourcePage,
    stream_type: input.streamType,
    confidence_level: input.confidenceLevel,
    qualified_seconds: input.qualifiedSeconds,
  });
}

export function trackCoursePreviewModalClose(
  input: PreviewEventBase & {
    streamType: PreviewStreamType | "unknown";
    watchedSeconds: number;
    qualified: boolean;
    closeReason: "button" | "backdrop" | "escape" | "cta" | "unmount";
  },
) {
  trackEvent("courses_preview_modal_close", {
    variant: input.variant,
    bundle_slug: input.bundleSlug,
    lesson_id: input.lessonId,
    lesson_title: input.lessonTitle,
    source_page: input.sourcePage,
    stream_type: input.streamType,
    watched_seconds: input.watchedSeconds,
    qualified: input.qualified,
    close_reason: input.closeReason,
  });
}

export function trackCoursePreviewPlayFail(
  input: PreviewEventBase & { reason: "auth_required" | "unavailable" | "network_error"; status?: number },
) {
  trackEvent("courses_preview_play_fail", {
    variant: input.variant,
    bundle_slug: input.bundleSlug,
    lesson_id: input.lessonId,
    lesson_title: input.lessonTitle,
    source_page: input.sourcePage,
    reason: input.reason,
    ...(typeof input.status === "number" ? { status: input.status } : {}),
  });
}

export function trackCoursePreviewAuthRequired(input: PreviewEventBase) {
  trackEvent("courses_preview_auth_required", {
    variant: input.variant,
    bundle_slug: input.bundleSlug,
    lesson_id: input.lessonId,
    lesson_title: input.lessonTitle,
    source_page: input.sourcePage,
  });
}
