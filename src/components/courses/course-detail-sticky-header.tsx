"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AbVariant } from "@/lib/ab-test-constants";
import { CourseCheckoutButton } from "./course-checkout-button";

function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

type Props = {
  title: string;
  pricing: {
    salePriceVnd: number;
    listPriceVnd: number;
    hasDiscount: boolean;
    isPurchasable: boolean;
    statusLabel?: "ready" | "pending" | "freeTemporary";
  };
  courseSlug: string;
  checkoutLabel: string;
  isOwned: boolean;
  isAuthenticated: boolean;
  childEntryHref: string;
  variant: AbVariant;
};

export function CourseDetailStickyHeader({
  title,
  pricing,
  courseSlug,
  checkoutLabel,
  isOwned,
  isAuthenticated,
  childEntryHref,
  variant,
}: Props) {
  const [visible, setVisible] = useState(false);
  const currentPriceVnd = Math.max(0, pricing.salePriceVnd);
  const showDiscount = pricing.listPriceVnd > currentPriceVnd && pricing.hasDiscount;
  const isFreeTemporary = pricing.statusLabel === "freeTemporary" && currentPriceVnd === 0;
  const checkoutCtaLabel = isFreeTemporary ? "Nhận khóa miễn phí ngay" : checkoutLabel;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed left-0 right-0 top-0 z-40 hidden items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur transition-transform duration-300 lg:flex ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
        <div className="flex shrink-0 items-end gap-2">
          <p className="text-sm font-black text-emerald-700">{formatCurrency(currentPriceVnd)}</p>
          {showDiscount ? (
            <p className="pb-0.5 text-xs text-slate-500 line-through">{formatCurrency(pricing.listPriceVnd)}</p>
          ) : null}
        </div>
      </div>
      {isOwned ? (
        <Link href={childEntryHref} className="solid-button text-sm">
          Vào học ngay
        </Link>
      ) : !pricing.isPurchasable ? (
        <Link href="/contact" className="solid-button text-sm">
          Nhận tư vấn lộ trình
        </Link>
      ) : (
        <CourseCheckoutButton
          courseSlug={courseSlug}
          label={checkoutCtaLabel}
          priceVnd={pricing.salePriceVnd}
          isAuthenticated={isAuthenticated}
          tracking={{ variant, bundleSlug: courseSlug }}
        />
      )}
    </div>
  );
}
