"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Play, CheckCircle, Video, Check } from "lucide-react";
import confetti from "canvas-confetti";

// Free, safe base64 silent wav snippet (prevent NotSupportedError)
const YAY_SOUND = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

const playSound = (base64Sound: string) => {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio();
    audio.src = base64Sound;
    audio.volume = 0.5;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => { });
    }
  } catch { }
};

const EvidenceUploadPanel = dynamic(
  () => import("@/components/evidence-upload-panel").then((module) => module.EvidenceUploadPanel),
  {
    loading: () => <p className="muted-text">Äang táº£i...</p>,
  },
);

interface LessonCompletionCardProps {
  childId: string;
  lessonId: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  videoSource?: string | null;
}

interface WatchSessionPayload {
  watchRequired: boolean;
  requiredWatchSeconds: number;
  heartbeatIntervalSeconds: number;
  sessionToken: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

export function LessonCompletionCard({
  childId,
  lessonId,
  title,
  objective,
  estimatedMinutes,
  videoSource,
}: LessonCompletionCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchSessionLoading, setWatchSessionLoading] = useState(false);
  const [openVideoLoading, setOpenVideoLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchReady, setWatchReady] = useState(false);
  const [watchInfo, setWatchInfo] = useState<string | null>(null);
  const [requiredWatchSeconds, setRequiredWatchSeconds] = useState(estimatedMinutes * 60);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [watchSessionToken, setWatchSessionToken] = useState<string | null>(null);
  const [watchSessionStartedAtMs, setWatchSessionStartedAtMs] = useState<number | null>(null);
  const [watchSessionExpiresAtMs, setWatchSessionExpiresAtMs] = useState<number | null>(null);
  const [watchHeartbeatIntervalSeconds, setWatchHeartbeatIntervalSeconds] = useState(5);
  const [watchHeartbeatSequence, setWatchHeartbeatSequence] = useState(0);
  const [useExtendedRetention, setUseExtendedRetention] = useState(false);
  const [completionDone, setCompletionDone] = useState(false);
  const heartbeatInFlightRef = useRef(false);
  const watchRequired = Boolean(videoSource);
  const watchProgressPercentage = watchRequired
    ? Math.min(100, Math.round((watchedSeconds / Math.max(1, requiredWatchSeconds)) * 100))
    : 100;

  const applyWatchResult = useCallback(
    (watchResult: { readyForCompletion?: boolean; requiredWatchSeconds?: number; watchedSeconds?: number }) => {
      const required =
        typeof watchResult.requiredWatchSeconds === "number" ? watchResult.requiredWatchSeconds : requiredWatchSeconds;
      const watched = typeof watchResult.watchedSeconds === "number" ? watchResult.watchedSeconds : watchedSeconds;
      setRequiredWatchSeconds(required);
      setWatchedSeconds(watched);

      if (watchResult.readyForCompletion) {
        setWatchReady(true);
        setWatchInfo(`ÄÃ£ ghi nháº­n video: ${watched}s / má»¥c tiÃªu ${required}s.`);
      } else {
        setWatchReady(false);
        setWatchInfo(`Cáº§n xem thÃªm video: ${watched}s / má»¥c tiÃªu ${required}s.`);
      }
    },
    [requiredWatchSeconds, watchedSeconds],
  );

