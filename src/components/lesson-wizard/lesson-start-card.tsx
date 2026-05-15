"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Play } from "lucide-react";
import { LessonPlayerScene } from "@/components/lesson-player/LessonPlayerScene";
import { useLessonLaunchTransition } from "./use-lesson-launch-transition";

interface LessonStartCardProps {
  childId: string;
  lessonId: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trackCode?: "ENGLISH" | "MATH" | "HABIT";
  tierLabel?: string | null;
  videoSource?: string | null;
  bunnyVideoId?: string | null;
  videoStatus?: string;
  onLessonSelect?: (lessonId: string) => void;
  onLessonComplete?: (lessonId: string) => void;
  beforeStart?: () => Promise<boolean> | boolean;
}

interface LessonLaunchButtonProps {
  isLaunching: boolean;
  isReady: boolean;
  prefersReducedMotion: boolean;
  onLaunch: () => void;
}

const SPARKLES = [
  { id: "s1", top: "15%", left: "8%", dx: -22, dy: -22, rotate: -30, color: "#f59e0b" },
  { id: "s2", top: "20%", left: "84%", dx: 20, dy: -24, rotate: 35, color: "#0ea5e9" },
  { id: "s3", top: "72%", left: "12%", dx: -24, dy: 18, rotate: 24, color: "#f97316" },
  { id: "s4", top: "78%", left: "86%", dx: 20, dy: 20, rotate: -24, color: "#22c55e" },
  { id: "s5", top: "8%", left: "50%", dx: 0, dy: -28, rotate: 0, color: "#eab308" },
];

