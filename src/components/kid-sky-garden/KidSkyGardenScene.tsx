"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { SeedPlantingCinematic } from "@/components/kid-sky-garden/components/SeedPlantingCinematic";
import { LessonStartCard } from "@/components/lesson-wizard/lesson-start-card";
import { Mascot } from "@/components/mascot";
import { BeanTipGrowthFx } from "@/components/kid-sky-garden/components/BeanTipGrowthFx";
import { buildSkyGardenNodes, mapLessonLikeToSkyGardenLesson } from "@/components/kid-sky-garden/mappers";
import type {
  SkyGardenChildProfile,
  SkyGardenGrowthState,
  SkyGardenLaneState,
  SkyGardenLesson,
  SkyGardenProgressSnapshot,
  SkyGardenSeedCourse,
} from "@/components/kid-sky-garden/types";
import type { ApiSuccess, TodayMissionDTO } from "@/lib/api-types";
import "./sky-garden.css";

interface KidSkyGardenSceneProps {
  childrenProfiles: SkyGardenChildProfile[];
  initialChildId: string;
  initialLessons: SkyGardenLesson[];
  initialProgress: SkyGardenProgressSnapshot;
  initialSeedCourse?: SkyGardenSeedCourse | null;
  /** When mode="course", the back button navigates to /kid/courses instead of /parent/dashboard */
  mode?: "today" | "course";
  courseSlug?: string;
  courseTitle?: string;
}

type SkyGardenJourneyOverview = {
  trackCode: SkyGardenLesson["trackCode"];
  journeyTitle: string;
  unitTitle: string;
  journeyAccent: string;
  totalLessons: number;
  completedLessons: number;
  nextLessonTitle: string | null;
};

type LessonsTodayResponse = {
  ok: boolean;
  data?: ApiSuccess<Pick<TodayMissionDTO, "lessons">>["data"];
  error?: {
    message?: string;
  };
};

type ActivityTodayResponse = {
  ok: boolean;
  data?: ApiSuccess<{
    dailyGoalMinutes?: number;
    totalMinutesToday?: number;
  }>["data"];
  error?: {
    message?: string;
  };
};

type AtmosphereParticle = {
  xPercent: number;
  yPercent: number;
  size: number;
  durationSeconds: number;
  delaySeconds: number;
  opacity: number;
};

const DEFAULT_MASCOT_MESSAGES = [
  "Mình cùng leo lên tầng mây mới nhé!",
  "Cây đậu sẽ lớn dần theo từng bài học đó!",
  "Hoàn thành tầng này là mở được tầng tiếp theo.",
];

const TIER_BASE_BOTTOM = 180;
const TIER_GAP = 320;
const FOCUS_SAFE_TOP = 252;
const FOCUS_SAFE_BOTTOM = 210;
const DEFAULT_SCROLL_TOP_SAFE = 236;
const DEFAULT_SCROLL_BOTTOM_SAFE = 176;
const SEED_CINEMATIC_STORAGE_PREFIX = "kid-sky-garden-seed";

function buildSeedCinematicStorageKey(childId: string, courseId: string) {
  return `${SEED_CINEMATIC_STORAGE_PREFIX}:${childId}:${courseId}`;
}

function buildAtmosphereParticles(count: number): AtmosphereParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const xSeed = (index * 17) % 100;
    const ySeed = (index * 23 + 11) % 84;

    return {
      xPercent: 8 + xSeed * 0.84,
      yPercent: 10 + ySeed,
      size: 3 + (index % 4),
      durationSeconds: 3.4 + (index % 5) * 0.7,
      delaySeconds: -((index % 6) * 0.5),
      opacity: 0.2 + (index % 4) * 0.12,
    };
  });
}

function resolveTierBottom(tierIndex: number) {
  return TIER_BASE_BOTTOM + Math.max(0, tierIndex - 1) * TIER_GAP;
}

function resolveLaneStateLabel(state: SkyGardenLaneState) {
  switch (state) {
    case "seeded":
      return "Mới gieo hạt";
    case "tier_unlocking":
      return "Đang mở tầng";
    case "plateau":
      return "Đã tới đỉnh hiện tại";
    case "growing":
    default:
      return "Đang vươn mầm";
  }
}

