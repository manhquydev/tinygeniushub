"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import { ArrowLeft } from "lucide-react";
import { LessonIntroPanel } from "@/components/lesson-player/panels/LessonIntroPanel";
import { VideoPlayerPanel } from "@/components/lesson-player/panels/VideoPlayerPanel";
import { ActivityPanel } from "@/components/lesson-player/panels/ActivityPanel";
import { CompletionPanel } from "@/components/lesson-player/panels/CompletionPanel";
import { EvidenceUploadPanel as EvidenceUploadPanelInner } from "@/components/evidence-upload-panel";
import { synth } from "@/lib/audio-utils";
import type { KidMascotState } from "@/components/animation/kid-mascot";
import type { ActivitySpec, ActivityType } from "@/modules/content/activity-types";
import "@/components/lesson-player/lesson-player.css";

// Lazy-load ThreeJS canvas (SSR-safe)
const LessonPlayerThreeCanvas = dynamic(
  () =>
    import("@/components/lesson-player/three/LessonPlayerThreeCanvas").then(
      (m) => m.LessonPlayerThreeCanvas,
    ),
  { ssr: false },
);

type LessonStep = 0 | 1 | 2 | 3 | 4;
type TrackCode = "ENGLISH" | "MATH" | "HABIT";
type BurstType = "correct" | "wrong" | null;

type ActivityRow = {
  id: string;
  type: ActivityType;
  prompt: string;
  spec: ActivitySpec;
  passCriteria: number;
};

interface WatchSessionPayload {
  watchRequired: boolean;
  requiredWatchSeconds: number;
  heartbeatIntervalSeconds: number;
  sessionToken: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

export interface LessonPlayerSceneProps {
  childId: string;
  lessonId: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trackCode: TrackCode;
  videoSource?: string | null;
  videoStreamType?: "hls" | "file" | null;
  tierLabel?: string | null;
  nextLessonTitle?: string | null;
  skipIntro?: boolean;
  onClose: () => void;
  onCompleted?: (lessonId: string) => void;
  onNextLesson?: () => void;
}

function shuffleAndTake<T>(input: T[], count: number): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
  return arr.slice(0, count);
}

const STEP_BG_CLASS: Record<LessonStep, string> = {
  0: "step-intro",
  1: "step-video",
  2: "step-quiz",
  3: "step-upload",
  4: "step-done",
};

const TRACK_COLOR_CLASS: Record<TrackCode, string> = {
  ENGLISH: "lp-track-english",
  MATH: "lp-track-math",
  HABIT: "lp-track-habit",
};

