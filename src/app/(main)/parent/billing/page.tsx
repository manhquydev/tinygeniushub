import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AlertCircle, CircleCheckBig, Clock3, ReceiptText, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { translate } from "@/i18n/translator";
import { resolveAppLocale } from "@/i18n/locales";
import { BillingTickets } from "@/components/parent/billing-tickets";
import { listEntitlements } from "@/modules/entitlement/entitlement-service";

export async function generateMetadata() {
  const locale = resolveAppLocale(await getLocale());
  return { title: translate("parent.billing.metadataTitle", undefined, locale) };
}

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  SUCCEEDED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  REFUNDED: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}D`;
}

function getProviderLabel(provider: string, simulationLabel: string) {
  if (provider === "payos") return "PayOS";
  if (provider === "mock_gateway") return simulationLabel;
  return provider.toUpperCase();
}

function getPaymentTitle(rawPayload: unknown, servicePayment: string, buyBundle: string, buyCourse: string) {
  if (!rawPayload || typeof rawPayload !== "object") return servicePayment;
  const payload = rawPayload as Record<string, unknown>;
  const target = payload.target && typeof payload.target === "object" ? (payload.target as Record<string, unknown>) : null;
  if (!target) return servicePayment;
  const title = typeof target.title === "string" ? target.title : null;
  if (title) return title;
  const kind = typeof target.kind === "string" ? target.kind : null;
  if (kind === "bundle") return buyBundle;
  if (kind === "course") return buyCourse;
  return servicePayment;
}

export default async function ParentBillingPage() {
  const parent = await getParentFromServerCookie();
  if (!parent) redirect("/session-expired?next=/parent/billing");

  const locale = resolveAppLocale(await getLocale());
  const t = (key: string) => translate(`parent.billing.${key}`, undefined, locale);

  const [payments, entitlements] = await Promise.all([
    prisma.paymentRecord.findMany({
      where: { parentId: parent.id },
      orderBy: { processedAt: "desc" },
      take: 20,
      select: { id: true, provider: true, amountVnd: true, status: true, processedAt: true, rawPayload: true },
    }),
    listEntitlements(parent.id),
  ]);

  const succeededPayments = payments.filter((p) => p.status === "SUCCEEDED");
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const failedPayments = payments.filter((p) => p.status === "FAILED");
  const totalSpent = succeededPayments.reduce((sum, p) => sum + p.amountVnd, 0);

  const simulationLabel = t("providerSimulation");
  const servicePayment = t("servicePayment");
  const buyBundle = t("buyBundle");
  const buyCourse = t("buyCourse");

  const paymentStatusLabel: Record<string, string> = {
    SUCCEEDED: t("paymentStatus.SUCCEEDED"),
    PENDING: t("paymentStatus.PENDING"),
    FAILED: t("paymentStatus.FAILED"),
    REFUNDED: t("paymentStatus.REFUNDED"),
  };

  return (
    <div className="page-stack">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#f8fafc_0%,#ffffff_55%,#ecfeff_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
            <Wallet className="h-6 w-6 text-sky-600" />
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{t("description")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("totalPaid")}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("successfulTransaction")}</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{succeededPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("processing")}</p>
              <p className="mt-1 text-2xl font-black text-amber-600">{pendingPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("failure")}</p>
              <p className="mt-1 text-2xl font-black text-rose-600">{failedPayments.length}</p>
            </div>
          </div>
        </div>
      </section>

      <BillingTickets
        heading={t("tickets.heading")}
        empty={t("tickets.empty")}
        codeLabel={t("tickets.code")}
        catalogLabel={t("tickets.catalog")}
        statusLabel={t("tickets.status")}
        validUntilLabel={t("tickets.validUntil")}
        openEnded={t("tickets.openEnded")}
        tickets={entitlements.map((row) => ({
          id: row.id,
          status: row.status,
          validUntil: row.validUntil ? row.validUntil.toISOString() : null,
          offeringCode: row.offering.code,
          catalogKey: row.offering.catalogKey,
        }))}
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">{t("recentHistory.heading")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("recentHistory.description")}</p>

          {payments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              {t("recentHistory.empty")}
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {payments.map((payment) => (
                <article key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{getPaymentTitle(payment.rawPayload, servicePayment, buyBundle, buyCourse)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(payment.processedAt).toLocaleDateString()} • {getProviderLabel(payment.provider, simulationLabel)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_CLASS[payment.status] ?? PAYMENT_STATUS_CLASS.PENDING}`}>
                      {paymentStatusLabel[payment.status] ?? payment.status}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black text-slate-900">{formatCurrency(payment.amountVnd)}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">{t("accountInfo.heading")}</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("accountInfo.paymentModel.label")}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{t("accountInfo.paymentModel.value")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("accountInfo.currentMethod.label")}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{t("accountInfo.currentMethod.value")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{t("accountInfo.autoRenewal.label")}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{t("accountInfo.autoRenewal.value")}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">{t("paymentNote.heading")}</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-600">
          <p className="inline-flex items-start gap-2">
            <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {t("paymentNote.autoRecord")}
          </p>
          <p className="inline-flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            {t("paymentNote.pendingWait")}
          </p>
          <p className="inline-flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            {t("paymentNote.contactSupport")}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/courses" className="solid-button">{t("paymentNote.buyCourses")}</Link>
          <Link href="/contact" className="ghost-button">{t("paymentNote.contactSupportBtn")}</Link>
          <Link href="/parent/courses" className="ghost-button">{t("paymentNote.purchasedKey")}</Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">
          <ReceiptText className="h-5 w-5 text-slate-700" />
          {t("invoice.heading")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("invoice.description")}</p>
        <Link href="/contact" className="ghost-button" style={{ marginTop: "0.75rem", width: "fit-content" }}>
          {t("invoice.sendRequest")}
        </Link>
      </section>
    </div>
  );
}
