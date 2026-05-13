import { describe, expect, it } from "vitest";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";

describe("resolveCourseDisplayPricing", () => {
  it("returns list price with no discount", () => {
    const pricing = resolveCourseDisplayPricing({
      priceVnd: 250000,
      listPriceVnd: 300000,
      salePriceVnd: 300000,
    });

    expect(pricing.salePriceVnd).toBe(300000);
    expect(pricing.listPriceVnd).toBe(300000);
    expect(pricing.hasDiscount).toBe(false);
    expect(pricing.saleStatus).toBe("none");
  });

  it("marks zero-priced courses with no discount as pending", () => {
    const pricing = resolveCourseDisplayPricing({
      priceVnd: 0,
      listPriceVnd: null,
      salePriceVnd: null,
    });

    expect(pricing.salePriceVnd).toBe(0);
    expect(pricing.listPriceVnd).toBe(0);
    expect(pricing.isPurchasable).toBe(false);
    expect(pricing.statusLabel).toBe("pending");
    expect(pricing.saleStatus).toBe("none");
  });

  it("treats sale 0 VND as active free-temporary discount with checkout enabled", () => {
    const now = new Date("2026-03-27T09:00:00.000Z");
    const pricing = resolveCourseDisplayPricing(
      {
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 0,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: "2026-03-27T10:00:00.000Z",
      },
      now,
    );

    expect(pricing.salePriceVnd).toBe(0);
    expect(pricing.listPriceVnd).toBe(300000);
    expect(pricing.hasDiscount).toBe(true);
    expect(pricing.isPurchasable).toBe(true);
    expect(pricing.statusLabel).toBe("freeTemporary");
    expect(pricing.saleStatus).toBe("active");
  });

  it("treats explicit sale 0VND with zero list price as free-temporary and purchasable", () => {
    const pricing = resolveCourseDisplayPricing({
      priceVnd: 0,
      listPriceVnd: 0,
      salePriceVnd: 0,
    });

    expect(pricing.salePriceVnd).toBe(0);
    expect(pricing.listPriceVnd).toBe(0);
    expect(pricing.hasDiscount).toBe(false);
    expect(pricing.isPurchasable).toBe(true);
    expect(pricing.statusLabel).toBe("freeTemporary");
    expect(pricing.saleStatus).toBe("none");
  });

  it("applies active timed sale", () => {
    const now = new Date("2026-03-27T09:00:00.000Z");
    const pricing = resolveCourseDisplayPricing(
      {
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 200000,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: "2026-03-27T10:00:00.000Z",
      },
      now,
    );

    expect(pricing.salePriceVnd).toBe(200000);
    expect(pricing.hasDiscount).toBe(true);
    expect(pricing.saleStatus).toBe("active");
  });

  it("returns scheduled status before sale start", () => {
    const now = new Date("2026-03-27T07:00:00.000Z");
    const pricing = resolveCourseDisplayPricing(
      {
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 200000,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: "2026-03-27T10:00:00.000Z",
      },
      now,
    );

    expect(pricing.saleStatus).toBe("scheduled");
    expect(pricing.salePriceVnd).toBe(300000);
    expect(pricing.hasDiscount).toBe(false);
  });

  it("returns expired status after sale end", () => {
    const now = new Date("2026-03-27T11:00:00.000Z");
    const pricing = resolveCourseDisplayPricing(
      {
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 200000,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: "2026-03-27T10:00:00.000Z",
      },
      now,
    );

    expect(pricing.saleStatus).toBe("expired");
    expect(pricing.salePriceVnd).toBe(300000);
    expect(pricing.hasDiscount).toBe(false);
  });

  it("marks invalid sale window", () => {
    const pricing = resolveCourseDisplayPricing({
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 200000,
      saleStartsAt: "2026-03-27T10:00:00.000Z",
      saleEndsAt: "2026-03-27T08:00:00.000Z",
    });

    expect(pricing.saleStatus).toBe("invalid");
    expect(pricing.salePriceVnd).toBe(300000);
    expect(pricing.hasDiscount).toBe(false);
  });

  it("reverts 0 VND sale to list price after sale window ends", () => {
    const now = new Date("2026-03-27T11:00:00.000Z");
    const pricing = resolveCourseDisplayPricing(
      {
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 0,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: "2026-03-27T10:00:00.000Z",
      },
      now,
    );

    expect(pricing.saleStatus).toBe("expired");
    expect(pricing.salePriceVnd).toBe(300000);
    expect(pricing.statusLabel).toBe("ready");
    expect(pricing.isPurchasable).toBe(true);
  });
});
