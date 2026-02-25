import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";

type Props = { params: Promise<{ slug: string }> };

async function loadCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug, isPublished: true },
    include: {
      lessons: {
        orderBy: { orderNo: "asc" },
        include: {
          lesson: {
            select: { id: true, title: true, estimatedMinutes: true },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await loadCourse(slug);
  if (!course) return { title: "Khóa học không tồn tại" };
  return {
    title: `${course.title} — Cùng Con Tự Học`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const [course, parent] = await Promise.all([loadCourse(slug), getParentFromServerCookie()]);
  if (!course) notFound();

  let enrollment = null;
  let hasActiveSub = false;

  if (parent) {
    const [enr, sub] = await Promise.all([
      prisma.courseEnrollment.findUnique({ where: { courseId_parentId: { courseId: course.id, parentId: parent.id } } }),
      prisma.subscription.findUnique({ where: { parentId: parent.id }, select: { status: true } }),
    ]);
    enrollment = enr;
    hasActiveSub = sub?.status === "ACTIVE_STANDARD" || sub?.status === "ACTIVE_FAMILYPLUS";
  }

  const discountedPrice = hasActiveSub ? Math.round(course.priceVnd * 0.8) : null;

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="card">
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>{course.title}</h1>
        <p style={{ lineHeight: 1.6 }}>{course.description}</p>
        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "center" }}>
          {discountedPrice ? (
            <>
              <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--brand-700)" }}>
                {discountedPrice.toLocaleString("vi-VN")}đ
              </span>
              <span style={{ textDecoration: "line-through", color: "var(--muted)" }}>
                {course.priceVnd.toLocaleString("vi-VN")}đ
              </span>
              <span
                style={{
                  background: "var(--accent-amber-light, #fef3c7)",
                  color: "var(--accent-amber-dark, #92400e)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderRadius: 6,
                  padding: "2px 8px",
                }}
              >
                Giảm 20% cho thành viên
              </span>
            </>
          ) : (
            <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--brand-700)" }}>
              {course.priceVnd.toLocaleString("vi-VN")}đ
            </span>
          )}
          <span className="muted-text">{course.durationDays} ngày học</span>
          <span className="muted-text">{course.lessons.length} bài học</span>
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
            priceVnd={discountedPrice ?? course.priceVnd}
          />
        )}
      </section>

      {/* Curriculum */}
      {course.lessons.length > 0 && (
        <section className="card">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Nội dung khóa học</h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {course.lessons.map(({ orderNo, lesson }) => (
              <div
                key={lesson.id}
                style={{
                  border: "1px solid rgba(15,23,42,0.1)",
                  borderRadius: 12,
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.6)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span>
                  <span className="muted-text" style={{ marginRight: "0.5rem" }}>{orderNo}.</span>
                  <span style={{ fontWeight: 600 }}>{lesson.title}</span>
                </span>
                <span className="muted-text" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                  {lesson.estimatedMinutes} phút
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
