"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { AbVariant } from "@/lib/ab-test-constants";
import { COURSE_TRIAL_PREVIEW_LESSON_LIMIT } from "@/modules/courses/course-trial-constants";
import { SecureVideoPlayer } from "@/components/media/secure-video-player";
import {
  trackCoursePreviewAuthRequired,
  trackCoursePreviewModalClose,
  trackCoursePreviewModalOpen,
  trackCoursePreviewPlayFail,
  trackCoursePreviewPlaySuccess,
  trackCoursePreviewWatchQualified,
} from "@/components/courses/course-storefront-tracking";

type VideoState =
  | { status: "loading" }
  | {
      status: "ready";
      embedUrl: string;
      streamType: "embed" | "secure";
      secureStreamTypeHint?: "hls" | "file" | null;
    }
  | { status: "auth_required" }
  | { status: "unavailable" };

type CloseReason = "button" | "backdrop" | "escape" | "cta" | "unmount";

type Props = {
  lessonId: string;
  lessonTitle: string;
  lessonObjective: string;
  courseSlug: string;
  variant: AbVariant;
  onClose: () => void;
};

export function CourseLessonPreviewModal({
  lessonId,
  lessonTitle,
  lessonObjective,
  courseSlug,
  variant,
  onClose,
}: Props) {
  const [video, setVideo] = useState<VideoState>({ status: "loading" });
  const [previewStarted, setPreviewStarted] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [securePlaying, setSecurePlaying] = useState(false);

  const hasTrackedPlaySuccessRef = useRef(false);
  const watchedSecondsRef = useRef(0);
  const hasTrackedQualifiedRef = useRef(false);
  const hasTrackedCloseRef = useRef(false);

  const streamType = video.status === "ready" ? video.streamType : "unknown";

  const refreshPreviewSource = useCallback(
    async (input?: { signal?: AbortSignal }) => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/video-token`, {
          signal: input?.signal,
        });

        if (res.status === 401) {
          setVideo({ status: "auth_required" });
          trackCoursePreviewAuthRequired({
            variant,
            bundleSlug: courseSlug,
            lessonId,
            lessonTitle,
            sourcePage: "course_detail",
          });
          return false;
        }

        if (!res.ok) {
          setVideo({ status: "unavailable" });
          trackCoursePreviewPlayFail({
            variant,
            bundleSlug: courseSlug,
            lessonId,
            lessonTitle,
            sourcePage: "course_detail",
            reason: "unavailable",
            status: res.status,
          });
          return false;
        }

        const json = (await res.json()) as {
          ok: boolean;
          data?: { embedUrl?: string; streamType?: "embed" | "secure" | "hls" | "file" };
        };

        if (!json.ok || !json.data?.embedUrl) {
          setVideo({ status: "unavailable" });
          trackCoursePreviewPlayFail({
            variant,
            bundleSlug: courseSlug,
            lessonId,
            lessonTitle,
            sourcePage: "course_detail",
            reason: "unavailable",
            status: res.status,
          });
          return false;
        }

        const detectedStreamType = json.data.streamType === "embed" ? "embed" : "secure";
        const secureStreamTypeHint =
          detectedStreamType === "secure"
            ? json.data.streamType === "file"
              ? "file"
              : "hls"
            : null;

        hasTrackedPlaySuccessRef.current = false;
        watchedSecondsRef.current = 0;
        hasTrackedQualifiedRef.current = false;
        hasTrackedCloseRef.current = false;
        setSecurePlaying(false);
        setPreviewStarted(false);
        setVideo({
          status: "ready",
          embedUrl: json.data.embedUrl,
          streamType: detectedStreamType,
          secureStreamTypeHint,
        });
        return true;
      } catch {
        if (input?.signal?.aborted) {
          return false;
        }

        setVideo({ status: "unavailable" });
        trackCoursePreviewPlayFail({
          variant,
          bundleSlug: courseSlug,
          lessonId,
          lessonTitle,
          sourcePage: "course_detail",
          reason: "network_error",
        });
        return false;
      }
    },
    [courseSlug, lessonId, lessonTitle, variant],
  );

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    trackCoursePreviewModalOpen({
      variant,
      bundleSlug: courseSlug,
      lessonId,
      lessonTitle,
      sourcePage: "course_detail",
    });

    void (async () => {
      await refreshPreviewSource({ signal: controller.signal });
      if (!isActive) return;
    })();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [courseSlug, lessonId, lessonTitle, refreshPreviewSource, variant]);

  const handleStartPreview = useCallback(async () => {
    if (startLoading) return;

    if (video.status === "ready") {
      setPreviewStarted(true);
      return;
    }

    setStartLoading(true);
    setVideo({ status: "loading" });
    const refreshed = await refreshPreviewSource();
    if (refreshed) {
      setPreviewStarted(true);
    }
    setStartLoading(false);
  }, [refreshPreviewSource, startLoading, video.status]);

  const handleReloadPreview = useCallback(async () => {
    if (startLoading) return;

    setStartLoading(true);
    setVideo({ status: "loading" });
    await refreshPreviewSource();
    setStartLoading(false);
  }, [refreshPreviewSource, startLoading]);

  const trackModalClose = useCallback(
    (reason: CloseReason) => {
      if (hasTrackedCloseRef.current) return;
      hasTrackedCloseRef.current = true;
      trackCoursePreviewModalClose({
        variant,
        bundleSlug: courseSlug,
        lessonId,
        lessonTitle,
        sourcePage: "course_detail",
        streamType,
        watchedSeconds: watchedSecondsRef.current,
        qualified: hasTrackedQualifiedRef.current,
        closeReason: reason,
      });
    },
    [courseSlug, lessonId, lessonTitle, streamType, variant],
  );

  const closeModal = useCallback(
    (reason: CloseReason) => {
      trackModalClose(reason);
      onClose();
    },
    [onClose, trackModalClose],
  );

  const markPlaySuccess = useCallback(
    (currentStreamType: "embed" | "secure") => {
      if (hasTrackedPlaySuccessRef.current) return;
      hasTrackedPlaySuccessRef.current = true;
      trackCoursePreviewPlaySuccess({
        variant,
        bundleSlug: courseSlug,
        lessonId,
        lessonTitle,
        sourcePage: "course_detail",
        streamType: currentStreamType,
      });
    },
    [courseSlug, lessonId, lessonTitle, variant],
  );

  const handleSecurePlaybackStateChange = useCallback(
    (isPlaying: boolean) => {
      setSecurePlaying((current) => (current === isPlaying ? current : isPlaying));
      if (isPlaying) {
        markPlaySuccess("secure");
      }
    },
    [markPlaySuccess],
  );

  useEffect(() => {
    if (video.status !== "ready" || !previewStarted) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (typeof document.hasFocus === "function" && !document.hasFocus()) return;

      if (video.streamType === "secure") {
        if (!securePlaying) return;
        watchedSecondsRef.current += 1;
        if (!hasTrackedQualifiedRef.current && watchedSecondsRef.current >= 20) {
          hasTrackedQualifiedRef.current = true;
          trackCoursePreviewWatchQualified({
            variant,
            bundleSlug: courseSlug,
            lessonId,
            lessonTitle,
            sourcePage: "course_detail",
            streamType: "secure",
            confidenceLevel: "high",
            qualifiedSeconds: watchedSecondsRef.current,
          });
        }
        return;
      }

      if (!hasTrackedPlaySuccessRef.current) return;
      watchedSecondsRef.current += 1;
      if (!hasTrackedQualifiedRef.current && watchedSecondsRef.current >= 30) {
        hasTrackedQualifiedRef.current = true;
        trackCoursePreviewWatchQualified({
          variant,
          bundleSlug: courseSlug,
          lessonId,
          lessonTitle,
          sourcePage: "course_detail",
          streamType: "embed",
          confidenceLevel: "medium",
          qualifiedSeconds: watchedSecondsRef.current,
        });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [courseSlug, lessonId, lessonTitle, previewStarted, securePlaying, variant, video]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal("escape");
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  const loginHref = `/auth/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Try learning:${lessonTitle}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => closeModal("backdrop")} />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Trial lesson</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">{lessonTitle}</h2>
          </div>
          <button
            type="button"
            onClick={() => closeModal("button")}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 px-5">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900" style={{ aspectRatio: "16/9" }}>
            {video.status === "loading" ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-slate-400">Loading video...</p>
              </div>
            ) : null}

            {video.status === "ready" ? (
              previewStarted ? (
                video.streamType === "secure" ? (
                  <SecureVideoPlayer
                    src={video.embedUrl}
                    streamTypeHint={video.secureStreamTypeHint ?? null}
                    className="h-full w-full"
                    title={lessonTitle}
                    onPlaybackStateChange={handleSecurePlaybackStateChange}
                  />
                ) : (
                  <iframe
                    src={video.embedUrl}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-none"
                    title={lessonTitle}
                    onLoad={() => markPlaySuccess("embed")}
                  />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="font-bold text-white">Ready to check it out</p>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Click start to open the trial video and check the appropriate level.
                  </p>
                  <button type="button" className="solid-button" onClick={() => void handleStartPreview()} disabled={startLoading}>
                    {startLoading ? "Opening video..." : "Start previewing"}
                  </button>
                </div>
              )
            ) : null}

            {video.status === "auth_required" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="font-bold text-white">
                  You need to log in to preview {COURSE_TRIAL_PREVIEW_LESSON_LIMIT} first lesson
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  Please log in to open a trial lesson and check suitability before purchasing.
                </p>
                <Link href={loginHref} className="solid-button" onClick={() => closeModal("cta")}>
                  Sign in to check it out
                </Link>
              </div>
            ) : null}

            {video.status === "unavailable" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-bold text-white">Video is temporarily not ready</p>
                <p className="text-sm leading-relaxed text-slate-400">
                  This lesson cannot open the video right now. Please try again or view the lock information to decide.
                </p>
                <button type="button" className="solid-button text-sm" onClick={() => void handleReloadPreview()} disabled={startLoading}>
                  {startLoading ? "Trying again..." : "Reload the video"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 p-5">
          {lessonObjective ? (
            <p className="text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-900">Target:</span>
              {lessonObjective}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/courses/${courseSlug}`} className="solid-button" onClick={() => closeModal("cta")}>
              View the full course to buy
            </Link>
            {video.status === "ready" ? (
              <button type="button" onClick={() => void handleReloadPreview()} className="ghost-button" disabled={startLoading}>
                {startLoading ? "Reloading..." : "Reload the video"}
              </button>
            ) : null}
            <button type="button" onClick={() => closeModal("button")} className="ghost-button">
              Close the test window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
