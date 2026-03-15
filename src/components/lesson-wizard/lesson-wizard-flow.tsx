"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ArrowLeft, ArrowRight, Check, Play, Sparkles, Video } from "lucide-react";
import confetti from "canvas-confetti";
import { KidMascot, type KidMascotGazeDirection, type KidMascotState } from "@/components/animation/kid-mascot";
import { bounceIn, swipeLeft, wobble } from "@/components/animation/kid-motion-variants";
import { ParentGateDialog } from "@/components/parent-gate-dialog";
import { ActivityRenderer } from "@/components/lesson-wizard/activity-renderer";
import { SecureVideoPlayer } from "@/components/media/secure-video-player";
import { synth } from "@/lib/audio-utils";
import type { ActivitySpec, ActivityType } from "@/modules/content/activity-types";

const EvidenceUploadPanel = dynamic(
  () => import("@/components/evidence-upload-panel").then((module) => module.EvidenceUploadPanel),
  { loading: () => <p className="lesson-wizard-helper-text">Äang táº£i khu vá»±c gá»­i káº¿t quáº£...</p> },
);

interface LessonWizardFlowProps {
  childId: string;
  lessonId: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  videoSource?: string | null;
  videoStreamType?: "hls" | "file" | null;
  onClose: () => void;
  onCompleted?: (lessonId: string) => void;
}

interface WatchSessionPayload {
  watchRequired: boolean;
  requiredWatchSeconds: number;
  heartbeatIntervalSeconds: number;
  sessionToken: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

type ActivityRow = {
  id: string;
  type: ActivityType;
  prompt: string;
  spec: ActivitySpec;
  passCriteria: number;
};

const LESSON_SPACE_STARS = Array.from({ length: 28 }, (_, index) => {
  const seed = Math.abs(Math.sin((index + 1) * 13.7));
  return {
    id: `lesson-star-${index + 1}`,
    top: `${Math.round(seed * 100)}%`,
    left: `${Math.round(Math.abs(Math.cos((index + 3) * 19.3)) * 100)}%`,
    duration: `${(3.2 + seed * 3.8).toFixed(2)}s`,
    delay: `${(seed * 2.6).toFixed(2)}s`,
    scale: 0.5 + seed * 1.2,
  };
});

const LESSON_QUIZ_CHOICES = [
  { id: "correct", label: "Ná»™i dung vá»«a há»c", description: "ÄÃ¢y lÃ  kiáº¿n thá»©c trong video", isCorrect: true },
  { id: "wrong", label: "Chá»§ Ä‘á» khÃ¡c", description: "ÄÃ¡p Ã¡n nÃ y chÆ°a Ä‘Ãºng rá»“i", isCorrect: false },
] as const;

function shouldUseIframePlayer(url: string) {
  return /^https?:\/\/iframe\.mediadelivery\.net\/embed\//i.test(url);
}

function shuffleActivities<T>(input: T[]) {
  const next = [...input];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex] as T, next[index] as T];
  }
  return next;
}

