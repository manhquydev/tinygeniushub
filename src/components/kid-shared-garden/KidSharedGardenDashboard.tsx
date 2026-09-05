"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useKidNavigationFeedback } from "@/components/kid-navigation-feedback";
import type { EntitledCourseForChild } from "@/modules/courses/entitled-course-lists";
import "./kid-shared-garden.css";

interface KidSharedGardenDashboardProps {
  childrenProfiles: Array<{
    id: string;
    nickname: string;
  }>;
  activeChildId: string;
  enrolledCourses: EntitledCourseForChild[];
}

type TapFxState = {
  id: number;
  x: number;
  y: number;
};

type PlotKind = "locked" | "completed" | "active" | "paused" | "seeded";

function getProgressPercent(journey: EntitledCourseForChild["journey"], totalLessons: number) {
  if (!journey || totalLessons <= 0) return 0;
  return Math.min(100, Math.round((journey.completedLessons / totalLessons) * 100));
}

function readPlotVisual(journey: EntitledCourseForChild["journey"]) {
  if (!journey) {
    return {
      kind: "locked" as const,
      plotSrc: "/images/cloud-garden/ground/course_plot_locked.png",
      tone: "locked" as const,
    };
  }

  switch (journey.status) {
    case "COMPLETED":
      return {
        kind: "completed" as const,
        plotSrc: "/images/cloud-garden/ground/course_plot_completed.png",
        tone: "completed" as const,
      };
    case "ACTIVE":
      return {
        kind: "active" as const,
        plotSrc: "/images/cloud-garden/ground/course_plot_active.png",
        tone: "active" as const,
      };
    case "PAUSED":
      return {
        kind: "paused" as const,
        plotSrc: "/images/cloud-garden/ground/course_plot_active.png",
        tone: "active" as const,
      };
    case "SEEDED":
    default:
      return {
        kind: "seeded" as const,
        plotSrc: "/images/cloud-garden/ground/course_plot_active.png",
        tone: "seeded" as const,
      };
  }
}

function readContinueKind(suggestedStatus?: string | null): PlotKind {
  switch (suggestedStatus) {
    case "COMPLETED":
      return "completed";
    case "ACTIVE":
      return "active";
    case "PAUSED":
      return "paused";
    default:
      return "seeded";
  }
}

