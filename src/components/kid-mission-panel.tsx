"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import confetti from "canvas-confetti";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { KidMotionProvider } from "@/components/animation/kid-motion-provider";
import { KidMascot, type KidMascotState } from "@/components/animation/kid-mascot";
import { bounceIn, fadeInUp, listStagger, popIn, wobble } from "@/components/animation/kid-motion-variants";
import { LessonStartCard } from "@/components/lesson-wizard/lesson-start-card";
import { synth } from "@/lib/audio-utils";

interface MissionChild {
  id: string;
  nickname: string;
}

interface MissionLesson {
  id: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  videoSource?: string | null;
}

interface KidMissionPanelProps {
  childrenProfiles: MissionChild[];
  initialChildId: string;
  initialLessons: MissionLesson[];
}

const JOURNEY_NODE_BASE_WIDTH = 288;
const JOURNEY_NODE_GAP = 28;
const JOURNEY_STARS = Array.from({ length: 14 }, (_, index) => {
  const seed = Math.abs(Math.sin((index + 1) * 57.23));
  const sizeClass = index % 5 === 0 ? "journey-space-star-lg" : index % 2 === 0 ? "journey-space-star-md" : "journey-space-star-sm";
  return {
    id: `star-${index + 1}`,
    top: `${10 + Math.round(seed * 22)}%`,
    left: `${5 + Math.round(Math.abs(Math.sin((index + 3) * 18.61)) * 90)}%`,
    delay: `${(seed * 2.8).toFixed(2)}s`,
    duration: `${(4.4 + seed * 4).toFixed(2)}s`,
    alphaMin: (0.18 + seed * 0.2).toFixed(2),
    alphaMid: (0.45 + seed * 0.24).toFixed(2),
    alphaMax: (0.78 + seed * 0.2).toFixed(2),
    className: sizeClass,
  };
});

const JOURNEY_PLANETS = [
  { id: "planet-1", top: "68%", left: "8%", size: "66px", className: "journey-planet-a" },
  { id: "planet-2", top: "14%", left: "34%", size: "92px", className: "journey-planet-b" },
  { id: "planet-3", top: "64%", left: "54%", size: "78px", className: "journey-planet-c" },
  { id: "planet-4", top: "22%", left: "82%", size: "88px", className: "journey-planet-d" },
];

const mascotMessages = [
  "C\u1eadu h\u1ecdc ngoan nh\u00e9!",
  "T\u1edb lu\u00f4n \u1edf \u0111\u00e2y h\u1ed7 tr\u1ee3 c\u1eadu!",
  "C\u1ee9 t\u1eeb t\u1eeb h\u1ecdc, kh\u00f4ng v\u1ed9i!",
  "C\u1ed1 l\u00ean c\u1ed1 l\u00ean n\u00e0o!",
  "H\u00f4m nay c\u1eadu tuy\u1ec7t l\u1eafm!",
];

const completionMessages = [
  "Qu\u00e1 \u0111\u1ec9nh! Con v\u1eeba ho\u00e0n th\u00e0nh th\u00eam m\u1ed9t b\u00e0i.",
  "Tuy\u1ec7t v\u1eddi! B\u1ea3n \u0111\u1ed3 nhi\u1ec7m v\u1ee5 s\u00e1ng l\u00ean r\u1ed3i.",
  "Xu\u1ea5t s\u1eafc! Con \u0111ang ti\u1ebfn b\u1ed9 r\u1ea5t nhanh.",
  "Yay! Ti\u1ebfp t\u1ee5c ph\u00e1t huy nh\u00e9.",
];

