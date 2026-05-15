"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Lock, Sparkles, Sprout, Trees } from "lucide-react";
import { GroundGardenCanvas } from "@/components/kid-courses/three/GroundGardenCanvas";
import { useKidNavigationFeedback } from "@/components/kid-navigation-feedback";
import type { EnrolledCourseForKidDashboard } from "@/modules/courses/course-service";
import "./kid-courses.css";

interface KidCourseDashboardProps {
  childrenProfiles: Array<{
    id: string;
    nickname: string;
    avatarId: string | null;
  }>;
  activeChildId: string;
  enrolledCourses: EnrolledCourseForKidDashboard[];
}

function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "ACTIVE":
      return "Continue studying";
    case "COMPLETED":
      return "Review";
    case "SEEDED":
      return "Get started now";
    case "PAUSED":
      return "Continue";
    default:
      return "Go to school";
  }
}

function getPhaseLabel(status: string | null | undefined): string {
  switch (status) {
    case "ACTIVE":
      return "Stage 3: Climb the tree trunk";
    case "COMPLETED":
      return "Stage 4: Touching the clouds";
    case "SEEDED":
      return "Stage 2: Seeds explode";
    case "PAUSED":
      return "Pause your journey";
    default:
      return "Stage 1: Incubation";
  }
}

function getStatusEmoji(status: string | null | undefined): string {
  switch (status) {
    case "COMPLETED":
      return "🌸";
    case "ACTIVE":
      return "🌿";
    case "SEEDED":
      return "🌱";
    default:
      return "🌰";
  }
}

function getProgressPercent(journey: EnrolledCourseForKidDashboard["journey"], totalLessons: number): number {
  if (!journey || totalLessons <= 0) {
    return 0;
  }
  return Math.round((journey.completedLessons / totalLessons) * 100);
}

