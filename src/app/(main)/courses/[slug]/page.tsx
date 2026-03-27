import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { AB_COURSES_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { resolveCourseCoverImage } from "@/modules/courses/course-media";
import { getCourseBundleByCourseSlug } from "@/modules/courses/course-bundles";
import { getStorefrontCourses, getRelatedCourses } from "@/modules/courses/course-service";
import { COURSE_TRIAL_PREVIEW_LESSON_LIMIT } from "@/modules/courses/course-trial-constants";
import {
  buildCourseClaritySnapshot,
  getBundleStorefrontContent,
} from "@/modules/courses/course-storefront-content";
import { isLegacyBundleRouteSlug } from "@/modules/courses/legacy-bundle-routes";
import { buildCourseJsonLd, safeJsonLd } from "@/lib/seo/course-jsonld";
import { CourseBreadcrumb } from "@/components/courses/course-breadcrumb";
import { CourseRelatedSection } from "@/components/courses/course-related-section";
import { CourseReviewsSection } from "@/components/courses/course-reviews-section";
import { BundleDetailViewTracker } from "@/components/courses/course-storefront-tracking";
import { CourseDetailStickyHeader } from "@/components/courses/course-detail-sticky-header";
import { CourseLevelChangeRequestCard } from "@/components/courses/course-level-change-request-card";
import { CourseDetailHero } from "./course-detail-hero";
import { CourseDetailFitChecklist } from "./course-detail-fit-checklist";
import { CourseDetailDifference } from "./course-detail-difference";
import { CourseDetailTimeline } from "./course-detail-timeline";
import { CourseDetailCurriculum } from "./course-detail-curriculum";
import { CourseDetailFaq } from "./course-detail-faq";
import {
  getFitChecklist,
  getOutcomeTimeline,
  compareTrackCourses,
  buildDifferencePoints,
  type TrackCourseLite,
} from "./course-detail-data";

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
      subject: true,
      ageGroup: true,
      reviewAverageRating: true,
      reviewCount: true,
      _count: { select: { lessons: true, enrollments: true } },
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

async function loadTrackCourses(bundleSlug: string): Promise<TrackCourseLite[]> {
  const candidates = await getStorefrontCourses();
  return candidates
    .filter((item) => getCourseBundleByCourseSlug(item.slug)?.slug === bundleSlug)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      durationDays: item.durationDays,
      lessonCount: item.lessonCount,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isLegacyBundleRouteSlug(slug)) {
    return {
      title: "Danh sách khóa học - Cùng Con Tự Học",
      description: "Khóa học hiển thị theo mô hình từng khóa độc lập.",
      alternates: { canonical: "https://cungcontuhoc.io.vn/courses" },
    };
  }
  const course = await loadPublishedCourse(slug);
  if (!course || !course.isPublished) return { title: "Khóa học không tồn tại" };

  const coverUrl = resolveCourseCoverImage(course.slug, course.coverImageUrl);
  const canonicalUrl = `https://cungcontuhoc.io.vn/courses/${course.slug}`;

  return {
    title: `${course.title} - Cùng Con Tự Học`,
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
  const bundle = getCourseBundleByCourseSlug(course.slug);
  const bundleContent = bundle ? getBundleStorefrontContent(bundle.slug) : null;
  const normalizedCover = resolveCourseCoverImage(course.slug, course.coverImageUrl);
  const fitChecklist = getFitChecklist(bundle?.slug ?? null);
  const claritySnapshot = bundle
    ? buildCourseClaritySnapshot({
        bundleSlug: bundle.slug,
        courseSlug: course.slug,
        courseTitle: course.title,
        lessonCount: course._count.lessons,
      })
    : null;
  const outcomeTimeline = getOutcomeTimeline(bundle?.slug ?? null, claritySnapshot);
  const courseUnitLabel = bundleContent?.courseUnitLabel ?? "giai đoạn";

  let trackPosition: number | null = null;
  let trackTotal: number | null = null;
  const trackLabel: string | null = bundle?.title ?? null;
  let differenceCards: { key: string; comparedBundleSlug: string; title: string; points: string[] }[] = [];
  if (bundle) {
    const trackCourses = await loadTrackCourses(bundle.slug);
    const ordered = [...trackCourses].sort((a, b) => compareTrackCourses(a, b, bundle.entryCourseSlug));
    const idx = ordered.findIndex((item) => item.id === course.id);
    if (idx >= 0) {
      trackPosition = idx + 1;
      trackTotal = ordered.length;
      const current: TrackCourseLite = {
        id: course.id,
        slug: course.slug,
        title: course.title,
        durationDays: course.durationDays,
        lessonCount: course._count.lessons,
      };
      const prev = ordered[idx - 1] ?? null;
      const next = ordered[idx + 1] ?? null;
      differenceCards = [
        prev
          ? {
              key: "previous",
              comparedBundleSlug: prev.slug,
              title: `So với khóa liền trước: ${prev.title}`,
              points: buildDifferencePoints(current, prev, "previous", courseUnitLabel),
            }
          : null,
        next
          ? {
              key: "next",
              comparedBundleSlug: next.slug,
              title: `So với khóa liền sau: ${next.title}`,
              points: buildDifferencePoints(current, next, "next", courseUnitLabel),
            }
          : null,
      ].filter((c): c is NonNullable<typeof c> => c !== null);
    }
  }

  const relatedCourses = await getRelatedCourses({ courseId: course.id, subject: course.subject, ageGroup: course.ageGroup });

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
        bundle={bundle}
        pricing={pricing}
        isOwned={isOwned}
        isAuthenticated={Boolean(parent)}
        childEntryHref={childEntryHref}
        variant={coursesVariant}
        checkoutLabel={checkoutLabel}
        reviewAverageRating={course.reviewAverageRating}
        reviewCount={course.reviewCount}
        enrollmentCount={course._count.enrollments}
        trackPosition={trackPosition}
        trackTotal={trackTotal}
        trackLabel={trackLabel}
        claritySnapshot={claritySnapshot}
      />
      <CourseDetailFitChecklist
        fitChecklist={fitChecklist}
        bestFor={bundleContent?.bestFor ?? null}
        courseSlug={course.slug}
        variant={coursesVariant}
      />
      <CourseDetailDifference differenceCards={differenceCards} courseSlug={course.slug} variant={coursesVariant} />
      <CourseDetailTimeline
        outcomeTimeline={outcomeTimeline}
        courseSlug={course.slug}
        variant={coursesVariant}
        claritySnapshot={claritySnapshot}
      />
      <CourseDetailCurriculum
        lessons={curriculumLessons}
        totalLessonCount={course._count.lessons}
        courseSlug={course.slug}
        isOwned={isOwned}
        variant={coursesVariant}
      />
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-emerald-900 sm:text-lg">Mua tự tin hơn</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
          Xem thử {COURSE_TRIAL_PREVIEW_LESSON_LIMIT} bài đầu để kiểm tra mức phù hợp. Nếu sau khi mua thấy chưa đúng
          level, đội ngũ có thể hỗ trợ đổi level/chuyển khóa theo chính sách.
        </p>
      </section>
      {isOwned ? <CourseLevelChangeRequestCard courseSlug={course.slug} /> : null}
      <CourseReviewsSection courseId={course.id} courseSlug={course.slug} parentId={parent?.id ?? null} isOwned={isOwned} />
      <CourseDetailFaq />
      <CourseRelatedSection courses={relatedCourses} />
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Bạn cần hỗ trợ trước khi thanh toán?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Đội ngũ tư vấn có thể giúp bạn chọn đúng khóa theo mục tiêu học của bé.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/contact" className="ghost-button">Liên hệ tư vấn</Link>
          <Link href="/courses" className="ghost-button">Xem danh sách khóa</Link>
        </div>
      </section>
    </div>
  );
}
