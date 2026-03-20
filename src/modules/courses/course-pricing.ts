export type CoursePricingInput = {
  priceVnd: number;
  listPriceVnd?: number | null;
  salePriceVnd?: number | null;
};

export type CourseDisplayPricing = {
  salePriceVnd: number;
  listPriceVnd: number;
  hasDiscount: boolean;
  isPurchasable: boolean;
  statusLabel: "ready" | "pending";
};

function normalizePositivePrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : null;
}

export function resolveSalePriceVnd(input: CoursePricingInput) {
  const fromSale = normalizePositivePrice(input.salePriceVnd ?? null);
  const fromList = normalizePositivePrice(input.listPriceVnd ?? null);
  const fromBase = normalizePositivePrice(input.priceVnd);
  return fromSale ?? fromList ?? fromBase ?? 0;
}

export function resolveListPriceVnd(input: CoursePricingInput) {
  const salePrice = resolveSalePriceVnd(input);
  const candidate = normalizePositivePrice(input.listPriceVnd ?? null) ?? normalizePositivePrice(input.priceVnd) ?? 0;
  const normalized = Math.max(0, Math.floor(candidate));
  return normalized >= salePrice ? normalized : salePrice;
}

export function resolveCourseDisplayPricing(input: CoursePricingInput): CourseDisplayPricing {
  const salePriceVnd = resolveSalePriceVnd(input);
  const listPriceVnd = resolveListPriceVnd(input);
  const isPurchasable = salePriceVnd > 0;
  const hasDiscount = isPurchasable && listPriceVnd > salePriceVnd;

  return {
    salePriceVnd,
    listPriceVnd,
    hasDiscount,
    isPurchasable,
    statusLabel: isPurchasable ? "ready" : "pending",
  };
}