export function KidMissionPanel({
  childrenProfiles,
  initialChildId,
  initialLessons,
}: KidMissionPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeChildId, setActiveChildId] = useState(initialChildId);
  const [lessons, setLessons] = useState(initialLessons);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchSeqRef = useRef(0);
  const completionFxResetTimerRef = useRef<number | null>(null);
  const mascotStateResetTimerRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const mascotMessageHydratedRef = useRef(false);
  const mascotStateRef = useRef<KidMascotState>("idle");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLessonPulse, setSelectedLessonPulse] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<Record<string, true>>({});
  const [completedLessonFx, setCompletedLessonFx] = useState<{ lessonId: string; pulse: number } | null>(null);
  const [mascotState, setMascotState] = useState<KidMascotState>("idle");
  const [mascotMessage, setMascotMessage] = useState("Nh\u1ea5n v\u00e0o t\u1edb nh\u00e9! C\u00f9ng h\u1ecdc b\u00e0i n\u00e0o!");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  const clearMascotStateResetTimer = useCallback(() => {
    if (mascotStateResetTimerRef.current !== null) {
      window.clearTimeout(mascotStateResetTimerRef.current);
      mascotStateResetTimerRef.current = null;
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const setMascotStateForDuration = useCallback(
    (nextState: KidMascotState, durationMs: number, force = false) => {
      if (!force && mascotStateRef.current === "celebrating" && nextState !== "celebrating") {
        return;
      }

      clearMascotStateResetTimer();
      mascotStateRef.current = nextState;
      setMascotState(nextState);

      mascotStateResetTimerRef.current = window.setTimeout(() => {
        if (mascotStateRef.current !== nextState) {
          mascotStateResetTimerRef.current = null;
          return;
        }
        mascotStateRef.current = "idle";
        setMascotState("idle");
        mascotStateResetTimerRef.current = null;
      }, durationMs);
    },
    [clearMascotStateResetTimer],
  );

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      if (mascotStateRef.current === "celebrating") {
        return;
      }
      mascotStateRef.current = "sleeping";
      setMascotState("sleeping");
      inactivityTimerRef.current = null;
    }, 10000);
  }, [clearInactivityTimer]);

  const playPop = useCallback(() => {
    if (!isSoundEnabled) return;
    synth.playPop();
  }, [isSoundEnabled]);

  const playYay = useCallback(() => {
    if (!isSoundEnabled) return;
    synth.playYay();
  }, [isSoundEnabled]);

  useEffect(() => {
    mascotStateRef.current = mascotState;
  }, [mascotState]);

  useEffect(() => {
    return () => {
      if (completionFxResetTimerRef.current !== null) {
        window.clearTimeout(completionFxResetTimerRef.current);
      }
      clearMascotStateResetTimer();
      clearInactivityTimer();
    };
  }, [clearInactivityTimer, clearMascotStateResetTimer]);

  useEffect(() => {
    if (completionFxResetTimerRef.current !== null) {
      window.clearTimeout(completionFxResetTimerRef.current);
      completionFxResetTimerRef.current = null;
    }

    if (!completedLessonFx || prefersReducedMotion) {
      return;
    }

    completionFxResetTimerRef.current = window.setTimeout(() => {
      setCompletedLessonFx(null);
      completionFxResetTimerRef.current = null;
    }, 1100);
  }, [completedLessonFx, prefersReducedMotion]);

  useEffect(() => {
    if (!mascotMessageHydratedRef.current) {
      mascotMessageHydratedRef.current = true;
      return;
    }

    setMascotStateForDuration("talking", 2000);
    resetInactivityTimer();
  }, [mascotMessage, resetInactivityTimer, setMascotStateForDuration]);

  useEffect(() => {
    const wakeMascot = () => {
      if (mascotStateRef.current === "sleeping") {
        mascotStateRef.current = "idle";
        setMascotState("idle");
      }
      resetInactivityTimer();
    };

    resetInactivityTimer();
    window.addEventListener("mousemove", wakeMascot);
    window.addEventListener("touchstart", wakeMascot);

    return () => {
      window.removeEventListener("mousemove", wakeMascot);
      window.removeEventListener("touchstart", wakeMascot);
    };
  }, [resetInactivityTimer]);

  const handleMascotClick = () => {
    playYay();
    const randomMsg = mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
    setMascotMessage(randomMsg);
    setMascotStateForDuration("happy", 1200);
    resetInactivityTimer();
  };

  const handleLockedLessonInteract = () => {
    setMascotStateForDuration("confused", 1200);
    resetInactivityTimer();
  };

  const handleActiveLessonInteract = () => {
    setMascotStateForDuration("happy", 1100);
    resetInactivityTimer();
  };

  const handleLessonSelect = (lessonId: string) => {
    const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);
    setSelectedLessonId(lessonId);
    setSelectedLessonPulse((previous) => previous + 1);
    if (selectedLesson) {
      setMascotMessage(`B\u1eaft \u0111\u1ea7u ${selectedLesson.title} nh\u00e9!`);
    }
    setIsProfilePopupOpen(false);
    resetInactivityTimer();
  };

  const handleLessonComplete = (lessonId: string) => {
    setCompletedLessonIds((previous) => ({
      ...previous,
      [lessonId]: true,
    }));
    setCompletedLessonFx((previous) => ({
      lessonId,
      pulse: previous?.lessonId === lessonId ? previous.pulse + 1 : 1,
    }));
    setSelectedLessonId(lessonId);
    setMascotMessage(completionMessages[Math.floor(Math.random() * completionMessages.length)]);

    if (!prefersReducedMotion) {
      const confettiColors = ["#fde047", "#f59e0b", "#0ea5e9", "#22c55e", "#f472b6"];
      confetti({
        particleCount: 70,
        spread: 76,
        startVelocity: 42,
        origin: { x: 0.28, y: 0.68 },
        colors: confettiColors,
      });
      confetti({
        particleCount: 70,
        spread: 76,
        startVelocity: 42,
        origin: { x: 0.72, y: 0.68 },
        colors: confettiColors,
      });
    }

    playYay();
    setMascotStateForDuration("celebrating", 3000, true);
    resetInactivityTimer();
  };

  const handleSoundToggle = () => {
    setIsSoundEnabled((previous) => !previous);
    resetInactivityTimer();
  };

  async function handleSelectChild(childId: string) {
    playPop();
    if (childId === activeChildId) {
      setIsProfilePopupOpen(false);
      return;
    }

    setActiveChildId(childId);
    setError(null);
    setLoadingLessons(true);
    setSelectedLessonId(null);
    setSelectedLessonPulse(0);
    setCompletedLessonIds({});
    setCompletedLessonFx(null);
    setIsProfilePopupOpen(false);
    mascotStateRef.current = "idle";
    setMascotState("idle");
    clearMascotStateResetTimer();
    resetInactivityTimer();

    const currentFetchSeq = ++fetchSeqRef.current;
    const url = new URL(window.location.href);
    url.searchParams.set("childId", childId);
    window.history.replaceState(null, "", url.toString());

    try {
      const response = await fetch(`/api/lessons/today?childId=${encodeURIComponent(childId)}`);
      const body = await response.json();

      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c b\u00e0i h\u1ecdc h\u00f4m nay.");
        setLessons([]);
        return;
      }

      const nextLessons = Array.isArray(body.data?.lessons) ? (body.data.lessons as MissionLesson[]) : [];
      setLessons(nextLessons);
    } catch (loadError) {
      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "L\u1ed7i kh\u00f4ng x\u00e1c \u0111\u1ecbnh.");
      setLessons([]);
    } finally {
      if (currentFetchSeq === fetchSeqRef.current) {
        setLoadingLessons(false);
      }
    }
  }

  const activeChild = childrenProfiles.find((child) => child.id === activeChildId) ?? childrenProfiles[0];
  const journeyTrackWidth = Math.max(
    lessons.length * JOURNEY_NODE_BASE_WIDTH + Math.max(lessons.length - 1, 0) * JOURNEY_NODE_GAP + 64,
    360,
  );
  const journeyPathD = `M 24 106 C ${Math.round(journeyTrackWidth * 0.17)} 28, ${Math.round(journeyTrackWidth * 0.34)} 170, ${Math.round(journeyTrackWidth * 0.5)} 104 C ${Math.round(journeyTrackWidth * 0.66)} 44, ${Math.round(journeyTrackWidth * 0.84)} 162, ${journeyTrackWidth - 24} 88`;
  const journeyTrackStyle = { "--journey-track-width": `${journeyTrackWidth}px` } as CSSProperties;

  return (
    <KidMotionProvider>
      <div className="kid-mission-root">
        <m.header className="kid-hud" variants={fadeInUp} initial="hidden" animate="visible">
          <m.div whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}>
            <Link href="/parent/dashboard" className="kid-hud-button kid-hud-back" onClick={resetInactivityTimer}>
              <ArrowLeft size={20} />
              <span>{"Quay l\u1ea1i"}</span>
            </Link>
          </m.div>

          <div className="kid-hud-center">
            <m.button
              type="button"
              className="kid-profile-badge"
              onClick={() => {
                playPop();
                setIsProfilePopupOpen((previous) => !previous);
                resetInactivityTimer();
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
            >
              <span className="kid-profile-avatar" aria-hidden="true">
                {activeChild.nickname.charAt(0).toUpperCase()}
              </span>
              <span className="kid-profile-name">{activeChild.nickname}</span>
            </m.button>

            <AnimatePresence>
              {isProfilePopupOpen ? (
                <m.div
                  className="kid-profile-popup"
                  initial={{ opacity: 0, scale: 0.72, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.82, y: -8 }}
                  transition={{ type: "spring", stiffness: 360, damping: 22 }}
                >
                  {childrenProfiles.map((child) => {
                    const isActive = child.id === activeChildId;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        className={`kid-profile-option ${isActive ? "kid-profile-option-active" : ""}`}
                        onClick={() => {
                          void handleSelectChild(child.id);
                        }}
                      >
                        <span className="kid-profile-avatar-small" aria-hidden="true">
                          {child.nickname.charAt(0).toUpperCase()}
                        </span>
                        <span>{child.nickname}</span>
                      </button>
                    );
                  })}
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>

          <m.button
            type="button"
            className="kid-hud-button kid-hud-sound"
            onClick={handleSoundToggle}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            aria-pressed={!isSoundEnabled}
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>{isSoundEnabled ? "\u00c2m thanh" : "\u0110ang t\u1eaft"}</span>
          </m.button>
        </m.header>

        <m.section className="kid-stage" variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.04 }}>
          <div className="kid-stage-copy">
            <h1>{"B\u1ea3n \u0111\u1ed3 h\u00e0nh tr\u00ecnh h\u00f4m nay"}</h1>
            <p>{"V\u01b0\u1ee3t qua t\u1eebng h\u00e0nh tinh, m\u1edf kh\u00f3a b\u00e0i h\u1ecdc m\u1edbi v\u00e0 nh\u1eadn sao th\u01b0\u1edfng."}</p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {loadingLessons ? (
              <m.div
                key="loading"
                className="kid-floating-status"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="kid-spinner" />
                <p>{"\u0110ang kh\u1edfi t\u1ea1o b\u1ea3n \u0111\u1ed3 b\u00e0i h\u1ecdc..."}</p>
              </m.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            {error ? (
              <m.div
                key={error}
                className="kid-floating-error"
                role="status"
                aria-live="assertive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {error}
              </m.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <m.div
              key={activeChild.id}
              className="journey-map-container"
              variants={listStagger}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {lessons.length > 0 ? (
                <div className="journey-map-track" style={journeyTrackStyle}>
                  <div className="journey-space-backdrop" aria-hidden="true">
                    <span className="journey-space-nebula journey-space-nebula-a" />
                    <span className="journey-space-nebula journey-space-nebula-b" />
                    <span className="journey-space-streak journey-space-streak-a" />
                    <span className="journey-space-streak journey-space-streak-b" />
                    {JOURNEY_PLANETS.map((planet) => (
                      <span
                        key={planet.id}
                        className={`journey-planet ${planet.className}`}
                        style={{ top: planet.top, left: planet.left, width: planet.size, height: planet.size } as CSSProperties}
                      />
                    ))}
                    {JOURNEY_STARS.map((star) => (
                      <span
                        key={star.id}
                        className={`journey-space-star ${star.className}`}
                        style={
                          {
                            top: star.top,
                            left: star.left,
                            animationDelay: star.delay,
                            animationDuration: star.duration,
                            "--star-alpha-min": star.alphaMin,
                            "--star-alpha-mid": star.alphaMid,
                            "--star-alpha-max": star.alphaMax,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </div>

                  <svg className="journey-path" viewBox={`0 0 ${journeyTrackWidth} 200`} preserveAspectRatio="none" aria-hidden="true">
                    <path d={journeyPathD} className="journey-path-glow" />
                    <path d={journeyPathD} className="journey-path-line" />
                  </svg>

                  <div className="journey-nodes-row">
                    {lessons.map((lesson, index) => {
                      const isCompletedFromEvent = Boolean(completedLessonIds[lesson.id]);
                      const isCompletedFromSeedData = index === 0 && lessons.length > 1;
                      const isCompleted = isCompletedFromEvent || isCompletedFromSeedData;
                      const isActiveProgression = index === (lessons.length > 1 ? 1 : 0);
                      const isLocked = !isCompleted && !isActiveProgression;
                      const isSelectedLesson = selectedLessonId === lesson.id;
                      const isCelebratingCompletion = completedLessonFx?.lessonId === lesson.id;
                      const completionPulse = isCelebratingCompletion ? (completedLessonFx?.pulse ?? 0) : 0;
                      const waveSeed = lessons.length > 1 ? index / (lessons.length - 1) : 0;
                      const nodeOffset = Math.round(Math.sin(waveSeed * Math.PI * 2.25) * 22);
                      const nodeStatusClass = isCompleted
                        ? "journey-node-completed"
                        : isActiveProgression
                          ? "journey-node-active"
                          : "journey-node-locked";

                      return (
                        <m.div
                          key={lesson.id}
                          variants={popIn}
                          layout
                          className={`journey-node ${nodeStatusClass}`}
                          style={{ "--journey-node-offset": `${nodeOffset}px` } as CSSProperties}
                          onHoverStart={isLocked ? handleLockedLessonInteract : isActiveProgression ? handleActiveLessonInteract : undefined}
                          onTapStart={isLocked ? handleLockedLessonInteract : isActiveProgression ? handleActiveLessonInteract : undefined}
                          onClick={isLocked ? handleLockedLessonInteract : undefined}
                        >
                          {isActiveProgression ? (
                            <m.div
                              className="journey-node-mascot"
                              animate={prefersReducedMotion ? { y: 0 } : { y: [0, -6, 0], rotate: [0, -3, 2, 0] }}
                              transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
                              aria-label={"Mascot \u0111\u1ed3ng h\u00e0nh"}
                            >
                              <KidMascot
                                size={64}
                                state={mascotState === "sleeping" ? "idle" : mascotState}
                                className="journey-node-mascot-icon"
                              />
                            </m.div>
                          ) : null}

                          <m.div
                            key={`lesson-index-${lesson.id}-${isSelectedLesson ? selectedLessonPulse : 0}`}
                            className="journey-node-index"
                            variants={wobble}
                            initial="idle"
                            animate={prefersReducedMotion ? "idle" : isSelectedLesson ? "wobble" : "idle"}
                            style={prefersReducedMotion && isSelectedLesson ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--brand-300) 45%, transparent)" } : undefined}
                          >
                            {isCompleted ? <span className="journey-node-check">{"\u2713"}</span> : index + 1}
                          </m.div>

                          <m.div
                            key={`lesson-card-${lesson.id}-${completionPulse}`}
                            variants={bounceIn}
                            initial="rest"
                            animate={prefersReducedMotion ? "rest" : isCelebratingCompletion ? "bounceIn" : "rest"}
                            style={{ width: "clamp(262px, 74vw, 312px)" }}
                          >
                            <div
                              className={`journey-lesson-shell ${isActiveProgression ? "animate-pulse-glow" : ""}`}
                              style={{
                                transform: !prefersReducedMotion
                                  ? `scale(${isActiveProgression ? 0.98 : isLocked ? 0.9 : 0.93})`
                                  : "scale(0.95)",
                                transition: "transform 0.3s, box-shadow 0.3s, background-color 0.3s, opacity 0.3s, filter 0.3s",
                                borderRadius: "24px",
                                backgroundColor: isCompletedFromEvent ? "color-mix(in srgb, #dcfce7 58%, white)" : undefined,
                                boxShadow: isCompletedFromEvent
                                  ? "0 0 0 3px color-mix(in srgb, #4ade80 35%, transparent)"
                                  : prefersReducedMotion && isSelectedLesson
                                    ? "0 0 0 3px color-mix(in srgb, var(--brand-300) 35%, transparent)"
                                    : undefined,
                              }}
                            >
                              <LessonStartCard
                                childId={activeChild.id}
                                lessonId={lesson.id}
                                title={lesson.title}
                                objective={lesson.objective}
                                estimatedMinutes={lesson.estimatedMinutes}
                                videoSource={lesson.videoSource}
                                onLessonSelect={handleLessonSelect}
                                onLessonComplete={handleLessonComplete}
                              />
                            </div>
                          </m.div>
                        </m.div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!loadingLessons && lessons.length === 0 ? (
                <m.div className="kid-floating-status" variants={popIn}>
                  <span>{"Ch\u01b0a c\u00f3 b\u00e0i h\u1ecdc ph\u00f9 h\u1ee3p cho h\u1ed3 s\u01a1 n\u00e0y."}</span>
                </m.div>
              ) : null}
            </m.div>
          </AnimatePresence>
        </m.section>

        <AnimatePresence>
          {!loadingLessons ? (
            <m.div
              className="mascot-container"
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 200, damping: 20 }}
            >
              <AnimatePresence mode="wait">
                <m.div
                  key={mascotMessage}
                  className="mascot-bubble"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  {mascotMessage}
                </m.div>
              </AnimatePresence>

              <m.div
                className="mascot-avatar"
                animate={prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
                transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                onClick={handleMascotClick}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                role="button"
                aria-label={"Mascot h\u01b0\u1edbng d\u1eabn"}
              >
                <KidMascot size={72} state={mascotState} className="pointer-events-none" />
              </m.div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </KidMotionProvider>
  );
}
