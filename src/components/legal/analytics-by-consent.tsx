"use client";

import { useEffect } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  hasAnalyticsConsent,
  hasMarketingConsent,
  hasClarityConsent,
} from "@/lib/legal/cookie-consent";
import { loadClarity } from "@/lib/analytics/clarity";

type AnalyticsByConsentProps = {
  ga4Id?: string;
  fbPixelId?: string;
  clarityProjectId?: string;
};

type ConsentAwareWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  _fbq?: (...args: unknown[]) => void;
  __ccthGa4Loaded?: boolean;
  __ccthFbLoaded?: boolean;
  __ccthClarityLoaded?: boolean;
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

function loadGa4(ga4Id: string) {
  const win = window as ConsentAwareWindow;
  if (win.__ccthGa4Loaded) return;

  const existingScript = document.getElementById("ccth-ga4-src");
  if (!existingScript) {
    const script = document.createElement("script");
    script.id = "ccth-ga4-src";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
    document.head.appendChild(script);
  }

  win.dataLayer = win.dataLayer ?? [];
  if (typeof win.gtag !== "function") {
    win.gtag = (...args: unknown[]) => {
      win.dataLayer?.push(args);
    };
  }

  win.gtag("js", new Date());
  win.gtag("config", ga4Id, { send_page_view: true });
  win.__ccthGa4Loaded = true;
}

function loadMetaPixel(pixelId: string) {
  const win = window as ConsentAwareWindow;
  if (win.__ccthFbLoaded) return;

  if (typeof win.fbq !== "function") {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    const fbq = function (...args: unknown[]) {
      const current = fbq as unknown as { queue?: unknown[][]; callMethod?: (...i: unknown[]) => void };
      if (typeof current.callMethod === "function") {
        current.callMethod(...args);
      } else {
        current.queue = current.queue ?? [];
        current.queue.push(args);
      }
    };

    (fbq as unknown as { push?: (...args: unknown[]) => void }).push = fbq;
    (fbq as unknown as { loaded?: boolean }).loaded = true;
    (fbq as unknown as { version?: string }).version = "2.0";
    (fbq as unknown as { queue?: unknown[][] }).queue = [];

    win.fbq = fbq;
    win._fbq = fbq;
  }

  win.fbq?.("init", pixelId);
  win.fbq?.("track", "PageView");
  win.__ccthFbLoaded = true;
}

function initClarity(projectId: string) {
  const win = window as ConsentAwareWindow;
  if (win.__ccthClarityLoaded) return;

  loadClarity({ projectId });
  win.__ccthClarityLoaded = true;
}

export function AnalyticsByConsent({
  ga4Id,
  fbPixelId,
  clarityProjectId,
}: AnalyticsByConsentProps) {
  useEffect(() => {
    const rawConsent = readCookie(COOKIE_CONSENT_COOKIE_NAME);
    if (!rawConsent) return;

    if (ga4Id && hasAnalyticsConsent(rawConsent)) {
      loadGa4(ga4Id);
    }

    if (fbPixelId && hasMarketingConsent(rawConsent)) {
      loadMetaPixel(fbPixelId);
    }

    // Load Clarity
    if (clarityProjectId && hasClarityConsent(rawConsent)) {
      initClarity(clarityProjectId);
    }
  }, [ga4Id, fbPixelId, clarityProjectId]);

  return null;
}

