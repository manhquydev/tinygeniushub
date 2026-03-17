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

type BundleDetailTrackedLinkProps = {
  href: string;
  className?: string;
  variant: AbVariant;
  bundleSlug: string;
  ctaLabel: string;
  position: number;
  children: ReactNode;
};

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
