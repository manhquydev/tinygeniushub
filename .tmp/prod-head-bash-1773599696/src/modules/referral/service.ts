import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isPrismaUniqueConstraintError } from "@/lib/prisma-error";
import { DomainError } from "@/modules/platform/errors";

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;
const MAX_CODE_GENERATION_ATTEMPTS = 8;

export const claimReferralCodeSchema = z.object({
  code: z.string().min(4).max(32),
});

export function normalizeReferralCode(code: string) {
  return code.trim().toUpperCase();
}

function generateReferralCodeCandidate() {
  const bytes = randomBytes(REFERRAL_CODE_LENGTH);

  let code = "";
  for (const byte of bytes) {
    code += REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length];
  }

  return code;
}

async function createUniqueReferralCode(parentId: string) {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const candidateCode = generateReferralCodeCandidate();

    try {
      return await prisma.referralCode.create({
        data: {
          parentId,
          code: candidateCode,
        },
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error, ["code"])) {
        throw error;
      }
    }
  }

  throw new DomainError("Unable to generate unique referral code", 500, "REFERRAL_CODE_GENERATION_FAILED");
}

export async function ensureReferralCodeForParent(parentId: string) {
  const existing = await prisma.referralCode.findUnique({
    where: { parentId },
  });

  if (existing) {
    return existing;
  }

  try {
    return await createUniqueReferralCode(parentId);
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error, ["parentid"])) {
      throw error;
    }

    const fallback = await prisma.referralCode.findUnique({
      where: { parentId },
    });

    if (fallback) {
      return fallback;
    }

    throw error;
  }
}

export async function getReferralSummaryForParent(parentId: string) {
  const referralCode = await ensureReferralCodeForParent(parentId);

  const [totalReferrals, paidReferrals, rewardedReferrals] = await Promise.all([
    prisma.referralAttribution.count({
      where: {
        referralCodeId: referralCode.id,
      },
    }),
    prisma.referralAttribution.count({
      where: {
        referralCodeId: referralCode.id,
        paidAt: { not: null },
      },
    }),
    prisma.referralAttribution.count({
      where: {
        referralCodeId: referralCode.id,
        rewardGranted: true,
      },
    }),
  ]);

  return {
    code: referralCode.code,
    totalReferrals,
    paidReferrals,
    rewardedReferrals,
  };
}

export async function getReferralSummaryForParentReadOnly(parentId: string) {
  const referralCode = await prisma.referralCode.findUnique({
    where: { parentId },
  });

  if (!referralCode) {
    return {
      code: null,
      totalReferrals: 0,
      paidReferrals: 0,
      rewardedReferrals: 0,
    };
  }

  const [totalReferrals, paidReferrals, rewardedReferrals] = await Promise.all([
    prisma.referralAttribution.count({
      where: {
        referralCodeId: referralCode.id,
      },
    }),
    prisma.referralAttribution.count({
      where: {
        referralCodeId: referralCode.id,
        paidAt: { not: null },
      },
    }),
    prisma.referralAttribution.count({
      where: {
        referralCodeId: referralCode.id,
        rewardGranted: true,
      },
    }),
  ]);

  return {
    code: referralCode.code,
    totalReferrals,
    paidReferrals,
    rewardedReferrals,
  };
}

export async function claimReferralCodeForParent(
  referredParentId: string,
  input: z.infer<typeof claimReferralCodeSchema>,
) {
  const parsed = claimReferralCodeSchema.parse(input);
  const code = normalizeReferralCode(parsed.code);

  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
  });

  if (!referralCode) {
    throw new DomainError("Referral code not found", 404, "REFERRAL_CODE_NOT_FOUND");
  }

  if (referralCode.parentId === referredParentId) {
    throw new DomainError("Cannot claim your own referral code", 409, "SELF_REFERRAL_NOT_ALLOWED");
  }

  const existing = await prisma.referralAttribution.findUnique({
    where: { referredParentId },
  });

  if (existing) {
    return {
      idempotent: true,
      attribution: existing,
    };
  }

  try {
    const attribution = await prisma.referralAttribution.create({
      data: {
        referralCodeId: referralCode.id,
        referredParentId,
      },
    });

    return {
      idempotent: false,
      attribution,
    };
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error, ["referredparentid"])) {
      throw error;
    }

    const fallback = await prisma.referralAttribution.findUnique({
      where: { referredParentId },
    });

    if (fallback) {
      return {
        idempotent: true,
        attribution: fallback,
      };
    }

    throw error;
  }
}
