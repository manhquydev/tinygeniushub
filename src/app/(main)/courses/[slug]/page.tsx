import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";

type Lesson = { id: string; title: string; objective: string; estimatedMinutes: number };
type CourseLesson = { orderNo: number; lesson: Lesson };
type Course = {
  id: string; slug: string; title: string; description: string;
  priceVnd: number; durationDays: number; coverImageUrl: string | null; isPublished: boolean;
};
type CourseWithLessons = Course & { lessons: CourseLesson[] };
type Enrollment = { id: string; enrolledAt: string; completedAt: string | null; certificateUrl: string | null };

type ApiResponse = {
  ok: boolean;
  data: { course: CourseWithLessons; enrollment: Enrollment | null };
};

async function fetchCourse(slug: string): Promise<ApiResponse["data"] | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/courses/${slug}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse;
    return json.ok ? json.data : null;
  } catch {
    return null;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchCourse(slug);
  if (!data) return { title: "Khóa học không tồn tại" };
  return {
    title: `${data.course.title} — Cùng Con Tự Học`,
    description: data.course.description,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchCourse(slug);
  if (!data) notFound();

  const { course, enrollment } = data;
  const sortedLessons = [...course.lessons].sort((a, b) => a.orderNo - b.orderNo);

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="card">
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>{course.title}</h1>
        <p style={{ lineHeight: 1.6 }}>{course.description}</p>
        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--brand-700)" }}>
            {course.priceVnd.toLocaleString("vi-VN")}đ
          </span>
          <span className="muted-text">{course.durationDays} ngày học</span>
          <span className="muted-text">{sortedLessons.length} bài học</span>
        </div>

        {enrollment ? (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p style={{ color: "var(--brand-700)", fontWeight: 700 }}>Đã đăng ký ✓</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href={`/courses/${course.slug}/lessons`} className="solid-button">
                Vào học ngay
              </Link>
              {enrollment.certificateUrl && (
                <a href={enrollment.certificateUrl} className="ghost-button" download>
                  Tải chứng chỉ
                </a>
              )}
            </div>
          </div>
        ) : (
          <CourseCheckoutButton
            courseSlug={course.slug}
            label="Mua khóa học"
            priceVnd={course.priceVnd}
          />
        )}
      </section>

      {/* Curriculum */}
      {sortedLessons.length > 0 && (
        <section className="card">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Nội dung khóa học</h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {sortedLessons.map(({ orderNo, lesson }) => (
              <details
                key={lesson.id}
                style={{
                  border: "1px solid rgba(15,23,42,0.1)",
                  borderRadius: 12,
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    listStyle: "none",
                  }}
                >
                  <span>
                    <span className="muted-text" style={{ marginRight: "0.5rem" }}>
                      {orderNo}.
                    </span>
                    {lesson.title}
                  </span>
                  <span className="muted-text" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                    {lesson.estimatedMinutes} phút
                  </span>
                </summary>
                {lesson.objective && (
                  <p className="muted-text" style={{ marginTop: "0.5rem", fontSize: "0.88rem", lineHeight: 1.5 }}>
                    {lesson.objective}
                  </p>
                )}
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
