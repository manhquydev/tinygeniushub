import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { CheckoutPlanButton } from "@/components/checkout-plan-button";

export const metadata: Metadata = {
  title: "Gói dịch vụ — Cùng Con Tự Học",
};

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Đang dùng thử",
  ACTIVE_STANDARD: "Standard (Năm)",
  ACTIVE_FAMILYPLUS: "Family+ (Năm)",
  CANCELED_AT_PERIOD_END: "Đã hủy — còn hiệu lực đến hết kỳ",
  EXPIRED: "Đã hết hạn",
  GRACE: "Gia hạn (cần thanh toán)",
  REFUNDED: "Đã hoàn tiền",
};

const STATUS_COLOR: Record<string, string> = {
  TRIALING: "#f59e0b",
  ACTIVE_STANDARD: "#10b981",
  ACTIVE_FAMILYPLUS: "#6366f1",
  CANCELED_AT_PERIOD_END: "#ef4444",
  EXPIRED: "#6b7280",
  GRACE: "#f97316",
  REFUNDED: "#6b7280",
};

function daysRemaining(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default async function ParentBillingPage() {
  const parent = await getParentFromServerCookie();
  if (!parent) redirect("/session-expired?next=/parent/billing");

  const [subscription, payments] = await Promise.all([
    prisma.subscription.findUnique({
      where: { parentId: parent.id },
      select: {
        planCode: true,
        status: true,
        childProfileLimit: true,
        caregiverLimit: true,
        currentPeriodEnd: true,
        autoRenew: true,
      },
    }),
    prisma.paymentRecord.findMany({
      where: { parentId: parent.id },
      orderBy: { processedAt: "desc" },
      take: 10,
      select: { id: true, amountVnd: true, status: true, processedAt: true, provider: true },
    }),
  ]);

  const status = subscription?.status ?? "TRIALING";
  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusColor = STATUS_COLOR[status] ?? "#6b7280";
  const periodEnd = subscription?.currentPeriodEnd;
  const days = periodEnd ? daysRemaining(periodEnd) : 0;
  const isActive = status === "ACTIVE_STANDARD" || status === "ACTIVE_FAMILYPLUS";

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Gói dịch vụ của bạn</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý đăng ký, xem lịch sử thanh toán và nâng cấp gói.</p>
      </section>

      {/* Current plan */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-slate-900">Gói hiện tại</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div
            style={{
              display: "inline-flex",
              borderRadius: 9999,
              padding: "4px 14px",
              fontWeight: 700,
              fontSize: "0.85rem",
              background: `${statusColor}18`,
              color: statusColor,
              border: `1px solid ${statusColor}44`,
            }}
          >
            {statusLabel}
          </div>
          {periodEnd && (
            <span className="text-sm text-slate-500">
              {isActive ? `Hết hạn sau ${days} ngày` : `Hết hạn: ${periodEnd.toLocaleDateString("vi-VN")}`}
            </span>
          )}
        </div>

        {subscription && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Hồ sơ bé</p>
              <p className="mt-0.5 font-bold text-slate-900">Tối đa {subscription.childProfileLimit}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Caregiver</p>
              <p className="mt-0.5 font-bold text-slate-900">Tối đa {subscription.caregiverLimit}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Tự gia hạn</p>
              <p className="mt-0.5 font-bold text-slate-900">{subscription.autoRenew ? "Bật" : "Tắt"}</p>
            </div>
          </div>
        )}

        {/* Upgrade CTAs */}
        {!isActive && (
          <div className="mt-5 flex flex-wrap gap-3">
            <CheckoutPlanButton planCode="YEARLY_STANDARD" label="Nâng cấp Standard — 799,000đ/năm" />
            <CheckoutPlanButton
              planCode="YEARLY_FAMILY_PLUS"
              label="Nâng cấp Family+ — 1,199,000đ/năm"
              className="ghost-button"
            />
          </div>
        )}

        {status === "ACTIVE_STANDARD" && (
          <div className="mt-4">
            <CheckoutPlanButton
              planCode="YEARLY_FAMILY_PLUS"
              label="Nâng cấp lên Family+ — 1,199,000đ/năm"
              className="ghost-button"
            />
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Để hủy gói hoặc yêu cầu hoàn tiền, hãy{" "}
          <Link href="/contact" className="underline">
            liên hệ hỗ trợ
          </Link>
          . Hoàn tiền 100% trong 30 ngày đầu, không cần giải thích lý do.
        </p>
      </section>

      {/* Payment history */}
      {payments.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-bold text-slate-900">Lịch sử thanh toán</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3">Nhà cung cấp</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(p.processedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.provider}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {p.amountVnd.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: p.status === "SUCCEEDED" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {p.status === "SUCCEEDED" ? "Thành công" : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
