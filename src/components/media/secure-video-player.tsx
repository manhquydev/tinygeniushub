"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type SecureVideoPlayerProps = {
  src: string;
  streamTypeHint?: "hls" | "file" | null;
  title?: string;
  className?: string;
  style?: CSSProperties;
  controls?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  onPlaybackStateChange?: (isPlaying: boolean) => void;
};

function isHlsSource(url: string) {
  return /\.m3u8($|[?#])/i.test(url);
}

export function SecureVideoPlayer({
  src,
  streamTypeHint,
  title,
  className,
  style,
  controls = true,
  playsInline = true,
  preload = "metadata",
  onPlaybackStateChange,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackStateCallbackRef = useRef<((isPlaying: boolean) => void) | undefined>(onPlaybackStateChange);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    playbackStateCallbackRef.current = onPlaybackStateChange;
  }, [onPlaybackStateChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isCancelled = false;
    let hls: { destroy: () => void; startLoad: () => void; recoverMediaError: () => void } | null = null;
    let usingNative = false;
    setError(null);
    playbackStateCallbackRef.current?.(false);

    const teardownNativeSource = () => {
      video.removeAttribute("src");
      video.load();
    };

    void (async () => {
      const shouldUseHls = await (async () => {
        if (streamTypeHint === "hls") return true;
        if (streamTypeHint === "file") return false;
        if (isHlsSource(src)) return true;

        // secure-playback URL hides the true extension, so probe one redirect hop.
        if (/\/secure-playback(?:\?|$)/i.test(src)) {
          try {
            const response = await fetch(src, {
              method: "GET",
              credentials: "include",
              redirect: "manual",
              cache: "no-store",
            });
            const location = response.headers.get("location");
            if (location) {
              return isHlsSource(location);
            }
          } catch {
            return false;
          }
        }

        return false;
      })();

      if (isCancelled || !video) return;

      if (!shouldUseHls) {
        usingNative = true;
        video.src = src;
        video.load();
        return;
      }

      const canPlayNativeHls = video.canPlayType("application/vnd.apple.mpegurl");
      if (canPlayNativeHls === "probably") {
        usingNative = true;
        video.src = src;
        video.load();
        return;
      }

      try {
        const hlsModule = await import("hls.js");
        const HlsCtor = hlsModule.default;
        if (isCancelled || !video) return;

        if (!HlsCtor.isSupported()) {
          usingNative = true;
          video.src = src;
          video.load();
          return;
        }

        const player = new HlsCtor({
          enableWorker: true,
          lowLatencyMode: false,
        });

        player.on(HlsCtor.Events.ERROR, (_event: unknown, data: { fatal?: boolean; type?: string }) => {
          if (!data?.fatal) return;

          if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
            player.startLoad();
            return;
          }

          if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
            player.recoverMediaError();
            return;
          }

          setError("Unable to play HLS video.");
          player.destroy();
        });

        player.loadSource(src);
        player.attachMedia(video);
        hls = player as unknown as {
          destroy: () => void;
          startLoad: () => void;
          recoverMediaError: () => void;
        };
      } catch {
        setError("Unable to initialize HLS player.");
        usingNative = true;
        video.src = src;
        video.load();
      }
    })();

    const emitPlaybackState = () => {
      const isPlaying = !video.paused && !video.ended && video.readyState >= 2;
      playbackStateCallbackRef.current?.(isPlaying);
    };

    const events: Array<keyof HTMLMediaElementEventMap> = [
      "play",
      "pause",
      "ended",
      "waiting",
      "seeking",
      "seeked",
      "timeupdate",
      "ratechange",
    ];
    for (const eventName of events) {
      video.addEventListener(eventName, emitPlaybackState);
    }
    emitPlaybackState();

    return () => {
      for (const eventName of events) {
        video.removeEventListener(eventName, emitPlaybackState);
      }
      playbackStateCallbackRef.current?.(false);
      isCancelled = true;
      if (hls) {
        hls.destroy();
      } else if (usingNative) {
        teardownNativeSource();
      }
    };
  }, [src, streamTypeHint]);

  return (
    <>
      <video
        ref={videoRef}
        data-playback-src={src}
        controls={controls}
        playsInline={playsInline}
        preload={preload}
        className={className}
        style={style}
        title={title}
      >
        Your browser does not support direct video playback.
      </video>
      {error ? (
        <p className="muted-text" style={{ marginTop: "0.5rem", fontSize: "0.8rem", textAlign: "center" }}>
          {error}
        </p>
      ) : null}
    </>
  );
}