export function LessonWizardFlow({
  childId,
  lessonId,
  title,
  objective,
  estimatedMinutes,
  videoSource,
  videoStreamType,
  onClose,
  onCompleted,
}: LessonWizardFlowProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0); // 0: Intro, 1: Video, 2: Quiz, 3: Upload, 4: Done
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExitGateOpen, setIsExitGateOpen] = useState(false);
  const [mascotState, setMascotState] = useState<KidMascotState>("talking");
  const [mascotGazeDirection, setMascotGazeDirection] = useState<KidMascotGazeDirection>("center");
  const [quizResult, setQuizResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [wrongAnswerPulse, setWrongAnswerPulse] = useState(0);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityAnswerLocked, setActivityAnswerLocked] = useState(false);
  const consecutiveCorrectRef = useRef(0);
  const totalWrongRef = useRef(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now);

  const quizCelebrateTimerRef = useRef<number | null>(null);
  const quizCompleteTimerRef = useRef<number | null>(null);
  const mascotStateResetTimerRef = useRef<number | null>(null);
  const hoverSoundAtRef = useRef(0);

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
  const heartbeatInFlightRef = useRef(false);
  const watchRequired = Boolean(videoSource);
  const watchProgressPercentage = watchRequired
    ? Math.min(100, Math.round((watchedSeconds / Math.max(1, requiredWatchSeconds)) * 100))
    : 100;

  const clearMascotStateResetTimer = useCallback(() => {
    if (mascotStateResetTimerRef.current !== null) {
      window.clearTimeout(mascotStateResetTimerRef.current);
      mascotStateResetTimerRef.current = null;
    }
  }, []);

  const clearQuizTimers = useCallback(() => {
    if (quizCelebrateTimerRef.current !== null) {
      window.clearTimeout(quizCelebrateTimerRef.current);
      quizCelebrateTimerRef.current = null;
    }
    if (quizCompleteTimerRef.current !== null) {
      window.clearTimeout(quizCompleteTimerRef.current);
      quizCompleteTimerRef.current = null;
    }
  }, []);

  const setMascotStateForDuration = useCallback(
    (nextState: KidMascotState, durationMs: number) => {
      clearMascotStateResetTimer();
      setMascotState(nextState);
      mascotStateResetTimerRef.current = window.setTimeout(() => {
        setMascotState("idle");
        mascotStateResetTimerRef.current = null;
      }, durationMs);
    },
    [clearMascotStateResetTimer],
  );

  const applyWatchResult = useCallback(
    (watchResult: { readyForCompletion?: boolean; requiredWatchSeconds?: number; watchedSeconds?: number }) => {
      const required = typeof watchResult.requiredWatchSeconds === "number" ? watchResult.requiredWatchSeconds : requiredWatchSeconds;
      const watched = typeof watchResult.watchedSeconds === "number" ? watchResult.watchedSeconds : watchedSeconds;
      setRequiredWatchSeconds(required);
      setWatchedSeconds(watched);
      if (watchResult.readyForCompletion) {
        setWatchReady(true);
      }
    },
    [requiredWatchSeconds, watchedSeconds],
  );

  const sendWatchHeartbeat = useCallback(
    async (nextSequence: number) => {
      if (!watchRequired || !watchSessionToken || watchReady) return;
      if (watchSessionExpiresAtMs && Date.now() > watchSessionExpiresAtMs) return;
      if (heartbeatInFlightRef.current) return;
      heartbeatInFlightRef.current = true;

      try {
        const response = await fetch(`/api/lessons/${lessonId}/watch/heartbeat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ childId, sessionToken: watchSessionToken, sequence: nextSequence }),
        });
        const body = await response.json();
        if (!response.ok || !body.ok) return;

        const watchResult = body.data?.watch;
        if (!watchResult) return;

        setWatchHeartbeatSequence(nextSequence);
        applyWatchResult(watchResult);
      } catch {
        setStatus("KhÃ´ng thá»ƒ cáº­p nháº­t tiáº¿n Ä‘á»™ xem video. Vui lÃ²ng thá»­ láº¡i.");
      } finally {
        heartbeatInFlightRef.current = false;
      }
    },
    [applyWatchResult, childId, lessonId, watchReady, watchRequired, watchSessionExpiresAtMs, watchSessionToken],
  );

  useEffect(() => {
    if (!watchRequired || !watchSessionToken || watchReady) return;

    const intervalMs = Math.max(1000, watchHeartbeatIntervalSeconds * 1000);
    const timer = window.setInterval(() => {
      void sendWatchHeartbeat(watchHeartbeatSequence + 1);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [sendWatchHeartbeat, watchHeartbeatIntervalSeconds, watchHeartbeatSequence, watchReady, watchRequired, watchSessionToken]);

  useEffect(() => {
    if (step === 4) {
      setMascotState("celebrating");
      return;
    }

    if (step === 3) {
      setMascotState("talking");
      return;
    }

    if (step === 0) {
      setMascotState("talking");
      return;
    }

    if (step === 2 && quizResult !== "idle") {
      return;
    }

    setMascotState("idle");
  }, [quizResult, step]);

  useEffect(() => {
    if (step !== 2) {
      setMascotGazeDirection("center");
    }
  }, [step]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    const controller = new AbortController();
    setActivityLoading(true);
    setActivityAnswerLocked(false);
    setActivityIndex(0);

    void (async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}/activities`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          ok?: boolean;
          data?: {
            activities?: ActivityRow[];
          };
        };

        if (!response.ok || !body.ok) {
          setActivities([]);
          return;
        }

        const fetchedActivities = Array.isArray(body.data?.activities) ? body.data.activities : [];
        const shuffled = shuffleActivities(fetchedActivities).slice(0, 3);
        setActivities(shuffled);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setActivities([]);
      } finally {
        setActivityLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [lessonId, step]);

  // Inactivity: set bored state after 30s with no interaction during quiz
  useEffect(() => {
    if (step !== 2) return;
    const timer = window.setTimeout(() => {
      setMascotState('bored');
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [lastInteractionTime, step]);

  useEffect(() => {
    setMounted(true);
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearQuizTimers();
      clearMascotStateResetTimer();
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [clearMascotStateResetTimer, clearQuizTimers]);

  async function startWatchSession() {
    if (!watchRequired) return;
    setWatchSessionLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/watch/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) return;

      const session = body.data?.session as WatchSessionPayload | undefined;
      if (!session?.watchRequired || !session.sessionToken || !session.issuedAt || !session.expiresAt) return;

      setWatchSessionToken(session.sessionToken);
      setWatchHeartbeatIntervalSeconds(session.heartbeatIntervalSeconds);
      setRequiredWatchSeconds(session.requiredWatchSeconds);
      setWatchedSeconds(0);
      setWatchReady(false);
      setWatchSessionExpiresAtMs(new Date(session.expiresAt).getTime());
      setWatchHeartbeatSequence(0);
      setStatus("Video Ä‘Ã£ sáºµn sÃ ng, cÃ¹ng theo dÃµi nhÃ©!");
    } catch {
      setStatus("KhÃ´ng thá»ƒ khá»Ÿi táº¡o phiÃªn xem video.");
    } finally {
      setWatchSessionLoading(false);
    }
  }

  async function markVideoWatched() {
    if (!watchRequired) return true;
    if (!watchSessionToken) return false;
    setWatchLoading(true);
    setStatus(null);

    let success = false;
    try {
      const response = await fetch(`/api/lessons/${lessonId}/watch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId, sessionToken: watchSessionToken }),
      });
      const body = await response.json();
      if (response.ok && body.ok) {
        setWatchReady(true);
        success = true;
      }
    } catch {
      setStatus("KhÃ´ng thá»ƒ xÃ¡c nháº­n Ä‘Ã£ xem video.");
    } finally {
      setWatchLoading(false);
    }

    return success;
  }

  const markCompleted = useCallback(async (options?: { closeAfterSuccess?: boolean; skipCelebrationFx?: boolean }) => {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
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
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setStatus("KhÃ´ng thá»ƒ hoÃ n thÃ nh bÃ i há»c. Vui lÃ²ng thá»­ láº¡i.");
        return;
      }

      if (!options?.skipCelebrationFx) {
        synth.playYay();
      }
      if (!options?.skipCelebrationFx && !prefersReducedMotion) {
        const duration = 1800;
        const end = Date.now() + duration;
        const launch = () => {
          confetti({
            particleCount: 14,
            angle: 60,
            spread: 65,
            origin: { x: 0 },
            colors: ["#38bdf8", "#22d3ee", "#a78bfa", "#facc15"],
          });
          confetti({
            particleCount: 14,
            angle: 120,
            spread: 65,
            origin: { x: 1 },
            colors: ["#38bdf8", "#22d3ee", "#a78bfa", "#facc15"],
          });
          if (Date.now() < end) {
            requestAnimationFrame(launch);
          }
        };
        launch();
      }

      onCompleted?.(lessonId);
      if (options?.closeAfterSuccess) {
        onClose();
      } else {
        setStep(4);
      }
    } finally {
      setLoading(false);
    }
  }, [childId, estimatedMinutes, lessonId, onClose, onCompleted, prefersReducedMotion]);

  const handleNextToVideo = () => {
    synth.playPop();
    setStep(1);
    setStatus(null);
    void startWatchSession();
  };

  const handleNextToQuiz = async () => {
    if (watchRequired && !watchReady) {
      const recorded = await markVideoWatched();
      if (!recorded) return;
    }
    setStatus(null);
    setStep(2);
    setQuizResult("idle");
    setMascotGazeDirection("center");
  };

  const handleOptionHoverStart = useCallback(
    (direction: KidMascotGazeDirection) => {
      setMascotGazeDirection(direction);
      setLastInteractionTime(Date.now());
      const now = window.performance.now();
      if (now - hoverSoundAtRef.current > 110) {
        synth.playPop();
        hoverSoundAtRef.current = now;
      }
    },
    [],
  );

  const handleOptionHoverEnd = useCallback(() => {
    setMascotGazeDirection("center");
  }, []);

  const handleActivityAnswer = useCallback(
    (isCorrect: boolean) => {
      if (loading || activityAnswerLocked) {
        return;
      }

      clearQuizTimers();
      setMascotGazeDirection("center");
      setLastInteractionTime(Date.now());

      if (isCorrect) {
        synth.playTing();
        setStatus("ChÃ­nh xÃ¡c!");
        setActivityAnswerLocked(true);

        consecutiveCorrectRef.current += 1;
        const nextConsecutiveCorrect = consecutiveCorrectRef.current;
        if (nextConsecutiveCorrect >= 5) {
          setMascotState("celebrating");
          synth.playYay();
          if (!prefersReducedMotion) {
            confetti({
              particleCount: 92,
              spread: 88,
              scalar: 1.02,
              origin: { x: 0.5, y: 0.6 },
              colors: ["#22d3ee", "#facc15", "#a78bfa", "#fb7185", "#34d399"],
            });
          }
        } else if (nextConsecutiveCorrect >= 3) {
          setMascotStateForDuration("excited", 1200);
        } else {
          setMascotStateForDuration("happy", 1000);
        }

        const isLastActivity = activityIndex >= activities.length - 1;
        if (isLastActivity) {
          quizCelebrateTimerRef.current = window.setTimeout(() => {
            setMascotState("celebrating");
            synth.playYay();
            if (!prefersReducedMotion) {
              confetti({
                particleCount: 92,
                spread: 88,
                scalar: 1.02,
                origin: { y: 0.56 },
                colors: ["#22d3ee", "#facc15", "#a78bfa", "#fb7185", "#34d399"],
              });
            }
            quizCelebrateTimerRef.current = null;
          }, 300);

          quizCompleteTimerRef.current = window.setTimeout(() => {
            setStatus(null);
            void markCompleted({ closeAfterSuccess: true, skipCelebrationFx: true });
            quizCompleteTimerRef.current = null;
          }, 1700);
          return;
        }

        quizCelebrateTimerRef.current = window.setTimeout(() => {
          setActivityIndex((current) => current + 1);
          setActivityAnswerLocked(false);
          setStatus(null);
          quizCelebrateTimerRef.current = null;
        }, 900);
        return;
      }

      synth.playBzz();
      setStatus("ChÆ°a Ä‘Ãºng rá»“i, con thá»­ láº¡i nhÃ©!");
      setActivityAnswerLocked(true);
      consecutiveCorrectRef.current = 0;
      totalWrongRef.current += 1;
      if (totalWrongRef.current >= 3) {
        setMascotStateForDuration("angry", 1100);
      } else {
        setMascotStateForDuration("nervous", 1100);
      }
      quizCelebrateTimerRef.current = window.setTimeout(() => {
        setActivityAnswerLocked(false);
        quizCelebrateTimerRef.current = null;
      }, 1500);
    },
    [
      activityAnswerLocked,
      activities.length,
      activityIndex,
      clearQuizTimers,
      loading,
      markCompleted,
      prefersReducedMotion,
      setMascotStateForDuration,
    ],
  );

  const handleQuizAnswer = (isCorrect: boolean) => {
    if (loading || quizResult === "correct") return;
    clearQuizTimers();
    setMascotGazeDirection("center");

    if (isCorrect) {
      synth.playTing();
      setQuizResult("correct");
      setStatus("ChÃ­nh xÃ¡c! Linh vật Cáo Ä‘ang má»Ÿ cháº·ng tiáº¿p theo...");
      setMascotStateForDuration("happy", 1200);

      quizCelebrateTimerRef.current = window.setTimeout(() => {
        setMascotState("celebrating");
        synth.playYay();
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 92,
            spread: 88,
            scalar: 1.02,
            origin: { y: 0.56 },
            colors: ["#22d3ee", "#facc15", "#a78bfa", "#fb7185", "#34d399"],
          });
        }
        quizCelebrateTimerRef.current = null;
      }, 500);

      quizCompleteTimerRef.current = window.setTimeout(() => {
        setStatus(null);
        void markCompleted({ closeAfterSuccess: true, skipCelebrationFx: true });
        quizCompleteTimerRef.current = null;
      }, 2000);
      return;
    }

    synth.playBzz();
    setQuizResult("wrong");
    setWrongAnswerPulse((value) => value + 1);
    setStatus("ChÆ°a Ä‘Ãºng rá»“i, con thá»­ láº¡i nhÃ©!");
    setMascotStateForDuration("confused", 1100);
  };

  const handleFinish = () => {
    void markCompleted();
  };

  const handleVerifiedExit = () => {
    setIsExitGateOpen(false);
    onClose();
  };

  const statusToneClass = useMemo(() => {
    if (!status) return "";
    if (quizResult === "wrong") return "lesson-wizard-status-warning";
    if (quizResult === "correct" || step === 4) return "lesson-wizard-status-success";
    return "";
  }, [quizResult, status, step]);
  const currentActivity = activities[activityIndex] ?? null;

  if (!mounted) return null;

  const content = (
    <div className="lesson-wizard-overlay">
      <div className="lesson-wizard-sky" aria-hidden="true">
        <span className="lesson-wizard-nebula lesson-wizard-nebula-a" />
        <span className="lesson-wizard-nebula lesson-wizard-nebula-b" />
        {LESSON_SPACE_STARS.map((star) => (
          <span
            key={star.id}
            className="lesson-wizard-star"
            style={
              {
                top: star.top,
                left: star.left,
                animationDuration: star.duration,
                animationDelay: star.delay,
                "--lesson-star-scale": star.scale.toFixed(2),
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="lesson-wizard-shell">
        <header className="lesson-wizard-header">
          <m.button
            type="button"
            className="lesson-wizard-exit-button"
            onClick={() => setIsExitGateOpen(true)}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            <span>ThoÃ¡t</span>
          </m.button>

          <div className="lesson-wizard-header-copy">
            <p>Cháº·ng há»c táº­p</p>
            <h2>{title}</h2>
          </div>

          <div className="lesson-wizard-time-pill">{estimatedMinutes} phÃºt</div>
        </header>

        <main className="lesson-wizard-main">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <m.section
                key="intro"
                variants={swipeLeft}
                initial="enter"
                animate="center"
                exit="exit"
                className="lesson-wizard-panel"
              >
                <m.div
                  className="lesson-wizard-mascot-floating"
                  animate={prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
                  transition={prefersReducedMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <KidMascot size={118} state={mascotState} actionProp="exploring" />
                </m.div>

                <div className="lesson-wizard-step-badge">
                  <Play size={16} />
                  <span>Sáºµn sÃ ng khá»Ÿi hÃ nh</span>
                </div>

                <h1 className="lesson-wizard-heading">Sáºµn sÃ ng há»c chÆ°a nÃ o?</h1>
                <p className="lesson-wizard-objective">{objective}</p>

                <m.button
                  type="button"
                  className="lesson-wizard-primary-button"
                  onClick={handleNextToVideo}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                  transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 320, damping: 18 }}
                >
                  <Sparkles size={18} />
                  <span>Báº¯t Ä‘áº§u ngay!</span>
                </m.button>
              </m.section>
            ) : null}

            {step === 1 ? (
              <m.section
                key="video"
                variants={swipeLeft}
                initial="enter"
                animate="center"
                exit="exit"
                className="lesson-wizard-panel lesson-wizard-panel-video"
              >
                <div className="lesson-wizard-video-head">
                  <h3>Xem video nhiá»‡m vá»¥</h3>
                  <p>Con xem gáº§n háº¿t video Ä‘á»ƒ má»Ÿ khÃ³a pháº§n thá»­ thÃ¡ch nhÃ©.</p>
                </div>

                <div className="lesson-wizard-video-frame">
                  {videoSource ? (
                    shouldUseIframePlayer(videoSource) ? (
                      <iframe src={videoSource} className="lesson-wizard-video-iframe" allowFullScreen />
                    ) : (
                      <SecureVideoPlayer
                        className="lesson-wizard-video-element"
                        src={videoSource}
                        streamTypeHint={videoStreamType}
                      />
                    )
                  ) : (
                    <div className="lesson-wizard-video-fallback">
                      <Video size={30} />
                      <span>BÃ i há»c nÃ y chÆ°a cÃ³ video.</span>
                    </div>
                  )}
                </div>

                <div className="lesson-wizard-progress-panel">
                  <div className="lesson-wizard-progress-meta">
                    <span>Tiáº¿n Ä‘á»™ xem</span>
                    <strong>{watchProgressPercentage}%</strong>
                  </div>
                  <div className="watch-progress-track lesson-wizard-progress-track">
                    <m.div
                      className={`watch-progress-fill lesson-wizard-progress-fill ${watchReady ? "watch-progress-fill-ready" : ""}`}
                      initial={false}
                      animate={{ width: `${watchProgressPercentage}%` }}
                    />
                  </div>
                  <m.button
                    type="button"
                    className="lesson-wizard-secondary-button"
                    onClick={handleNextToQuiz}
                    disabled={watchSessionLoading || watchLoading}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 320, damping: 20 }}
                  >
                    <span>{watchLoading ? "Äang xÃ¡c nháº­n..." : "Tiáº¿p tá»¥c thá»­ thÃ¡ch"}</span>
                    <ArrowRight size={18} />
                  </m.button>
                </div>
              </m.section>
            ) : null}

            {step === 2 ? (
              <m.section
                key="quiz"
                variants={swipeLeft}
                initial="enter"
                animate="center"
                exit="exit"
                className="lesson-wizard-panel lesson-wizard-panel-quiz"
              >
                <m.div
                  className="lesson-wizard-mascot-inline"
                  animate={prefersReducedMotion ? { y: 0 } : { y: [0, -10, 0] }}
                  transition={prefersReducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <KidMascot size={90} state={mascotState} actionProp="math" gazeDirection={mascotGazeDirection} />
                </m.div>

                                <h3 className="lesson-wizard-quiz-title">Đố bé biết nhé!</h3>
                {activityLoading ? <p className="lesson-wizard-quiz-copy">Đang tải câu hỏi...</p> : null}

                {!activityLoading && currentActivity ? (
                  <>
                    <p className="lesson-wizard-quiz-copy">Câu {activityIndex + 1}/{activities.length}</p>
                    <ActivityRenderer
                      key={currentActivity.id}
                      activity={currentActivity}
                      disabled={loading || activityAnswerLocked}
                      onAnswer={handleActivityAnswer}
                      mascotGazeDirection={mascotGazeDirection}
                      onHoverOption={handleOptionHoverStart}
                      onHoverOptionEnd={handleOptionHoverEnd}
                    />
                  </>
                ) : null}

                {!activityLoading && activities.length === 0 ? (
                  <>
                    <p className="lesson-wizard-quiz-copy">Bài học vừa rồi thuộc chủ đề nào?</p>
                    <div className="lesson-wizard-option-grid">
                      {LESSON_QUIZ_CHOICES.map((choice, index) => {
                        const isCorrectChoice = choice.isCorrect;
                        const isSuccess = isCorrectChoice && quizResult === "correct";
                        const isError = !isCorrectChoice && quizResult === "wrong";
                        const isAnswerLocked = loading || quizResult === "correct";
                        const gazeDirection: KidMascotGazeDirection = index === 0 ? "left" : "right";

                        return (
                          <m.button
                            key={`${choice.id}-${isError ? wrongAnswerPulse : 0}`}
                            type="button"
                            className={`lesson-wizard-option ${isSuccess ? "lesson-wizard-option-success" : ""} ${isError ? "lesson-wizard-option-error" : ""}`}
                            onClick={() => handleQuizAnswer(choice.isCorrect)}
                            onHoverStart={isAnswerLocked ? undefined : () => handleOptionHoverStart(gazeDirection)}
                            onHoverEnd={isAnswerLocked ? undefined : handleOptionHoverEnd}
                            onFocus={isAnswerLocked ? undefined : () => handleOptionHoverStart(gazeDirection)}
                            onBlur={isAnswerLocked ? undefined : handleOptionHoverEnd}
                            disabled={isAnswerLocked}
                            variants={!isCorrectChoice ? wobble : bounceIn}
                            initial={!isCorrectChoice ? "idle" : "rest"}
                            animate={
                              !isCorrectChoice
                                ? isError && !prefersReducedMotion
                                  ? "wobble"
                                  : "idle"
                                : isSuccess && !prefersReducedMotion
                                  ? "bounceIn"
                                  : "rest"
                            }
                            whileHover={prefersReducedMotion || isAnswerLocked ? undefined : { scale: 1.04 }}
                            whileTap={prefersReducedMotion || isAnswerLocked ? undefined : { scale: 0.95 }}
                            transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 320, damping: 22 }}
                          >
                            <strong>{isCorrectChoice ? title : choice.label}</strong>
                            <span>{choice.description}</span>
                          </m.button>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </m.section>
            ) : null}

            {step === 3 ? (
              <m.section
                key="upload"
                variants={swipeLeft}
                initial="enter"
                animate="center"
                exit="exit"
                className="lesson-wizard-panel lesson-wizard-panel-upload"
              >
                <h3>Gá»­i káº¿t quáº£ cho tháº§y cÃ´ nhÃ©!</h3>
                <p>Nhá» ba máº¹ chá»¥p láº¡i bÃ i lÃ m rá»“i gá»­i lÃªn Ä‘á»ƒ nháº­n sao thÆ°á»Ÿng.</p>

                <div className="lesson-wizard-upload-shell">
                  <EvidenceUploadPanel childId={childId} lessonId={lessonId} />
                </div>

                <m.button
                  type="button"
                  className="lesson-wizard-primary-button"
                  onClick={handleFinish}
                  disabled={loading}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                  transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 320, damping: 20 }}
                >
                  <span>{loading ? "Äang gá»­i..." : "HoÃ n thÃ nh nhiá»‡m vá»¥!"}</span>
                </m.button>
              </m.section>
            ) : null}

            {step === 4 ? (
              <m.section
                key="done"
                variants={swipeLeft}
                initial="enter"
                animate="center"
                exit="exit"
                className="lesson-wizard-panel lesson-wizard-panel-done"
              >
                <m.div
                  className="lesson-wizard-mascot-floating"
                  animate={prefersReducedMotion ? { y: 0 } : { y: [0, -10, 0] }}
                  transition={prefersReducedMotion ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <KidMascot size={124} state="celebrating" actionProp="exploring" />
                </m.div>

                <h1 className="lesson-wizard-heading lesson-wizard-heading-success">Tuyá»‡t vá»i!</h1>
                <p className="lesson-wizard-objective">Con vá»«a hoÃ n thÃ nh xuáº¥t sáº¯c cháº·ng há»c hÃ´m nay rá»“i.</p>

                <m.button
                  type="button"
                  className="lesson-wizard-primary-button"
                  onClick={onClose}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                  transition={prefersReducedMotion ? undefined : { type: "spring", stiffness: 320, damping: 18 }}
                >
                  <Check size={18} />
                  <span>Quay láº¡i báº£n Ä‘á»“</span>
                </m.button>
              </m.section>
            ) : null}
          </AnimatePresence>
        </main>

        {status ? <p className={`lesson-wizard-status ${statusToneClass}`}>{status}</p> : null}
      </div>

      <ParentGateDialog open={isExitGateOpen} onClose={() => setIsExitGateOpen(false)} onVerified={handleVerifiedExit} />
    </div>
  );

  return createPortal(content, document.body);
}



