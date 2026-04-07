export type CoursePricingInput = {
  priceVnd: number;
  listPriceVnd?: number | null;
  salePriceVnd?: number | null;
  saleStartsAt?: Date | string | null;
  saleEndsAt?: Date | string | null;
};

export type SaleStatus = "none" | "scheduled" | "active" | "expired" | "invalid";

export type CourseDisplayPricing = {
  salePriceVnd: number;
  listPriceVnd: number;
  hasDiscount: boolean;
  isPurchasable: boolean;
  statusLabel: "ready" | "pending" | "freeTemporary";
  saleStatus: SaleStatus;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

function normalizePositivePrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : null;
}

function normalizeNonNegativePrice(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const normalized = Math.floor(value);
  return normalized >= 0 ? normalized : null;
}

function normalizeDate(value: Date | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function resolveSalePriceVnd(input: CoursePricingInput) {
  const fromSale = normalizeNonNegativePrice(input.salePriceVnd ?? null);
  const fromList = normalizePositivePrice(input.listPriceVnd ?? null);
  const fromBase = normalizePositivePrice(input.priceVnd);
  return fromSale ?? fromList ?? fromBase ?? 0;
}

export function resolveListPriceVnd(input: CoursePricingInput) {
  const candidate = normalizePositivePrice(input.listPriceVnd ?? null) ?? normalizePositivePrice(input.priceVnd) ?? 0;
  return Math.max(0, Math.floor(candidate));
}

function resolveSaleStatus(input: CoursePricingInput, now: Date): {
  status: SaleStatus;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  shouldApplySalePrice: boolean;
} {
  const listPriceVnd = resolveListPriceVnd(input);
  const configuredSalePriceVnd = normalizeNonNegativePrice(input.salePriceVnd ?? null);
  const hasDiscount = configuredSalePriceVnd !== null && configuredSalePriceVnd < listPriceVnd;

  if (!hasDiscount) {
    return {
      status: "none",
      saleStartsAt: null,
      saleEndsAt: null,
      shouldApplySalePrice: false,
    };
  }

  const saleStartsAt = normalizeDate(input.saleStartsAt ?? null);
  const saleEndsAt = normalizeDate(input.saleEndsAt ?? null);

  if (!saleStartsAt && !saleEndsAt) {
    return {
      status: "active",
      saleStartsAt: null,
      saleEndsAt: null,
      shouldApplySalePrice: true,
    };
  }

  if (!saleStartsAt || !saleEndsAt || saleStartsAt.getTime() >= saleEndsAt.getTime()) {
    return {
      status: "invalid",
      saleStartsAt,
      saleEndsAt,
      shouldApplySalePrice: false,
    };
  }

  if (now.getTime() < saleStartsAt.getTime()) {
    return {
      status: "scheduled",
      saleStartsAt,
      saleEndsAt,
      shouldApplySalePrice: false,
    };
  }

  if (now.getTime() >= saleEndsAt.getTime()) {
    return {
      status: "expired",
      saleStartsAt,
      saleEndsAt,
      shouldApplySalePrice: false,
    };
  }

  return {
    status: "active",
    saleStartsAt,
    saleEndsAt,
    shouldApplySalePrice: true,
  };
}

export function resolveCourseDisplayPricing(input: CoursePricingInput, now = new Date()): CourseDisplayPricing {
  const listPriceVnd = resolveListPriceVnd(input);
  const configuredSalePriceVnd = normalizeNonNegativePrice(input.salePriceVnd ?? null);
  const saleState = resolveSaleStatus(input, now);
  const salePriceVnd =
    configuredSalePriceVnd !== null && saleState.shouldApplySalePrice
      ? configuredSalePriceVnd
      : listPriceVnd;

  const hasDiscount = listPriceVnd > salePriceVnd;
  const isFreeTemporary = salePriceVnd === 0 && hasDiscount;
  const isPendingPriceConfig = salePriceVnd === 0 && !hasDiscount;
  const isPurchasable = salePriceVnd > 0 || isFreeTemporary;

  return {
    salePriceVnd,
    listPriceVnd,
    hasDiscount,
    isPurchasable,
    statusLabel: isPendingPriceConfig
      ? "pending"
      : isFreeTemporary
        ? "freeTemporary"
        : "ready",
    saleStatus: saleState.status,
    saleStartsAt: saleState.saleStartsAt,
    saleEndsAt: saleState.saleEndsAt,
  };
}
