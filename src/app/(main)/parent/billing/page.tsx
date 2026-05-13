import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CircleCheckBig, Clock3, ReceiptText, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Payments and Invoicing - TinyGenius Hub",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  SUCCEEDED: "Success",
  PENDING: "Processing",
  FAILED: "Failure",
  REFUNDED: "Refund given",
};

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  SUCCEEDED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  REFUNDED: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}D`;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function getProviderLabel(provider: string) {
  if (provider === "payos") return "PayOS";
  if (provider === "mock_gateway") return "Simulation";
  return provider.toUpperCase();
}

function getPaymentTitle(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") {
    return "Service payment";
  }

  const payload = rawPayload as Record<string, unknown>;
  const target = payload.target && typeof payload.target === "object" ? (payload.target as Record<string, unknown>) : null;
  if (!target) {
    return "Service payment";
  }

  const title = typeof target.title === "string" ? target.title : null;
  if (title) {
    return title;
  }

  const kind = typeof target.kind === "string" ? target.kind : null;
  if (kind === "bundle") return "Buy the course set";
  if (kind === "course") return "Buy the course";
  return "Service payment";
}

export default async function ParentBillingPage() {
  const parent = await getParentFromServerCookie();
  if (!parent) redirect("/session-expired?next=/parent/billing");

  const payments = await prisma.paymentRecord.findMany({
    where: { parentId: parent.id },
    orderBy: { processedAt: "desc" },
    take: 20,
    select: {
      id: true,
      provider: true,
      amountVnd: true,
      status: true,
      processedAt: true,
      rawPayload: true,
    },
  });

  const succeededPayments = payments.filter((payment) => payment.status === "SUCCEEDED");
  const pendingPayments = payments.filter((payment) => payment.status === "PENDING");
  const failedPayments = payments.filter((payment) => payment.status === "FAILED");

  const totalSpent = succeededPayments.reduce((sum, payment) => sum + payment.amountVnd, 0);

  return (
    <div className="page-stack">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#f8fafc_0%,#ffffff_55%,#ecfeff_100%)] p-5 shadow-sm sm:p-8">
        <div className="grid gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">
            <Wallet className="h-6 w-6 text-sky-600" />
            Payments and invoices
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            This page focuses on course purchases. Current payments use PayOS in the form of transfers
            bank account.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total paid</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Successful transaction</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{succeededPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Processing</p>
              <p className="mt-1 text-2xl font-black text-amber-600">{pendingPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Failure</p>
              <p className="mt-1 text-2xl font-black text-rose-600">{failedPayments.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Recent transaction history</h2>
          <p className="mt-1 text-sm text-slate-600">Track details of each transaction and processing status.</p>

          {payments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              There are no transactions yet. You can start from the course page.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {payments.map((payment) => (
                <article key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{getPaymentTitle(payment.rawPayload)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(payment.processedAt)} • {getProviderLabel(payment.provider)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_CLASS[payment.status] ?? PAYMENT_STATUS_CLASS.PENDING}`}
                    >
                      {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-black text-slate-900">{formatCurrency(payment.amountVnd)}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Account information</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Payment model</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Buy by course</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Current method</p>
              <p className="mt-1 text-sm font-bold text-slate-900">PayOS - bank transfer</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Automatic renewal</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Does not apply to purchase by key model</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Note when paying via bank transfer</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-600">
          <p className="inline-flex items-start gap-2">
            <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            After successful transfer, the system automatically records and opens the course.
          </p>
          <p className="inline-flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            If the status is still &quot;Processing&quot;, please wait a few more minutes for webhook sync.
          </p>
          <p className="inline-flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            Need trading support? Send your order code via the contact page for quick processing by the team.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/courses" className="solid-button">
            Buy additional courses
          </Link>
          <Link href="/contact" className="ghost-button">
            Contact support
          </Link>
          <Link href="/parent/courses" className="ghost-button">
            Go to the purchased key
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">
          <ReceiptText className="h-5 w-5 text-slate-700" />
          Need to issue invoices or reconcile transactions?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Please send transaction time, amount and payment provider so we can support quick reconciliation.
        </p>
        <Link href="/contact" className="ghost-button" style={{ marginTop: "0.75rem", width: "fit-content" }}>
          Send request for reconciliation
        </Link>
      </section>
    </div>
  );
}
