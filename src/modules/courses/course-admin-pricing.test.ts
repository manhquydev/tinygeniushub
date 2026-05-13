import { describe, expect, it } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import { normalizeCourseAdminPricing } from "@/modules/courses/course-admin-pricing";

describe("normalizeCourseAdminPricing", () => {
  it("normalizes non-sale pricing", () => {
    const result = normalizeCourseAdminPricing({
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: null,
      saleStartsAt: null,
      saleEndsAt: null,
    });

    expect(result.priceVnd).toBe(300000);
    expect(result.listPriceVnd).toBe(300000);
    expect(result.salePriceVnd).toBe(null);
    expect(result.saleStartsAt).toBeNull();
    expect(result.saleEndsAt).toBeNull();
  });

  it("accepts valid sale pricing with window", () => {
    const result = normalizeCourseAdminPricing({
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 200000,
      saleStartsAt: "2026-03-27T08:00:00.000Z",
      saleEndsAt: "2026-03-27T10:00:00.000Z",
    });

    expect(result.priceVnd).toBe(300000);
    expect(result.listPriceVnd).toBe(300000);
    expect(result.salePriceVnd).toBe(200000);
    expect(result.saleStartsAt?.toISOString()).toBe("2026-03-27T08:00:00.000Z");
    expect(result.saleEndsAt?.toISOString()).toBe("2026-03-27T10:00:00.000Z");
  });

  it("accepts temporary free sale (0 VND) with sale window", () => {
    const result = normalizeCourseAdminPricing({
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 0,
      saleStartsAt: "2026-03-27T08:00:00.000Z",
      saleEndsAt: "2026-03-27T10:00:00.000Z",
    });

    expect(result.listPriceVnd).toBe(300000);
    expect(result.salePriceVnd).toBe(0);
    expect(result.saleStartsAt?.toISOString()).toBe("2026-03-27T08:00:00.000Z");
    expect(result.saleEndsAt?.toISOString()).toBe("2026-03-27T10:00:00.000Z");
  });

  it("accepts flash sale 0 VND when list price is greater than zero", () => {
    const result = normalizeCourseAdminPricing({
      priceVnd: 300000,
      listPriceVnd: 300000,
      salePriceVnd: 0,
      saleStartsAt: "2026-03-27T08:00:00.000Z",
      saleEndsAt: "2026-03-27T10:00:00.000Z",
    });

    expect(result.salePriceVnd).toBe(0);
    expect(result.saleStartsAt?.toISOString()).toBe("2026-03-27T08:00:00.000Z");
    expect(result.saleEndsAt?.toISOString()).toBe("2026-03-27T10:00:00.000Z");
  });

  it("rejects sale price greater than list price", () => {
    expect(() =>
      normalizeCourseAdminPricing({
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 350000,
      }),
    ).toThrowError(DomainError);
  });

  it("rejects sale window without a discount", () => {
    expect(() =>
      normalizeCourseAdminPricing({
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: null,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: "2026-03-27T10:00:00.000Z",
      }),
    ).toThrowError(DomainError);
  });

  it("rejects incomplete sale window", () => {
    expect(() =>
      normalizeCourseAdminPricing({
        priceVnd: 300000,
        listPriceVnd: 300000,
        salePriceVnd: 200000,
        saleStartsAt: "2026-03-27T08:00:00.000Z",
        saleEndsAt: null,
      }),
    ).toThrowError(DomainError);
  });
});
