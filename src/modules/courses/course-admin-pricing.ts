import { DomainError } from "@/modules/platform/errors";

type DateInputValue = Date | string | null | undefined;

export type CourseAdminPricingInput = {
  priceVnd: number;
  listPriceVnd?: number | null;
  salePriceVnd?: number | null;
  saleStartsAt?: DateInputValue;
  saleEndsAt?: DateInputValue;
};

export type NormalizedCourseAdminPricing = {
  priceVnd: number;
  listPriceVnd: number;
  salePriceVnd: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

function normalizeMoney(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new DomainError(
      `${field} must be an integer >= 0`,
      400,
      "COURSE_PRICE_INVALID",
    );
  }

  return value;
}

function parseDateInput(value: DateInputValue, field: string): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError(
      `${field} is invalid`,
      400,
      "COURSE_SALE_WINDOW_INVALID",
    );
  }

  return parsed;
}

export function normalizeCourseAdminPricing(
  input: CourseAdminPricingInput,
): NormalizedCourseAdminPricing {
  const basePriceVnd = normalizeMoney(input.priceVnd, "Base price");
  const listPriceVnd =
    input.listPriceVnd === null || input.listPriceVnd === undefined
      ? basePriceVnd
      : normalizeMoney(input.listPriceVnd, "List price");
  const rawSalePriceVnd =
    input.salePriceVnd === null || input.salePriceVnd === undefined
      ? null
      : normalizeMoney(input.salePriceVnd, "Sale price");

  if (rawSalePriceVnd !== null && rawSalePriceVnd >= listPriceVnd) {
    throw new DomainError(
      "Sale price must be lower than regular price",
      400,
      "COURSE_SALE_PRICE_INVALID",
    );
  }

  const hasDiscount = rawSalePriceVnd !== null;
  const saleStartsAt = parseDateInput(input.saleStartsAt, "Sale start time");
  const saleEndsAt = parseDateInput(input.saleEndsAt, "Sale end time");

  if (!hasDiscount && (saleStartsAt || saleEndsAt)) {
    throw new DomainError(
      "Sale window requires a sale price",
      400,
      "COURSE_SALE_WINDOW_REDUNDANT",
    );
  }

  if ((saleStartsAt && !saleEndsAt) || (!saleStartsAt && saleEndsAt)) {
    throw new DomainError(
      "Sale start and end time must be set together",
      400,
      "COURSE_SALE_WINDOW_INCOMPLETE",
    );
  }

  if (saleStartsAt && saleEndsAt && saleStartsAt.getTime() >= saleEndsAt.getTime()) {
    throw new DomainError(
      "Sale end time must be after sale start time",
      400,
      "COURSE_SALE_WINDOW_ORDER_INVALID",
    );
  }

  return {
    // Keep `priceVnd` as base/list price for backward compatibility.
    priceVnd: listPriceVnd,
    listPriceVnd,
    salePriceVnd: hasDiscount ? rawSalePriceVnd : null,
    saleStartsAt: hasDiscount ? saleStartsAt : null,
    saleEndsAt: hasDiscount ? saleEndsAt : null,
  };
}
