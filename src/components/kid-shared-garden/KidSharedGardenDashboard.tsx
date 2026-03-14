"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, CloudSun, Flower2, Sparkles, Sprout } from "lucide-react";
import type { EnrolledCourseForKidDashboard } from "@/modules/courses/course-service";
import "./kid-shared-garden.css";

interface KidSharedGardenDashboardProps {
  childrenProfiles: Array<{
    id: string;
    nickname: string;
  }>;
  activeChildId: string;
  enrolledCourses: EnrolledCourseForKidDashboard[];
}

function readJourneyLabel(journey: EnrolledCourseForKidDashboard["journey"]) {
  if (!journey) return "Ươm mầm";
  switch (journey.status) {
    case "COMPLETED":
      return "Hoa nở";
    case "ACTIVE":
      return "Leo thân cây";
    case "PAUSED":
      return "Tạm nghỉ";
    case "SEEDED":
    default:
      return "Mầm non";
  }
}

function readCourseStatusLabel(journey: EnrolledCourseForKidDashboard["journey"]) {
  if (!journey) return "Chưa gieo hạt";
  switch (journey.status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "ACTIVE":
      return "Đang học";
    case "PAUSED":
      return "Tiếp tục";
    case "SEEDED":
    default:
      return "Sẵn sàng";
  }
}

function getProgressPercent(journey: EnrolledCourseForKidDashboard["journey"], totalLessons: number) {
  if (!journey || totalLessons <= 0) return 0;
  return Math.min(100, Math.round((journey.completedLessons / totalLessons) * 100));
}

function readCardEmoji(journey: EnrolledCourseForKidDashboard["journey"]) {
  if (!journey) return "🌰";
  if (journey.status === "COMPLETED") return "🌸";
  if (journey.status === "ACTIVE") return "🌿";
  return "🌱";
}

