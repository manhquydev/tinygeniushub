"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import confetti from "canvas-confetti";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { KidMotionProvider } from "@/components/animation/kid-motion-provider";
import {
  KidMascot,
  type KidMascotActionProp,
  type KidMascotGazeDirection,
  type KidMascotState,
} from "@/components/animation/kid-mascot";
import { bounceIn, fadeInUp, listStagger, popIn, wobble } from "@/components/animation/kid-motion-variants";
import { DailyGoalReachedScreen } from "@/components/daily-goal-reached-screen";
import { LessonStartCard } from "@/components/lesson-wizard/lesson-start-card";
import { Mascot, type MascotActionProp, type MascotState } from "@/components/mascot";
import { ParentGateDialog } from "@/components/parent-gate-dialog";
import { synth } from "@/lib/audio-utils";
import type { ApiSuccess, LessonCardDTO, TodayMissionDTO } from "@/lib/api-types";

interface MissionChild {
  id: string;
  nickname: string;
}

type MissionLesson = Pick<LessonCardDTO, "id" | "title" | "objective" | "estimatedMinutes"> & {
  videoSource?: string | null;
  bunnyVideoId?: string | null;
  videoStatus?: string | null;

};

interface KidMissionPanelProps {
  childrenProfiles: MissionChild[];
  initialChildId: string;
  initialLessons: MissionLesson[];
}

type ParentGateIntent = "exit" | "goal-override";

type GoalGuardState = {
  loading: boolean;
  dailyGoalMinutes: number;
  totalMinutesToday: number;
  reached: boolean;
};

type ActivityTodayResponse = {
  ok: boolean;
  data?: ApiSuccess<{
    dailyGoalMinutes?: number;
    totalMinutesToday?: number;
  }>["data"];
};

type LessonsTodayResponse = {
  ok: boolean;
  data?: ApiSuccess<Pick<TodayMissionDTO, "lessons">>["data"];
  error?: {
    message?: string;
  };
};

const JOURNEY_NODE_BASE_WIDTH = 288;
const JOURNEY_NODE_GAP = 28;
const JOURNEY_TAIL_SPACE = 800;
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
  "Keep learning at your own pace!",
  "I am here to help you!",
  "Take it step by step.",
  "Keep going!",
  "You are doing great today!",
];

const completionMessages = [
  "Great work! You completed another lesson.",
  "Wonderful! Your mission map is lighting up.",
  "Excellent! You are making fast progress.",
  "Yay! Keep it up.",
];

const MASCOT_ACTION_PROPS: KidMascotActionProp[] = ["reading", "math", "exploring"];
const NODE_GAZE_DIRECTIONS: KidMascotGazeDirection[] = ["left", "center", "right"];
const ACTIVE_NODE_STATES: KidMascotState[] = ["happy", "playful", "talking", "proud"];
const LOCKED_NODE_STATES: KidMascotState[] = ["sleeping", "confused", "talking"];
const COMPLETED_NODE_STATES: KidMascotState[] = ["proud", "happy", "playful"];
const COMPLETED_NODE_ACTIONS: KidMascotActionProp[] = ["heart", "music", "exploring"];
const LOCKED_NODE_ACTIONS: KidMascotActionProp[] = ["reading", "exploring", "math"];

interface JourneyNodeMascotProfile {
  state: KidMascotState;
  actionProp: KidMascotActionProp;
  gazeDirection: KidMascotGazeDirection;
  motionLevel: "full" | "soft" | "minimal";
  size: number;
  title: string;
}