export function KidCoursesDashboard({
  childrenProfiles,
  activeChildId,
  enrolledCourses,
}: KidCourseDashboardProps) {
  const { navigate, isNavigating } = useKidNavigationFeedback();
  const [childId, setChildId] = useState(activeChildId);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const firstCourseSlug = useMemo(() => enrolledCourses[0]?.course.slug ?? null, [enrolledCourses]);

  const activeChild = childrenProfiles.find((child) => child.id === childId) ?? childrenProfiles[0];
  const avatarLabel = activeChild
    ? (Array.from(activeChild.nickname.trim())[0]?.toUpperCase() ?? "B")
    : "B";

  useEffect(() => {
    if (!isNavigating) {
      setPendingAction(null);
    }
  }, [isNavigating]);

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

  const handleChildChange = useCallback(
    (newChildId: string) => {
      if (isNavigating) {
        return;
      }
      setChildId(newChildId);
      startNavigation("child-switch", `/kid/courses?childId=${encodeURIComponent(newChildId)}`);
    },
    [isNavigating, startNavigation],
  );

  const handleCourseClick = useCallback(
    (courseSlug: string, focusTierNo?: number) => {
      if (isNavigating) {
        return;
      }
      const params = new URLSearchParams();
      params.set("childId", childId);
      if (typeof focusTierNo === "number" && Number.isFinite(focusTierNo) && focusTierNo > 0) {
        params.set("focusTierNo", String(Math.floor(focusTierNo)));
      }
      startNavigation("open-course", `/kid/courses/${encodeURIComponent(courseSlug)}?${params.toString()}`);
    },
    [childId, isNavigating, startNavigation],
  );

  const handleGoSharedGarden = useCallback(() => {
    startNavigation("go-shared-garden", `/kid/garden?childId=${encodeURIComponent(childId)}`);
  }, [childId, startNavigation]);

  const handleGoCourseGarden = useCallback(() => {
    if (!firstCourseSlug || isNavigating) {
      return;
    }
    startNavigation(
      "go-course-garden",
      `/kid/courses/${encodeURIComponent(firstCourseSlug)}?childId=${encodeURIComponent(childId)}`,
    );
  }, [childId, firstCourseSlug, isNavigating, startNavigation]);

  return (
    <div className="kcd-scene" aria-label="Baby's learning page" aria-busy={isNavigating}>
      <GroundGardenCanvas className="kcd-three-layer" />

      <span className="kcd-cloud kcd-cloud-a" aria-hidden="true" />
      <span className="kcd-cloud kcd-cloud-b" aria-hidden="true" />
      <span className="kcd-cloud kcd-cloud-c" aria-hidden="true" />
      <span className="kcd-cloud kcd-cloud-d" aria-hidden="true" />

      <div className="kcd-particles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={`particle-${index + 1}`} className="kcd-particle" />
        ))}
      </div>

      <header className="kcd-hud">
        <div className="kcd-hud-row">
          <button
            type="button"
            className="kcd-btn-back"
            onClick={() => startNavigation("go-parent-dashboard", "/parent/dashboard")}
            disabled={isNavigating}
            aria-label="Return to the dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <label className="kcd-child-select-label">
            <span className="kcd-child-avatar" aria-hidden="true">
              {avatarLabel}
            </span>
            <span className="kcd-child-name">{activeChild?.nickname ?? "Little"}</span>
            {childrenProfiles.length > 1 ? (
              <select
                value={childId}
                onChange={(event) => handleChildChange(event.target.value)}
                className="kcd-child-select"
                aria-label="Select baby profile"
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
            className="kcd-garden-link"
            onClick={handleGoSharedGarden}
            disabled={isNavigating}
            aria-label="Open a communal garden"
          >
            <Trees size={16} />
            {pendingAction === "go-shared-garden" ? "Open..." : "Communal garden"}
          </button>
        </div>

        <div className="kcd-hud-title-row">
          <h1 className="kcd-title">
            <Sparkles size={22} />
            Baby's Learning Page
          </h1>
          <p className="kcd-subtitle">
            Children follow purchased learning paths: choose a seedling to start exploring.
          </p>
          <p className="kcd-flow-note">
            Standard flow: <strong>1) Study page</strong> → <strong>2) Communal garden</strong> →{" "}
            <strong>3) Garden detailed course</strong>.
          </p>
        </div>

        <div className="kcd-flow-nav" role="navigation" aria-label="Navigate baby functions">
          <button type="button" className="kcd-flow-chip is-active" aria-current="page">
            Learning page
          </button>
          <button type="button" className="kcd-flow-chip" onClick={handleGoSharedGarden} disabled={isNavigating}>
            {pendingAction === "go-shared-garden" ? "Open..." : "Communal garden"}
          </button>
          <button
            type="button"
            className="kcd-flow-chip"
            onClick={handleGoCourseGarden}
            disabled={!firstCourseSlug || isNavigating}
          >
            {pendingAction === "go-course-garden" ? "Open..." : "Garden course"}
          </button>
        </div>

        <div className="kcd-stage-strip" aria-label="Learning stages">
          <span>1. Incubate the course</span>
          <span>2. Magic click</span>
          <span>3. Climb the bean stalk</span>
          <span>4. Break through the clouds</span>
        </div>
      </header>

      <main className="kcd-main">
        {enrolledCourses.length === 0 ? (
          <div className="kcd-empty">
            <span className="kcd-empty-emoji" aria-hidden="true">
              🌱
            </span>
            <h2 className="kcd-empty-title">There are no courses yet</h2>
            <p className="kcd-empty-desc">
              Parents, please buy a course for your child to start their journey in the rattan garden.
            </p>
            <button
              type="button"
              className="kcd-empty-button"
              onClick={() => startNavigation("go-parent-courses", "/parent/courses")}
              disabled={isNavigating}
            >
              {pendingAction === "go-parent-courses" ? "Open..." : "View Premium courses"}
            </button>
          </div>
        ) : (
          <div className="kcd-grid">
            {enrolledCourses.map(({ course, journey }) => {
              const percent = getProgressPercent(journey, course.totalLessons);
              const statusLabel = getStatusLabel(journey?.status);
              const phaseLabel = getPhaseLabel(journey?.status);
              const isCompleted = journey?.status === "COMPLETED";
              const completedLessons = Math.max(0, journey?.completedLessons ?? 0);
              const focusTierNo = Math.max(
                1,
                Math.min(course.totalLessons, completedLessons + 1),
              );

              return (
                <article
                  key={course.id}
                  className={`kcd-card ${isCompleted ? "kcd-card-completed" : ""}`}
                  onClick={() => handleCourseClick(course.slug, focusTierNo)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Enter the lock${course.title}`}
                  aria-disabled={isNavigating}
                  onKeyDown={(event) => {
                    if (isNavigating) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCourseClick(course.slug, focusTierNo);
                    }
                  }}
                >
                  <span className="kcd-card-glow" aria-hidden="true" />

                  <div className="kcd-card-cover">
                    {course.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.coverImageUrl}
                        alt={course.title}
                        className="kcd-card-cover-image"
                      />
                    ) : (
                      <div className="kcd-card-cover-default" aria-hidden="true">
                        <span className="kcd-card-cover-emoji">{getStatusEmoji(journey?.status)}</span>
                      </div>
                    )}

                    <span className={`kcd-badge ${isCompleted ? "kcd-badge-done" : "kcd-badge-active"}`}>
                      {isCompleted ? (
                        <>
                          <CheckCircle2 size={12} />
                          Complete
                        </>
                      ) : journey ? (
                        <>
                          <Sprout size={12} />
                          Studying
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          Haven't started yet
                        </>
                      )}
                    </span>
                  </div>

                  <div className="kcd-card-body">
                    <h2 className="kcd-card-title">{course.title}</h2>
                    <p className="kcd-card-desc">{course.description || "The course is ready for children."}</p>

                    {course.bundleCourseCount ? (
                      <p className="kcd-phase-label">{`Complete set${course.bundleCourseCount}level`}</p>
                    ) : null}

                    <p className="kcd-phase-label">{phaseLabel}</p>

                    <div className="kcd-progress-wrap">
                      <div className="kcd-progress-info">
                        <span className="kcd-progress-label">
                          <BookOpen size={12} />
                          {journey?.completedLessons ?? 0}/{course.totalLessons} lessons
                        </span>
                        <span className="kcd-progress-percent">{percent}%</span>
                      </div>
                      <div className="kcd-progress-track">
                        <div
                          className="kcd-progress-fill"
                          style={{ width: `${percent}%` }}
                          role="progressbar"
                          aria-valuenow={percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${percent}% complete`}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`kcd-cta ${isCompleted ? "kcd-cta-done" : "kcd-cta-primary"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCourseClick(course.slug, focusTierNo);
                      }}
                      disabled={isNavigating}
                      aria-label={`${statusLabel}lock${course.title}`}
                    >
                      {pendingAction === "open-course" ? "Open..." : statusLabel}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
