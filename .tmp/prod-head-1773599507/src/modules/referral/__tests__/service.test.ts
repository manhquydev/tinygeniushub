import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, isPrismaUniqueConstraintErrorMock, randomBytesMock } = vi.hoisted(() => ({
  prismaMock: {
    referralCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    referralAttribution: {
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  isPrismaUniqueConstraintErrorMock: vi.fn(),
  randomBytesMock: vi.fn(() => Buffer.from([0, 1, 2, 3, 4, 5, 6, 7])),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/prisma-error", () => ({
  isPrismaUniqueConstraintError: isPrismaUniqueConstraintErrorMock,
}));

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return {
    ...actual,
    randomBytes: randomBytesMock,
  };
});

import {
  claimReferralCodeForParent,
  claimReferralCodeSchema,
  ensureReferralCodeForParent,
  getReferralSummaryForParent,
  getReferralSummaryForParentReadOnly,
  normalizeReferralCode,
} from "@/modules/referral/service";

describe("normalizeReferralCode", () => {
  it("uppercases and trims referral code", () => {
    expect(normalizeReferralCode("  abcd1234  ")).toBe("ABCD1234");
  });
});

describe("claimReferralCodeSchema", () => {
  it("accepts input with code", () => {
    expect(claimReferralCodeSchema.parse({ code: "ABCD1234" })).toEqual({ code: "ABCD1234" });
  });

  it("rejects empty code", () => {
    expect(() => claimReferralCodeSchema.parse({ code: "" })).toThrow();
  });
});

describe("ensureReferralCodeForParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPrismaUniqueConstraintErrorMock.mockReturnValue(false);
  });

  it("returns existing referral code without generating new one", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce({
      id: "ref-1",
      parentId: "parent-1",
      code: "EXIST123",
    });

    const result = await ensureReferralCodeForParent("parent-1");

    expect(result).toEqual({
      id: "ref-1",
      parentId: "parent-1",
      code: "EXIST123",
    });
    expect(prismaMock.referralCode.create).not.toHaveBeenCalled();
  });

  it("creates new referral code when none exists", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce(null);
    prismaMock.referralCode.create.mockResolvedValueOnce({
      id: "ref-2",
      parentId: "parent-1",
      code: "ABCDEFGH",
    });

    const result = await ensureReferralCodeForParent("parent-1");

    expect(result).toEqual({
      id: "ref-2",
      parentId: "parent-1",
      code: "ABCDEFGH",
    });
    expect(randomBytesMock).toHaveBeenCalled();
  });

  it("recovers from parent unique race by returning fallback code", async () => {
    const uniqueParentError = new Error("duplicate parent");

    prismaMock.referralCode.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "ref-race",
        parentId: "parent-1",
        code: "RACE1234",
      });
    prismaMock.referralCode.create.mockRejectedValueOnce(uniqueParentError);

    isPrismaUniqueConstraintErrorMock.mockImplementation((error: unknown, fields: string[]) => {
      if (error !== uniqueParentError) {
        return false;
      }
      if (fields.join(",") === "code") {
        return false;
      }
      if (fields.join(",") === "parentid") {
        return true;
      }
      return false;
    });

    const result = await ensureReferralCodeForParent("parent-1");

    expect(result).toEqual({
      id: "ref-race",
      parentId: "parent-1",
      code: "RACE1234",
    });
  });
});

describe("getReferralSummaryForParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.referralCode.findUnique.mockResolvedValue({
      id: "ref-1",
      parentId: "parent-1",
      code: "ABCD1234",
    });
    prismaMock.referralAttribution.count
      .mockResolvedValueOnce(11)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);
  });

  it("returns aggregated referral metrics", async () => {
    const result = await getReferralSummaryForParent("parent-1");

    expect(result).toEqual({
      code: "ABCD1234",
      totalReferrals: 11,
      paidReferrals: 5,
      rewardedReferrals: 3,
    });
  });
});

describe("getReferralSummaryForParentReadOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero metrics when referral code is missing", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce(null);

    const result = await getReferralSummaryForParentReadOnly("parent-1");

    expect(result).toEqual({
      code: null,
      totalReferrals: 0,
      paidReferrals: 0,
      rewardedReferrals: 0,
    });
    expect(prismaMock.referralAttribution.count).not.toHaveBeenCalled();
  });

  it("returns aggregated metrics when referral code exists", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce({
      id: "ref-1",
      parentId: "parent-1",
      code: "ABCD1234",
    });
    prismaMock.referralAttribution.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    const result = await getReferralSummaryForParentReadOnly("parent-1");

    expect(result).toEqual({
      code: "ABCD1234",
      totalReferrals: 7,
      paidReferrals: 2,
      rewardedReferrals: 1,
    });
  });
});

describe("claimReferralCodeForParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPrismaUniqueConstraintErrorMock.mockReturnValue(false);
  });

  it("throws REFERRAL_CODE_NOT_FOUND when code does not exist", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce(null);

    await expect(
      claimReferralCodeForParent("parent-referred", {
        code: "MISSING",
      }),
    ).rejects.toMatchObject({
      code: "REFERRAL_CODE_NOT_FOUND",
      status: 404,
    });
  });

  it("throws SELF_REFERRAL_NOT_ALLOWED when claiming own code", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce({
      id: "ref-1",
      parentId: "parent-referred",
      code: "ABCD1234",
    });

    await expect(
      claimReferralCodeForParent("parent-referred", {
        code: "ABCD1234",
      }),
    ).rejects.toMatchObject({
      code: "SELF_REFERRAL_NOT_ALLOWED",
      status: 409,
    });
  });

  it("returns idempotent existing attribution", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce({
      id: "ref-1",
      parentId: "parent-owner",
      code: "ABCD1234",
    });
    prismaMock.referralAttribution.findUnique.mockResolvedValueOnce({
      id: "attr-1",
      referredParentId: "parent-referred",
    });

    const result = await claimReferralCodeForParent("parent-referred", {
      code: "abcd1234",
    });

    expect(result).toEqual({
      idempotent: true,
      attribution: {
        id: "attr-1",
        referredParentId: "parent-referred",
      },
    });
    expect(prismaMock.referralAttribution.create).not.toHaveBeenCalled();
  });

  it("creates new attribution for valid referral claim", async () => {
    prismaMock.referralCode.findUnique.mockResolvedValueOnce({
      id: "ref-1",
      parentId: "parent-owner",
      code: "ABCD1234",
    });
    prismaMock.referralAttribution.findUnique.mockResolvedValueOnce(null);
    prismaMock.referralAttribution.create.mockResolvedValueOnce({
      id: "attr-new",
      referralCodeId: "ref-1",
      referredParentId: "parent-referred",
    });

    const result = await claimReferralCodeForParent("parent-referred", {
      code: "ABCD1234",
    });

    expect(result).toEqual({
      idempotent: false,
      attribution: {
        id: "attr-new",
        referralCodeId: "ref-1",
        referredParentId: "parent-referred",
      },
    });
  });

  it("handles referredParent unique collision by returning fallback attribution", async () => {
    const uniqueError = new Error("duplicate referredParentId");

    prismaMock.referralCode.findUnique.mockResolvedValueOnce({
      id: "ref-1",
      parentId: "parent-owner",
      code: "ABCD1234",
    });
    prismaMock.referralAttribution.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "attr-race",
        referredParentId: "parent-referred",
      });
    prismaMock.referralAttribution.create.mockRejectedValueOnce(uniqueError);
    isPrismaUniqueConstraintErrorMock.mockImplementation((error: unknown, fields: string[]) => {
      return error === uniqueError && fields.join(",") === "referredparentid";
    });

    const result = await claimReferralCodeForParent("parent-referred", {
      code: "ABCD1234",
    });

    expect(result).toEqual({
      idempotent: true,
      attribution: {
        id: "attr-race",
        referredParentId: "parent-referred",
      },
    });
  });
});
