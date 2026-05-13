"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TOP_BAR_DELAY_MS = 120;
const OVERLAY_DELAY_MS = 400;
const NAVIGATION_SAFETY_TIMEOUT_MS = 12_000;

type NavigationFeedbackEventName =
  | "nav_feedback_started"
  | "nav_feedback_overlay_shown"
  | "nav_feedback_completed"
  | "nav_feedback_aborted";

type NavigationFeedbackEventPayload = {
  target: string;
  durationMs?: number;
  reason?: string;
};

type PendingNavigation = {
  startedAt: number;
  target: string;
};

type KidNavigateOptions = {
  replace?: boolean;
};

type KidNavigationFeedbackContextValue = {
  navigate: (href: string, options?: KidNavigateOptions) => void;
  isNavigating: boolean;
  pendingTarget: string | null;
};

const KidNavigationFeedbackContext = createContext<KidNavigationFeedbackContextValue | null>(null);

function getCurrentRouteKey(pathname: string, queryString: string) {
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function normalizeNavigationTarget(href: string): string {
  if (typeof window === "undefined") {
    return href;
  }

  try {
    const nextUrl = new URL(href, window.location.origin);
    return `${nextUrl.pathname}${nextUrl.search}`;
  } catch {
    return href;
  }
}

function emitNavigationFeedbackEvent(
  eventName: NavigationFeedbackEventName,
  payload: NavigationFeedbackEventPayload,
) {
  if (typeof window === "undefined") {
    return;
  }

  const detail = {
    event: eventName,
    ...payload,
  };

  window.dispatchEvent(new CustomEvent("ccth-navigation-feedback", { detail }));

  const maybeDataLayer = (
    window as Window & {
      dataLayer?: Array<Record<string, unknown>> | { push: (value: Record<string, unknown>) => void };
    }
  ).dataLayer;

  if (Array.isArray(maybeDataLayer)) {
    maybeDataLayer.push(detail);
    return;
  }

  if (maybeDataLayer && typeof maybeDataLayer.push === "function") {
    maybeDataLayer.push(detail);
  }
}

function KidNavigationFeedbackOverlay({
  showOverlay,
  showTopBar,
}: {
  showOverlay: boolean;
  showTopBar: boolean;
}) {
  return (
    <>
      {showTopBar ? (
        <div className="kid-nav-feedback-topbar" aria-hidden>
          <div className="kid-nav-feedback-topbar-track" />
        </div>
      ) : null}

      {showOverlay ? (
        <div
          className="kid-nav-feedback-overlay"
          role="status"
          aria-live="polite"
          aria-label="Opening a new page"
        >
          <div className="kid-nav-feedback-card">
            <p className="kid-nav-feedback-title">Opening a new page...</p>
            <p className="kid-nav-feedback-subtitle">Please wait a moment.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function KidNavigationFeedbackProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const routeKey = getCurrentRouteKey(pathname, queryString);

  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [showTopBar, setShowTopBar] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const currentRouteKeyRef = useRef(routeKey);
  const overlayAnnouncedRef = useRef(false);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);

  const finishNavigation = useCallback(
    (eventName: Extract<NavigationFeedbackEventName, "nav_feedback_completed" | "nav_feedback_aborted">, reason: string) => {
      const pendingNavigation = pendingNavigationRef.current;
      if (!pendingNavigation) {
        return;
      }

      const durationMs = Math.round(Math.max(0, performance.now() - pendingNavigation.startedAt));
      emitNavigationFeedbackEvent(eventName, {
        target: pendingNavigation.target,
        durationMs,
        reason,
      });

      pendingNavigationRef.current = null;
      overlayAnnouncedRef.current = false;
      setPendingTarget(null);
      setShowTopBar(false);
      setShowOverlay(false);
    },
    [],
  );

  const navigate = useCallback(
    (href: string, options?: KidNavigateOptions) => {
      if (!href) {
        return;
      }

      if (pendingNavigationRef.current) {
        return;
      }

      const normalizedTarget = normalizeNavigationTarget(href);
      if (normalizedTarget === routeKey) {
        return;
      }
      const startedAt = performance.now();

      pendingNavigationRef.current = {
        startedAt,
        target: normalizedTarget,
      };

      overlayAnnouncedRef.current = false;
      setPendingTarget(normalizedTarget);
      setShowTopBar(false);
      setShowOverlay(false);

      emitNavigationFeedbackEvent("nav_feedback_started", {
        target: normalizedTarget,
      });

      if (options?.replace) {
        router.replace(href);
        return;
      }

      router.push(href);
    },
    [routeKey, router],
  );

  useEffect(() => {
    const pendingNavigation = pendingNavigationRef.current;
    if (!pendingNavigation) {
      currentRouteKeyRef.current = routeKey;
      return;
    }

    if (routeKey === pendingNavigation.target || currentRouteKeyRef.current !== routeKey) {
      currentRouteKeyRef.current = routeKey;
      finishNavigation("nav_feedback_completed", "route_change");
    }
  }, [finishNavigation, routeKey]);

  useEffect(() => {
    if (!pendingNavigationRef.current) {
      return;
    }

    const syncByLocation = () => {
      const pendingNavigation = pendingNavigationRef.current;
      if (!pendingNavigation) {
        return;
      }

      const currentLocation = normalizeNavigationTarget(window.location.href);
      if (currentLocation === pendingNavigation.target) {
        currentRouteKeyRef.current = currentLocation;
        finishNavigation("nav_feedback_completed", "location_match");
      }
    };

    syncByLocation();
    const locationSyncTimer = window.setInterval(syncByLocation, 150);

    return () => {
      window.clearInterval(locationSyncTimer);
    };
  }, [finishNavigation, pendingTarget]);

  useEffect(() => {
    if (!pendingNavigationRef.current) {
      return;
    }

    const topBarTimer = window.setTimeout(() => {
      setShowTopBar(true);
    }, TOP_BAR_DELAY_MS);

    const overlayTimer = window.setTimeout(() => {
      setShowOverlay(true);
      if (!overlayAnnouncedRef.current && pendingNavigationRef.current) {
        overlayAnnouncedRef.current = true;
        emitNavigationFeedbackEvent("nav_feedback_overlay_shown", {
          target: pendingNavigationRef.current.target,
        });
      }
    }, OVERLAY_DELAY_MS);

    return () => {
      window.clearTimeout(topBarTimer);
      window.clearTimeout(overlayTimer);
    };
  }, [pendingTarget]);

  useEffect(() => {
    if (!pendingNavigationRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      finishNavigation("nav_feedback_aborted", "timeout");
    }, NAVIGATION_SAFETY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [finishNavigation, pendingTarget]);

  const contextValue = useMemo<KidNavigationFeedbackContextValue>(
    () => ({
      navigate,
      isNavigating: Boolean(pendingTarget),
      pendingTarget,
    }),
    [navigate, pendingTarget],
  );

  return (
    <KidNavigationFeedbackContext.Provider value={contextValue}>
      {children}
      <KidNavigationFeedbackOverlay showOverlay={showOverlay} showTopBar={showTopBar} />
    </KidNavigationFeedbackContext.Provider>
  );
}

export function useKidNavigationFeedback() {
  const context = useContext(KidNavigationFeedbackContext);
  if (!context) {
    throw new Error("useKidNavigationFeedback must be used within KidNavigationFeedbackProvider");
  }

  return context;
}
