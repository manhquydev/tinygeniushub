"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Preloads a video URL by creating a hidden <video> element.
 * Returns isReady=true when video has buffered enough to play through.
 */
export function useVideoPreloader(url: string | null | undefined) {
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setIsReady(false);
    if (!url) return;

    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = url;
    videoRef.current = video;

    const handleReady = () => setIsReady(true);
    video.addEventListener("canplaythrough", handleReady, { once: true });

    return () => {
      video.removeEventListener("canplaythrough", handleReady);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null;
    };
  }, [url]);

  return { isReady };
}
