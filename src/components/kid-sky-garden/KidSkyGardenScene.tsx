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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, BookOpenText, Calculator, Leaf } from "lucide-react";
import { SeedPlantingCinematic } from "@/components/kid-sky-garden/components/SeedPlantingCinematic";
import { SkyGardenFxCanvas } from "@/components/kid-sky-garden/three/SkyGardenFxCanvas";
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
}

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

type SyncOptions = {
  silent?: boolean;
};

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
      return "Toán";
    case "HABIT":
      return "Thói quen";
    case "ENGLISH":
    default:
      return "Tiếng Anh";
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
}: KidSkyGardenSceneProps) {
  const router = useRouter();
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
  const avatarLabel = activeChild
    ? Array.from(activeChild.nickname.trim())[0]?.toUpperCase() ?? "B"
    : "B";

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
        unitTitle: trackLessons[0]?.unitTitle ?? "Mở đầu",
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
  const totalLessonMinutes = lessons.reduce(
    (sum, lesson) => sum + lesson.estimatedMinutes,
    0,
  );
  const activeNode = nodes.find((node) => node.state === "active") ?? null;
  const nextLessonTitle = activeNode?.title ?? null;
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
    () => clamp01((climbProgress - 0.44) / 0.56) * 0.92,
    [climbProgress],
  );

  const goToLearningHub = useCallback(() => {
    router.push(`/kid/courses?childId=${encodeURIComponent(activeChildId)}`);
  }, [activeChildId, router]);

  const goToSharedGarden = useCallback(() => {
    router.push(`/kid/garden?childId=${encodeURIComponent(activeChildId)}`);
  }, [activeChildId, router]);

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
            lessonsBody.error?.message ?? "Không tải được dữ liệu hành trình.",
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
        } else {
          setSelectedTrack(null);
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
            : "Không thể đồng bộ dữ liệu hành trình.",
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
      setStatusMessage("Hôm nay đã đạt mục tiêu phút học, bé nghỉ một chút nhé.");
      return false;
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

      setLessons(updatedLessons);
      setStatusMessage("Tuyệt vời! Bé vừa mở thêm một tầng mây mới.");
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
    const nextTrack = mode === "course" ? initialLessons[0]?.trackCode ?? null : null;
    setSelectedTrack(nextTrack);
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
      setStatusMessage(`Hạt giống mới cho khóa "${initialSeedCourse.title}" đã sẵn sàng.`);
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
    setStatusMessage(`Đã gieo mầm cho khóa "${seedCinematicCourse.title}". Bắt đầu leo mây thôi!`);
  }, [activeChildId, seedCinematicCourse]);

  const mascotMessage =
    statusMessage ??
    (showCloudClimbMap
      ? !hasHiddenBelow
        ? "Bắt đầu từ khu vườn nhé. Hoàn thành bài để leo lên tầng mây."
        : activeNode
          ? "Chinh phục cụm bài hiện tại để mở khóa vùng mây phía trên."
          : "Tiếp tục hành trình trên mây nào."
      : "Chọn hành trình yêu thích để khởi động khu vườn học tập.");

  return (
    <section className="ksg2-scene" style={sceneStyle} aria-label="Khu vườn mây học tập">
      <SkyGardenFxCanvas className="ksg2-three-layer" />

      <div className="ksg2-atmosphere" aria-hidden="true">
        <span
          className="ksg2-cloud-layer is-back"
          style={{ transform: `translate3d(0, ${cloudBackOffset}px, 0)` }}
        />
        <span
          className="ksg2-cloud-layer is-front"
          style={{ transform: `translate3d(0, ${cloudFrontOffset}px, 0)` }}
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
                router.push("/parent/dashboard");
              }
            }}
            aria-label={mode === "course" ? "Quay lại trang học tập" : "Quay lại phụ huynh"}
          >
            <ArrowLeft size={18} />
          </button>

          <label className="ksg2-child-picker">
            <span className="ksg2-child-avatar" aria-hidden="true">
              {avatarLabel}
            </span>
            <span className="ksg2-child-prefix">Bé:</span>
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

        <div className="ksg2-flow-nav" role="navigation" aria-label="Điều hướng hành trình">
          <button type="button" className="ksg2-flow-chip" onClick={goToLearningHub}>
            Học tập
          </button>
          <button type="button" className="ksg2-flow-chip" onClick={goToSharedGarden}>
            Vườn chung
          </button>
          <span className="ksg2-flow-chip is-active">Khóa này</span>
        </div>

        {mode === "course" ? (
          <section className="ksg2-course-hero">
            <div className="ksg2-course-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={courseCoverImageUrl ?? "/images/courses/course_cover_littlefox.png"}
                alt={courseTitle ?? "Khóa học"}
              />
            </div>

            <div className="ksg2-course-content">
              <p className="ksg2-course-tag">Cloud Garden • Leo tầng mây</p>
              <h1>{courseTitle ?? "Khóa học của bé"}</h1>
              {isCompact ? null : (
                <p>
                  {courseDescription ??
                    "Hoàn thành từng bài học để cây đậu vươn qua các tầng mây."}
                </p>
              )}
              <div className="ksg2-course-stats">
                <span>{`${completedCount}/${lessons.length} bài`}</span>
                <span>{`${completedPercent}% tiến độ`}</span>
                {isCompact ? null : <span>{`${totalLessonMinutes} phút`}</span>}
                {isCompact || !nextLessonTitle ? null : <span>{`Tiếp theo: ${nextLessonTitle}`}</span>}
              </div>
            </div>

            <Image
              src="/kisu-assets/stickers/sticker_hint.png"
              alt=""
              width={56}
              height={56}
              className="ksg2-course-kisu"
            />
          </section>
        ) : null}

        <div className="ksg2-progress-bar">
          <span>{`${progress.totalMinutesToday}/${progress.dailyGoalMinutes} phút`}</span>
          <strong>{`${completedCount}/${lessons.length} bài`}</strong>
        </div>
      </header>

      {loading ? <p className="ksg2-status">Đang đồng bộ dữ liệu khu vườn...</p> : null}
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
                  setStatusMessage(`Mình vào ${journey.title} nhé!`);
                }}
                style={{ "--ksg2-accent": journey.accent } as CSSProperties}
              >
                <span className="ksg2-journey-glyph">{resolveTrackIcon(journey.trackCode)}</span>
                <div className="ksg2-journey-content">
                  <strong>{journey.title}</strong>
                  <span>{journey.unitTitle}</span>
                  <span>{`${journey.completedLessons}/${journey.totalLessons} bài`}</span>
                  <span>
                    {journey.nextLessonTitle
                      ? `Tiếp theo: ${journey.nextLessonTitle}`
                      : "Sẵn sàng bắt đầu"}
                  </span>
                </div>
              </button>
            ))}
          </section>
        ) : (
          <section className="ksg2-map-wrap" aria-label="Bản đồ leo tầng mây" ref={mapWrapRef}>
            <div className="ksg2-map" style={{ minHeight: `${mapHeight}px` }}>
              {hasHiddenAbove ? (
                <div className="ksg2-fog-cap" aria-hidden="true">
                  <span>Mây phủ phía trên, tiếp tục học để khám phá</span>
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
                  <span className="ksg2-ground-anchor">{`Đã vượt ${visibleWindowStart} tầng`}</span>
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
                      src="/images/cloud-garden/ground/course_sapling_level0.png"
                      alt=""
                      width={108}
                      height={128}
                      className="ksg2-sapling"
                    />
                    <span className="ksg2-firefly is-a" />
                    <span className="ksg2-firefly is-b" />
                    <span className="ksg2-firefly is-c" />
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
                      <span className="ksg2-tier-label">{`Tầng mây ${tierNo}`}</span>
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
                          videoSource={node.videoSource}
                          bunnyVideoId={node.bunnyVideoId}
                          videoStatus={node.videoStatus}
                          onLessonComplete={handleLessonComplete}
                          beforeStart={guardBeforeStart}
                        />
                      ) : (
                        <div className="ksg2-node-meta">
                          <h3>{node.title}</h3>
                          <p>{`${node.estimatedMinutes} phút • ${node.objective}`}</p>
                          {node.state === "completed" ? (
                            <span className="ksg2-node-chip">Đã hoàn thành</span>
                          ) : (
                            <button
                              type="button"
                              className="ksg2-node-lock"
                              onClick={() =>
                                setStatusMessage(
                                  "Hoàn thành tầng hiện tại để mở khóa tầng mới nhé!",
                                )
                              }
                            >
                              Chưa mở tầng này
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
