"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Lock, CheckCircle, Sprout } from "lucide-react";
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

function getJourneyStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "ACTIVE":
      return "Tiếp tục học";
    case "COMPLETED":
      return "Hoàn thành";
    case "SEEDED":
      return "Bắt đầu thôi!";
    case "PAUSED":
      return "Tiếp tục";
    default:
      return "Vào học";
  }
}

function getJourneyEmoji(status: string | null | undefined): string {
  switch (status) {
    case "COMPLETED":
      return "🏆";
    case "ACTIVE":
      return "🌱";
    case "SEEDED":
      return "🌰";
    default:
      return "☁️";
  }
}

function getProgressPercent(journey: EnrolledCourseForKidDashboard["journey"], totalLessons: number): number {
  if (!journey) return 0;
  if (totalLessons === 0) return 0;
  return Math.round((journey.completedLessons / totalLessons) * 100);
}

export function KidCoursesDashboard({
  childrenProfiles,
  activeChildId,
  enrolledCourses,
}: KidCourseDashboardProps) {
  const router = useRouter();
  const [childId, setChildId] = useState(activeChildId);

  const activeChild = childrenProfiles.find((child) => child.id === childId) ?? childrenProfiles[0];
  const avatarLabel = activeChild
    ? (Array.from(activeChild.nickname.trim())[0]?.toUpperCase() ?? "B")
    : "B";

  const handleChildChange = useCallback(
    (newChildId: string) => {
      setChildId(newChildId);
      router.push(`/kid/courses?childId=${encodeURIComponent(newChildId)}`);
    },
    [router],
  );

  const handleCourseClick = useCallback(
    (courseSlug: string) => {
      router.push(`/kid/courses/${encodeURIComponent(courseSlug)}?childId=${encodeURIComponent(childId)}`);
    },
    [childId, router],
  );

  return (
    <div className="kcd-scene" aria-label="Khu vườn học tập của bé">
      {/* Sky background layers */}
      <span className="kcd-cloud kcd-cloud-a" aria-hidden="true" />
      <span className="kcd-cloud kcd-cloud-b" aria-hidden="true" />
      <span className="kcd-cloud kcd-cloud-c" aria-hidden="true" />
      <span className="kcd-cloud kcd-cloud-d" aria-hidden="true" />

      {/* Floating particles */}
      <div className="kcd-particles" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={`particle-${index + 1}`} className="kcd-particle" />
        ))}
      </div>

      {/* HUD */}
      <header className="kcd-hud">
        <div className="kcd-hud-row">
          <button
            type="button"
            className="kcd-btn-back"
            onClick={() => router.push("/parent/dashboard")}
            aria-label="Quay lại bảng điều khiển"
          >
            <ArrowLeft size={20} />
          </button>

          <label className="kcd-child-select-label">
            <span className="kcd-child-avatar" aria-hidden="true">
              {avatarLabel}
            </span>
            <span className="kcd-child-name">{activeChild?.nickname ?? "Bé"}</span>
            {childrenProfiles.length > 1 && (
              <select
                value={childId}
                onChange={(event) => handleChildChange(event.target.value)}
                className="kcd-child-select"
                aria-label="Chọn hồ sơ bé"
              >
                {childrenProfiles.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.nickname}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>

        <div className="kcd-hud-title-row">
          <h1 className="kcd-title">
            <span className="kcd-title-emoji" aria-hidden="true">
              🌤️
            </span>
            Những Khu Vườn Của Bé
          </h1>
          <p className="kcd-subtitle">Chọn một khu vườn để bắt đầu hành trình học!</p>
        </div>
      </header>

      {/* Course cards */}
      <main className="kcd-main">
        {enrolledCourses.length === 0 ? (
          <div className="kcd-empty">
            <span className="kcd-empty-emoji" aria-hidden="true">
              🌱
            </span>
            <h2 className="kcd-empty-title">Chưa có khu vườn nào</h2>
            <p className="kcd-empty-desc">
              Ba mẹ hãy vào mục Khóa học Premium để mở khu vườn mới cho bé nhé!
            </p>
          </div>
        ) : (
          <div className="kcd-grid">
            {enrolledCourses.map(({ course, journey }) => {
              const percent = getProgressPercent(journey, course.totalLessons);
              const statusLabel = getJourneyStatusLabel(journey?.status);
              const emoji = getJourneyEmoji(journey?.status);
              const isCompleted = journey?.status === "COMPLETED";

              return (
                <article
                  key={course.id}
                  className={`kcd-card ${isCompleted ? "kcd-card-completed" : ""}`}
                  onClick={() => handleCourseClick(course.slug)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Vào khu vườn ${course.title}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCourseClick(course.slug);
                    }
                  }}
                >
                  {/* Card glow effect */}
                  <span className="kcd-card-glow" aria-hidden="true" />

                  {/* Cover image or default sky */}
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
                        <span className="kcd-card-cover-emoji">{emoji}</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <span
                      className={`kcd-badge ${isCompleted ? "kcd-badge-done" : "kcd-badge-active"}`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle size={12} />
                          Hoàn thành
                        </>
                      ) : journey ? (
                        <>
                          <Sprout size={12} />
                          Đang học
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          Chưa bắt đầu
                        </>
                      )}
                    </span>
                  </div>

                  <div className="kcd-card-body">
                    <h2 className="kcd-card-title">{course.title}</h2>
                    <p className="kcd-card-desc">{course.description}</p>

                    {/* Progress bar */}
                    <div className="kcd-progress-wrap">
                      <div className="kcd-progress-info">
                        <span className="kcd-progress-label">
                          <BookOpen size={12} />
                          {journey?.completedLessons ?? 0}/{course.totalLessons} bài
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
                          aria-label={`${percent}% hoàn thành`}
                        />
                      </div>

                      {/* Stars */}
                      <div className="kcd-stars" aria-hidden="true">
                        {Array.from({ length: Math.min(5, Math.ceil(percent / 20)) }, (_, i) => (
                          <span key={`star-${i + 1}`} className="kcd-star">
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`kcd-cta ${isCompleted ? "kcd-cta-done" : "kcd-cta-primary"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCourseClick(course.slug);
                      }}
                      aria-label={`${statusLabel} khóa ${course.title}`}
                    >
                      {statusLabel}
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