  async function openLessonVideo() {
    if (!watchRequired || openVideoLoading) {
      return;
    }

    setOpenVideoLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/video-token`);
      const body = await response.json();
      if (!response.ok || !body.ok || typeof body.data?.embedUrl !== "string") {
        setStatus(body.error?.message ?? "Unable to open lesson video.");
        return;
      }

      const popup = window.open(body.data.embedUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        setStatus("Popup was blocked by the browser. Please allow popups for this site.");
      }
    } catch (openError) {
      setStatus(openError instanceof Error ? openError.message : "Unable to reach the server.");
    } finally {
      setOpenVideoLoading(false);
    }
  }

  async function startWatchSession() {
    if (!watchRequired) {
      return;
    }

    setWatchSessionLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/watch/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childId,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setStatus(body.error?.message ?? "KhÃ´ng thá»ƒ báº¯t Ä‘áº§u phiÃªn xem video");
        return;
      }

      const session = body.data?.session as WatchSessionPayload | undefined;
      if (!session?.watchRequired || !session.sessionToken || !session.issuedAt || !session.expiresAt) {
        setStatus("BÃ i há»c nÃ y khÃ´ng yÃªu cáº§u xem video.");
        return;
      }

      setWatchSessionToken(session.sessionToken);
      setWatchHeartbeatIntervalSeconds(session.heartbeatIntervalSeconds);
      setRequiredWatchSeconds(session.requiredWatchSeconds);
      setWatchedSeconds(0);
      setWatchReady(false);
      setWatchInfo(
        `ÄÃ£ báº¯t Ä‘áº§u phiÃªn xem video. Má»¥c tiÃªu ${session.requiredWatchSeconds}s, Ä‘á»“ng bá»™ má»—i ${session.heartbeatIntervalSeconds}s.`,
      );
      setWatchSessionStartedAtMs(new Date(session.issuedAt).getTime());
      setWatchSessionExpiresAtMs(new Date(session.expiresAt).getTime());
      setWatchHeartbeatSequence(0);
    } catch (watchSessionError) {
      setStatus(watchSessionError instanceof Error ? watchSessionError.message : "KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n há»‡ thá»‘ng.");
    } finally {
      setWatchSessionLoading(false);
    }
  }

  const sendWatchHeartbeat = useCallback(
    async (nextSequence: number) => {
      if (!watchRequired || !watchSessionToken || watchReady) {
        return;
      }

      if (watchSessionExpiresAtMs && Date.now() > watchSessionExpiresAtMs) {
        setStatus("PhiÃªn xem video Ä‘Ã£ háº¿t háº¡n. HÃ£y báº¯t Ä‘áº§u phiÃªn má»›i.");
        setWatchSessionToken(null);
        setWatchSessionStartedAtMs(null);
        setWatchSessionExpiresAtMs(null);
        return;
      }

      if (heartbeatInFlightRef.current) {
        return;
      }
      heartbeatInFlightRef.current = true;

      try {
        const response = await fetch(`/api/lessons/${lessonId}/watch/heartbeat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            childId,
            sessionToken: watchSessionToken,
            sequence: nextSequence,
          }),
        });
        const body = await response.json();
        if (!response.ok || !body.ok) {
          setStatus(body.error?.message ?? "KhÃ´ng Ä‘á»“ng bá»™ Ä‘Æ°á»£c tiáº¿n Ä‘á»™ xem video.");
          return;
        }

        const watchResult = body.data?.watch as
          | { readyForCompletion?: boolean; requiredWatchSeconds?: number; watchedSeconds?: number }
          | undefined;
        if (!watchResult) {
          return;
        }

        setWatchHeartbeatSequence(nextSequence);
        applyWatchResult(watchResult);
      } catch (watchError) {
        setStatus(watchError instanceof Error ? watchError.message : "Không thể kết nối đến hệ thống.");
      } finally {
        heartbeatInFlightRef.current = false;
      }
    },
    [
      applyWatchResult,
      childId,
      lessonId,
      watchReady,
      watchRequired,
      watchSessionExpiresAtMs,
      watchSessionToken,
    ],
  );

  useEffect(() => {
    if (!watchRequired || !watchSessionToken || watchReady) {
      return;
    }

    const intervalMs = Math.max(1000, watchHeartbeatIntervalSeconds * 1000);
    const timer = window.setInterval(() => {
      void sendWatchHeartbeat(watchHeartbeatSequence + 1);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    sendWatchHeartbeat,
    watchHeartbeatIntervalSeconds,
    watchHeartbeatSequence,
    watchReady,
    watchRequired,
    watchSessionToken,
  ]);

  async function markVideoWatched() {
    if (!watchRequired) {
      return;
    }

    if (!watchSessionToken || !watchSessionStartedAtMs) {
      setStatus("HÃ£y báº¯t Ä‘áº§u phiÃªn xem video trÆ°á»›c khi ghi nháº­n tiáº¿n Ä‘á»™.");
      return;
    }

    if (watchSessionExpiresAtMs && Date.now() > watchSessionExpiresAtMs) {
      setStatus("PhiÃªn xem video Ä‘Ã£ háº¿t háº¡n. HÃ£y báº¯t Ä‘áº§u phiÃªn má»›i.");
      setWatchSessionToken(null);
      setWatchSessionStartedAtMs(null);
      setWatchSessionExpiresAtMs(null);
      return;
    }

    setWatchLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/watch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childId,
          sessionToken: watchSessionToken,
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setStatus(body.error?.message ?? "KhÃ´ng thá»ƒ ghi nháº­n tiáº¿n Ä‘á»™ xem video");
        return;
      }

      const watchResult = body.data?.watch as
        | { readyForCompletion?: boolean; requiredWatchSeconds?: number; watchedSeconds?: number }
        | undefined;
      if (watchResult) {
        applyWatchResult(watchResult);
      }
    } catch (watchError) {
      setStatus(watchError instanceof Error ? watchError.message : "KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n há»‡ thá»‘ng.");
    } finally {
      setWatchLoading(false);
    }
  }

  async function markCompleted() {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childId,
          quizScore: 90,
          minutesLearned: estimatedMinutes,
          checklist: ["watch_done", "activity_done", "offline_done"],
          useExtendedRetention,
        }),
      });

      const body = await response.json();
      if (!response.ok || !body.ok) {
        setStatus(body.error?.message ?? "KhÃ´ng thá»ƒ lÆ°u tiáº¿n Ä‘á»™");
        return;
      }

      if (body.data.idempotent) {
        setStatus("BÃ i nÃ y Ä‘Ã£ hoÃ n thÃ nh trÆ°á»›c Ä‘Ã³.");
      } else {
        setStatus("ÄÃ£ hoÃ n thÃ nh bÃ i há»c vÃ  nháº­n thÆ°á»Ÿng.");
        playSound(YAY_SOUND);
        // Trigger enhanced confetti celebration
        const duration = 2500;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 15,
            angle: 60,
            spread: 80,
            origin: { x: 0 },
            colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899']
          });
          confetti({
            particleCount: 15,
            angle: 120,
            spread: 80,
            origin: { x: 1 },
            colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      }

      setCompletionDone(true);
    } catch (completeError) {
      setStatus(completeError instanceof Error ? completeError.message : "KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n há»‡ thá»‘ng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <m.article className="list-item stack-item lesson-flow-card" layout style={{ border: "2px solid var(--surface-200)", padding: "1.5rem" }}>
      <strong style={{ fontSize: "1.25rem", color: "var(--brand-700)" }}>{title}</strong>
      <p className="muted-text" style={{ fontSize: "1rem" }}>{objective}</p>
      <p className="muted-text">Thá»i lÆ°á»£ng dá»± kiáº¿n: <strong>{estimatedMinutes} phÃºt</strong></p>
      {watchRequired ? (
        <div className="page-stack" style={{ width: "100%", background: "color-mix(in srgb, var(--surface-100) 50%, white)", padding: "1rem", borderRadius: "16px" }}>
          {videoSource ? (
            <m.button
              type="button"
              className="ghost-button"
              onClick={openLessonVideo}
              disabled={openVideoLoading}
              whileHover={prefersReducedMotion ? undefined : { y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              style={{ justifyContent: "center", gap: "0.5rem", background: "white", border: "2px solid var(--surface-200)" }}
            >
              <Play size={18} className="text-brand-500" /> {openVideoLoading ? "Opening video..." : "Open lesson video"}
            </m.button>
          ) : null}
          <m.button
            type="button"
            className="ghost-button"
            onClick={startWatchSession}
            disabled={watchSessionLoading}
            whileHover={prefersReducedMotion ? undefined : { y: -1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            style={{ justifyContent: "center", gap: "0.5rem" }}
          >
            {watchSessionLoading ? "Äang táº¡o phiÃªn xem..." : <><Video size={18} /> Báº¯t Ä‘áº§u theo dÃµi xem video</>}
          </m.button>
          <div
            className="watch-progress-track super-thick-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={watchProgressPercentage}
            aria-valuetext={`${watchProgressPercentage}%`}
            aria-label="Tiáº¿n Ä‘á»™ xem video"
          >
            <m.div
              className={`watch-progress-fill ${watchReady ? "watch-progress-fill-ready" : ""}`}
              initial={false}
              animate={{ width: `${watchProgressPercentage}%` }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="muted-text" style={{ textAlign: "center", fontSize: "0.9rem" }}>
            Tiáº¿n Ä‘á»™: <strong style={{ color: "var(--brand-600)" }}>{watchProgressPercentage}%</strong>
          </p>
          <m.button
            type="button"
            className="ghost-button"
            onClick={markVideoWatched}
            disabled={watchLoading || !watchSessionToken}
            whileHover={prefersReducedMotion ? undefined : { y: -1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            style={{ justifyContent: "center", gap: "0.5rem", background: "white" }}
          >
            {watchLoading ? "Äang ghi nháº­n..." : <><CheckCircle size={18} className="text-brand-500" /> ÄÃ£ xem video, tiáº¿p tá»¥c</>}
          </m.button>
          <AnimatePresence mode="wait" initial={false}>
            {watchInfo ? (
              <m.p
                key={watchInfo}
                className={`muted-text status-pill ${watchReady ? "status-pill-ready" : ""}`}
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {watchInfo}
              </m.p>
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <p className="muted-text">BÃ i há»c nÃ y chÆ°a cÃ³ video, bá» qua bÆ°á»›c xem video.</p>
      )}
      <label className="inline-checkbox" style={{ opacity: 0.6, transform: "scale(0.9)", transformOrigin: "left center" }}>
        <input
          type="checkbox"
          checked={useExtendedRetention}
          onChange={(event) => setUseExtendedRetention(event.target.checked)}
          disabled={loading}
        />
        <span>Æ¯u tiÃªn lÆ°u trá»¯ 365 ngÃ y náº¿u gÃ³i há»— trá»£</span>
      </label>
      <m.button
        type="button"
        className="solid-button"
        onClick={markCompleted}
        disabled={loading || (watchRequired && !watchReady) || completionDone}
        whileHover={prefersReducedMotion || completionDone ? undefined : { y: -2, scale: 1.02 }}
        whileTap={prefersReducedMotion || completionDone ? undefined : { scale: 0.96 }}
        style={{ width: "100%", padding: "1.2rem", fontSize: "1.1rem", borderRadius: "20px", marginTop: "1rem", background: completionDone ? "var(--brand-600)" : (loading || (watchRequired && !watchReady)) ? "var(--surface-200)" : undefined, color: completionDone ? "white" : (loading || (watchRequired && !watchReady)) ? "var(--ink-700)" : undefined, boxShadow: (loading || (watchRequired && !watchReady) || completionDone) ? "none" : undefined, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
      >
        {loading ? "Äang ghi nháº­n..." : completionDone ? <><Check size={20} /> ðŸŽ‰ ÄÃ£ xong!</> : "HoÃ n thÃ nh bÃ i"}
      </m.button>
      <AnimatePresence mode="wait" initial={false}>
        {status ? (
          <m.p
            key={status}
            className="muted-text"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {status}
          </m.p>
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {completionDone ? (
          <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: "1.5rem", borderTop: "2px dashed color-mix(in srgb, var(--surface-200) 60%, transparent)", paddingTop: "1.5rem" }}>
            <EvidenceUploadPanel childId={childId} lessonId={lessonId} />
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.article>
  );
}
