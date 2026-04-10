import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CircleCheckBig, Clock3, ReceiptText, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Thanh toán và hóa đơn - Cùng Con Tự Học",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  SUCCEEDED: "Thành công",
  PENDING: "Đang xử lý",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  SUCCEEDED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  REFUNDED: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function getProviderLabel(provider: string) {
  if (provider === "payos") return "PayOS";
  if (provider === "mock_gateway") return "Mô phỏng";
  return provider.toUpperCase();
}

function getPaymentTitle(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== "object") {
    return "Thanh toán dịch vụ";
  }

  const payload = rawPayload as Record<string, unknown>;
  const target = payload.target && typeof payload.target === "object" ? (payload.target as Record<string, unknown>) : null;
  if (!target) {
    return "Thanh toán dịch vụ";
  }

  const title = typeof target.title === "string" ? target.title : null;
  if (title) {
    return title;
  }

  const kind = typeof target.kind === "string" ? target.kind : null;
  if (kind === "bundle") return "Mua bộ khóa học";
  if (kind === "course") return "Mua khóa học";
  return "Thanh toán dịch vụ";
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
            Thanh toán và hóa đơn
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Trang này tập trung vào giao dịch mua khóa học. Thanh toán hiện tại sử dụng PayOS theo hình thức chuyển
            khoản ngân hàng.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Tổng đã thanh toán</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Giao dịch thành công</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">{succeededPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Đang xử lý</p>
              <p className="mt-1 text-2xl font-black text-amber-600">{pendingPayments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Thất bại</p>
              <p className="mt-1 text-2xl font-black text-rose-600">{failedPayments.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Lịch sử giao dịch gần đây</h2>
          <p className="mt-1 text-sm text-slate-600">Theo dõi chi tiết từng giao dịch và trạng thái xử lý.</p>

          {payments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Chưa có giao dịch nào. Bạn có thể bắt đầu từ trang khóa học.
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
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Thông tin tài khoản</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Mô hình thanh toán</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Mua theo từng khóa học</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Phương thức hiện tại</p>
              <p className="mt-1 text-sm font-bold text-slate-900">PayOS - chuyển khoản ngân hàng</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Tự động gia hạn</p>
              <p className="mt-1 text-sm font-bold text-slate-900">Không áp dụng với mô hình mua theo khóa</p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">Lưu ý khi thanh toán qua chuyển khoản</h2>
        <div className="mt-3 grid gap-2 text-sm text-slate-600">
          <p className="inline-flex items-start gap-2">
            <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Sau khi chuyển khoản thành công, hệ thống tự động ghi nhận và mở khóa học.
          </p>
          <p className="inline-flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            Nếu trạng thái còn &quot;Đang xử lý&quot;, vui lòng chờ thêm vài phút để webhook đồng bộ.
          </p>
          <p className="inline-flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            Cần hỗ trợ giao dịch? Gửi mã đơn hàng qua trang liên hệ để đội ngũ xử lý nhanh.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/courses" className="solid-button">
            Mua thêm khóa học
          </Link>
          <Link href="/contact" className="ghost-button">
            Liên hệ hỗ trợ
          </Link>
          <Link href="/parent/courses" className="ghost-button">
            Đi tới khóa đã mua
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">
          <ReceiptText className="h-5 w-5 text-slate-700" />
          Cần xuất hóa đơn hoặc đối soát giao dịch?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Vui lòng gửi thời gian giao dịch, số tiền và nhà cung cấp thanh toán để chúng tôi hỗ trợ đối soát nhanh.
        </p>
        <Link href="/contact" className="ghost-button" style={{ marginTop: "0.75rem", width: "fit-content" }}>
          Gửi yêu cầu đối soát
        </Link>
      </section>
    </div>
  );
}