interface GuideMascotProfile {
  parentState: MascotState;
  childState: MascotState;
  parentActionProp: MascotActionProp;
  childActionProp: MascotActionProp;
  parentGazeDirection: KidMascotGazeDirection;
  childGazeDirection: KidMascotGazeDirection;
  motionLevel: "full" | "soft" | "minimal";
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickBySeed<T>(options: readonly T[], seed: string): T {
  return options[hashSeed(seed) % options.length];
}

function resolveMascotAction(lesson: MissionLesson | undefined, seed: string): KidMascotActionProp {
  if (lesson) {
    const text = `${lesson.title} ${lesson.objective}`.toLowerCase();
    if (/(math|count|number|calculation)/u.test(text)) {
      return "math";
    }
    if (/(read|book|letter|word|story|phonics)/u.test(text)) {
      return "reading";
    }
  }

  const hash = hashSeed(seed);
  return MASCOT_ACTION_PROPS[hash % MASCOT_ACTION_PROPS.length];
}

function resolveJourneyNodeMascotProfile({
  lesson,
  childId,
  index,
  status,
  isSelectedLesson,
  isCelebratingCompletion,
}: {
  lesson: MissionLesson;
  childId: string;
  index: number;
  status: "completed" | "active" | "locked";
  isSelectedLesson: boolean;
  isCelebratingCompletion: boolean;
}): JourneyNodeMascotProfile {
  const seed = `${childId}-${lesson.id}-${index}`;
  const baseAction = resolveMascotAction(lesson, `${seed}-action`);
  const gazeDirection = pickBySeed(NODE_GAZE_DIRECTIONS, `${seed}-gaze`);

  if (status === "completed") {
    return {
      state: isCelebratingCompletion ? "celebrating" : pickBySeed(COMPLETED_NODE_STATES, `${seed}-completed-state`),
      actionProp: isCelebratingCompletion ? "music" : pickBySeed(COMPLETED_NODE_ACTIONS, `${seed}-completed-action`),
      gazeDirection,
      motionLevel: isCelebratingCompletion ? "full" : "soft",
      size: isCelebratingCompletion ? 66 : 56,
      title: "Mascot landmark completed",
    };
  }

  if (status === "active") {
    return {
      state: isSelectedLesson ? "playful" : pickBySeed(ACTIVE_NODE_STATES, `${seed}-active-state`),
      actionProp: baseAction,
      gazeDirection,
      motionLevel: "full",
      size: 64,
      title: "Mascot mold is studying",
    };
  }

  return {
    state: pickBySeed(LOCKED_NODE_STATES, `${seed}-locked-state`),
    actionProp: pickBySeed(LOCKED_NODE_ACTIONS, `${seed}-locked-action`),
    gazeDirection,
    motionLevel: "minimal",
    size: 52,
    title: "Mascot landmark is about to unlock",
  };
}

function resolveGuideMascotProfile({
  guideState,
  seed,
}: {
  guideState: KidMascotState;
  seed: string;
}): GuideMascotProfile {
  const guideHash = hashSeed(seed);
  const parentGazeDirection: KidMascotGazeDirection = guideHash % 2 === 0 ? "center" : "right";
  const childGazeDirection: KidMascotGazeDirection = guideHash % 3 === 0 ? "left" : "center";

  if (guideState === "celebrating") {
    return {
      parentState: "celebrating",
      childState: "playful",
      parentActionProp: "magic",
      childActionProp: "music",
      parentGazeDirection,
      childGazeDirection,
      motionLevel: "full",
    };
  }

  if (guideState === "sleeping") {
    return {
      parentState: "sleepy",
      childState: "sleepy",
      parentActionProp: "none",
      childActionProp: "none",
      parentGazeDirection: "center",
      childGazeDirection: "center",
      motionLevel: "minimal",
    };
  }

  if (guideState === "confused") {
    return {
      parentState: "thinking",
      childState: "sad",
      parentActionProp: "reading",
      childActionProp: "music",
      parentGazeDirection,
      childGazeDirection,
      motionLevel: "soft",
    };
  }

  if (guideState === "talking") {
    return {
      parentState: "thinking",
      childState: "happy",
      parentActionProp: "reading",
      childActionProp: "heart",
      parentGazeDirection,
      childGazeDirection,
      motionLevel: "soft",
    };
  }

  return {
    parentState: "proud",
    childState: guideState === "playful" ? "playful" : "happy",
    parentActionProp: "heart",
    childActionProp: "music",
    parentGazeDirection,
    childGazeDirection,
    motionLevel: "soft",
  };
}

export function KidMissionPanel({
  childrenProfiles,
  initialChildId,
  initialLessons,
}: KidMissionPanelProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const journeyContainerRef = useRef<HTMLDivElement | null>(null);
  const dragActiveRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
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
  const [mascotMessage, setMascotMessage] = useState("Tap me when you need help. Let's learn!");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState(false);
  const [parentGateSession, setParentGateSession] = useState(0);
  const [parentGateIntent, setParentGateIntent] = useState<ParentGateIntent>("exit");
  const [goalGuardState, setGoalGuardState] = useState<GoalGuardState>({
    loading: false,
    dailyGoalMinutes: 0,
    totalMinutesToday: 0,
    reached: false,
  });
  const [goalOverrideByChild, setGoalOverrideByChild] = useState<Record<string, true>>({});
  const [isJourneyDragging, setIsJourneyDragging] = useState(false);
  const goalCheckSeqRef = useRef(0);

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

  const handleJourneyPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, select, [data-no-drag='true']")) {
      return;
    }

