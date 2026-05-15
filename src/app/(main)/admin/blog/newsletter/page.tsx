import Link from "next/link";
import { getLocale } from "next-intl/server";
import { AdminBlogNewsletterExportButton } from "@/components/admin-blog-newsletter-export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { requireAdminParent } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { translate, type TranslationValues } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";

type SearchParams = {
  page?: string | string[];
};

type AdminNewsletterPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

function getFirstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildHref(page: number) {
  return `/admin/blog/newsletter?page=${page}`;
}

export default async function AdminBlogNewsletterPage({ searchParams }: AdminNewsletterPageProps) {
  await requireAdminParent();
  const locale = resolveAppLocale(await getLocale());
  const t = (key: string, values?: TranslationValues) =>
    translate(`admin.blog.newsletter.${key}`, values, locale);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(getFirstValue(resolvedSearchParams?.page) ?? "1") || 1);

  const [activeSubscribers, unsubscribedCount, subscribers, totalSubscribers] = await Promise.all([
    prisma.blogNewsletterSubscriber.count({
      where: {
        verified: true,
        unsubscribedAt: null,
      },
    }),
    prisma.blogNewsletterSubscriber.count({
      where: {
        unsubscribedAt: {
          not: null,
        },
      },
    }),
    prisma.blogNewsletterSubscriber.findMany({
      where: {
        verified: true,
      },
      orderBy: {
        subscribedAt: "desc",
      },
      skip: (currentPage - 1) * 50,
      take: 50,
      select: {
        id: true,
        email: true,
        nameVi: true,
        subscribedAt: true,
      },
    }),
    prisma.blogNewsletterSubscriber.count({
      where: {
        verified: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalSubscribers / 50));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--admin-text-primary)]">{t("title")}</h1>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{t("description")}</p>
          </div>
          <AdminBlogNewsletterExportButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">{t("statActive")}</p>
          <p className="mt-2 text-3xl font-black text-[var(--admin-text-primary)]">{activeSubscribers}</p>
        </div>
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">{t("statUnsubscribed")}</p>
          <p className="mt-2 text-3xl font-black text-[var(--admin-text-primary)]">{unsubscribedCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--admin-sidebar-accent)] hover:bg-[var(--admin-sidebar-accent)]">
              <TableHead className="text-xs">{t("colEmail")}</TableHead>
              <TableHead className="text-xs">{t("colName")}</TableHead>
              <TableHead className="text-xs">{t("colDate")}</TableHead>
              <TableHead className="text-xs">{t("colVerified")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="text-xs font-semibold text-[var(--admin-text-primary)]">{subscriber.email}</TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">{subscriber.nameVi ?? "-"}</TableCell>
                <TableCell className="text-xs text-[var(--admin-text-secondary)]">
                  {new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(subscriber.subscribedAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700">{t("verifiedBadge")}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {subscribers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-[var(--admin-text-muted)] py-8">{t("empty")}</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-3">
        <Button asChild variant="outline" size="sm" className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}>
          <Link href={buildHref(Math.max(1, currentPage - 1))}>{t("previousPage")}</Link>
        </Button>
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("pageInfo", { current: currentPage, total: totalPages })}</p>
        <Button asChild variant="outline" size="sm" className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}>
          <Link href={buildHref(Math.min(totalPages, currentPage + 1))}>{t("nextPage")}</Link>
        </Button>
      </div>
    </div>
  );
}
