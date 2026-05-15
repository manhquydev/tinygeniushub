import type { AbVariant } from "@/lib/ab-test-constants";
import type { CourseDisplayPricing } from "@/modules/courses/course-pricing";
import { CourseDetailSidebar } from "@/components/courses/course-detail-sidebar";

type Props = {
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
  durationDays: number;
  normalizedCover: string | null;
  pricing: Pick<
    CourseDisplayPricing,
    "salePriceVnd" | "listPriceVnd" | "hasDiscount" | "isPurchasable" | "saleEndsAt" | "statusLabel"
  >;
  isOwned: boolean;
  isAuthenticated: boolean;
  childEntryHref: string;
  variant: AbVariant;
  checkoutLabel: string;
};

export function CourseDetailHero({
  slug,
  title,
  description,
  lessonCount,
  durationDays,
  normalizedCover,
  pricing,
  isOwned,
  isAuthenticated,
  childEntryHref,
  variant,
  checkoutLabel,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_55%,#ecfeff_100%)] p-5 shadow-sm sm:p-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">{title}</h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total lesson</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{lessonCount} lessons</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/90 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Access period</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{durationDays} days</p>
            </div>
          </div>

          {normalizedCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizedCover}
              alt={title}
              className="w-full rounded-2xl object-cover shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
              style={{ aspectRatio: "16 / 9" }}
            />
          ) : (
            <div
              className="w-full rounded-2xl bg-[linear-gradient(145deg,#e2e8f0_0%,#f8fafc_55%,#ecfeff_100%)]"
              style={{ aspectRatio: "16 / 9" }}
            />
          )}
        </div>

        <CourseDetailSidebar
          courseSlug={slug}
          pricing={pricing}
          isOwned={isOwned}
          isAuthenticated={isAuthenticated}
          childEntryHref={childEntryHref}
          variant={variant}
          checkoutLabel={checkoutLabel}
        />
      </div>
    </section>
  );
}
