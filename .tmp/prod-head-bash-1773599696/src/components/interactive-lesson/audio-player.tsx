"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface AudioPlayerProps {
  src?: string;
  autoPlay?: boolean;
  onEnd?: () => void;
  onError?: () => void;
}

export interface AudioPlayerRef {
  replay: () => void;
}

// Hidden audio element — plays src when autoPlay=true, fires onEnd when done
// Exposes replay() via ref for manual replay trigger (e.g. speaker button)
export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  function AudioPlayer({ src, autoPlay = true, onEnd, onError }, ref) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onEndRef = useRef(onEnd);
    const onErrorRef = useRef(onError);

    // Always keep refs current
    useEffect(() => { onEndRef.current = onEnd; });
    useEffect(() => { onErrorRef.current = onError; });

    const clearFallbackTimer = () => {
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    // Expose replay() method to parent via ref
    useImperativeHandle(ref, () => ({
      replay: () => {
        const audio = audioRef.current;
        if (!audio || !src) return;
        audio.currentTime = 0;
        void audio.play().catch(() => {/* silent */});
      },
    }));

    useEffect(() => {
      clearFallbackTimer();

      // No src — call onEnd quickly so callers can advance
      if (!src || src.trim() === "") {
        fallbackTimerRef.current = setTimeout(() => {
          onEndRef.current?.();
          fallbackTimerRef.current = null;
        }, 100);
        return;
      }

      if (!autoPlay) return;

      const audio = audioRef.current;
      if (!audio) return;

      const handleEnded = () => {
        onEndRef.current?.();
      };

      const handleError = () => {
        onErrorRef.current?.();
        fallbackTimerRef.current = setTimeout(() => {
          onEndRef.current?.();
          fallbackTimerRef.current = null;
        }, 2000);
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      // Reset and play
      audio.currentTime = 0;
      void audio.play().catch(() => {
        // Browser may block autoplay — treat as silent error
        handleError();
      });

      return () => {
        audio.pause();
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        clearFallbackTimer();
      };
      // Re-run when src or autoPlay change
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, autoPlay]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        clearFallbackTimer();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!src) return null;

    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <audio
        ref={audioRef}
        src={src}
        style={{ display: "none" }}
        preload="auto"
      />
    );
  }
);
