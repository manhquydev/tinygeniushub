"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, BookOpenText, Calculator, Leaf } from "lucide-react";
import { SeedPlantingCinematic } from "@/components/kid-sky-garden/components/SeedPlantingCinematic";
import { SkyGardenFxCanvas } from "@/components/kid-sky-garden/three/SkyGardenFxCanvas";
import { useKidNavigationFeedback } from "@/components/kid-navigation-feedback";
import {
  buildSkyGardenNodes,
  mapLessonLikeToSkyGardenLesson,
} from "@/components/kid-sky-garden/mappers";
import { LessonStartCard } from "@/components/lesson-wizard/lesson-start-card";
import { Mascot } from "@/components/mascot";
import type {
  SkyGardenChildProfile,
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
  mode?: "today" | "course";
  courseSlug?: string;
  courseTitle?: string;
  courseDescription?: string | null;
  courseCoverImageUrl?: string | null;
  initialFocusTierNo?: number | null;
  initialJourneyStatus?: "SEEDED" | "ACTIVE" | "PAUSED" | "COMPLETED" | null;
}

type LessonsTodayResponse = {
  ok: boolean;
  data?: ApiSuccess<
    Pick<TodayMissionDTO, "lessons"> & {
      journey?: {
        status?: "SEEDED" | "ACTIVE" | "PAUSED" | "COMPLETED" | null;
        currentTierNo?: number | null;
        currentTierProgress?: number | null;
      } | null;
    }
  >["data"];
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

type SyncOptions = {
  silent?: boolean;
};

type SkyPerformanceProfile = "full" | "low" | "reduced";

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const SEED_CINEMATIC_STORAGE_PREFIX = "kid-sky-garden-seed";
const VISIBLE_NODE_COUNT = 3;

const SKY_STOPS: Array<{ top: string; mid: string; bottom: string }> = [
  { top: "#c7f1ff", mid: "#7dd3fc", bottom: "#d9f99d" },
  { top: "#7dd3fc", mid: "#38bdf8", bottom: "#fcd34d" },
  { top: "#60a5fa", mid: "#6366f1", bottom: "#fb923c" },
  { top: "#1e3a8a", mid: "#4c1d95", bottom: "#0f172a" },
];

function buildSeedCinematicStorageKey(childId: string, courseId: string) {
  return `${SEED_CINEMATIC_STORAGE_PREFIX}:${childId}:${courseId}`;
}

function resolveTrackLabel(trackCode: SkyGardenLesson["trackCode"]) {
  switch (trackCode) {
    case "MATH":
      return "Maths";
    case "HABIT":
      return "Habit";
    case "ENGLISH":
    default:
      return "English";
  }
}

function resolveTrackIcon(trackCode: SkyGardenLesson["trackCode"]) {
  switch (trackCode) {
    case "MATH":
      return <Calculator size={18} strokeWidth={2.5} />;
    case "HABIT":
      return <Leaf size={18} strokeWidth={2.5} />;
    case "ENGLISH":
      return <BookOpenText size={18} strokeWidth={2.5} />;
    default:
      return <BookOpenText size={18} strokeWidth={2.5} />;
  }
}

function formatKidDisplayName(nickname: string) {
  const cleaned = nickname.trim();
  if (!cleaned) {
    return "Baby";
  }

  if (cleaned.includes("@")) {
    const localPart = cleaned.split("@")[0]?.trim() ?? "";
    const readable = localPart.replace(/[._-]+/g, " ").trim();
    if (!readable) {
      return "Baby";
    }
    return readable.slice(0, 24);
  }

  return cleaned.slice(0, 24);
}

function readJourneyVisual(params: {
  status: "SEEDED" | "ACTIVE" | "PAUSED" | "COMPLETED" | null;
  completedLessons: number;
  totalLessons: number;
}) {
  const fallbackStatus =
    params.status ??
    (params.totalLessons > 0 && params.completedLessons >= params.totalLessons
      ? "COMPLETED"
      : params.completedLessons > 0
        ? "ACTIVE"
        : "SEEDED");

  switch (fallbackStatus) {
    case "COMPLETED":
      return {
        label: "Has bloomed",
        tone: "completed" as const,
        fxSrc: "/images/cloud-garden/vfx/vfx_tier_unlocked_badge.png",
      };
    case "PAUSED":
      return {
        label: "Take a break",
        tone: "paused" as const,
        fxSrc: "/images/cloud-garden/vfx/vfx_seed_sprout.png",
      };
    case "ACTIVE":
      return {
        label: "Growing up",
        tone: "active" as const,
        fxSrc: "/images/cloud-garden/vfx/vfx_tap_star_pop.png",
      };
    case "SEEDED":
    default:
      return {
        label: "New sprouts",
        tone: "seeded" as const,
        fxSrc: "/images/cloud-garden/vfx/vfx_seed_sprout.png",
      };
  }
}

function detectSkyPerformanceProfile(prefersReducedMotion: boolean): SkyPerformanceProfile {
  if (prefersReducedMotion) {
    return "reduced";
  }
  if (typeof navigator === "undefined") {
    return "full";
  }

  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const slowNetwork = Boolean(connection?.saveData) || /(^2g$|slow-2g|3g)/i.test(connection?.effectiveType ?? "");
  const isUltraLowEnd =
    memory <= 2 ||
    cores <= 2 ||
    (Boolean(connection?.saveData) && /(^2g$|slow-2g|3g)/i.test(connection?.effectiveType ?? ""));

  if (isUltraLowEnd) {
    return "reduced";
  }

  if (slowNetwork || memory <= 4 || cores <= 4) {
    return "low";
  }

  return "full";
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const int = Number.parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex(rgb: Rgb) {
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mixHexColor(fromHex: string, toHex: string, ratio: number) {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const mix = clamp01(ratio);
  return rgbToHex({
    r: from.r + (to.r - from.r) * mix,
    g: from.g + (to.g - from.g) * mix,
    b: from.b + (to.b - from.b) * mix,
  });
}

function sampleSkyColors(progress: number) {
  const safe = clamp01(progress);
  const segments = SKY_STOPS.length - 1;
  if (segments <= 0) {
    return SKY_STOPS[0]!;
  }

  const scaled = safe * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const blend = scaled - index;

  const from = SKY_STOPS[index]!;
  const to = SKY_STOPS[index + 1]!;

  return {
    top: mixHexColor(from.top, to.top, blend),
    mid: mixHexColor(from.mid, to.mid, blend),
    bottom: mixHexColor(from.bottom, to.bottom, blend),
  };
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
  courseDescription = null,
  courseCoverImageUrl = null,
  initialFocusTierNo = null,
  initialJourneyStatus = null,
}: KidSkyGardenSceneProps) {
  const { navigate, isNavigating } = useKidNavigationFeedback();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const routeLocationKey = `${pathname}?${searchParams.toString()}`;
  const routeFocusTierNo = useMemo(() => {
    const raw = searchParams.get("focusTierNo");
    const parsed = Number.parseInt(raw ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  const hasHandledInitialSeedRef = useRef(false);
  const mapWrapRef = useRef<HTMLElement | null>(null);
  const mapWindowAnchorRef = useRef<string | null>(null);
  const routeSyncRef = useRef<string | null>(null);

  const [activeChildId, setActiveChildId] = useState(initialChildId);
  const [lessons, setLessons] = useState(initialLessons);
  const [progress, setProgress] = useState<SkyGardenProgressSnapshot>(initialProgress);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [performanceProfile, setPerformanceProfile] = useState<SkyPerformanceProfile>(() =>
    detectSkyPerformanceProfile(prefersReducedMotion),
  );
  const [journeyStatus, setJourneyStatus] = useState<
    "SEEDED" | "ACTIVE" | "PAUSED" | "COMPLETED" | null
  >(initialJourneyStatus);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<string | null>(null);
  const [seedCinematicCourse, setSeedCinematicCourse] =
    useState<SkyGardenSeedCourse | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [climbProgress, setClimbProgress] = useState(0);
  const [levelUpFxTier, setLevelUpFxTier] = useState<number | null>(null);
  const [focusTierNo, setFocusTierNo] = useState<number | null>(
    routeFocusTierNo ?? initialFocusTierNo,
  );
  const [selectedTrack, setSelectedTrack] = useState<SkyGardenLesson["trackCode"] | null>(
    mode === "course" ? initialLessons[0]?.trackCode ?? null : null,
  );

  const activeChild =
    childrenProfiles.find((child) => child.id === activeChildId) ?? childrenProfiles[0];
  const activeChildName = formatKidDisplayName(activeChild?.nickname ?? "");
  const avatarLabel = Array.from(activeChildName)[0]?.toUpperCase() ?? "B";

  useEffect(() => {
    if (!isNavigating) {
      setPendingNavigationAction(null);
    }
  }, [isNavigating]);

  useEffect(() => {
    const syncProfile = () => {
      setPerformanceProfile(detectSkyPerformanceProfile(prefersReducedMotion));
    };

    syncProfile();

    const connection = (navigator as Navigator & {
      connection?: {
        addEventListener?: (type: "change", listener: () => void) => void;
        removeEventListener?: (type: "change", listener: () => void) => void;
      };
    }).connection;

    window.addEventListener("resize", syncProfile, { passive: true });
    connection?.addEventListener?.("change", syncProfile);

    return () => {
      window.removeEventListener("resize", syncProfile);
      connection?.removeEventListener?.("change", syncProfile);
    };
  }, [prefersReducedMotion]);

  const journeys = useMemo(() => {
    const grouped = new Map<string, SkyGardenLesson[]>();
    for (const lesson of lessons) {
      const current = grouped.get(lesson.trackCode) ?? [];
      current.push(lesson);
      grouped.set(lesson.trackCode, current);
    }

    return Array.from(grouped.entries()).map(([trackCode, trackLessons]) => {
      const completedLessons = trackLessons.filter((lesson) => lesson.isCompleted).length;
      const nextLesson =
        trackLessons.find((lesson) => !lesson.isCompleted) ?? trackLessons[0] ?? null;

      return {
        trackCode: trackCode as SkyGardenLesson["trackCode"],
        title: trackLessons[0]?.journeyTitle ?? resolveTrackLabel(trackCode),
        unitTitle: trackLessons[0]?.unitTitle ?? "Opening",
        accent: trackLessons[0]?.journeyAccent ?? "#2563eb",
        totalLessons: trackLessons.length,
        completedLessons,
        nextLessonTitle: nextLesson?.title ?? null,
      };
    });
  }, [lessons]);

  const showCloudClimbMap = mode === "course" || Boolean(selectedTrack);
  const scopedLessons = useMemo(
    () =>
      selectedTrack
        ? lessons.filter((lesson) => lesson.trackCode === selectedTrack)
        : lessons,
    [lessons, selectedTrack],
  );

  const nodes = useMemo(
    () => (showCloudClimbMap ? buildSkyGardenNodes(scopedLessons) : []),
    [scopedLessons, showCloudClimbMap],
  );

  const activeNodeIndex = useMemo(
    () => nodes.findIndex((node) => node.state === "active"),
    [nodes],
  );
  const preferredFocusNodeIndex = useMemo(() => {
    if (focusTierNo == null) {
      return -1;
    }
    return nodes.findIndex((node) => node.tierIndex === focusTierNo);
  }, [focusTierNo, nodes]);
  const effectiveFocusNodeIndex = useMemo(() => {
    if (preferredFocusNodeIndex < 0) {
      return -1;
    }
    if (activeNodeIndex < 0) {
      return preferredFocusNodeIndex;
    }
    // Ignore stale/incorrect hint from previous screen when too far from real active node.
    return Math.abs(preferredFocusNodeIndex - activeNodeIndex) <= 1
      ? preferredFocusNodeIndex
      : -1;
  }, [activeNodeIndex, preferredFocusNodeIndex]);
  const baseNodeIndex = useMemo(() => {
    if (effectiveFocusNodeIndex >= 0) {
      return Math.max(0, effectiveFocusNodeIndex - 1);
    }
    if (nodes.length === 0) {
      return 0;
    }
    if (activeNodeIndex <= 0) {
      return 0;
    }
    return activeNodeIndex - 1;
  }, [activeNodeIndex, effectiveFocusNodeIndex, nodes.length]);
  const visibleWindowStart = useMemo(() => {
    const maxStart = Math.max(0, nodes.length - VISIBLE_NODE_COUNT);
    return Math.min(Math.max(0, baseNodeIndex), maxStart);
  }, [baseNodeIndex, nodes.length]);
  const visibleNodes = useMemo(
    () => nodes.slice(visibleWindowStart, visibleWindowStart + VISIBLE_NODE_COUNT),
    [nodes, visibleWindowStart],
  );
  const hasHiddenAbove = visibleWindowStart + visibleNodes.length < nodes.length;
  const hasHiddenBelow = visibleWindowStart > 0;
  const nodeWindowProgress = useMemo(() => {
    if (nodes.length <= 1) {
      return 0;
    }
    return clamp01(visibleWindowStart / (nodes.length - 1));
  }, [nodes.length, visibleWindowStart]);

  const completedCount = lessons.filter((lesson) => lesson.isCompleted).length;
  const completedPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const journeyVisual = useMemo(
    () =>
      readJourneyVisual({
        status: journeyStatus,
        completedLessons: completedCount,
        totalLessons: lessons.length,
      }),
    [completedCount, journeyStatus, lessons.length],
  );
  const activeNode = nodes.find((node) => node.state === "active") ?? null;
  const nextLessonTitle = activeNode?.title ?? null;
  const remainingGoalMinutes = Math.max(progress.dailyGoalMinutes - progress.totalMinutesToday, 0);
  const heroTierLabel =
    activeNode?.tierIndex != null ? `Cloud layer${activeNode.tierIndex}` : "First clouds";
  const heroProgressLabel =
    completedCount > 0 ? `${completedPercent}% of gardens have bloomed` : "Touch the clouds to start";
  const heroJourneyHint = nextLessonTitle
    ? `Next mission:${nextLessonTitle}`
    : courseDescription?.trim()
      ? courseDescription.trim()
      : "Tap on the first cloud to start the journey.";
  const tierSpacing = isCompact ? 330 : 390;
  const baseTierBottom = isCompact ? 150 : 180;
  const mapHeight = Math.max(
    isCompact ? 1500 : 1700,
    visibleNodes.length * tierSpacing + (isCompact ? 430 : 520),
  );

  const skyColors = useMemo(() => sampleSkyColors(climbProgress), [climbProgress]);

  const sceneStyle = useMemo(
    () =>
      ({
        background: [
          "radial-gradient(circle at 10% 8%, rgba(196, 247, 255, 0.35) 0%, transparent 36%)",
          "radial-gradient(circle at 90% 20%, rgba(125, 211, 252, 0.28) 0%, transparent 34%)",
          `linear-gradient(180deg, ${skyColors.top} 0%, ${skyColors.mid} 48%, ${skyColors.bottom} 100%)`,
        ].join(", "),
        "--ksg2-climb-progress": `${climbProgress}`,
      }) as CSSProperties,
    [climbProgress, skyColors.bottom, skyColors.mid, skyColors.top],
  );

  const cloudBackOffset = useMemo(() => -climbProgress * 34, [climbProgress]);
  const cloudFrontOffset = useMemo(() => -climbProgress * 56, [climbProgress]);
  const starsOpacity = useMemo(
    () =>
      performanceProfile === "reduced"
        ? 0
        : clamp01((climbProgress - 0.44) / 0.56) * (performanceProfile === "low" ? 0.5 : 0.92),
    [climbProgress, performanceProfile],
  );
  const fxQuality = performanceProfile === "full" ? "full" : "low";
  const shouldRenderWebGlFx = performanceProfile !== "reduced";
  const shouldAnimateAtmosphere = performanceProfile === "full";

  const startNavigation = useCallback(
    (action: string, href: string) => {
      if (isNavigating) {
        return;
      }
      setPendingNavigationAction(action);
      navigate(href);
    },
    [isNavigating, navigate],
  );

  const goToLearningHub = useCallback(() => {
    startNavigation("go-learning-hub", `/kid/courses?childId=${encodeURIComponent(activeChildId)}`);
  }, [activeChildId, startNavigation]);

  const goToSharedGarden = useCallback(() => {
    startNavigation("go-shared-garden", `/kid/garden?childId=${encodeURIComponent(activeChildId)}`);
  }, [activeChildId, startNavigation]);

  const syncChildData = useCallback(
    async (childId: string, options?: SyncOptions) => {
      const childProfile = childrenProfiles.find((child) => child.id === childId);
      if (!childProfile) {
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
          fetch(lessonsUrl, { method: "GET", cache: "no-store" }),
          fetch(`/api/children/${encodeURIComponent(childId)}/activity-today`, {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const lessonsBody = (await lessonsResponse.json()) as LessonsTodayResponse;
        const activityBody = (await activityResponse.json()) as ActivityTodayResponse;

        if (!lessonsResponse.ok || !lessonsBody.ok) {
          setStatusMessage(
            lessonsBody.error?.message ?? "Unable to download trip data.",
          );
          return;
        }

        const nextLessonsRaw = Array.isArray(lessonsBody.data?.lessons)
          ? lessonsBody.data.lessons
          : [];
        const nextLessons = nextLessonsRaw.map((lesson, index) =>
          mapLessonLikeToSkyGardenLesson(lesson, index),
        );

        setLessons(nextLessons);
        if (mode === "course") {
          setSelectedTrack(nextLessons[0]?.trackCode ?? null);
          setJourneyStatus(lessonsBody.data?.journey?.status ?? null);
        } else {
          setSelectedTrack(null);
          setJourneyStatus(null);
        }

        const dailyGoalMinutesRaw = activityBody.data?.dailyGoalMinutes;
        const totalMinutesTodayRaw = activityBody.data?.totalMinutesToday;
        const dailyGoalMinutes =
          typeof dailyGoalMinutesRaw === "number"
            ? dailyGoalMinutesRaw
            : childProfile.dailyGoalMinutes;
        const totalMinutesToday =
          typeof totalMinutesTodayRaw === "number" ? totalMinutesTodayRaw : 0;

        setProgress((current) => ({
          ...current,
          dailyGoalMinutes,
          totalMinutesToday,
          reached: dailyGoalMinutes > 0 && totalMinutesToday >= dailyGoalMinutes,
          completedLessons: nextLessons.filter((lesson) => lesson.isCompleted).length,
          totalLessons: nextLessons.length,
        }));

        const url = new URL(window.location.href);
        url.searchParams.set("childId", childId);
        window.history.replaceState(null, "", url.toString());
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Cannot synchronize trip data.",
        );
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
      await syncChildData(childId);
    },
    [activeChildId, syncChildData],
  );

  const guardBeforeStart = useCallback(() => {
    if (progress.reached) {
      setStatusMessage("Today's goal of learning minutes has been reached, but you can still continue!");
      // Allow them to continue anyway, don't block logic
    }
    return true;
  }, [progress.reached]);

  const handleLessonComplete = useCallback(
    (lessonId: string) => {
      const updatedLessons = lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson,
      );

      const beforeScoped = selectedTrack
        ? lessons.filter((lesson) => lesson.trackCode === selectedTrack)
        : lessons;
      const afterScoped = selectedTrack
        ? updatedLessons.filter((lesson) => lesson.trackCode === selectedTrack)
        : updatedLessons;

      const beforeNodes = buildSkyGardenNodes(beforeScoped);
      const afterNodes = buildSkyGardenNodes(afterScoped);

      const beforeActiveTier =
        beforeNodes.find((node) => node.state === "active")?.tierIndex ?? 1;
      const afterActiveTier =
        afterNodes.find((node) => node.state === "active")?.tierIndex ?? beforeActiveTier;

      if (afterActiveTier > beforeActiveTier) {
        setLevelUpFxTier(afterActiveTier);
      }

      const completedAfter = updatedLessons.filter((lesson) => lesson.isCompleted).length;
      if (completedAfter >= updatedLessons.length && updatedLessons.length > 0) {
        setJourneyStatus("COMPLETED");
      } else if (completedAfter > 0) {
        setJourneyStatus("ACTIVE");
      }

      setLessons(updatedLessons);
      setStatusMessage("Great! Baby has just opened a new layer of clouds.");
      void syncChildData(activeChildId, { silent: true });
    },
    [activeChildId, lessons, selectedTrack, syncChildData],
  );

  useEffect(() => {
    if (mode === "course" && !selectedTrack && lessons.length > 0) {
      setSelectedTrack(lessons[0]?.trackCode ?? null);
    }
  }, [lessons, mode, selectedTrack]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const syncCompact = () => {
      setIsCompact(media.matches);
    };

    syncCompact();
    media.addEventListener("change", syncCompact);
    return () => {
      media.removeEventListener("change", syncCompact);
    };
  }, []);

  useEffect(() => {
    setActiveChildId(initialChildId);
  }, [initialChildId]);

  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);

  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress]);

  useEffect(() => {
    setJourneyStatus(initialJourneyStatus ?? null);
  }, [initialJourneyStatus]);

  useEffect(() => {
    const nextTrack = mode === "course" ? initialLessons[0]?.trackCode ?? null : null;
    setSelectedTrack(nextTrack);
    if (mode !== "course") {
      setJourneyStatus(null);
    }
  }, [initialLessons, mode]);

  useEffect(() => {
    setFocusTierNo(routeFocusTierNo ?? initialFocusTierNo ?? null);
  }, [initialFocusTierNo, routeFocusTierNo]);

  useEffect(() => {
    if (mode !== "course" || !courseSlug || !activeChildId) {
      return;
    }
    const syncKey = `${courseSlug}:${activeChildId}:${routeLocationKey}`;
    if (routeSyncRef.current === syncKey) {
      return;
    }
    routeSyncRef.current = syncKey;
    void syncChildData(activeChildId, { silent: true });
  }, [activeChildId, courseSlug, mode, routeLocationKey, syncChildData]);

  useEffect(() => {
    if (hasHandledInitialSeedRef.current) {
      return;
    }
    hasHandledInitialSeedRef.current = true;

    if (!initialSeedCourse) {
      return;
    }

    const storageKey = buildSeedCinematicStorageKey(activeChildId, initialSeedCourse.id);
    let hasSeen = false;
    try {
      hasSeen = window.localStorage.getItem(storageKey) === "1";
    } catch {
      hasSeen = false;
    }

    if (!hasSeen) {
      setSeedCinematicCourse(initialSeedCourse);
      setStatusMessage(`New seed for key"${initialSeedCourse.title}" is ready.`);
    }
  }, [activeChildId, initialSeedCourse]);

  useEffect(() => {
    if (!levelUpFxTier) {
      return;
    }
    const timer = window.setTimeout(() => setLevelUpFxTier(null), 1300);
    return () => window.clearTimeout(timer);
  }, [levelUpFxTier]);

  useEffect(() => {
    setClimbProgress(nodeWindowProgress);
  }, [nodeWindowProgress]);

  useEffect(() => {
    if (!showCloudClimbMap) {
      mapWindowAnchorRef.current = null;
      return;
    }

    const mapWrap = mapWrapRef.current;
    if (!mapWrap) {
      return;
    }

    const preferredFocusNode =
      effectiveFocusNodeIndex >= 0 ? nodes[effectiveFocusNodeIndex] ?? null : null;
    const focusNodeId =
      preferredFocusNode?.id ??
      activeNode?.id ??
      visibleNodes[visibleNodes.length - 1]?.id ??
      null;
    const anchorKey = `${activeChildId}:${selectedTrack ?? "all"}:${visibleWindowStart}:${
      focusNodeId ?? "none"
    }:${nodes.length}:${routeLocationKey}`;
    if (mapWindowAnchorRef.current === anchorKey && mapWrap.scrollTop > 8) {
      return;
    }
    mapWindowAnchorRef.current = anchorKey;
    const previousInlineScrollBehavior = mapWrap.style.scrollBehavior;
    mapWrap.style.scrollBehavior = "auto";

    const scrollToProgressNode = () => {
      if (!focusNodeId) {
        mapWrap.scrollTop = Math.max(0, mapWrap.scrollHeight - mapWrap.clientHeight);
        return;
      }

      const targetTier = mapWrap.querySelector<HTMLElement>(
        `[data-node-id="${focusNodeId}"]`,
      );

      if (!targetTier) {
        mapWrap.scrollTop = Math.max(0, mapWrap.scrollHeight - mapWrap.clientHeight);
        return;
      }
      const targetNode =
        targetTier.querySelector<HTMLElement>(".ksg2-node-card") ?? targetTier;

      const wrapRect = mapWrap.getBoundingClientRect();
      const targetRect = targetNode.getBoundingClientRect();
      const targetTopInScroll = targetRect.top - wrapRect.top + mapWrap.scrollTop;
      const targetCenterInScroll = targetTopInScroll + targetRect.height * 0.5;
      const focusOffsetRatio = (() => {
        if (!hasHiddenBelow) return isCompact ? 0.56 : 0.54;
        if (hasHiddenAbove) return isCompact ? 0.5 : 0.48;
        return isCompact ? 0.52 : 0.5;
      })();
      const desiredTop =
        targetCenterInScroll - mapWrap.clientHeight * focusOffsetRatio;
      const maxScrollTop = Math.max(0, mapWrap.scrollHeight - mapWrap.clientHeight);
      mapWrap.scrollTop = Math.min(maxScrollTop, Math.max(0, desiredTop));
    };

    let alignRaf = 0;
    let disposed = false;
    let alignQueued = false;
    const retryTimers: number[] = [];
    const startAt = performance.now();
    const alignWindowMs = 4200;
    let clearFocusTimer = 0;
    const queueAlign = () => {
      if (disposed || alignQueued) {
        return;
      }
      alignQueued = true;
      alignRaf = window.requestAnimationFrame(() => {
        alignQueued = false;
        scrollToProgressNode();
      });
    };

    queueAlign();
    for (const delayMs of [60, 140, 240, 360, 520, 760, 1040, 1360, 1760, 2200, 2800, 3400, 4000]) {
      retryTimers.push(
        window.setTimeout(() => {
          if (disposed) {
            return;
          }
          queueAlign();
        }, delayMs),
      );
    }

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || performance.now() - startAt > alignWindowMs) {
        return;
      }
      queueAlign();
    });
    resizeObserver.observe(mapWrap);

    const mutationObserver = new MutationObserver(() => {
      if (disposed || performance.now() - startAt > alignWindowMs) {
        return;
      }
      queueAlign();
    });
    mutationObserver.observe(mapWrap, { childList: true, subtree: true });

    const handlePageShow = () => {
      if (disposed) {
        return;
      }
      queueAlign();
    };
    const handleVisibilityChange = () => {
      if (disposed || document.visibilityState !== "visible") {
        return;
      }
      queueAlign();
    };
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (focusTierNo != null) {
      clearFocusTimer = window.setTimeout(() => setFocusTierNo(null), alignWindowMs);
    }

    return () => {
      disposed = true;
      if (alignRaf > 0) {
        window.cancelAnimationFrame(alignRaf);
      }
      for (const timer of retryTimers) {
        window.clearTimeout(timer);
      }
      if (clearFocusTimer > 0) {
        window.clearTimeout(clearFocusTimer);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mapWrap.style.scrollBehavior = previousInlineScrollBehavior;
    };
  }, [
    activeChildId,
    activeNode?.id,
    focusTierNo,
    hasHiddenAbove,
    hasHiddenBelow,
    isCompact,
    nodes,
    nodes.length,
    effectiveFocusNodeIndex,
    routeLocationKey,
    selectedTrack,
    showCloudClimbMap,
    visibleNodes.length,
    visibleWindowStart,
  ]);

  const handleSeedCinematicFinish = useCallback(() => {
    if (!seedCinematicCourse) {
      return;
    }

    const storageKey = buildSeedCinematicStorageKey(activeChildId, seedCinematicCourse.id);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore localStorage write failures.
    }

    setSeedCinematicCourse(null);
    setStatusMessage(`Seeds have been planted for the course"${seedCinematicCourse.title}". Let's start climbing the clouds!`);
  }, [activeChildId, seedCinematicCourse]);

  const mascotMessage =
    statusMessage ??
    (showCloudClimbMap
      ? !hasHiddenBelow
        ? "Let's start with the garden. Complete the lesson to climb to the clouds."
        : activeNode
          ? "Conquer the current cluster of cards to unlock the cloud area above."
          : "Let's continue our journey in the clouds."
      : "Choose your favorite journey to start your learning garden.");

  return (
    <section
      className="ksg2-scene"
      style={sceneStyle}
      data-testid={mode === "course" ? "kid-course-scene" : "kid-today-scene"}
      data-performance-profile={performanceProfile}
      aria-label="Cloud learning garden"
      aria-busy={isNavigating || loading}
    >
      {shouldRenderWebGlFx ? <SkyGardenFxCanvas className="ksg2-three-layer" quality={fxQuality} /> : null}

      <div className="ksg2-atmosphere" aria-hidden="true">
        <span
          className="ksg2-cloud-layer is-back"
          style={{
            transform: shouldAnimateAtmosphere
              ? `translate3d(0, ${cloudBackOffset}px, 0)`
              : "translate3d(0, 0, 0)",
          }}
        />
        <span
          className="ksg2-cloud-layer is-front"
          style={{
            transform: shouldAnimateAtmosphere
              ? `translate3d(0, ${cloudFrontOffset}px, 0)`
              : "translate3d(0, 0, 0)",
          }}
        />
        <span className="ksg2-star-field" style={{ opacity: starsOpacity }} />
      </div>

      <header className="ksg2-hud">
        <div className="ksg2-top-row">
          <button
            type="button"
            className="ksg2-back-btn"
            onClick={() => {
              if (mode === "course") {
                goToLearningHub();
              } else {
                startNavigation("go-parent-dashboard", "/parent/dashboard");
              }
            }}
            disabled={isNavigating}
            aria-label={mode === "course" ? "Return to the learning page" : "Back to parents"}
          >
            <ArrowLeft size={18} />
          </button>

          <label className="ksg2-child-picker">
            <span className="ksg2-child-avatar" aria-hidden="true">
              {avatarLabel}
            </span>
            <span className="ksg2-child-prefix">Little:</span>
            <select
              value={activeChildId}
              onChange={(event) => {
                void handleChildChange(event.target.value);
              }}
              aria-label="Select baby profile"
              disabled={isNavigating}
            >
              {childrenProfiles.map((child) => (
                <option key={child.id} value={child.id}>
                  {formatKidDisplayName(child.nickname)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ksg2-flow-nav" role="navigation" aria-label="Navigate the journey">
          <button type="button" className="ksg2-flow-chip" onClick={goToLearningHub} disabled={isNavigating}>
            <Image
              src="/kisu-assets/stickers/sticker_tap_here_smile.png"
              alt=""
              width={22}
              height={22}
              className="ksg2-flow-chip-icon"
            />
            {pendingNavigationAction === "go-learning-hub" ? "Open..." : "School yard"}
          </button>
          <button type="button" className="ksg2-flow-chip" onClick={goToSharedGarden} disabled={isNavigating}>
            <Image
              src="/kisu-assets/stickers/sticker_point_course_plot.png"
              alt=""
              width={22}
              height={22}
              className="ksg2-flow-chip-icon"
            />
            {pendingNavigationAction === "go-shared-garden" ? "Open..." : "Shared garden"}
          </button>
          <span className="ksg2-flow-chip is-active">
            <Image
              src="/kisu-assets/stickers/sticker_hint.png"
              alt=""
              width={22}
              height={22}
              className="ksg2-flow-chip-icon"
            />
            Cloud garden
          </span>
        </div>

        {mode === "course" ? (
          <section className="ksg2-course-hero" data-testid="kid-course-hero">
            <div className="ksg2-course-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={courseCoverImageUrl ?? "/images/courses/course_cover_littlefox.png"}
                alt={courseTitle ?? "Course"}
              />
            </div>

            <div className="ksg2-course-content">
              <p className="ksg2-course-tag">{`Cloud garden's${activeChildName}`}</p>
              <h1>{courseTitle ?? "Baby's learning journey"}</h1>
              <p className="ksg2-course-story">{heroJourneyHint}</p>
              <div className="ksg2-course-stats">
                <span>{heroTierLabel}</span>
                <span>{heroProgressLabel}</span>
                {isCompact ? null : <span>{`Target${progress.dailyGoalMinutes}minutes/day`}</span>}
              </div>
              <span
                className={`ksg2-journey-state is-${journeyVisual.tone}`}
                data-testid="kid-course-journey-state"
              >
                {journeyVisual.label}
              </span>
            </div>

            <Image
              src="/kisu-assets/stickers/sticker_hint.png"
              alt=""
              width={56}
              height={56}
              className="ksg2-course-kisu"
            />
            <Image
              src={journeyVisual.fxSrc}
              alt=""
              width={88}
              height={88}
              className={`ksg2-course-state-fx is-${journeyVisual.tone}`}
            />
          </section>
        ) : null}

        <div className="ksg2-progress-bar">
          <span>{`Today the baby learns${progress.totalMinutesToday}minute`}</span>
          <strong>
            {remainingGoalMinutes > 0
              ? `${remainingGoalMinutes} minutes left`
              : "Baby reached his goal!"}
          </strong>
        </div>
      </header>

      {loading ? <p className="ksg2-status">Synchronizing garden data...</p> : null}
      {!loading && statusMessage ? <p className="ksg2-status">{statusMessage}</p> : null}

      <main className="ksg2-main">
        {!showCloudClimbMap ? (
          <section className="ksg2-journey-list">
            {journeys.map((journey) => (
              <button
                key={journey.trackCode}
                type="button"
                className="ksg2-journey-card"
                onClick={() => {
                  setSelectedTrack(journey.trackCode);
                  setStatusMessage(`I come in${journey.title}okay!`);
                }}
                style={{ "--ksg2-accent": journey.accent } as CSSProperties}
              >
                <span className="ksg2-journey-glyph">{resolveTrackIcon(journey.trackCode)}</span>
                <div className="ksg2-journey-content">
                  <strong>{journey.title}</strong>
                  <span>{journey.unitTitle}</span>
                  <span>{`${journey.completedLessons}/${journey.totalLessons}post`}</span>
                  <span>
                    {journey.nextLessonTitle
                      ? `Next:${journey.nextLessonTitle}`
                      : "Ready to start"}
                  </span>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <section
            className="ksg2-map-wrap"
            aria-label="Cloud climbing map"
            ref={mapWrapRef}
            data-testid={mode === "course" ? "kid-course-map" : "kid-today-map"}
          >
            <div className="ksg2-map" style={{ minHeight: `${mapHeight}px` }}>
              {hasHiddenAbove ? (
                <div className="ksg2-fog-cap" aria-hidden="true">
                  <span>Clouds above, continue learning to explore</span>
                </div>
              ) : null}

              <Image
                src="/images/cloud-garden/ground/bg_ground_garden.png"
                alt=""
                width={1280}
                height={420}
                className="ksg2-ground-image"
              />

              <div className="ksg2-ground-entry" aria-hidden="true">
                {hasHiddenBelow ? (
                  <span className="ksg2-ground-anchor">{`Passed${visibleWindowStart}floor`}</span>
                ) : (
                  <>
                    <Image
                      src="/images/cloud-garden/ground/course_planter_base.png"
                      alt=""
                      width={172}
                      height={94}
                      className="ksg2-planter"
                    />
                    <Image
                      src="/images/cloud-garden/ui/course_sapling_level0.png"
                      alt=""
                      width={108}
                      height={128}
                      className="ksg2-sapling"
                    />
                    {performanceProfile === "full" ? (
                      <>
                        <span className="ksg2-firefly is-a" />
                        <span className="ksg2-firefly is-b" />
                        <span className="ksg2-firefly is-c" />
                      </>
                    ) : null}
                  </>
                )}
              </div>

              <span className="ksg2-stem" aria-hidden="true" />

              {visibleNodes.map((node, index) => {
                const tierNo = node.tierIndex;
                const nodeStateAsset =
                  node.state === "active"
                    ? "/images/nodes/node_giant_leaf_platform.png"
                    : node.state === "completed"
                      ? "/images/nodes/node_flower_bloomed_done.png"
                      : "/images/nodes/node_flower_bud_locked.png";

                const isUnlocking = levelUpFxTier === tierNo;

                return (
                  <article
                    key={node.id}
                    className={`ksg2-tier ${node.side === "left" ? "is-left" : "is-right"} ${
                      isUnlocking ? "is-unlocking" : ""
                    }`}
                    data-node-id={node.id}
                    data-node-state={node.state}
                    data-testid={`kid-course-tier-${tierNo}-${node.state}`}
                    style={{ bottom: `${baseTierBottom + index * tierSpacing}px` }}
                  >
                    <div className="ksg2-tier-cloud" aria-hidden="true">
                      <Image
                        src="/images/cloud-garden/vfx/platform_cloud_fluffy.png"
                        alt=""
                        fill
                        sizes="(max-width: 768px) 92vw, 460px"
                        className="ksg2-tier-cloud-image"
                      />
                      {isUnlocking ? (
                        <>
                          <Image
                            src="/images/cloud-garden/vfx/vfx_cloud_burst_levelup.png"
                            alt=""
                            width={170}
                            height={170}
                            className="ksg2-tier-burst"
                          />
                          <Image
                            src="/images/cloud-garden/vfx/vfx_tier_unlocked_badge.png"
                            alt=""
                            width={72}
                            height={72}
                            className="ksg2-tier-badge"
                          />
                        </>
                      ) : null}
                      <span className="ksg2-tier-label">{`Cloud layer${tierNo}`}</span>
                    </div>

                    <div className={`ksg2-node-card state-${node.state}`}>
                      <Image
                        src={nodeStateAsset}
                        alt=""
                        width={116}
                        height={68}
                        className="ksg2-node-asset"
                      />

                      <div className="ksg2-node-head">
                        <span>{resolveTrackLabel(node.trackCode)}</span>
                        <strong>{node.journeyTitle}</strong>
                      </div>
                      <p className="ksg2-node-unit">{node.unitTitle}</p>

                      {node.state === "active" ? (
                        <LessonStartCard
                          childId={activeChildId}
                          lessonId={node.id}
                          title={node.title}
                          objective={node.objective}
                          estimatedMinutes={node.estimatedMinutes}
                          trackCode={(node.trackCode === "MATH" || node.trackCode === "HABIT" || node.trackCode === "ENGLISH") ? node.trackCode : "ENGLISH"}
                          tierLabel={node.tierIndex != null ? `Floor${node.tierIndex}` : null}
                          videoSource={node.videoSource}
                          bunnyVideoId={node.bunnyVideoId}
                          videoStatus={node.videoStatus}
                          onLessonComplete={handleLessonComplete}
                          beforeStart={guardBeforeStart}
                        />
                      ) : (
                        <div className="ksg2-node-meta">
                          <h3>{node.title}</h3>
                          <p>{`${node.estimatedMinutes}minute •${node.objective}`}</p>
                          {node.state === "completed" ? (
                            <span className="ksg2-node-chip">Completed</span>
                          ) : (
                            <button
                              type="button"
                              className="ksg2-node-lock"
                              data-testid={`kid-course-tier-lock-${tierNo}`}
                              onClick={() =>
                                setStatusMessage(
                                  "Complete the current floor to unlock a new floor!",
                                )
                              }
                            >
                              This floor has not been opened yet
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <div className="ksg2-companion" aria-hidden="true">
        <Image src="/images/nodes/kisu_companion_balloon.png" alt="" width={96} height={126} />
      </div>

      <div className="ksg2-mascot" aria-live="polite">
        <Mascot
          variant="small"
          state={progress.reached ? "sleepy" : activeNode ? "happy" : "celebrating"}
          size={isCompact ? 86 : 116}
          motionLevel="soft"
          pauseWhenOffscreen
          showBaseGlow={false}
        />
        {isCompact ? null : <p className="ksg2-mascot-bubble">{mascotMessage}</p>}
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
