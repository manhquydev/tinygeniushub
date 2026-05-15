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
  { id: "payments", label: "Pay", icon: CreditCard },
  { id: "webhooks", label: "Webhook events", icon: Webhook },
  { id: "trials", label: "Trial lesson", icon: BookOpen },
  { id: "announcements", label: "Notification", icon: Bell },
  { id: "coupons", label: "Discount code", icon: Tag },
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
      <div className="flex gap-1 overflow-x-auto rounded-t-2xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] px-4 py-3">
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
                  : "text-[var(--admin-text-secondary)] hover:bg-[var(--admin-sidebar-accent)] hover:text-[var(--admin-text-secondary)]"
              }`}
            >
              <Icon size={14} className="shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-b-2xl border border-t-0 border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
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