export function KidSharedGardenDashboard({
  childrenProfiles,
  activeChildId,
  enrolledCourses,
}: KidSharedGardenDashboardProps) {
  const router = useRouter();
  const [childId, setChildId] = useState(activeChildId);
  const firstCourseSlug = useMemo(() => enrolledCourses[0]?.course.slug ?? null, [enrolledCourses]);

  const activeChild = childrenProfiles.find((child) => child.id === childId) ?? childrenProfiles[0];
  const avatarLetter = activeChild?.nickname.trim().charAt(0).toUpperCase() || "B";

  const summary = useMemo(() => {
    const completedCourses = enrolledCourses.filter((course) => course.journey?.status === "COMPLETED").length;
    const activeCourses = enrolledCourses.filter((course) => course.journey?.status === "ACTIVE").length;

    return {
      totalCourses: enrolledCourses.length,
      completedCourses,
      activeCourses,
    };
  }, [enrolledCourses]);

  const handleChildChange = useCallback(
    (nextChildId: string) => {
      setChildId(nextChildId);
      router.push(`/kid/garden?childId=${encodeURIComponent(nextChildId)}`);
    },
    [router],
  );

  const handleOpenCourse = useCallback(
    (courseSlug: string) => {
      router.push(`/kid/courses/${encodeURIComponent(courseSlug)}?childId=${encodeURIComponent(childId)}`);
    },
    [childId, router],
  );

  const handleGoLearningHub = useCallback(() => {
    router.push(`/kid/courses?childId=${encodeURIComponent(childId)}`);
  }, [childId, router]);

  const handleGoCourseGarden = useCallback(() => {
    if (!firstCourseSlug) return;
    router.push(`/kid/courses/${encodeURIComponent(firstCourseSlug)}?childId=${encodeURIComponent(childId)}`);
  }, [childId, firstCourseSlug, router]);

  return (
    <div className="ksg-scene" aria-label="Khu vườn chung cho bé">
      <span className="ksg-cloud ksg-cloud-a" aria-hidden="true" />
      <span className="ksg-cloud ksg-cloud-b" aria-hidden="true" />
      <span className="ksg-cloud ksg-cloud-c" aria-hidden="true" />

      <div className="ksg-fireflies" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={`firefly-${index + 1}`} className="ksg-firefly" />
        ))}
      </div>

      <header className="ksg-header">
        <div className="ksg-header-row">
          <button
            type="button"
            className="ksg-icon-button"
            onClick={handleGoLearningHub}
            aria-label="Quay về trang học tập"
          >
            <ArrowLeft size={18} />
          </button>

          <label className="ksg-child-switch">
            <span className="ksg-child-avatar" aria-hidden="true">
              {avatarLetter}
            </span>
            <span className="ksg-child-name">{activeChild?.nickname ?? "Bé"}</span>
            {childrenProfiles.length > 1 ? (
              <select
                className="ksg-child-select"
                value={childId}
                onChange={(event) => handleChildChange(event.target.value)}
                aria-label="Chọn bé"
              >
                {childrenProfiles.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.nickname}
                  </option>
                ))}
              </select>
            ) : null}
          </label>

          <button type="button" className="ksg-learning-button" onClick={handleGoLearningHub}>
            <BookOpen size={16} />
            Trang học tập
          </button>
        </div>

        <div className="ksg-title-wrap">
          <h1 className="ksg-title">
            <CloudSun size={26} />
            Khu Vườn Chung
          </h1>
          <p className="ksg-subtitle">
            Trạm tổng quan tiến độ. Từ đây bé có thể vào từng khóa đã mua để học tiếp.
          </p>
          <p className="ksg-flow-note">
            Luồng chuẩn: <strong>1) Trang học tập</strong> → <strong>2) Khu vườn chung</strong> →{" "}
            <strong>3) Vườn khóa học chi tiết</strong>.
          </p>
        </div>

        <div className="ksg-flow-nav" role="navigation" aria-label="Điều hướng chức năng bé">
          <button type="button" className="ksg-flow-chip" onClick={handleGoLearningHub}>
            Trang học tập
          </button>
          <button type="button" className="ksg-flow-chip is-active" aria-current="page">
            Khu vườn chung
          </button>
          <button
            type="button"
            className="ksg-flow-chip"
            onClick={handleGoCourseGarden}
            disabled={!firstCourseSlug}
          >
            Vườn khóa học
          </button>
        </div>

        <div className="ksg-stage-strip" aria-label="Các giai đoạn hành trình">
          <span>1. Ươm mầm</span>
          <span>2. Bùng nổ hạt giống</span>
          <span>3. Leo thân cây</span>
          <span>4. Chạm tầng mây</span>
        </div>
      </header>

      <main className="ksg-main">
        <section className="ksg-summary" aria-label="Tổng quan khu vườn">
          <article>
            <strong>{summary.totalCourses}</strong>
            <span>Khóa đã mua</span>
          </article>
          <article>
            <strong>{summary.activeCourses}</strong>
            <span>Đang học</span>
          </article>
          <article>
            <strong>{summary.completedCourses}</strong>
            <span>Đã hoàn thành</span>
          </article>
        </section>

        {enrolledCourses.length === 0 ? (
          <section className="ksg-empty">
            <span className="ksg-empty-icon" aria-hidden="true">
              🌱
            </span>
            <h2>Chưa có hạt giống nào</h2>
            <p>Hãy mở thêm khóa học đã mua để khu vườn chung của bé bắt đầu phát triển.</p>
            <Image
              src="/images/nodes/kisu_companion_balloon.png"
              alt="Kisu đồng hành"
              width={180}
              height={180}
              className="ksg-empty-kisu"
            />
            <button type="button" onClick={() => router.push("/parent/courses")}>
              Mở danh sách khóa học
            </button>
          </section>
        ) : (
          <section className="ksg-grid">
            {enrolledCourses.map(({ course, journey }) => {
              const progress = getProgressPercent(journey, course.totalLessons);
              const phaseLabel = readJourneyLabel(journey);
              const statusLabel = readCourseStatusLabel(journey);
              const isCompleted = journey?.status === "COMPLETED";

              return (
                <article
                  key={course.id}
                  className={`ksg-card ${isCompleted ? "ksg-card-completed" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenCourse(course.slug)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleOpenCourse(course.slug);
                    }
                  }}
                  aria-label={`Mở khóa học ${course.title}`}
                >
                  <div className="ksg-card-head">
                    <span className="ksg-seed-mark" aria-hidden="true">
                      {readCardEmoji(journey)}
                    </span>
                    <span className={`ksg-status-chip ${isCompleted ? "is-completed" : ""}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <h2>{course.title}</h2>
                  <p>{course.description || "Khóa học đã sẵn sàng trong khu vườn của bé."}</p>

                  <div className="ksg-progress">
                    <div className="ksg-progress-row">
                      <span>{phaseLabel}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="ksg-progress-track">
                      <div className="ksg-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="ksg-progress-meta">
                      <span>
                        <Sprout size={12} />
                        {journey?.completedLessons ?? 0}/{course.totalLessons} bài
                      </span>
                      <span>
                        {isCompleted ? <CheckCircle2 size={12} /> : <Flower2 size={12} />}
                        {isCompleted ? "Đã nở hoa" : "Đang lớn"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ksg-card-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenCourse(course.slug);
                    }}
                  >
                    <Sparkles size={14} />
                    {isCompleted ? "Xem lại khóa học" : "Tiếp tục học"}
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
