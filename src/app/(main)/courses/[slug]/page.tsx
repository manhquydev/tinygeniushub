import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { BookOpen, CalendarDays, ChevronRight, CircleCheckBig, Clock3, ShieldCheck } from "lucide-react";
import { AB_COURSES_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { resolveCourseCoverImage } from "@/modules/courses/course-media";
import { getCourseBundleByCourseSlug } from "@/modules/courses/course-bundles";
import { getBundleStorefrontContent } from "@/modules/courses/course-storefront-content";
import { isLegacyBundleRouteSlug } from "@/modules/courses/legacy-bundle-routes";
import { CourseCheckoutButton } from "@/components/courses/course-checkout-button";
import { BundleDetailViewTracker } from "@/components/courses/course-storefront-tracking";

type Props = { params: Promise<{ slug: string }> };

async function loadPublishedCourse(slug: string) {
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
      durationDays: true,
      coverImageUrl: true,
      isPublished: true,
      _count: {
        select: { lessons: true },
      },
      lessons: {
        orderBy: { orderNo: "asc" },
        take: 12,
        select: {
          id: true,
          orderNo: true,
          lesson: {
            select: {
              title: true,
              estimatedMinutes: true,
              objective: true,
            },
          },
        },
      },
    },
  });
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
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

  if (!course || !course.isPublished) {
    return { title: "Khóa học không tồn tại" };
  }

  return {
    title: `${course.title} - Cùng Con Tự Học`,
    description: course.description,
    alternates: {
      canonical: `https://cungcontuhoc.io.vn/courses/${course.slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  if (isLegacyBundleRouteSlug(slug)) {
    permanentRedirect("/courses");
  }
  const course = await loadPublishedCourse(slug);

  if (!course || !course.isPublished) {
    notFound();
  }

  const cookieStore = await cookies();
  const coursesVariant: AbVariant = cookieStore.get(AB_COURSES_COOKIE)?.value === "B" ? "B" : "A";
  const parent = await getParentFromServerCookie();
  const pricing = resolveCourseDisplayPricing(course);
  const checkoutLabel = coursesVariant === "B" ? "Mua khóa và bắt đầu ngay" : "Mua khóa học";
  const bundle = getCourseBundleByCourseSlug(course.slug);
  const bundleContent = bundle ? getBundleStorefrontContent(bundle.slug) : null;
  const normalizedCover = resolveCourseCoverImage(course.slug, course.coverImageUrl);

  let isOwned = false;
  let childEntryHref = `/kid/courses/${encodeURIComponent(course.slug)}`;

  if (parent) {
    const [enrollment, firstChild] = await Promise.all([
      prisma.courseEnrollment.findUnique({
        where: {
          courseId_parentId: {
            courseId: course.id,
            parentId: parent.id,
          },
        },
        select: { id: true },
      }),
      prisma.childProfile.findFirst({
        where: { parentId: parent.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }),
    ]);

    isOwned = Boolean(enrollment);
    if (firstChild) {
      childEntryHref = `${childEntryHref}?childId=${encodeURIComponent(firstChild.id)}`;
    }
  }

  return (
    <div className="page-stack">
      <BundleDetailViewTracker
        variant={coursesVariant}
        bundleSlug={course.slug}
        tracks={1}
        lessons={course._count.lessons}
      />
      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_55%,#ecfeff_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="space-y-4">
            {normalizedCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={normalizedCover}
                alt={course.title}
                className="w-full rounded-2xl object-cover shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
                style={{ aspectRatio: "16 / 9" }}
              />
            ) : (
              <div className="w-full rounded-2xl bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]" style={{ aspectRatio: "16 / 9" }} />
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white/90 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Bài học</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{course._count.lessons}</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/90 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Thời hạn</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{course.durationDays} ngày</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/90 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Nhịp gợi ý</p>
                <p className="mt-1 text-sm font-bold text-slate-900">4-5 bài/tuần</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <p className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
              Khóa học độc lập
            </p>
            <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">{course.title}</h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{course.description}</p>
            {bundleContent ? (
              <p className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-sky-800">
                {bundleContent.promise}
              </p>
            ) : null}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Giá thanh toán</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-3xl font-black tracking-[-0.02em] text-emerald-700">
                  {formatCurrency(pricing.salePriceVnd)}
                </p>
                {pricing.hasDiscount ? (
                  <p className="pb-1 text-sm text-slate-500 line-through">{formatCurrency(pricing.listPriceVnd)}</p>
                ) : null}
              </div>
              <p className="text-xs text-emerald-700/80">Thanh toán một lần, kích hoạt ngay sau xác nhận</p>
            </div>

            {isOwned ? (
              <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CircleCheckBig className="h-4 w-4" />
                  Bạn đã sở hữu khóa học này.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={childEntryHref} className="solid-button">
                    Vào học ngay <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                  <Link href="/parent/courses" className="ghost-button">
                    Xem khóa đã mua
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <CourseCheckoutButton
                  courseSlug={course.slug}
                  label={checkoutLabel}
                  priceVnd={pricing.salePriceVnd}
                  isAuthenticated={Boolean(parent)}
                  tracking={{
                    variant: coursesVariant,
                    bundleSlug: course.slug,
                  }}
                />
                {!parent ? (
                  <p className="text-xs text-slate-500">
                    Hệ thống sẽ đưa bạn đến đăng nhập hoặc đăng ký, rồi quay lại đúng khóa học này để tiếp tục thanh toán.
                  </p>
                ) : null}
              </div>
            )}

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="inline-flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                Truy cập khóa học ngay sau khi giao dịch thành công.
              </p>
              <p className="inline-flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                Trạng thái thanh toán được cập nhật tự động trên hệ thống.
              </p>
              <p className="inline-flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Theo dõi tiến bộ rõ theo số bài hoàn thành và mốc tuần học.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Nội dung khóa học</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Hiển thị {course.lessons.length} bài đầu tiên để phụ huynh hình dung cấu trúc khóa học.
        </p>
        <div className="mt-4 grid gap-3">
          {course.lessons.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Bài {item.orderNo}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-slate-900">{item.lesson.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.lesson.objective}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-right ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Thời lượng</p>
                  <p className="text-sm font-bold text-slate-900">{item.lesson.estimatedMinutes} phút</p>
                </div>
              </div>
            </article>
          ))}
          {course._count.lessons > course.lessons.length ? (
            <p className="text-xs font-semibold text-slate-500">
              +{course._count.lessons - course.lessons.length} bài tiếp theo sẽ mở sau khi mua khóa.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Bạn cần hỗ trợ trước khi thanh toán?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Đội ngũ tư vấn có thể giúp bạn chọn đúng khóa theo mục tiêu học của bé.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/contact" className="ghost-button">
            Liên hệ tư vấn
          </Link>
          <Link href="/courses" className="ghost-button">
            Xem danh sách khóa
          </Link>
        </div>
      </section>
    </div>
  );
}
