"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { WatchProgressRing } from "@/components/lesson-player/components/WatchProgressRing";
import { SecureVideoPlayer } from "@/components/media/secure-video-player";

interface VideoPlayerPanelProps {
  title: string;
  videoSource?: string | null;
  videoStreamType?: "hls" | "file" | null;
  watchProgress: number; // 0..100
  canContinue: boolean;
  onContinue: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  mascotMessage?: string;
}

export function VideoPlayerPanel({
  title,
  videoSource,
  videoStreamType,
  watchProgress,
  canContinue,
  onContinue,
  onPlaybackStateChange,
}: VideoPlayerPanelProps) {
  const t = useTranslations("kid.lesson.video");
  const prefersReducedMotion = useReducedMotion() ?? false;
  const normalizedVideoSource = videoSource ?? "";
  const hasVideo = Boolean(videoSource);
  const [iframeEngaged, setIframeEngaged] = useState(false);

  const isIframe =
    hasVideo &&
    (normalizedVideoSource.startsWith("https://iframe.mediadelivery.net") ||
      normalizedVideoSource.includes("bunny") ||
      normalizedVideoSource.includes("youtube") ||
      normalizedVideoSource.includes("vimeo"));

  useEffect(() => {
    setIframeEngaged(false);
  }, [normalizedVideoSource]);

  useEffect(() => {
    if (isIframe) {
      onPlaybackStateChange?.(iframeEngaged);
    }
  }, [iframeEngaged, isIframe, onPlaybackStateChange]);

  const hint = !hasVideo
    ? t("hintNoVideo")
    : canContinue
      ? t("hintReady")
      : t("hintWatchMore");

  return (
    <div className="lp-main lp-main-video" style={{ gap: "0.8rem" }}>
      <div className="lp-video-head">
        <div className="lp-video-head-bar" aria-hidden="true">
          <span className="lp-video-head-pip" />
          <span className="lp-video-head-pip is-active" />
          <span className="lp-video-head-pip" />
        </div>
        <h3>{title}</h3>
        <p>{t("watchToContinue")}</p>
      </div>

      <div className="lp-video-panel">
        <div
          className="lp-video-frame"
          onClick={() => {
            if (isIframe && !iframeEngaged) {
              setIframeEngaged(true);
            }
          }}
        >
          {!hasVideo ? (
            <div className="lp-video-fallback">
              <div className="lp-video-fallback-icon" aria-hidden="true" />
              <span style={{ fontSize: "0.8rem", textAlign: "center", maxWidth: "26ch" }}>
                {t("noVideoFallback")}
              </span>
            </div>
          ) : isIframe ? (
            <iframe
              className="lp-video-iframe"
              src={normalizedVideoSource}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : (
            <SecureVideoPlayer
              src={normalizedVideoSource}
              streamTypeHint={videoStreamType ?? null}
              className="lp-video-element"
              title={title}
              onPlaybackStateChange={onPlaybackStateChange}
            />
          )}
        </div>

        <div className="lp-watch-progress-area">
          <div className="lp-watch-ring-wrap">
            <WatchProgressRing percentage={watchProgress} size={62} isReady={canContinue} />
          </div>
          <div className="lp-watch-progress-info">
            <p className="lp-watch-progress-label">{t("viewed")}</p>
            <p className="lp-watch-progress-value">{Math.round(watchProgress)}%</p>
            <p className={`lp-watch-progress-hint ${canContinue ? "is-ready" : ""}`}>
              {hint}
            </p>
          </div>

          <m.button
            type="button"
            className="lp-btn-primary lp-video-continue-btn"
            style={{ width: "auto", minHeight: "46px", padding: "0 1.1rem", fontSize: "0.88rem" }}
            disabled={!canContinue}
            onClick={onContinue}
            whileHover={prefersReducedMotion || !canContinue ? undefined : { scale: 1.04 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            aria-label={t("continueAria")}
          >
            {hasVideo ? t("continue") : t("continueWithoutVideo")}
          </m.button>
        </div>
      </div>
    </div>
  );
}