function isDirectVideoSource(value: string | null | undefined) {
  return typeof value === "string" && (/^https?:\/\//i.test(value) || value.startsWith("/"));
}

function detectStreamTypeFromSource(value: string | null | undefined): "hls" | "file" | null {
  if (!value) return null;
  return /\.m3u8($|[?#])/i.test(value) ? "hls" : "file";
}

async function fetchVideoTokenWithTimeout(
  lessonId: string,
  timeoutMs = 8000,
): Promise<{ embedUrl: string; streamType?: "hls" | "file" | "embed" } | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(`/api/lessons/${lessonId}/video-token`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { embedUrl?: string; streamType?: "hls" | "file" | "embed" };
    };
    if (!json.data?.embedUrl) return null;
    return {
      embedUrl: json.data.embedUrl,
      streamType: json.data.streamType,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function LessonLaunchButton({
  isLaunching,
  isReady,
  prefersReducedMotion,
  onLaunch,
}: LessonLaunchButtonProps) {
  return (
    <div className="relative w-full mt-2">
      <AnimatePresence>
        {isLaunching && !prefersReducedMotion
          ? SPARKLES.map((sparkle) => (
              <m.span
                key={sparkle.id}
                aria-hidden="true"
                className="pointer-events-none absolute inline-flex items-center justify-center text-sm"
                style={{
                  top: sparkle.top,
                  left: sparkle.left,
                  color: sparkle.color,
                }}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.2, 1.1, 0.4],
                  x: [0, sparkle.dx],
                  y: [0, sparkle.dy],
                  rotate: [0, sparkle.rotate],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                ✦
              </m.span>
            ))
          : null}
      </AnimatePresence>

      <m.button
        type="button"
        onClick={onLaunch}
        disabled={isLaunching || !isReady}
        className="solid-button w-full flex items-center justify-center gap-2"
        animate={
          prefersReducedMotion
            ? undefined
            : isLaunching
              ? {
                  scale: [1, 1.06, 0.97, 1.03, 1],
                  y: [0, -3, 0],
                }
              : undefined
        }
        whileHover={prefersReducedMotion || isLaunching ? undefined : { y: -2, scale: 1.03 }}
        whileTap={prefersReducedMotion || isLaunching ? undefined : { scale: 0.97 }}
        transition={prefersReducedMotion ? undefined : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          minHeight: "56px",
          borderRadius: "999px",
          fontSize: "1.1rem",
          fontWeight: 700,
          padding: "0.85rem 1.2rem",
          color: "white",
          border: "2px solid color-mix(in srgb, white 45%, transparent)",
          background: "linear-gradient(135deg, #f97316 0%, #facc15 48%, #22c55e 100%)",
          boxShadow: "0 14px 30px rgba(249, 115, 22, 0.28)",
        }}
      >
        <Play size={22} fill="currentColor" />{" "}
        {!isReady ? "Loading..." : isLaunching ? "Start up..." : "Start the lesson"}
      </m.button>
    </div>
  );
}

export function LessonStartCard(props: LessonStartCardProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { isOpen, isLaunching, handleStartLesson, handleCloseLesson } = useLessonLaunchTransition({
    lessonId: props.lessonId,
    onSelect: props.onLessonSelect,
    prefersReducedMotion,
    openDelayMs: 0,
  });
  const [resolvedVideoSource, setResolvedVideoSource] = useState<string | null | undefined>(undefined);
  const [resolvedVideoStreamType, setResolvedVideoStreamType] = useState<"hls" | "file" | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    setIsInteractive(true);
  }, []);

  async function handleLaunch() {
    if (!isInteractive) {
      return;
    }

    if (props.beforeStart) {
      const shouldStart = await props.beforeStart();
      if (!shouldStart) {
        return;
      }
    }

    setIsFetchingToken(true);

    // Always request server-issued playback URL first with a timeout guard
    // to prevent users waiting indefinitely if token service is slow.
    if (props.bunnyVideoId || props.videoSource) {
      const tokenData = await fetchVideoTokenWithTimeout(props.lessonId);
      if (tokenData?.embedUrl) {
        setResolvedVideoSource(tokenData.embedUrl);
        setResolvedVideoStreamType(
          tokenData.streamType === "hls" ? "hls" : tokenData.streamType === "file" ? "file" : null,
        );
      } else {
        setResolvedVideoSource(isDirectVideoSource(props.videoSource) ? props.videoSource : null);
        setResolvedVideoStreamType(detectStreamTypeFromSource(props.videoSource));
      }
    } else {
      setResolvedVideoSource(props.videoSource ?? null);
      setResolvedVideoStreamType(detectStreamTypeFromSource(props.videoSource));
    }

    setIsFetchingToken(false);
    handleStartLesson();
  }

  return (
    <>
      <m.article
        className="list-item stack-item lesson-flow-card relative isolate overflow-hidden flex flex-col items-center text-center gap-4 sm:gap-5"
        layout
        whileHover={prefersReducedMotion ? undefined : { y: -5, scale: 1.01 }}
        style={{
          border: "2px solid color-mix(in srgb, #facc15 45%, #fff)",
          padding: "1.6rem 1.2rem",
          borderRadius: "30px",
          background:
            "radial-gradient(circle at 12% 10%, rgba(254, 240, 138, 0.65) 0%, rgba(254, 240, 138, 0) 40%), radial-gradient(circle at 88% 88%, rgba(186, 230, 253, 0.55) 0%, rgba(186, 230, 253, 0) 42%), linear-gradient(145deg, #ffffff 0%, #fff7ed 52%, #ecfeff 100%)",
          boxShadow: "0 18px 42px rgba(14, 116, 144, 0.14), 0 8px 22px rgba(249, 115, 22, 0.18)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute -top-6 -left-6 h-16 w-16 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(253, 224, 71, 0.65) 0%, rgba(253, 224, 71, 0) 70%)" }}
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-7 -right-7 h-20 w-20 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(125, 211, 252, 0.55) 0%, rgba(125, 211, 252, 0) 70%)" }}
        />

        <div
          className="w-20 h-20 rounded-[28px] flex items-center justify-center text-4xl mb-1"
          style={{
            background:
              "linear-gradient(145deg, color-mix(in srgb, #fef08a 68%, white), color-mix(in srgb, #bae6fd 62%, white))",
            border: "2px solid color-mix(in srgb, #ffffff 65%, #facc15)",
            boxShadow: "0 10px 20px rgba(249, 115, 22, 0.14)",
          }}
        >
          🚀
        </div>
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: "color-mix(in srgb, #fef3c7 80%, white)",
            border: "1px solid color-mix(in srgb, #f59e0b 36%, transparent)",
            color: "#b45309",
          }}
        >
          Today's mission
        </span>
        <strong style={{ fontSize: "1.5rem", color: "var(--brand-700)", lineHeight: "1.2" }}>{props.title}</strong>
        <p className="text-ink-500" style={{ fontSize: "1.05rem", maxWidth: "30ch" }}>
          {props.objective}
        </p>
        <p className="muted-text text-sm">
          Duration: <strong style={{ color: "var(--brand-700)" }}>{props.estimatedMinutes} minutes</strong>
        </p>

        <LessonLaunchButton
          isLaunching={isLaunching || isFetchingToken}
          isReady={isInteractive}
          prefersReducedMotion={prefersReducedMotion}
          onLaunch={() => {
            void handleLaunch();
          }}
        />

        {isFetchingToken ? (
          <div
            className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-[30px] p-4"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0) 45%, rgba(255,255,255,0.92) 100%)",
            }}
          >
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: "color-mix(in srgb, #0ea5e9 14%, white)",
                border: "1px solid color-mix(in srgb, #0ea5e9 28%, transparent)",
                color: "#0c4a6e",
              }}
            >
              Preparing lessons...
            </span>
          </div>
        ) : null}
      </m.article>

      {isOpen ? (
        <LessonPlayerScene
          childId={props.childId}
          lessonId={props.lessonId}
          title={props.title}
          objective={props.objective}
          estimatedMinutes={props.estimatedMinutes}
          trackCode={props.trackCode ?? "ENGLISH"}
          skipIntro
          tierLabel={props.tierLabel}
          videoSource={resolvedVideoSource === undefined ? props.videoSource : resolvedVideoSource}
          videoStreamType={resolvedVideoSource === undefined ? detectStreamTypeFromSource(props.videoSource) : resolvedVideoStreamType}
          onClose={handleCloseLesson}
          onCompleted={props.onLessonComplete}
        />
      ) : null}
    </>
  );
}
