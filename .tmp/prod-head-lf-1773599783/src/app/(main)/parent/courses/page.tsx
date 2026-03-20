import Link from "next/link";
import { requireParent } from "@/lib/auth/require-parent";
import { getParentEnrollments } from "@/modules/courses/course-service";
import { BookOpen, Award, ChevronRight } from "lucide-react";

export default async function ParentCoursesPage() {
  const parent = await requireParent();
  const enrollments = await getParentEnrollments(parent.id);

  return (
    <div className="page-stack">
      <section className="card">
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>
          <BookOpen size={22} style={{ display: "inline", verticalAlign: "middle", marginRight: 8 }} />
          Khóa học của tôi
        </h1>
        <p className="muted-text">Các khóa học premium bạn đã đăng ký.</p>
      </section>

      {enrollments.length === 0 ? (
        <section className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>Bạn chưa đăng ký khóa học nào.</p>
          <p className="muted-text" style={{ marginBottom: 16 }}>Khám phá các khóa học premium dành cho bé.</p>
          <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
            Xem khóa học
          </Link>
        </section>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const isCompleted = Boolean(enrollment.completedAt);
            return (
              <section
                key={enrollment.id}
                className="card"
                style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}
              >
                {course.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.coverImageUrl}
                    alt={course.title}
                    style={{ width: 120, aspectRatio: "16/9", objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{course.title}</h2>
                    {isCompleted && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0d9488",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 999,
                          padding: "2px 10px",
                        }}
                      >
                        <Award size={12} /> Hoàn thành
                      </span>
                    )}
                  </div>
                  <p className="muted-text" style={{ fontSize: "0.875rem", marginTop: 4, lineHeight: 1.5 }}>
                    {course.description}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 6 }}>
                    Đăng ký: {new Date(enrollment.enrolledAt).toLocaleDateString("vi-VN")}
                    {" · "}
                    {course.durationDays} ngày
                  </p>
                  {enrollment.certificateUrl && (
                    <a
                      href={enrollment.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 8,
                        fontSize: "0.85rem",
                        color: "#0d9488",
                        fontWeight: 600,
                      }}
                    >
                      <Award size={14} /> Tải chứng chỉ
                    </a>
                  )}
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#0d9488",
                    whiteSpace: "nowrap",
                    alignSelf: "center",
                  }}
                >
                  Vào học <ChevronRight size={16} />
                </Link>
              </section>
            );
          })}
        </div>
      )}

      <section className="card" style={{ textAlign: "center" }}>
        <p className="muted-text" style={{ marginBottom: 12 }}>Muốn thêm khóa học?</p>
        <Link href="/courses" className="solid-button" style={{ width: "fit-content" }}>
          Xem tất cả khóa học
        </Link>
      </section>
    </div>
  );
}