export function LessonPlayerScene({
  childId,
  lessonId,
  title,
  objective,
  estimatedMinutes,
  trackCode,
  videoSource,
  videoStreamType,
  tierLabel,
  nextLessonTitle,
  skipIntro = false,
  onClose,
  onCompleted,
  onNextLesson,
}: LessonPlayerSceneProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<LessonStep>(skipIntro ? 1 : 0);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Three.js burst FX trigger
  const [burstType, setBurstType] = useState<BurstType>(null);
  const burstResetRef = useRef<number | null>(null);

  const triggerBurst = useCallback((type: NonNullable<BurstType>) => {
    if (burstResetRef.current) window.clearTimeout(burstResetRef.current);
    setBurstType(type);
    burstResetRef.current = window.setTimeout(() => setBurstType(null), 1200);
  }, []);

  // Mascot state
  const [mascotState, setMascotState] = useState<KidMascotState>("talking");
  const mascotResetTimer = useRef<number | null>(null);

  // Activity state
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoadError, setActivityLoadError] = useState(false);
  const [activityReloadNonce, setActivityReloadNonce] = useState(0);
  const [activityAnswerLocked, setActivityAnswerLocked] = useState(false);
  const [activityResult, setActivityResult] = useState<"idle" | "correct" | "wrong">("idle");
  const consecutiveCorrectRef = useRef(0);
  const totalWrongRef = useRef(0);
  const quizTimerRef = useRef<number | null>(null);

  // Video tracking state
  const [watchSessionLoading, setWatchSessionLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [watchReady, setWatchReady] = useState(false);
  const [requiredWatchSeconds, setRequiredWatchSeconds] = useState(estimatedMinutes * 60);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [watchSessionToken, setWatchSessionToken] = useState<string | null>(null);
  const [watchSessionExpiresAtMs, setWatchSessionExpiresAtMs] = useState<number | null>(null);
  const [watchHeartbeatIntervalSeconds, setWatchHeartbeatIntervalSeconds] = useState(5);
  const [watchHeartbeatSequence, setWatchHeartbeatSequence] = useState(0);
  const [videoPlaybackActive, setVideoPlaybackActive] = useState(false);
  const heartbeatInFlightRef = useRef(false);
  const watchRequired = Boolean(videoSource);
  const watchProgressPercentage = watchRequired
    ? Math.min(100, Math.round((watchedSeconds / Math.max(1, requiredWatchSeconds)) * 100))
    : 100;
  const watchCanContinue = !watchRequired || watchReady;

  const fetchJsonWithTimeout = useCallback(async (
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs = 12_000,
  ): Promise<{ response: Response; body: unknown } | null> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);
      return { response, body };
    } catch {
      return null;
    } finally {
      window.clearTimeout(timer);
    }
  }, []);

  // Mount & body lock
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (mascotResetTimer.current) window.clearTimeout(mascotResetTimer.current);
      if (quizTimerRef.current) window.clearTimeout(quizTimerRef.current);
      if (burstResetRef.current) window.clearTimeout(burstResetRef.current);
    };
  }, []);

  // Mascot state by step
  useEffect(() => {
    if (step === 4) {
      setMascotState("celebrating");
    } else if (step === 0) {
      setMascotState("talking");
    } else {
      setMascotState("idle");
    }
  }, [step]);

  // --- Watch Session ---
  async function startWatchSession() {
    if (!watchRequired) return;
    setWatchSessionLoading(true);
    setStatus(null);
    try {
      const result = await fetchJsonWithTimeout(`/api/lessons/${lessonId}/watch/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId }),
      });
      if (!result) {
        setStatus("Network is slow, cannot initiate video viewing session.");
        return;
      }
      const body = result.body as { ok?: boolean; data?: { session?: WatchSessionPayload } } | null;
      if (!result.response.ok || !body?.ok) {
        setStatus("Unable to initialize video viewing session.");
        return;
      }
      const session = body.data?.session;
      if (!session?.watchRequired || !session.sessionToken) {
        setWatchReady(true);
        setWatchSessionToken(null);
        setWatchSessionExpiresAtMs(null);
        setRequiredWatchSeconds(0);
        setWatchedSeconds(0);
        setWatchHeartbeatSequence(0);
        return;
      }
      setWatchSessionToken(session.sessionToken);
      setWatchHeartbeatIntervalSeconds(session.heartbeatIntervalSeconds);
      setRequiredWatchSeconds(session.requiredWatchSeconds);
      setWatchedSeconds(0);
      setWatchReady(false);
      setWatchSessionExpiresAtMs(new Date(session.expiresAt!).getTime());
      setWatchHeartbeatSequence(0);
    } catch {
      setStatus("Unable to initialize video viewing session.");
    } finally {
      setWatchSessionLoading(false);
    }
  }

  // Heartbeat interval
  const sendHeartbeat = useCallback(
    async (seq: number) => {
      if (!watchRequired || !watchSessionToken || watchReady) return;
      if (watchSessionExpiresAtMs && Date.now() > watchSessionExpiresAtMs) return;
      if (heartbeatInFlightRef.current) return;
      heartbeatInFlightRef.current = true;
      try {
        const result = await fetchJsonWithTimeout(`/api/lessons/${lessonId}/watch/heartbeat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            childId,
            sessionToken: watchSessionToken,
            sequence: seq,
            isPlaying: videoPlaybackActive,
          }),
        });
        if (!result) return;
        const body = result.body as {
          ok?: boolean;
          data?: {
            watch?: {
              readyForCompletion?: boolean;
              watchedSeconds?: number;
              requiredWatchSeconds?: number;
            };
          };
        } | null;
        if (!result.response.ok || !body?.ok) return;
        const wr = body.data?.watch;
        if (!wr) return;
        setWatchHeartbeatSequence(seq);
        if (typeof wr.requiredWatchSeconds === "number") setRequiredWatchSeconds(wr.requiredWatchSeconds);
        if (typeof wr.watchedSeconds === "number") setWatchedSeconds(wr.watchedSeconds);
        if (wr.readyForCompletion) setWatchReady(true);
      } catch {
        // silent
      } finally {
        heartbeatInFlightRef.current = false;
      }
    },
    [
      childId,
      lessonId,
      videoPlaybackActive,
      watchReady,
      watchRequired,
      watchSessionExpiresAtMs,
      watchSessionToken,
    ],
  );

  useEffect(() => {
    if (!watchRequired || !watchSessionToken || watchReady) return;
    const intervalMs = Math.max(1000, watchHeartbeatIntervalSeconds * 1000);
    const timer = window.setInterval(() => {
      void sendHeartbeat(watchHeartbeatSequence + 1);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [sendHeartbeat, watchHeartbeatIntervalSeconds, watchHeartbeatSequence, watchReady, watchRequired, watchSessionToken]);

  async function markVideoWatched() {
    if (!watchRequired) return true;
    if (!watchSessionToken) return false;
    setWatchLoading(true);
    try {
      const result = await fetchJsonWithTimeout(`/api/lessons/${lessonId}/watch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId, sessionToken: watchSessionToken }),
      });
      if (!result) {
        setStatus("Slow connection, cannot confirm video viewing.");
        return false;
      }
      const body = result.body as {
        ok?: boolean;
        data?: {
          watch?: {
            readyForCompletion?: boolean;
            watchedSeconds?: number;
            requiredWatchSeconds?: number;
          };
        };
      };
      if (!result.response.ok || !body.ok) {
        return false;
      }

      const watch = body.data?.watch;
      if (typeof watch?.requiredWatchSeconds === "number") {
        setRequiredWatchSeconds(watch.requiredWatchSeconds);
      }
      if (typeof watch?.watchedSeconds === "number") {
        setWatchedSeconds(watch.watchedSeconds);
      }

      if (watch?.readyForCompletion) {
        setWatchReady(true);
        return true;
      }

      const watched = typeof watch?.watchedSeconds === "number" ? watch.watchedSeconds : watchedSeconds;
      const required =
        typeof watch?.requiredWatchSeconds === "number"
          ? watch.requiredWatchSeconds
          : requiredWatchSeconds;
      const remainingSeconds = Math.max(0, required - watched);
      if (remainingSeconds > 0) {
        setStatus(`I need to see more about approx${remainingSeconds}seconds before continuing.`);
      }
      return false;
    } catch {
      setStatus("Unable to confirm viewing of video.");
      return false;
    } finally {
      setWatchLoading(false);
    }
  }

  // --- Step transitions ---
  const handleNextToVideo = () => {
    synth.playPop();
    setStep(1);
    setStatus(null);
  };

  useEffect(() => {
    if (step !== 1) return;
    if (!watchRequired) return;
    if (watchReady) return;
    if (watchSessionLoading) return;
    if (watchSessionToken) return;
    void startWatchSession();
  }, [step, watchRequired, watchReady, watchSessionLoading, watchSessionToken]);

  useEffect(() => {
    if (step !== 1) {
      setVideoPlaybackActive(false);
    }
  }, [step]);

  const handleNextToQuiz = async () => {
    if (watchRequired && !watchReady) {
      const ok = await markVideoWatched();
      if (!ok) return;
    }
    setStatus(null);
    setStep(2);
    setActivityResult("idle");
  };

  // Load activities when step=2
  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    setActivityLoading(true);
    setActivityLoadError(false);
    setActivityAnswerLocked(false);
    setActivityIndex(0);
    setActivityResult("idle");

    void (async () => {
      try {
        const result = await fetchJsonWithTimeout(`/api/lessons/${lessonId}/activities`, {
          method: "GET",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!result) {
          setActivities([]);
          setActivityLoadError(true);
          setStatus("If you can't download the exercise, you can complete it to continue.");
          return;
        }
        const body = result.body as {
          ok?: boolean;
          data?: { activities?: ActivityRow[] };
        } | null;
        if (!result.response.ok || !body?.ok) {
          setActivities([]);
          setActivityLoadError(true);
          return;
        }
        const fetched = Array.isArray(body.data?.activities) ? body.data.activities : [];
        setActivities(shuffleAndTake(fetched, 3));
        setActivityLoadError(false);
      } catch {
        if (cancelled) return;
        setActivities([]);
        setActivityLoadError(true);
      } finally {
        if (cancelled) return;
        setActivityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activityReloadNonce, lessonId, step]);

  const retryLoadActivities = useCallback(() => {
    setActivityReloadNonce((value) => value + 1);
  }, []);

  // Mark completed
  const markCompleted = useCallback(
    async (opts?: { close?: boolean; skipFx?: boolean }) => {
      setLoading(true);
      setStatus(null);
      try {
        const result = await fetchJsonWithTimeout(`/api/lessons/${lessonId}/complete`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            childId,
            quizScore: 100,
            minutesLearned: estimatedMinutes,
            checklist: ["watch_done", "activity_done", "offline_done"],
            useExtendedRetention: true,
          }),
        });
        const body = (result?.body ?? null) as { ok?: boolean } | null;
        if (!result || !result.response.ok || !body?.ok) {
          setStatus("Unable to complete lesson. Please try again.");
          return;
        }
        if (!opts?.skipFx) {
          synth.playYay();
        }
        if (!opts?.skipFx && !prefersReducedMotion) {
          const end = Date.now() + 1800;
          const launch = () => {
            confetti({ particleCount: 14, angle: 60, spread: 65, origin: { x: 0 }, colors: ["#38bdf8", "#a78bfa", "#facc15"] });
            confetti({ particleCount: 14, angle: 120, spread: 65, origin: { x: 1 }, colors: ["#22d3ee", "#fb7185", "#34d399"] });
            if (Date.now() < end) requestAnimationFrame(launch);
          };
          launch();
        }
        onCompleted?.(lessonId);
        if (opts?.close) {
          onClose();
        } else {
          setStep(4);
        }
      } finally {
        setLoading(false);
      }
    },
    [childId, estimatedMinutes, lessonId, onClose, onCompleted, prefersReducedMotion],
  );

  // Activity answer handler
  const handleActivityAnswer = useCallback(
    (isCorrect: boolean) => {
      if (loading || activityAnswerLocked) return;
      if (quizTimerRef.current) window.clearTimeout(quizTimerRef.current);

      setActivityResult(isCorrect ? "correct" : "wrong");
      setActivityAnswerLocked(true);

      // Trigger ThreeJS burst
      triggerBurst(isCorrect ? "correct" : "wrong");

      if (isCorrect) {
        synth.playTing();
        consecutiveCorrectRef.current += 1;
        totalWrongRef.current = 0;

        if (consecutiveCorrectRef.current >= 5) {
          setMascotState("celebrating");
          synth.playYay();
        } else if (consecutiveCorrectRef.current >= 3) {
          setMascotState("excited");
        } else {
          setMascotState("happy");
          if (mascotResetTimer.current) window.clearTimeout(mascotResetTimer.current);
          mascotResetTimer.current = window.setTimeout(() => setMascotState("idle"), 1000);
        }

        const isLast = activityIndex >= activities.length - 1;
        if (isLast) {
          quizTimerRef.current = window.setTimeout(() => {
            setActivityResult("idle");
            void markCompleted({ close: false, skipFx: false });
          }, 1500);
        } else {
          quizTimerRef.current = window.setTimeout(() => {
            setActivityIndex((i) => i + 1);
            setActivityAnswerLocked(false);
            setActivityResult("idle");
          }, 900);
        }
        return;
      }

      synth.playBzz();
      consecutiveCorrectRef.current = 0;
      totalWrongRef.current += 1;
      if (totalWrongRef.current >= 3) {
        setMascotState("angry");
      } else {
        setMascotState("nervous");
        if (mascotResetTimer.current) window.clearTimeout(mascotResetTimer.current);
        mascotResetTimer.current = window.setTimeout(() => setMascotState("idle"), 1100);
      }

      quizTimerRef.current = window.setTimeout(() => {
        setActivityAnswerLocked(false);
        setActivityResult("idle");
      }, 1500);
    },
    [activityAnswerLocked, activityIndex, activities.length, loading, markCompleted, triggerBurst],
  );

  const stepBgClass = STEP_BG_CLASS[step];
  const trackClass = TRACK_COLOR_CLASS[trackCode];
  const hudDark = step === 1 || step === 4;

  if (!mounted) return null;

  const content = (
    <div className={`lp-scene ${trackClass}`}>
      {/* ThreeJS background – receives burst prop */}
      <LessonPlayerThreeCanvas
        step={step}
        burst={burstType}
        className="lp-three-layer"
      />

      {/* Background gradient overlay per step */}
      <div className={`lp-bg-overlay ${stepBgClass}`} key={stepBgClass} />

      {/* HUD – no emoji, CSS-only indicators */}
      <header className={`lp-hud${hudDark ? " is-dark" : ""}`}>
        <button
          type="button"
          className="lp-hud-back"
          onClick={onClose}
          aria-label="Exit lesson"
        >
          <ArrowLeft size={20} />
          <span className="lp-hud-back-label">Exit</span>
        </button>
        <div className="lp-hud-info">
          {tierLabel ? (
            <p className="lp-hud-tier">{tierLabel}</p>
          ) : null}
          <p className="lp-hud-title">{title}</p>
        </div>
        {/* Time pill – pure CSS dot indicator (no emoji) */}
        <div className="lp-hud-time-pill" aria-label={`Duration${estimatedMinutes}minute`}>
          {estimatedMinutes}minute
        </div>
      </header>

      {/* Step progress track */}
      <div className="lp-step-track" role="progressbar" aria-valuenow={step + 1} aria-valuemax={5} aria-label="Lesson progress">
        {([0, 1, 2, 3, 4] as LessonStep[]).map((s) => (
          <span
            key={s}
            className={`lp-step-dot${s < step ? " is-done" : s === step ? " is-active" : ""}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Step Panels */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <m.div key="intro" style={{ width: "100%", display: "contents" }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <LessonIntroPanel
              title={title}
              objective={objective}
              estimatedMinutes={estimatedMinutes}
              trackCode={trackCode}
              tierLabel={tierLabel}
              onStart={handleNextToVideo}
            />
          </m.div>
        )}

        {step === 1 && (
          <m.div key="video" style={{ width: "100%", display: "contents" }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <VideoPlayerPanel
              title={title}
              videoSource={videoSource}
              videoStreamType={videoStreamType}
              watchProgress={watchProgressPercentage}
              canContinue={watchCanContinue && !watchSessionLoading && !watchLoading}
              onPlaybackStateChange={setVideoPlaybackActive}
              onContinue={() => { void handleNextToQuiz(); }}
            />
          </m.div>
        )}

        {step === 2 && (
          <m.div key="quiz" style={{ width: "100%", display: "contents" }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {activityLoading || activities.length > 0 ? (
              <ActivityPanel
                activities={activities}
                activityIndex={activityIndex}
                activityLoading={activityLoading}
                activityAnswerLocked={activityAnswerLocked}
                result={activityResult}
                mascotState={mascotState}
                onAnswer={handleActivityAnswer}
              />
            ) : (
              <div className="lp-main">
                <div
                  className="lp-panel"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.9rem",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--lp-track-primary)" }}>
                    {activityLoadError ? "Unable to load question" : "There are no practice questions"}
                  </h3>
                  <p className="muted-text" style={{ margin: 0 }}>
                    {activityLoadError
                      ? "Please try downloading again, or complete the lesson to continue."
                      : "This article currently does not have interactive exercises. You can complete the lesson right away."}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" }}>
                    {activityLoadError ? (
                      <button
                        type="button"
                        className="lp-btn-secondary"
                        onClick={retryLoadActivities}
                        disabled={loading}
                      >
                        Try downloading again
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="lp-btn-primary"
                      onClick={() => {
                        void markCompleted();
                      }}
                      disabled={loading}
                    >
                      {loading ? "Completing..." : "Complete the lesson"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </m.div>
        )}

        {step === 3 && (
          <m.div key="upload" style={{ width: "100%", display: "contents" }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lp-main">
              <div className="lp-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Section label – no emoji */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
                  <span style={{ display: "block", width: "24px", height: "24px", borderRadius: "8px", background: "var(--lp-track-accent)", border: "1.5px solid color-mix(in srgb, var(--lp-track-primary) 22%, transparent)", flexShrink: 0 }} aria-hidden="true" />
                  <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--lp-ink-soft)", margin: 0 }}>
                    Add learning evidence (optional)
                  </p>
                </div>
                <EvidenceUploadPanelInner childId={childId} lessonId={lessonId} />
                <button
                  type="button"
                  className="lp-btn-secondary"
                  onClick={() => void markCompleted()}
                  disabled={loading}
                >
                  {loading ? "Completing..." : "Skip, complete the lesson"}
                </button>
              </div>
            </div>
          </m.div>
        )}

        {step === 4 && (
          <m.div key="done" style={{ width: "100%", display: "contents" }}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <CompletionPanel
              title={title}
              trackCode={trackCode}
              earnedXp={150}
              earnedCoins={10}
              tierLabel={tierLabel}
              nextLessonTitle={nextLessonTitle}
              onBackToMap={onClose}
              onNextLesson={onNextLesson}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* Status toast */}
      <AnimatePresence>
        {status && (
          <m.div
            className="lp-status"
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
          >
            {status}
          </m.div>
        )}
      </AnimatePresence>

    </div>
  );

  return createPortal(content, document.body);
}