function resolveTrackLabel(trackCode: SkyGardenLesson["trackCode"]) {
  switch (trackCode) {
    case "MATH":
      return "Toán";
    case "HABIT":
      return "Thói quen";
    case "ENGLISH":
    default:
      return "Tiếng Anh";
  }
}

function resolveTrackGlyph(trackCode: SkyGardenLesson["trackCode"]) {
  switch (trackCode) {
    case "HABIT":
      return "🌱";
    case "ENGLISH":
    default:
      return "🦊"; // Default emoji for unknown courses
  }
}

function resolveTierDepthClass(tierIndex: number, activeTierIndex: number) {
  const depthDistance = Math.abs(tierIndex - activeTierIndex);
  if (depthDistance === 0) return "ksg-tier-depth-focus";
  if (depthDistance === 1) return "ksg-tier-depth-near";
  if (depthDistance === 2) return "ksg-tier-depth-mid";
  return "ksg-tier-depth-far";
}

export function KidSkyGardenScene({
  childrenProfiles,
  initialChildId,
  initialLessons,
  initialProgress,
  initialSeedCourse = null,
  mode = "today",
  courseSlug,
  courseTitle,
}: KidSkyGardenSceneProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const hudRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const hasCenteredInitialTierRef = useRef(false);
  const hasHandledInitialSeedRef = useRef(false);
  const [activeChildId, setActiveChildId] = useState(initialChildId);
  const [lessons, setLessons] = useState(initialLessons);
  const [progress, setProgress] = useState<SkyGardenProgressSnapshot>(initialProgress);
  const [loading, setLoading] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [lowPerformanceMode, setLowPerformanceMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [seedCinematicCourse, setSeedCinematicCourse] = useState<SkyGardenSeedCourse | null>(null);
  const [stemPulseCount, setStemPulseCount] = useState(0);
  const [newlyUnlockedLessonId, setNewlyUnlockedLessonId] = useState<string | null>(null);
  const [unlockingTierIndex, setUnlockingTierIndex] = useState<number | null>(null);
  const [isCompactMascotMode, setIsCompactMascotMode] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SkyGardenLesson["trackCode"] | null>(null);
  const [scrollTopSafe, setScrollTopSafe] = useState(DEFAULT_SCROLL_TOP_SAFE);
  const [scrollBottomSafe, setScrollBottomSafe] = useState(DEFAULT_SCROLL_BOTTOM_SAFE);
  const [growthState, setGrowthState] = useState<SkyGardenGrowthState>({
    phase: "idle",
    fromTier: 1,
    toTier: 1,
    pulse: 0,
  });

  const scopedLessons = useMemo(
    () => (selectedTrack ? lessons.filter((lesson) => lesson.trackCode === selectedTrack) : lessons),
    [lessons, selectedTrack],
  );
  const nodes = useMemo(() => buildSkyGardenNodes(scopedLessons), [scopedLessons]);
  const maxTierIndex = nodes.length > 0 ? Math.max(...nodes.map((n) => n.tierIndex)) : 1;
  const sceneHeight = Math.max(1200, 350 + maxTierIndex * TIER_GAP);
  const activeNode = nodes.find((node) => node.state === "active") ?? null;
  const activeJourney = selectedTrack ? activeNode ?? nodes[0] ?? null : null;
  const completedCount = nodes.filter((node) => node.state === "completed").length;
  const activeTierIndex =
    activeNode?.tierIndex ?? (nodes.length > 0 ? nodes[nodes.length - 1]!.tierIndex : 1);
  const atmosphereParticles = useMemo(
    () => buildAtmosphereParticles(lowPerformanceMode ? 8 : 16),
    [lowPerformanceMode],
  );

  const laneState: SkyGardenLaneState = useMemo(() => {
    if (nodes.length === 0) return "seeded";
    if (growthState.phase === "growing") return "tier_unlocking";
    if (completedCount === 0) return "seeded";
    if (completedCount >= nodes.length) return "plateau";
    return "growing";
  }, [completedCount, growthState.phase, nodes.length]);
  const laneStateLabel = resolveLaneStateLabel(laneState);

  const journeyOverviews = useMemo<SkyGardenJourneyOverview[]>(() => {
    const groups = new Map<SkyGardenLesson["trackCode"], SkyGardenLesson[]>();
    for (const lesson of lessons) {
      const current = groups.get(lesson.trackCode) ?? [];
      current.push(lesson);
      groups.set(lesson.trackCode, current);
    }

    return Array.from(groups.entries()).map(([trackCode, trackLessons]) => {
      const completedLessons = trackLessons.filter((lesson) => lesson.isCompleted).length;
      const nextLesson = trackLessons.find((lesson) => !lesson.isCompleted) ?? trackLessons[0] ?? null;
      return {
        trackCode,
        journeyTitle: trackLessons[0]?.journeyTitle ?? resolveTrackLabel(trackCode),
        unitTitle: trackLessons[0]?.unitTitle ?? "Khởi đầu",
        journeyAccent: trackLessons[0]?.journeyAccent ?? "#2563eb",
        totalLessons: trackLessons.length,
        completedLessons,
        nextLessonTitle: nextLesson?.title ?? null,
      };
    });
  }, [lessons]);

  const activeChild = childrenProfiles.find((child) => child.id === activeChildId) ?? childrenProfiles[0];
  const activeChildAvatarLabel = useMemo(() => {
    const trimmed = activeChild?.nickname.trim() ?? "";
    if (trimmed.length === 0) return "B";
    return Array.from(trimmed)[0]?.toUpperCase() ?? "B";
  }, [activeChild?.nickname]);
  const mascotMessage =
    statusMessage ??
    DEFAULT_MASCOT_MESSAGES[(completedCount + growthState.pulse) % DEFAULT_MASCOT_MESSAGES.length]!;

  const clearSeedQueryParams = useCallback(() => {
    const url = new URL(window.location.href);
    const hasSeedParams = url.searchParams.has("seedCourseId") || url.searchParams.has("seedCourseTitle");
    if (!hasSeedParams) {
      return;
    }
    url.searchParams.delete("seedCourseId");
    url.searchParams.delete("seedCourseTitle");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const focusTier = useCallback(
    (tierIndex: number) => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      const viewportHeight = container.clientHeight;
      const targetFromBottom = resolveTierBottom(tierIndex);
      const safeTop = Math.min(FOCUS_SAFE_TOP, Math.max(128, scrollTopSafe));
      const safeBottom = Math.min(FOCUS_SAFE_BOTTOM, Math.max(116, scrollBottomSafe));
      const safeBand = Math.max(160, viewportHeight - safeTop - safeBottom);
      const targetScreenY = safeTop + safeBand * 0.52;
      const rawTop = sceneHeight - targetFromBottom - targetScreenY;
      const maxTop = Math.max(0, container.scrollHeight - viewportHeight);
      const nextTop = Math.min(Math.max(rawTop, 0), maxTop);

      container.scrollTo({
        top: nextTop,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [prefersReducedMotion, sceneHeight, scrollBottomSafe, scrollTopSafe],
  );

  const syncChildData = useCallback(
    async (childId: string, options?: { silent?: boolean; preserveGrowth?: boolean }) => {
      const activeChildProfile = childrenProfiles.find((child) => child.id === childId);
      if (!activeChildProfile) {
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setStatusMessage(null);

      try {
        const lessonsUrl =
          mode === "course" && courseSlug
            ? `/api/courses/${encodeURIComponent(courseSlug)}/lessons?childId=${encodeURIComponent(childId)}`
            : `/api/lessons/today?childId=${encodeURIComponent(childId)}`;

        const [lessonsResponse, activityResponse] = await Promise.all([
          fetch(lessonsUrl, {
            method: "GET",
            cache: "no-store",
          }),
          fetch(`/api/children/${encodeURIComponent(childId)}/activity-today`, {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const lessonsBody = (await lessonsResponse.json()) as LessonsTodayResponse;
        const activityBody = (await activityResponse.json()) as ActivityTodayResponse;

        if (!lessonsResponse.ok || !lessonsBody.ok) {
          setStatusMessage(lessonsBody.error?.message ?? "Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c b\u00e0i h\u1ecdc.");
          return;
        }

        const nextLessonsRaw = Array.isArray(lessonsBody.data?.lessons) ? lessonsBody.data.lessons : [];
        const nextLessons = nextLessonsRaw.map((lesson, index) => mapLessonLikeToSkyGardenLesson(lesson, index));
        setLessons(nextLessons);

        if (!options?.preserveGrowth) {
          const nextNodes = buildSkyGardenNodes(nextLessons);
          const nextActiveTier = nextNodes.find((node) => node.state === "active")?.tierIndex ?? Math.max(nextNodes.length, 1);
          setGrowthState((current) => ({
            ...current,
            phase: "idle",
            fromTier: nextActiveTier,
            toTier: nextActiveTier,
          }));
          setUnlockingTierIndex(null);
        }

        const url = new URL(window.location.href);
        url.searchParams.set("childId", childId);
        window.history.replaceState(null, "", url.toString());

        const dailyGoalMinutesRaw = activityBody.data?.dailyGoalMinutes;
        const totalMinutesTodayRaw = activityBody.data?.totalMinutesToday;
        const dailyGoalMinutes =
          typeof dailyGoalMinutesRaw === "number" ? dailyGoalMinutesRaw : activeChildProfile.dailyGoalMinutes;
        const totalMinutesToday = typeof totalMinutesTodayRaw === "number" ? totalMinutesTodayRaw : 0;

        setProgress((current) => ({
          ...current,
          dailyGoalMinutes,
          totalMinutesToday,
          reached: dailyGoalMinutes > 0 && totalMinutesToday >= dailyGoalMinutes,
        }));
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tải khu vườn.");
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [childrenProfiles, courseSlug, mode],
  );

  const handleChildChange = useCallback(
    async (childId: string) => {
      if (!childId || childId === activeChildId) {
        return;
      }

      setActiveChildId(childId);
      setSelectedTrack(null);
      hasCenteredInitialTierRef.current = false;
      setStemPulseCount(0);
      setNewlyUnlockedLessonId(null);
      setUnlockingTierIndex(null);
      await syncChildData(childId);
    },
    [activeChildId, syncChildData],
  );

  const guardBeforeStart = useCallback(() => {
    if (!progress.reached) {
      return true;
    }
    setStatusMessage("Hôm nay đã đạt mục tiêu rồi. Mình nghỉ một chút nhé!");
    return false;
  }, [progress.reached]);

  const handleLessonComplete = useCallback(
    (lessonId: string) => {
      const beforeNodes = buildSkyGardenNodes(lessons);
      const beforeActiveTier = beforeNodes.find((node) => node.state === "active")?.tierIndex ?? activeTierIndex;

      const updatedLessons = lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson));
      const afterNodes = buildSkyGardenNodes(updatedLessons);
      const nextActiveNode = afterNodes.find((node) => node.state === "active") ?? null;
      const nextActiveTier = nextActiveNode?.tierIndex ?? beforeActiveTier;
      const hasUnlockedNewTier = nextActiveTier > beforeActiveTier;

      setLessons(updatedLessons);
      setStemPulseCount((count) => count + 1);
      setNewlyUnlockedLessonId(nextActiveNode?.id ?? null);
      setUnlockingTierIndex(hasUnlockedNewTier ? nextActiveTier : null);

      setGrowthState((current) => ({
        pulse: current.pulse + 1,
        phase: hasUnlockedNewTier && !prefersReducedMotion ? "growing" : "idle",
        fromTier: hasUnlockedNewTier ? beforeActiveTier : nextActiveTier,
        toTier: nextActiveTier,
      }));

      setStatusMessage(
        hasUnlockedNewTier
          ? "Tuyệt vời! Cây đậu vừa mọc lên tầng mây mới."
          : "Giỏi lắm! Con vừa hoàn thành thêm một thử thách.",
      );
      void syncChildData(activeChildId, { silent: true, preserveGrowth: true });
    },
    [activeChildId, activeTierIndex, lessons, prefersReducedMotion, syncChildData],
  );

  useEffect(() => {
    if (growthState.phase !== "growing") {
      return;
    }

    const timer = window.setTimeout(() => {
      setGrowthState((current) => ({
        ...current,
        phase: "idle",
        fromTier: current.toTier,
      }));
      setUnlockingTierIndex(null);
    }, prefersReducedMotion ? 0 : 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [growthState.phase, growthState.pulse, prefersReducedMotion]);

  useEffect(() => {
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    setLowPerformanceMode(typeof memory === "number" && memory <= 4);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 820px)");
    const sync = () => {
      setIsCompactMascotMode(query.matches);
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!selectedTrack) {
      return;
    }
    const hasTrackLessons = lessons.some((lesson) => lesson.trackCode === selectedTrack);
    if (!hasTrackLessons) {
      setSelectedTrack(null);
    }
  }, [lessons, selectedTrack]);

  useEffect(() => {
    const computeBottomSafe = () => {
      const viewportHeight = window.innerHeight;
      const minBottom = isCompactMascotMode ? 124 : 168;
      const suggested = Math.round(viewportHeight * (isCompactMascotMode ? 0.2 : 0.24));
      setScrollBottomSafe(Math.max(minBottom, Math.min(FOCUS_SAFE_BOTTOM, suggested)));
    };

    computeBottomSafe();
    window.addEventListener("resize", computeBottomSafe, { passive: true });
    return () => {
      window.removeEventListener("resize", computeBottomSafe);
    };
  }, [isCompactMascotMode]);

  useEffect(() => {
    const hud = hudRef.current;
    if (!hud) {
      return;
    }

    const updateTopSafe = () => {
      const hudHeight = Math.round(hud.getBoundingClientRect().height);
      const dynamicTop = Math.max(170, Math.min(FOCUS_SAFE_TOP, hudHeight + 18));
      setScrollTopSafe(dynamicTop);
    };

    updateTopSafe();
    const observer = new ResizeObserver(updateTopSafe);
    observer.observe(hud);
    window.addEventListener("resize", updateTopSafe, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateTopSafe);
    };
  }, [activeChildId, completedCount, isCompactMascotMode, nodes.length, progress.totalMinutesToday, statusMessage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || prefersReducedMotion) {
      setParallaxOffset(0);
      return;
    }

    let rafId: number | null = null;
    const updateParallax = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        setParallaxOffset(Math.min(56, container.scrollTop * 0.1));
      });
    };

    updateParallax();
    container.addEventListener("scroll", updateParallax, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      container.removeEventListener("scroll", updateParallax);
    };
  }, [prefersReducedMotion, activeChildId]);

  useEffect(() => {
    if (!selectedTrack || loading || seedCinematicCourse || hasCenteredInitialTierRef.current) {
      return;
    }
    hasCenteredInitialTierRef.current = true;
    focusTier(activeTierIndex);
  }, [activeTierIndex, focusTier, loading, seedCinematicCourse, selectedTrack]);

  useEffect(() => {
    if (!selectedTrack || growthState.phase !== "growing") {
      return;
    }
    focusTier(growthState.toTier);
  }, [focusTier, growthState.phase, growthState.toTier, selectedTrack]);

  useEffect(() => {
    if (hasHandledInitialSeedRef.current) {
      return;
    }
    hasHandledInitialSeedRef.current = true;

    if (!initialSeedCourse) {
      return;
    }

    const seedStorageKey = buildSeedCinematicStorageKey(activeChildId, initialSeedCourse.id);
    let hasSeenCinematic = false;
    try {
      hasSeenCinematic = window.localStorage.getItem(seedStorageKey) === "1";
    } catch {
      hasSeenCinematic = false;
    }

    if (hasSeenCinematic) {
      clearSeedQueryParams();
      return;
    }

    setSeedCinematicCourse(initialSeedCourse);
    setStatusMessage(`Hạt đậu mới cho khóa "${initialSeedCourse.title}" đã sẵn sàng.`);
  }, [activeChildId, clearSeedQueryParams, initialSeedCourse]);

  const handleSeedCinematicFinish = useCallback(() => {
    if (!seedCinematicCourse) {
      return;
    }

    const seedStorageKey = buildSeedCinematicStorageKey(activeChildId, seedCinematicCourse.id);
    try {
      window.localStorage.setItem(seedStorageKey, "1");
    } catch {
      // ignore localStorage write failures in restricted environments.
    }

    setSeedCinematicCourse(null);
    setStemPulseCount((count) => count + 1);
    setGrowthState((current) => ({
      ...current,
      pulse: current.pulse + 1,
    }));
    setStatusMessage(`Đã gieo cây đậu cho khóa "${seedCinematicCourse.title}". Mình bắt đầu thôi!`);
    focusTier(activeTierIndex);
    clearSeedQueryParams();
  }, [activeChildId, activeTierIndex, clearSeedQueryParams, focusTier, seedCinematicCourse]);

  const tipFromBottom = resolveTierBottom(growthState.fromTier) + 48;
  const tipToBottom = resolveTierBottom(growthState.toTier) + 48;
  const isCameraFocusActive = growthState.phase === "growing" && !prefersReducedMotion;

  return (
    <section
      className={`ksg-scene ${isCameraFocusActive ? "ksg-scene-camera-focus" : ""}`}
      aria-label="Khu vườn trên mây"
    >
      <span
        className="ksg-sky-cloud ksg-sky-cloud-a"
        style={{ transform: `translate3d(0, ${parallaxOffset * 0.18}px, 0)` }}
        aria-hidden="true"
      />
      <span
        className="ksg-sky-cloud ksg-sky-cloud-b"
        style={{ transform: `translate3d(0, ${parallaxOffset * 0.25}px, 0)` }}
        aria-hidden="true"
      />
      <span
        className="ksg-sky-cloud ksg-sky-cloud-c"
        style={{ transform: `translate3d(0, ${parallaxOffset * 0.34}px, 0)` }}
        aria-hidden="true"
      />
      <span
        className="ksg-depth-fog ksg-depth-fog-back"
        style={{ transform: `translate3d(0, ${parallaxOffset * 0.12}px, 0)` }}
        aria-hidden="true"
      />
      <span
        className="ksg-depth-fog ksg-depth-fog-front"
        style={{ transform: `translate3d(0, ${parallaxOffset * 0.26}px, 0)` }}
        aria-hidden="true"
      />
      <div className="ksg-particle-field" aria-hidden="true">
        {atmosphereParticles.map((particle, index) => (
          <span
            key={`ksg-particle-${index + 1}`}
            className="ksg-particle"
            style={{
              left: `${particle.xPercent}%`,
              bottom: `${particle.yPercent}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${particle.durationSeconds}s`,
              animationDelay: `${particle.delaySeconds}s`,
            }}
          />
        ))}
      </div>
      <span className="ksg-camera-vignette" aria-hidden="true" />

      <header ref={hudRef} className="ksg-hud">
        <div className="ksg-hud-row">
          <button
            type="button"
            className="ksg-pill ksg-pill-icon"
            onClick={() => {
              if (mode === "course") {
                router.push(`/kid/courses?childId=${encodeURIComponent(activeChildId)}`);
              } else {
                router.push("/parent/dashboard");
              }
            }}
            aria-label={mode === "course" ? "Quay lại danh sách khu v\u01b0\u1eddn" : "Quay l\u1ea1i khu v\u1ef1c ph\u1ee5 huynh"}
          >
            <ArrowLeft size={20} />
          </button>

          <label className="ksg-pill ksg-child-select">
            <span className="ksg-child-avatar" aria-hidden="true">
              {activeChildAvatarLabel}
            </span>
            <span className="ksg-child-label">Bé học</span>
            <select
              value={activeChildId}
              onChange={(event) => {
                void handleChildChange(event.target.value);
              }}
              aria-label="Chọn hồ sơ bé"
            >
              {childrenProfiles.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.nickname}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ksg-hud-row">
          <div className="ksg-pill ksg-progress-pill">
            <div className="ksg-progress-summary">
              <strong>{`${activeChild.nickname}: ${completedCount}/${nodes.length || 0} tầng`}</strong>
              <span>{laneStateLabel}</span>
            </div>
            <strong className="ksg-progress-minute">{`${progress.totalMinutesToday}/${progress.dailyGoalMinutes} phút`}</strong>
          </div>
        </div>

        {activeJourney ? (
          <div className="ksg-hud-row">
            <div
              className="ksg-pill ksg-journey-pill"
              style={{ "--ksg-journey-accent": activeJourney.journeyAccent } as CSSProperties}
            >
              <span className="ksg-journey-track">{resolveTrackLabel(activeJourney.trackCode)}</span>
              <strong className="ksg-journey-title">{activeJourney.journeyTitle}</strong>
              <span className="ksg-journey-unit">{activeJourney.unitTitle}</span>
            </div>
            {selectedTrack ? (
              <button
                type="button"
                className="ksg-pill ksg-journey-switch"
                onClick={() => {
                  setSelectedTrack(null);
                  hasCenteredInitialTierRef.current = false;
                }}
              >
                Đổi khóa
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {loading ? (
        <div className="ksg-status" style={{ top: `${Math.max(104, scrollTopSafe - 2)}px` }} role="status" aria-live="polite">
          <span className="ksg-loading">
            <span className="ksg-loader-dot" />
            Đang cập nhật khu vườn...
          </span>
        </div>
      ) : statusMessage ? (
        <p className="ksg-status" style={{ top: `${Math.max(104, scrollTopSafe - 2)}px` }} role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      {loading ? (
        <div className="ksg-student-loading" role="status" aria-live="polite">
          <span className="ksg-student-loading-orb" aria-hidden="true" />
          <div>
            <strong>Đang chuẩn bị khu vườn của bé...</strong>
            <p>Hệ thống đang cập nhật lộ trình học và bài học phù hợp.</p>
          </div>
        </div>
      ) : null}

      <div
        ref={scrollContainerRef}
        className="ksg-scroll"
        style={{
          paddingTop: `${scrollTopSafe}px`,
          paddingBottom: `${scrollBottomSafe}px`,
        }}
      >
        {selectedTrack ? (
          <div className="ksg-map" style={{ minHeight: `${sceneHeight}px` }}>
          <div className="ksg-ground-asset" aria-hidden="true">
            <Image src="/assets/garden/ground.png" alt="" width={1200} height={420} className="ksg-ground-asset-image" />
          </div>

          <div
            className={`ksg-beanstalk ${stemPulseCount > 0 ? "ksg-beanstalk-grow" : ""}`}
            key={`stem-${stemPulseCount}`}
            aria-hidden="true"
          />
          {nodes.map((node, index) => (
            <span
              key={`stem-leaf-${node.id}`}
              className={`ksg-stem-leaf ${index % 2 === 0 ? "ksg-stem-leaf-left" : "ksg-stem-leaf-right"}`}
              style={{ bottom: `${resolveTierBottom(index + 1) - 94}px` }}
              aria-hidden="true"
            />
          ))}

          <BeanTipGrowthFx
            fromBottom={tipFromBottom}
            toBottom={tipToBottom}
            active={growthState.phase === "growing"}
            pulse={growthState.pulse}
            prefersReducedMotion={prefersReducedMotion}
          />

          {nodes.map((node, index) => {
            const bottom = resolveTierBottom(index + 1);
            const nodeCardClassName =
              node.state === "active"
                ? "ksg-node-card ksg-node-card-active"
                : node.state === "completed"
                  ? "ksg-node-card ksg-node-card-completed"
                  : "ksg-node-card ksg-node-card-locked";
            const isTierActive = node.tierIndex === activeTierIndex;
            const isTierUnlocking = unlockingTierIndex === node.tierIndex;
            const tierDepthClass = resolveTierDepthClass(node.tierIndex, activeTierIndex);

            return (
              <article
                key={node.id}
                className={`ksg-tier ${tierDepthClass}`}
                style={{ bottom: `${bottom}px`, "--ksg-journey-accent": node.journeyAccent } as CSSProperties}
              >
                <div
                  className={[
                    "ksg-tier-cloud",
                    isTierActive ? "ksg-tier-cloud-active" : "",
                    isTierUnlocking ? "ksg-tier-cloud-unlocking" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden="true"
                >
                  <Image
                    src="/assets/garden/cloud_platform.png"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 86vw, 440px"
                    className="ksg-tier-cloud-asset"
                  />
                  <span className="ksg-tier-cloud-shadow" />
                  <span className="ksg-tier-cloud-highlight" />
                </div>
                <span className="ksg-tier-label">{`Tầng mây ${node.tierIndex}`}</span>

                <div className={`ksg-node-wrap ${node.side === "left" ? "ksg-node-wrap-left" : "ksg-node-wrap-right"}`}>
                  <div className="ksg-node-tower">
                    <span className="ksg-node-tower-vine ksg-node-tower-vine-left" aria-hidden="true" />
                    <span className="ksg-node-tower-vine ksg-node-tower-vine-right" aria-hidden="true" />
                    <div className={`${nodeCardClassName} ${newlyUnlockedLessonId === node.id ? "ksg-node-unlock-pop" : ""}`}>
                      <div className="ksg-node-journey-bar">
                        <span className="ksg-node-track">{resolveTrackLabel(node.trackCode)}</span>
                        <strong>{node.journeyTitle}</strong>
                      </div>
                      <p className="ksg-node-unit">{node.unitTitle}</p>

                      {node.state === "active" ? (
                        <LessonStartCard
                          childId={activeChildId}
                          lessonId={node.id}
                          title={node.title}
                          objective={node.objective}
                          estimatedMinutes={node.estimatedMinutes}
                          videoSource={node.videoSource}
                          bunnyVideoId={node.bunnyVideoId}
                          videoStatus={node.videoStatus}
                          onLessonComplete={handleLessonComplete}
                          beforeStart={guardBeforeStart}
                        />
                      ) : (
                        <>
                          <span
                            className={`ksg-node-chip ${
                              node.state === "completed" ? "ksg-node-chip-completed" : "ksg-node-chip-locked"
                            }`}
                          >
                            {node.state === "completed" ? "Đã hoàn thành" : "Đang khóa"}
                          </span>
                          <h3 className="ksg-node-title">{node.title}</h3>
                          <p className="ksg-node-meta">{`${node.estimatedMinutes} phút • ${node.objective}`}</p>

                          {node.state === "locked" ? (
                            <button
                              type="button"
                              className="ksg-node-lock-btn"
                              onClick={() => {
                                setStatusMessage("Hoàn thành tầng đang mở để cây đậu leo tiếp nhé!");
                              }}
                            >
                              Chưa mở tầng này
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        ) : (
          <div className="ksg-entry">
            <section className="ksg-entry-overview">
              <h2>{`Xin chào ${activeChild.nickname}!`}</h2>
              <p>Chọn một khóa học để vào khu vườn và bắt đầu hành trình hôm nay.</p>
              <div className="ksg-entry-stats">
                <article className="ksg-entry-stat">
                  <span>Thời gian hôm nay</span>
                  <strong>{`${progress.totalMinutesToday}/${progress.dailyGoalMinutes} phút`}</strong>
                </article>
                <article className="ksg-entry-stat">
                  <span>Tổng bài theo kế hoạch</span>
                  <strong>{`${lessons.length} bài`}</strong>
                </article>
              </div>
            </section>

            <section className="ksg-entry-courses">
              <h3>Khóa học của bé</h3>
              <div className="ksg-entry-course-grid">
                {journeyOverviews.map((journey) => (
                  <button
                    key={journey.trackCode}
                    type="button"
                    className="ksg-entry-course-card"
                    style={{ "--ksg-journey-accent": journey.journeyAccent } as CSSProperties}
                    onClick={() => {
                      setSelectedTrack(journey.trackCode);
                      hasCenteredInitialTierRef.current = false;
                      setStatusMessage(`Mình vào ${journey.journeyTitle} nhé!`);
                    }}
                  >
                    <span className="ksg-entry-course-glyph">{resolveTrackGlyph(journey.trackCode)}</span>
                    <div className="ksg-entry-course-content">
                      <strong>{journey.journeyTitle}</strong>
                      <span>{journey.unitTitle}</span>
                      <span>{`${journey.completedLessons}/${journey.totalLessons} bài`}</span>
                      <span>{journey.nextLessonTitle ? `Tiếp theo: ${journey.nextLessonTitle}` : "Sẵn sàng bắt đầu"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="ksg-mascot" aria-live="polite">
        <Mascot
          variant="small"
          state={progress.reached ? "sleepy" : activeNode ? "happy" : "celebrating"}
          size={isCompactMascotMode ? 84 : 120}
          motionLevel="soft"
          pauseWhenOffscreen
          showBaseGlow={false}
        />
        {isCompactMascotMode ? null : <p className="ksg-mascot-bubble">{mascotMessage}</p>}
      </div>

      {seedCinematicCourse ? (
        <SeedPlantingCinematic
          courseTitle={seedCinematicCourse.title}
          onFinish={handleSeedCinematicFinish}
          prefersReducedMotion={prefersReducedMotion}
        />
      ) : null}
    </section>
  );
}