export function KidSharedGardenDashboard({
  childrenProfiles,
  activeChildId,
  enrolledCourses,
}: KidSharedGardenDashboardProps) {
  const { navigate, isNavigating } = useKidNavigationFeedback();
  const t = useTranslations("kid.gardenHud");
  const [childId, setChildId] = useState(activeChildId);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [tapFx, setTapFx] = useState<TapFxState | null>(null);
  const [activePlotMotionId, setActivePlotMotionId] = useState<string | null>(null);
  const tapFxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plotMotionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChild = childrenProfiles.find((child) => child.id === childId) ?? childrenProfiles[0];
  const avatarLetter = Array.from(activeChild?.nickname.trim() ?? "")[0]?.toUpperCase() ?? "B";

  const summary = useMemo(() => {
    const completedCourses = enrolledCourses.filter((course) => course.journey?.status === "COMPLETED").length;
    const activeCourses = enrolledCourses.filter((course) => course.journey?.status === "ACTIVE").length;

    return {
      totalCourses: enrolledCourses.length,
      completedCourses,
      activeCourses,
    };
  }, [enrolledCourses]);

  const suggestedCourse = useMemo(() => {
    const priority = ["ACTIVE", "PAUSED", "SEEDED", "COMPLETED"] as const;

    for (const status of priority) {
      const match = enrolledCourses.find((course) => course.journey?.status === status);
      if (match) {
        return match;
      }
    }

    return enrolledCourses[0] ?? null;
  }, [enrolledCourses]);

  useEffect(() => {
    if (!isNavigating) {
      setPendingAction(null);
    }
  }, [isNavigating]);

  useEffect(() => {
    return () => {
      if (tapFxTimeoutRef.current) {
        clearTimeout(tapFxTimeoutRef.current);
      }
      if (plotMotionTimeoutRef.current) {
        clearTimeout(plotMotionTimeoutRef.current);
      }
    };
  }, []);

  const startNavigation = useCallback(
    (action: string, href: string) => {
      if (isNavigating) {
        return;
      }
      setPendingAction(action);
      navigate(href);
    },
    [isNavigating, navigate],
  );

  const emitTapFx = useCallback(
    (x: number, y: number) => {
      if (isNavigating) {
        return;
      }

      if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      if (tapFxTimeoutRef.current) {
        clearTimeout(tapFxTimeoutRef.current);
      }

      setTapFx({ id: Date.now(), x, y });
      tapFxTimeoutRef.current = setTimeout(() => {
        setTapFx(null);
      }, 430);
    },
    [isNavigating],
  );

  const triggerPlotMotion = useCallback((courseId: string) => {
    if (plotMotionTimeoutRef.current) {
      clearTimeout(plotMotionTimeoutRef.current);
    }
    setActivePlotMotionId(courseId);
    plotMotionTimeoutRef.current = setTimeout(() => {
      setActivePlotMotionId((current) => (current === courseId ? null : current));
    }, 320);
  }, []);

  const handleChildChange = useCallback(
    (nextChildId: string) => {
      if (isNavigating) {
        return;
      }
      setChildId(nextChildId);
      startNavigation("child-switch", `/kid/garden?childId=${encodeURIComponent(nextChildId)}`);
    },
    [isNavigating, startNavigation],
  );

  const handleOpenCourse = useCallback(
    (courseSlug: string) => {
      startNavigation("open-course", `/kid/courses/${encodeURIComponent(courseSlug)}?childId=${encodeURIComponent(childId)}`);
    },
    [childId, startNavigation],
  );

  const handleContinueLearning = useCallback(() => {
    if (!suggestedCourse) {
      return;
    }
    startNavigation(
      "continue-learning",
      `/kid/courses/${encodeURIComponent(suggestedCourse.course.slug)}?childId=${encodeURIComponent(childId)}`,
    );
  }, [childId, startNavigation, suggestedCourse]);

  const handleGoParentDashboard = useCallback(() => {
    startNavigation("go-parent-dashboard", "/parent/dashboard");
  }, [startNavigation]);

  const continueLabel = t(`sharedGarden.plot.${readContinueKind(suggestedCourse?.journey?.status)}Action`);

  return (
    <div
      className="ksg-scene"
      data-testid="kid-garden-scene"
      aria-label={t("sharedGarden.sceneAria")}
      aria-busy={isNavigating}
    >
      <div className="ksg-ambient" data-testid="kid-garden-ambient" aria-hidden="true">
        <Image
          src="/images/cloud-garden/ambient/ambient_cloud_strip_far.png"
          alt=""
          width={1920}
          height={1080}
          className="ksg-ambient-cloud"
          priority
        />
        <Image
          src="/images/cloud-garden/ambient/ambient_butterfly_soft.png"
          alt=""
          width={280}
          height={280}
          className="ksg-ambient-butterfly ksg-ambient-butterfly-a"
        />
        <Image
          src="/images/cloud-garden/ambient/ambient_butterfly_soft.png"
          alt=""
          width={220}
          height={220}
          className="ksg-ambient-butterfly ksg-ambient-butterfly-b"
        />
        <Image
          src="/images/cloud-garden/ambient/ambient_leaf_float.png"
          alt=""
          width={260}
          height={260}
          className="ksg-ambient-leaf ksg-ambient-leaf-a"
        />
        <Image
          src="/images/cloud-garden/ambient/ambient_leaf_float.png"
          alt=""
          width={220}
          height={220}
          className="ksg-ambient-leaf ksg-ambient-leaf-b"
        />
      </div>

      <header className="ksg-header">
        <button
          type="button"
          className="ksg-parent-link"
          onClick={(event) => {
            emitTapFx(event.clientX, event.clientY);
            handleGoParentDashboard();
          }}
          disabled={isNavigating}
          aria-label={t("sharedGarden.parentAria")}
        >
          <ArrowLeft size={18} />
          {pendingAction === "go-parent-dashboard" ? t("opening") : t("sharedGarden.parents")}
        </button>

        <label className="ksg-child-switch">
          <span className="ksg-child-avatar" aria-hidden="true">
            {avatarLetter}
          </span>
          <span className="ksg-child-name">{activeChild?.nickname ?? t("sharedGarden.childFallback")}</span>
          {childrenProfiles.length > 1 ? (
            <select
              className="ksg-child-select"
              value={childId}
              onChange={(event) => handleChildChange(event.target.value)}
              aria-label={t("sharedGarden.chooseChildAria")}
              disabled={isNavigating}
            >
              {childrenProfiles.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.nickname}
                </option>
              ))}
            </select>
          ) : null}
        </label>

        <button
          type="button"
          className="ksg-continue-button"
          onClick={(event) => {
            emitTapFx(event.clientX, event.clientY);
            handleContinueLearning();
          }}
          disabled={!suggestedCourse || isNavigating}
          aria-label={t("sharedGarden.continueAria")}
        >
          <Sparkles size={16} />
          {pendingAction === "continue-learning" ? t("opening") : continueLabel}
        </button>
      </header>

      <main className="ksg-main">
        <section className="ksg-hero">
          <Image
            src="/kisu-assets/stickers/sticker_hint.png"
            alt={t("sharedGarden.heroKisuAlt")}
            width={128}
            height={128}
            className="ksg-hero-kisu"
          />
          <div className="ksg-hero-content">
            <h1>{t("sharedGarden.heading")}</h1>
            <p>{t("sharedGarden.subtitle")}</p>
          </div>
        </section>

        <section className="ksg-kpi-strip" aria-label={t("sharedGarden.kpiAria")}>
          <article className="ksg-kpi-chip">
            <strong>{summary.totalCourses}</strong>
            <span>{t("sharedGarden.kpiPurchased")}</span>
          </article>
          <article className="ksg-kpi-chip">
            <strong>{summary.activeCourses}</strong>
            <span>{t("sharedGarden.kpiStudying")}</span>
          </article>
          <article className="ksg-kpi-chip">
            <strong>{summary.completedCourses}</strong>
            <span>{t("sharedGarden.kpiCompleted")}</span>
          </article>
        </section>

        {enrolledCourses.length === 0 ? (
          <section className="ksg-empty">
            <Image
              src="/images/nodes/kisu_companion_balloon.png"
              alt={t("sharedGarden.emptyKisuAlt")}
              width={180}
              height={180}
              className="ksg-empty-kisu"
            />
            <h2>{t("sharedGarden.emptyHeading")}</h2>
            <p>{t("sharedGarden.emptyBody")}</p>
            <button
              type="button"
              onClick={(event) => {
                emitTapFx(event.clientX, event.clientY);
                startNavigation("go-parent-courses", "/parent/courses");
              }}
              disabled={isNavigating}
            >
              {pendingAction === "go-parent-courses" ? t("opening") : t("sharedGarden.openCourseList")}
            </button>
          </section>
        ) : (
          <section className="ksg-garden-grid" data-testid="kid-garden-grid">
            {enrolledCourses.map(({ course, journey }) => {
              const progress = getProgressPercent(journey, course.totalLessons);
              const completedLessons = journey?.completedLessons ?? 0;
              const plotVisual = readPlotVisual(journey);
              const isCompleted = plotVisual.tone === "completed";
              const hasActiveSparkle = journey?.status === "ACTIVE";
              const hasCompletedSparkle = journey?.status === "COMPLETED";

              return (
                <article
                  key={course.id}
                  data-testid={`kid-garden-plot-${course.slug}`}
                  className={`ksg-plot-card ${isCompleted ? "is-completed" : ""} ${
                    activePlotMotionId === course.id ? "is-tapping" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onPointerDown={() => {
                    triggerPlotMotion(course.id);
                  }}
                  onClick={(event) => {
                    emitTapFx(event.clientX, event.clientY);
                    handleOpenCourse(course.slug);
                  }}
                  aria-disabled={isNavigating}
                  aria-label={t("sharedGarden.openCourseAria", { title: course.title })}
                  onKeyDown={(event) => {
                    if (isNavigating) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleOpenCourse(course.slug);
                    }
                  }}
                >
                  <div className="ksg-plot-stage">
                    <Image
                      src={plotVisual.plotSrc}
                      alt=""
                      width={320}
                      height={240}
                      className="ksg-plot-image"
                    />

                    {hasActiveSparkle ? (
                      <Image
                        src="/images/cloud-garden/vfx/vfx_tap_star_pop.png"
                        alt=""
                        width={128}
                        height={128}
                        className="ksg-state-sparkle ksg-state-sparkle-active"
                      />
                    ) : null}
                    {hasCompletedSparkle ? (
                      <Image
                        src="/images/cloud-garden/vfx/vfx_tier_unlocked_badge.png"
                        alt=""
                        width={136}
                        height={136}
                        className="ksg-state-sparkle ksg-state-sparkle-completed"
                      />
                    ) : null}

                    {course.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.coverImageUrl} alt="" className="ksg-course-cover" />
                    ) : null}
                  </div>

                  <div className="ksg-plot-meta">
                    <h2>{course.title}</h2>
                    <p className="ksg-plot-status">{t(`sharedGarden.plot.${plotVisual.kind}Status`)}</p>

                    <div className="ksg-progress-row">
                      <span>{t("sharedGarden.lessonsCount", { completed: completedLessons, total: course.totalLessons })}</span>
                      <span>{`${progress}%`}</span>
                    </div>
                    <div className="ksg-progress-track">
                      <div className="ksg-progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <button
                      type="button"
                      data-testid={`kid-garden-plot-cta-${course.slug}`}
                      className="ksg-open-course-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        emitTapFx(event.clientX, event.clientY);
                        handleOpenCourse(course.slug);
                      }}
                      disabled={isNavigating}
                    >
                      {pendingAction === "open-course" ? t("opening") : t(`sharedGarden.plot.${plotVisual.kind}Action`)}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {tapFx ? (
        <div
          key={tapFx.id}
          className="ksg-tap-fx"
          style={{ left: `${tapFx.x}px`, top: `${tapFx.y}px` }}
          aria-hidden="true"
        >
          <Image
            src="/images/cloud-garden/vfx/vfx_tap_ring_soft.png"
            alt=""
            width={180}
            height={180}
            className="ksg-tap-fx-ring"
          />
          <Image
            src="/images/cloud-garden/vfx/vfx_tap_star_pop.png"
            alt=""
            width={130}
            height={130}
            className="ksg-tap-fx-star"
          />
        </div>
      ) : null}
    </div>
  );
}
