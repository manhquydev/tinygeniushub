import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    couponCode: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { validateCoupon } from "@/modules/admin/admin-billing-service";

describe("validateCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid when coupon does not exist", async () => {
    prismaMock.couponCode.findUnique.mockResolvedValueOnce(null);

    const result = await validateCoupon("missing-code");

    expect(result).toEqual({
      valid: false,
      message: "Mã giảm giá không tồn tại.",
    });
    expect(prismaMock.couponCode.update).not.toHaveBeenCalled();
  });

  it("returns invalid when coupon reached max uses", async () => {
    prismaMock.couponCode.findUnique.mockResolvedValueOnce({
      discountPercent: 20,
      maxUses: 10,
      usedCount: 10,
      active: true,
      expiresAt: null,
    });

    const result = await validateCoupon("maxed");

    expect(result).toEqual({
      valid: false,
      message: "Mã giảm giá đã hết lượt sử dụng.",
    });
    expect(prismaMock.couponCode.update).not.toHaveBeenCalled();
  });

  it("returns discount and never consumes coupon usage", async () => {
    prismaMock.couponCode.findUnique.mockResolvedValueOnce({
      discountPercent: 15,
      maxUses: 20,
      usedCount: 3,
      active: true,
      expiresAt: null,
    });

    const result = await validateCoupon("save15");

    expect(result).toEqual({
      valid: true,
      discountPercent: 15,
    });
    expect(prismaMock.couponCode.update).not.toHaveBeenCalled();
  });
});
