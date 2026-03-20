"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import { Play } from "lucide-react";

interface VideoSegmentPlayerProps {
  src: string;
  poster?: string;
  onEnded: () => void;
  /** URL of next video to preload */
  preloadSrc?: string;
}

/**
 * Video player that reuses a single <video> DOM element across src changes.
 * Shows a play overlay if autoplay is blocked (mobile first-play).
 */
export function VideoSegmentPlayer({ src, poster, onEnded, preloadSrc }: VideoSegmentPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const onEndedRef = useRef(onEnded);
  useEffect(() => { onEndedRef.current = onEnded; });

  // Play video when src changes (reuse same <video> element)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setNeedsTap(false);
    video.src = src;
    if (poster) video.poster = poster;
    video.load();

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay blocked — show tap overlay
        setNeedsTap(true);
      });
    }

    const handleEnded = () => onEndedRef.current();
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [src, poster]);

  // Preload next video
  useEffect(() => {
    if (!preloadSrc) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = preloadSrc;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [preloadSrc]);

  const handleTapToPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    void video.play().catch(() => {/* silent */});
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {/* Tap-to-play overlay for mobile autoplay gate */}
      {needsTap && (
        <m.button
          type="button"
          onClick={handleTapToPlay}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: [1, 1.08, 1] }}
          transition={{ scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "none",
            background: "rgba(59, 130, 246, 0.9)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
          }}
          aria-label="Bắt đầu xem"
        >
          <Play size={48} fill="#fff" />
        </m.button>
      )}
    </div>
  );
}
