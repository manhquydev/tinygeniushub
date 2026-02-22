"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import confetti from "canvas-confetti";
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
const STAR_SEEDS = Array.from({ length: 14 }, (_, index) => {
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
  const [mascotMessage, setMascotMessage] = useState("Nhấn vào tớ nhé! Cùng học bài nào!");

  const mascotMessages = [
    "Cậu học ngoan nhé!",
    "Tớ luôn ở đây hỗ trợ cậu!",
    "Cứ từ từ học, không vội!",
    "Cố lên cố lên nào!",
    "Wow, hôm nay cậu thật tuyệt!"
  ];

  const completionMessages = [
    "Qua dinh! Con vua hoan thanh them 1 bai.",
    "Tuyet voi! Ban do nhiem vu sang len roi.",
    "Xuat sac! Con dang tien bo rat nhanh.",
    "Yay! Tiep tuc phat huy nhe.",
  ];

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
    synth.playYay();
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
      setMascotMessage(`Bat dau ${selectedLesson.title} nha!`);
    }
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
    const randomMsg = completionMessages[Math.floor(Math.random() * completionMessages.length)];
    setMascotMessage(randomMsg);
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
    setMascotStateForDuration("celebrating", 3000, true);
    resetInactivityTimer();
  };

  async function handleSelectChild(childId: string) {
    synth.playPop();
    if (childId === activeChildId) {
      return;
    }

    setActiveChildId(childId);
    setError(null);
    setLoadingLessons(true);
    setSelectedLessonId(null);
    setSelectedLessonPulse(0);
    setCompletedLessonIds({});
    setCompletedLessonFx(null);
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
        setError(body.error?.message ?? "Không tải được bài học hôm nay.");
        setLessons([]);
        return;
      }

      const nextLessons = Array.isArray(body.data?.lessons) ? (body.data.lessons as MissionLesson[]) : [];
      setLessons(nextLessons);
    } catch (loadError) {
      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
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
      <div className="page-stack kid-shell">
        <m.section
          className="card kid-hero-card"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1>Bài học hôm nay — {activeChild.nickname}</h1>
          <p className="muted-text">
            Chọn đúng hồ sơ bé để hệ thống lấy bài học theo tiến độ.
          </p>
          <div className="child-switcher" style={{ gap: "1.5rem", marginTop: "1.5rem", padding: "1rem", background: "color-mix(in srgb, var(--surface-100) 50%, transparent)", borderRadius: "24px", justifyContent: "center", display: "flex", flexWrap: "wrap" }}>
            {childrenProfiles.map((child) => {
              const isActive = child.id === activeChildId;
              const firstLetter = child.nickname.charAt(0).toUpperCase();

              return (
                <div key={child.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <m.button
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={`kid-avatar ${isActive ? "kid-avatar-active" : ""}`}
                    disabled={loadingLessons}
                    whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.05 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                    layout
                  >
                    {firstLetter}
                  </m.button>
                  <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ink-900)" : "var(--ink-600)", fontSize: "1.1rem" }}>
                    {child.nickname}
                  </span>
                </div>
              );
            })}
          </div>
        </m.section>

        <m.section
          className="card"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.05 }}
          aria-busy={loadingLessons}
        >
          <h2>Bài học hôm nay</h2>
          <AnimatePresence mode="wait" initial={false}>
            {loadingLessons ? (
              <m.div
                key="loading"
                className="muted-text"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem" }}
              >
                <div className="animate-float" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--surface-200)", borderTopColor: "var(--brand-500)", animation: "spin 1s linear infinite" }} />
                <p style={{ fontWeight: 600, color: "var(--brand-600)" }}>Đang chuẩn bị bài học...</p>
              </m.div>
            ) : null}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            {error ? (
              <m.div
                key={error}
                className="error-text"
                role="status"
                aria-live="assertive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ background: "#fef2f2", padding: "1rem", borderRadius: "12px", border: "1px solid #fecaca", marginBottom: "1rem" }}
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
                    {STAR_SEEDS.map((star) => (
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
                              aria-label="Mascot dong hanh"
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
                            {isCompleted ? <span className="journey-node-check">✓</span> : index + 1}
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
                <m.div className="list-item" variants={popIn}>
                  <span>Chưa có bài học phù hợp cho hồ sơ này.</span>
                </m.div>
              ) : null}
            </m.div>
          </AnimatePresence>
        </m.section>

        {/* Mascot Character Guide */}
        <AnimatePresence>
          {!loadingLessons && (
            <m.div
              className="mascot-container"
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            >
              <AnimatePresence mode="wait">
                <m.div
                  key={mascotMessage}
                  className="mascot-bubble"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {mascotMessage}
                </m.div>
              </AnimatePresence>
              <m.div
                className="mascot-avatar"
                animate={prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
                transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                onClick={handleMascotClick}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                role="button"
                aria-label="Nhân vật hướng dẫn hỗ trợ trẻ em"
              >
                <KidMascot size={72} state={mascotState} className="pointer-events-none" />
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </KidMotionProvider>
  );
}

