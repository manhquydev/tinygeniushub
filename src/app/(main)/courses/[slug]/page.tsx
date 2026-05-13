import { cache } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { AB_COURSES_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildCourseJsonLd, safeJsonLd } from "@/lib/seo/course-jsonld";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";
import { CourseDetailStickyHeader } from "@/components/courses/course-detail-sticky-header";
import { BundleDetailViewTracker } from "@/components/courses/course-storefront-tracking";
import { resolveCourseCoverImage } from "@/modules/courses/course-media";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { COURSE_TRIAL_PREVIEW_LESSON_LIMIT } from "@/modules/courses/course-trial-constants";
import { isLegacyBundleRouteSlug } from "@/modules/courses/legacy-bundle-routes";
import { CourseDetailCurriculum } from "./course-detail-curriculum";
import { CourseDetailFaq } from "./course-detail-faq";
import { CourseDetailHero } from "./course-detail-hero";

type Props = { params: Promise<{ slug: string }> };

const loadPublishedCourse = cache(async function loadPublishedCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceVnd: true,
      listPriceVnd: true,
      salePriceVnd: true,
      saleStartsAt: true,
      saleEndsAt: true,
      durationDays: true,
      coverImageUrl: true,
      isPublished: true,
      reviewAverageRating: true,
      reviewCount: true,
      _count: { select: { lessons: true } },
    },
  });
});

const loadCourseCurriculumLessons = cache(async function loadCourseCurriculumLessons(courseId: string, isOwned: boolean) {
  return prisma.courseLesson.findMany({
    where: { courseId },
    orderBy: { orderNo: "asc" },
    ...(isOwned ? {} : { take: COURSE_TRIAL_PREVIEW_LESSON_LIMIT }),
    select: {
      id: true,
      orderNo: true,
      lesson: {
        select: {
          id: true,
          title: true,
          estimatedMinutes: true,
          objective: true,
          isPreview: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isLegacyBundleRouteSlug(slug)) {
    return {
      title: "Danh sách khóa học - TinyGenius Hub",
      description: "Khóa học hiển thị theo mô hình từng khóa độc lập.",
      alternates: { canonical: "https://www.tinygeniushubvn.tech/courses" },
    };
  }
  const course = await loadPublishedCourse(slug);
  if (!course || !course.isPublished) return { title: "Khóa học không tồn tại" };

  const coverUrl = resolveCourseCoverImage(course.slug, course.coverImageUrl);
  const canonicalUrl = `https://www.tinygeniushubvn.tech/courses/${course.slug}`;

  return {
    title: `${course.title} - TinyGenius Hub`,
    description: course.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: course.title,
      description: course.description,
      url: canonicalUrl,
      type: "website",
      images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: course.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description: course.description,
      images: coverUrl ? [coverUrl] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  if (isLegacyBundleRouteSlug(slug)) permanentRedirect("/courses");

  const course = await loadPublishedCourse(slug);
  if (!course || !course.isPublished) notFound();

  const cookieStore = await cookies();
  const coursesVariant: AbVariant = cookieStore.get(AB_COURSES_COOKIE)?.value === "B" ? "B" : "A";
  const parent = await getParentFromServerCookie();
  const pricing = resolveCourseDisplayPricing(course);
  const checkoutLabel = coursesVariant === "B" ? "Mua khóa và bắt đầu ngay" : "Mua khóa học";
  const normalizedCover = resolveCourseCoverImage(course.slug, course.coverImageUrl);

  let isOwned = false;
  let childEntryHref = `/kid/courses/${encodeURIComponent(course.slug)}`;
  if (parent) {
    const [enrollment, firstChild] = await Promise.all([
      prisma.courseEnrollment.findUnique({
        where: { courseId_parentId: { courseId: course.id, parentId: parent.id } },
        select: { id: true },
      }),
      prisma.childProfile.findFirst({
        where: { parentId: parent.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }),
    ]);
    isOwned = Boolean(enrollment);
    if (firstChild) childEntryHref = `${childEntryHref}?childId=${encodeURIComponent(firstChild.id)}`;
  }

  const curriculumLessons = await loadCourseCurriculumLessons(course.id, isOwned);
  const courseJsonLd = buildCourseJsonLd({
    slug: course.slug,
    title: course.title,
    description: course.description,
    priceVnd: pricing.salePriceVnd,
    durationDays: course.durationDays,
    reviewAverageRating: course.reviewAverageRating,
    reviewCount: course.reviewCount,
  });

  return (
    <div className="page-stack pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(courseJsonLd) }} />
      <BundleDetailViewTracker variant={coursesVariant} bundleSlug={course.slug} tracks={1} lessons={course._count.lessons} />

      <CourseDetailStickyHeader
        title={course.title}
        pricing={pricing}
        courseSlug={course.slug}
        checkoutLabel={checkoutLabel}
        isOwned={isOwned}
        isAuthenticated={Boolean(parent)}
        childEntryHref={childEntryHref}
        variant={coursesVariant}
      />

      <CourseBreadcrumb courseTitle={course.title} courseSlug={course.slug} />

      <CourseDetailHero
        slug={course.slug}
        title={course.title}
        description={course.description}
        lessonCount={course._count.lessons}
        durationDays={course.durationDays}
        normalizedCover={normalizedCover}
        pricing={pricing}
        isOwned={isOwned}
        isAuthenticated={Boolean(parent)}
        childEntryHref={childEntryHref}
        variant={coursesVariant}
        checkoutLabel={checkoutLabel}
      />

      <CourseDetailCurriculum
        lessons={curriculumLessons}
        totalLessonCount={course._count.lessons}
        courseSlug={course.slug}
        isOwned={isOwned}
        variant={coursesVariant}
      />

      <CourseDetailFaq />
    </div>
  );
}
