import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import {
  getPublishedCourseBundleDetailBySlug,
  type CourseBundleDetail,
} from "@/modules/courses/course-bundle-service";
import { getCourseBundleByCourseSlug } from "@/modules/courses/course-bundles";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";

type Props = { params: Promise<{ slug: string }> };

async function loadBundleDetailFromAnySlug(slug: string): Promise<{
  detail: CourseBundleDetail;
  canonicalSlug: string;
} | null> {
  const detailByBundleSlug = await getPublishedCourseBundleDetailBySlug(slug);
  if (detailByBundleSlug) {
    return {
      detail: detailByBundleSlug,
      canonicalSlug: slug,
    };
  }

  const bundleByCourseSlug = getCourseBundleByCourseSlug(slug);
  if (!bundleByCourseSlug) {
    return null;
  }

  const detailByMappedBundleSlug = await getPublishedCourseBundleDetailBySlug(bundleByCourseSlug.slug);
  if (!detailByMappedBundleSlug) {
    return null;
  }

  return {
    detail: detailByMappedBundleSlug,
    canonicalSlug: bundleByCourseSlug.slug,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await loadBundleDetailFromAnySlug(slug);

  if (!resolved) {
    return { title: "Khóa học không tồn tại" };
  }

  return {
    title: `${resolved.detail.bundle.title} — Cùng Con Tự Học`,
    description: resolved.detail.bundle.description,
    alternates: {
      canonical: `https://cungcontuhoc.io.vn/courses/${resolved.canonicalSlug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await loadBundleDetailFromAnySlug(slug);

  if (!resolved) {
    notFound();
  }

  if (slug !== resolved.canonicalSlug) {
    redirect(`/courses/${resolved.canonicalSlug}`);
  }

  const { detail } = resolved;
  const parent = await getParentFromServerCookie();

  let isBundleOwned = false;
  let hasActiveSub = false;
  let childEntryHref = `/kid/courses/${encodeURIComponent(detail.bundle.entryCourseSlug)}`;

  if (parent) {
    const [enrollments, subscription, firstChild] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where: {
          parentId: parent.id,
          courseId: {
            in: detail.courses.map((course) => course.id),
          },
        },
        select: {
          id: true,
          courseId: true,
        },
      }),
      prisma.subscription.findUnique({ where: { parentId: parent.id }, select: { status: true } }),
      prisma.childProfile.findFirst({
        where: { parentId: parent.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }),
    ]);

    isBundleOwned = enrollments.length === detail.courses.length;
    hasActiveSub =
      subscription?.status === "ACTIVE_STANDARD" || subscription?.status === "ACTIVE_FAMILYPLUS";

    if (firstChild) {
      childEntryHref = `${childEntryHref}?childId=${encodeURIComponent(firstChild.id)}`;
    }
  }

  const discountedPrice = hasActiveSub ? Math.round(detail.stats.priceVnd * 0.8) : null;

  return (
    <div className="page-stack">
      <section className="card" style={{ display: "grid", gap: "1rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={detail.bundle.coverImageUrl}
          alt={detail.bundle.title}
          style={{ width: "100%", aspectRatio: "16/9", borderRadius: 14, objectFit: "cover" }}
        />

        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>{detail.bundle.title}</h1>
        <p style={{ lineHeight: 1.6 }}>{detail.bundle.description}</p>

        <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "center" }}>
          {discountedPrice ? (
            <>
              <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--brand-700)" }}>
                {discountedPrice.toLocaleString("vi-VN")}đ
              </span>
              <span style={{ textDecoration: "line-through", color: "var(--muted)" }}>
                {detail.stats.priceVnd.toLocaleString("vi-VN")}đ
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
              {detail.stats.priceVnd.toLocaleString("vi-VN")}đ
            </span>
          )}
          <span className="muted-text">{detail.stats.durationDays} ngày</span>
          <span className="muted-text">{detail.stats.totalCourses} cấp độ</span>
          <span className="muted-text">{detail.stats.totalLessons} bài học</span>
        </div>

        {isBundleOwned ? (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p style={{ color: "var(--brand-700)", fontWeight: 700 }}>Bạn đã sở hữu trọn bộ ✓</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href={childEntryHref} className="solid-button">
                Vào học ngay
              </Link>
              <Link href="/parent/courses" className="ghost-button">
                Xem khóa đã mua
              </Link>
            </div>
          </div>
        ) : (
          <CourseCheckoutButton
            courseSlug={detail.bundle.slug}
            label="Mua trọn bộ"
            priceVnd={discountedPrice ?? detail.stats.priceVnd}
          />
        )}
      </section>

      <section className="card" style={{ display: "grid", gap: "0.8rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Nội dung bên trong bộ khóa học</h2>
        <div style={{ display: "grid", gap: "0.55rem" }}>
          {detail.courses.map((course, index) => (
            <div
              key={course.id}
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
                <span className="muted-text" style={{ marginRight: "0.5rem" }}>{index + 1}.</span>
                <span style={{ fontWeight: 600 }}>{course.title}</span>
              </span>
              <span className="muted-text" style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                {course.lessonCount} bài
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
