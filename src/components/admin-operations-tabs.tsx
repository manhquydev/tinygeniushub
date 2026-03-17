"use client";

import { useState } from "react";
import { AdminAnnouncementPanel } from "@/components/admin-announcement-panel";
import { AdminCouponPanel } from "@/components/admin-coupon-panel";
import { AdminFooterSocialLinksPanel } from "@/components/admin-footer-social-links-panel";
import { AdminOperationsPanel } from "@/components/admin-operations-panel";
import { Bell, BookOpen, CreditCard, Share2, Tag, Webhook } from "lucide-react";

type PaymentRow = {
  id: string;
  provider: string;
  providerTransactionId: string;
  amountVnd: number;
  currency: string;
  status: string;
  processedAt: string;
  parent: { email: string };
};

type WebhookRow = {
  id: string;
  provider: string;
  eventId: string;
  signatureValid: boolean;
  status: string;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
};

type LessonTrialRow = {
  id: string;
  slug: string;
  title: string;
  trialEnabled: boolean;
  trackCode: string;
};

interface Props {
  payments: PaymentRow[];
  webhooks: WebhookRow[];
  lessonTrialRows: LessonTrialRow[];
}

const TABS = [
  { id: "payments", label: "Thanh toán", icon: CreditCard },
  { id: "webhooks", label: "Sự kiện webhook", icon: Webhook },
  { id: "trials", label: "Bài học dùng thử", icon: BookOpen },
  { id: "announcements", label: "Thông báo", icon: Bell },
  { id: "coupons", label: "Mã giảm giá", icon: Tag },
  { id: "footer-social", label: "Footer social", icon: Share2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminOperationsTabs({
  payments,
  webhooks,
  lessonTrialRows,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("payments");

  return (
    <div className="space-y-0">
      <div className="flex gap-1 overflow-x-auto rounded-t-2xl border border-slate-200 bg-white px-4 py-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Icon size={14} className="shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4">
        {activeTab === "payments" || activeTab === "webhooks" || activeTab === "trials" ? (
          <AdminOperationsPanel
            initialPayments={payments}
            initialWebhooks={webhooks}
            lessonTrialRows={lessonTrialRows}
            defaultView={activeTab === "payments" ? "payments" : activeTab === "webhooks" ? "webhooks" : "trials"}
          />
        ) : null}

        {activeTab === "announcements" ? <AdminAnnouncementPanel /> : null}
        {activeTab === "coupons" ? <AdminCouponPanel /> : null}
        {activeTab === "footer-social" ? <AdminFooterSocialLinksPanel /> : null}
      </div>
    </div>
  );
}
