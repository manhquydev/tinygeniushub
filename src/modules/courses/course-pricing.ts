export type CoursePricingInput = {
  priceVnd: number;
  listPriceVnd?: number | null;
  salePriceVnd?: number | null;
};

export function resolveSalePriceVnd(input: CoursePricingInput) {
  const candidate = input.salePriceVnd ?? input.priceVnd;
  return Math.max(0, Math.floor(candidate));
}

export function resolveListPriceVnd(input: CoursePricingInput) {
  const salePrice = resolveSalePriceVnd(input);
  const candidate = input.listPriceVnd ?? input.priceVnd;
  const normalized = Math.max(0, Math.floor(candidate));
  return normalized >= salePrice ? normalized : salePrice;
}

export function resolveCourseDisplayPricing(input: CoursePricingInput) {
  const salePriceVnd = resolveSalePriceVnd(input);
  const listPriceVnd = resolveListPriceVnd(input);
  const hasDiscount = listPriceVnd > salePriceVnd;

  return {
    salePriceVnd,
    listPriceVnd,
    hasDiscount,
  };
}