    const container = journeyContainerRef.current;
    if (!container) {
      return;
    }

    dragActiveRef.current = true;
    dragPointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = container.scrollLeft;
    setIsJourneyDragging(true);
    container.setPointerCapture(event.pointerId);
  };

  const handleJourneyPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = journeyContainerRef.current;
    if (!container || !dragActiveRef.current || dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    container.scrollLeft = dragStartScrollLeftRef.current - deltaX;
  };

  const stopJourneyDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = journeyContainerRef.current;
    if (!container || !dragActiveRef.current || dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    dragActiveRef.current = false;
    setIsJourneyDragging(false);
    container.releasePointerCapture(event.pointerId);
    dragPointerIdRef.current = null;
  };

  const handleJourneyWheel = useCallback((event: WheelEvent) => {
    const container = journeyContainerRef.current;
    if (!container) {
      return;
    }

    const maxHorizontalScroll = container.scrollWidth - container.clientWidth;
    if (maxHorizontalScroll <= 0) {
      return;
    }

    const prefersHorizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

    if (!prefersHorizontal) {
      const shell = document.querySelector(".kid-app-shell") as HTMLElement | null;
      const scrollHost =
        shell && shell.scrollHeight > shell.clientHeight ? shell : (document.scrollingElement as HTMLElement | null);
      if (scrollHost) {
        const maxVerticalScroll = scrollHost.scrollHeight - scrollHost.clientHeight;
        const canScrollDown = event.deltaY > 0 && scrollHost.scrollTop < maxVerticalScroll - 1;
        const canScrollUp = event.deltaY < 0 && scrollHost.scrollTop > 1;
        if (canScrollDown || canScrollUp) {
          const nextScrollTop = Math.min(maxVerticalScroll, Math.max(0, scrollHost.scrollTop + event.deltaY));
          event.preventDefault();
          scrollHost.scrollTop = nextScrollTop;
          return;
        }
      }
    }

    const delta = prefersHorizontal ? event.deltaX || event.deltaY : event.deltaY;
    const nextScrollLeft = Math.min(maxHorizontalScroll, Math.max(0, container.scrollLeft + delta));
    if (nextScrollLeft === container.scrollLeft) {
      return;
    }

    event.preventDefault();
    container.scrollLeft = nextScrollLeft;
  }, []);

  useEffect(() => {
    const container = journeyContainerRef.current;
    if (!container) {
      return;
    }

    const wheelListener = (event: WheelEvent) => {
      handleJourneyWheel(event);
    };

    container.addEventListener("wheel", wheelListener, { passive: false });
    return () => {
      container.removeEventListener("wheel", wheelListener);
    };
  }, [activeChildId, handleJourneyWheel]);

  const fetchGoalGuardSnapshot = useCallback(async (childId: string): Promise<GoalGuardState | null> => {
    if (!childId) {
      return null;
    }

    try {
      const response = await fetch(`/api/children/${encodeURIComponent(childId)}/activity-today`, {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as ActivityTodayResponse;

      if (!response.ok || !body.ok) {
        return null;
      }

      const dailyGoalMinutesRaw = body.data?.dailyGoalMinutes;
      const totalMinutesRaw = body.data?.totalMinutesToday;
      const dailyGoalMinutes = typeof dailyGoalMinutesRaw === "number" ? dailyGoalMinutesRaw : 0;
      const totalMinutesToday = typeof totalMinutesRaw === "number" ? totalMinutesRaw : 0;
      const reached = dailyGoalMinutes > 0 && totalMinutesToday >= dailyGoalMinutes;

      return {
        loading: false,
        dailyGoalMinutes,
        totalMinutesToday,
        reached,
      };
    } catch {
      return null;
    }
  }, []);

  const refreshGoalGuardForChild = useCallback(
    async (childId: string, options?: { silent?: boolean }) => {
      if (!childId) {
        return true;
      }

      const fetchSeq = ++goalCheckSeqRef.current;
      if (!options?.silent) {
        setGoalGuardState((current) => ({
          ...current,
          loading: true,
        }));
      }

      const snapshot = await fetchGoalGuardSnapshot(childId);
      if (fetchSeq !== goalCheckSeqRef.current) {
        return true;
      }

      if (!snapshot) {
        // Fail-open: if goal API fails, do not block kid lesson flow.
        setGoalGuardState((current) => ({
          ...current,
          loading: false,
          reached: false,
        }));
        return true;
      }

      setGoalGuardState(snapshot);
      return !(snapshot.reached && !goalOverrideByChild[childId]);
    },
    [fetchGoalGuardSnapshot, goalOverrideByChild],
  );

  useEffect(() => {
    if (!activeChildId) {
      return;
    }

    void refreshGoalGuardForChild(activeChildId);
  }, [activeChildId, refreshGoalGuardForChild]);

  const ensureGoalAllowsLessonStart = useCallback(async () => {
    const allowed = await refreshGoalGuardForChild(activeChildId, { silent: true });
    if (!allowed) {
      setMascotMessage("You've studied enough today, let's rest a bit!");
      setIsProfilePopupOpen(false);
      resetInactivityTimer();
    }
    return allowed;
  }, [activeChildId, refreshGoalGuardForChild, resetInactivityTimer]);

  const openParentGate = (intent: ParentGateIntent = "exit") => {
    setParentGateIntent(intent);
    setParentGateSession((current) => current + 1);
    setIsParentGateOpen(true);
    resetInactivityTimer();
  };

  const closeParentGate = () => {
    setIsParentGateOpen(false);
    resetInactivityTimer();
  };

  const handleParentGateVerified = () => {
    setIsParentGateOpen(false);
    if (parentGateIntent === "goal-override") {
      setGoalOverrideByChild((current) => ({
        ...current,
        [activeChildId]: true,
      }));
      setMascotMessage("Mom and Dad agreed, I can study a little more!");
      setMascotStateForDuration("happy", 1400, true);
      resetInactivityTimer();
      return;
    }

    router.push("/parent/dashboard");
  };

  const handleLessonSelect = (lessonId: string) => {
    const selectedLesson = lessons.find((lesson) => lesson.id === lessonId);
    setSelectedLessonId(lessonId);
    setSelectedLessonPulse((previous) => previous + 1);
    if (selectedLesson) {
      setMascotMessage(`Starting ${selectedLesson.title}!`);
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
    void refreshGoalGuardForChild(activeChildId, { silent: true });
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
      const body = (await response.json()) as LessonsTodayResponse;

      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Unable to load today's lesson.");
        setLessons([]);
        return;
      }

      const nextLessons = Array.isArray(body.data?.lessons)
        ? (body.data.lessons as unknown as MissionLesson[])
        : [];
      setLessons(nextLessons);
    } catch (loadError) {
      if (currentFetchSeq !== fetchSeqRef.current) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Unknown error.");
      setLessons([]);
    } finally {
      if (currentFetchSeq === fetchSeqRef.current) {
        setLoadingLessons(false);
      }
    }
  }

  const activeChild = childrenProfiles.find((child) => child.id === activeChildId) ?? childrenProfiles[0];
  const goalGuardBlocked = goalGuardState.reached && !goalOverrideByChild[activeChild.id];
  const activeProgressIndex = lessons.length > 1 ? 1 : 0;
  const activeProgressLesson = lessons[activeProgressIndex] ?? null;
  const guideMascotProfile = resolveGuideMascotProfile({
    guideState: mascotState,
    seed: `${activeChildId}-${activeProgressLesson?.id ?? "guide"}-${mascotMessage}`,
  });
  const journeyTrackWidth = Math.max(
    lessons.length * JOURNEY_NODE_BASE_WIDTH + Math.max(lessons.length - 1, 0) * JOURNEY_NODE_GAP + JOURNEY_TAIL_SPACE,
    1200,
  );
  const journeyPathD = `M 24 106 C ${Math.round(journeyTrackWidth * 0.17)} 28, ${Math.round(journeyTrackWidth * 0.34)} 170, ${Math.round(journeyTrackWidth * 0.5)} 104 C ${Math.round(journeyTrackWidth * 0.66)} 44, ${Math.round(journeyTrackWidth * 0.84)} 162, ${journeyTrackWidth - 24} 88`;
  const journeyTrackStyle = { "--journey-track-width": `${journeyTrackWidth}px` } as CSSProperties;

  return (
    <KidMotionProvider>
      <div className="kid-mission-root">
        <m.header className="kid-hud" variants={fadeInUp} initial="hidden" animate="visible">
          <m.div whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}>
            <button
              type="button"
              className="kid-hud-button kid-hud-back"
              onClick={() => {
                openParentGate("exit");
              }}
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
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
            <span>{isSoundEnabled ? "Sound" : "Muted"}</span>
          </m.button>
        </m.header>

        <m.section className="kid-stage" variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.04 }}>
          <div className="kid-stage-copy">
            <h1>Today's journey map</h1>
            <p>Move through each planet, unlock new lessons, and collect reward stars.</p>
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
                <p>Preparing the lesson map...</p>
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
            {goalGuardBlocked ? (
              <m.div
                key={`goal-guard-${activeChild.id}`}
                className="kid-floating-status"
                variants={popIn}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <DailyGoalReachedScreen
                  childName={activeChild.nickname}
                  dailyGoalMinutes={goalGuardState.dailyGoalMinutes}
                  totalMinutesToday={goalGuardState.totalMinutesToday}
                  onRequestExtraLearning={() => {
                    openParentGate("goal-override");
                  }}
                />
              </m.div>
            ) : (
              <m.div
                key={activeChild.id}
                ref={journeyContainerRef}
                className={`journey-map-container ${isJourneyDragging ? "journey-map-container-dragging" : ""}`}
                variants={listStagger}
                initial="hidden"
                animate="visible"
                exit="exit"
                onPointerDown={handleJourneyPointerDown}
                onPointerMove={handleJourneyPointerMove}
                onPointerUp={stopJourneyDragging}
                onPointerCancel={stopJourneyDragging}
                onPointerLeave={stopJourneyDragging}
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
                      const isActiveProgression = index === activeProgressIndex;
                      const isLocked = !isCompleted && !isActiveProgression;
                      const isSelectedLesson = selectedLessonId === lesson.id;
                      const isCelebratingCompletion = completedLessonFx?.lessonId === lesson.id;
                      const completionPulse = isCelebratingCompletion ? (completedLessonFx?.pulse ?? 0) : 0;
                      const waveSeed = lessons.length > 1 ? index / (lessons.length - 1) : 0;
                      const nodeOffset = Math.round(Math.sin(waveSeed * Math.PI * 2.25) * 22);
                      const nodeStatus: "completed" | "active" | "locked" = isCompleted
                        ? "completed"
                        : isActiveProgression
                          ? "active"
                          : "locked";
                      const nodeMascot = resolveJourneyNodeMascotProfile({
                        lesson,
                        childId: activeChild.id,
                        index,
                        status: nodeStatus,
                        isSelectedLesson,
                        isCelebratingCompletion,
                      });
                      const mascotMotionLevel = prefersReducedMotion ? "minimal" : nodeMascot.motionLevel;
                      const nodeMascotClassName = isCompleted
                        ? "journey-node-mascot journey-node-mascot-completed"
                        : isActiveProgression
                          ? "journey-node-mascot journey-node-mascot-active"
                          : "journey-node-mascot journey-node-mascot-locked";
                      const nodeMascotAnimate = prefersReducedMotion
                        ? { y: 0, rotate: 0, scale: 1 }
                        : isActiveProgression
                          ? { y: [0, -6, 0], rotate: [0, -3, 2, 0], scale: [1, 1.03, 1] }
                          : isCompleted
                            ? { y: [0, -2, 0], scale: [1, 1.015, 1] }
                            : { y: [0, -1, 0], rotate: [0, -1, 0] };
                      const nodeMascotTransition = prefersReducedMotion
                        ? undefined
                        : isActiveProgression
                          ? { repeat: Infinity, duration: 2.1, ease: "easeInOut" as const }
                          : { repeat: Infinity, duration: 2.8, ease: "easeInOut" as const };
                      const nodeMascotStyle = {
                        "--journey-node-mascot-frame-size": "64px",
                        "--journey-node-mascot-character-scale": "2",
                      } as CSSProperties;
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
                          <m.div
                            className={nodeMascotClassName}
                            style={nodeMascotStyle}
                            animate={nodeMascotAnimate}
                            transition={nodeMascotTransition}
                            aria-label={nodeMascot.title}
                          >
                            <KidMascot
                              size={nodeMascot.size}
                              state={nodeMascot.state}
                              actionProp={nodeMascot.actionProp}
                              gazeDirection={nodeMascot.gazeDirection}
                              motionLevel={mascotMotionLevel}
                              pauseWhenOffscreen
                              className="journey-node-mascot-icon"
                              title={nodeMascot.title}
                            />
                          </m.div>

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
                                bunnyVideoId={lesson.bunnyVideoId}
                                videoStatus={lesson.videoStatus ?? undefined}

                                onLessonSelect={handleLessonSelect}
                                onLessonComplete={handleLessonComplete}
                                beforeStart={ensureGoalAllowsLessonStart}
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
                  <div className="mascot-empty-state mascot-empty-state-inline">
                    <Mascot variant="small" state="sleepy" size={132} actionProp="none" motionLevel="minimal" pauseWhenOffscreen />
                    <h3>Nothing here yet...</h3>
                    <p className="muted-text">No suitable lessons are available for this profile yet.</p>
                  </div>
                </m.div>
              ) : null}
              </m.div>
            )}
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
                className="mascot-avatar mascot-avatar-guide"
                animate={prefersReducedMotion ? { y: 0 } : { y: [0, -8, 0] }}
                transition={prefersReducedMotion ? undefined : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                onClick={handleMascotClick}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                role="button"
                aria-label="Guide mascot"
              >
                <Mascot
                  variant="duo"
                  state={guideMascotProfile.parentState}
                  actionProp="none"
                  parentState={guideMascotProfile.parentState}
                  childState={guideMascotProfile.childState}
                  parentActionProp={guideMascotProfile.parentActionProp}
                  childActionProp={guideMascotProfile.childActionProp}
                  parentGazeDirection={guideMascotProfile.parentGazeDirection}
                  childGazeDirection={guideMascotProfile.childGazeDirection}
                  size={94}
                  motionLevel={prefersReducedMotion ? "minimal" : guideMascotProfile.motionLevel}
                  pauseWhenOffscreen
                  className="pointer-events-none"
                  title="Mascot instructions"
                />
              </m.div>
            </m.div>
          ) : null}
        </AnimatePresence>

        <ParentGateDialog key={parentGateSession} open={isParentGateOpen} onClose={closeParentGate} onVerified={handleParentGateVerified} />
      </div>
    </KidMotionProvider>
  );
}

