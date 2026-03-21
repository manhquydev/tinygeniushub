import { PaymentStatus, WebhookStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

export const adminPaymentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
});

export const adminWebhookQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(WebhookStatus).optional(),
});

export const adminPaymentExportQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  status: z.union([z.literal("ALL"), z.nativeEnum(PaymentStatus)]).default("ALL"),
});

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(64),
  discountPercent: z.coerce.number().int().min(5).max(100),
  maxUses: z
    .union([z.coerce.number().int().min(1), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : value)),
  expiresAt: z
    .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : value)),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(3).max(64),
});

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

function assertCouponCodeFormat(code: string) {
  if (!/^[A-Z0-9_-]{3,64}$/.test(code)) {
    throw new DomainError(
      "Mã giảm giá chỉ gồm chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.",
      400,
      "INVALID_COUPON_CODE",
    );
  }
}

export async function listCoupons(limit = 100) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  return prisma.couponCode.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: normalizedLimit,
    select: {
      id: true,
      code: true,
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function createCoupon(
  input: {
    code: string;
    discountPercent: number;
    maxUses?: number | null;
    expiresAt?: Date | null;
  },
  adminEmail: string,
) {
  const payload = createCouponSchema.parse(input);
  const normalizedCode = normalizeCouponCode(payload.code);
  assertCouponCodeFormat(normalizedCode);

  if (payload.expiresAt && payload.expiresAt <= new Date()) {
    throw new DomainError("Thời gian hết hạn phải ở tương lai.", 400, "INVALID_COUPON_EXPIRES_AT");
  }

  return prisma.couponCode.create({
    data: {
      code: normalizedCode,
      discountPercent: payload.discountPercent,
      maxUses: payload.maxUses,
      expiresAt: payload.expiresAt,
      createdBy: adminEmail,
      active: true,
    },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function toggleCoupon(id: string) {
  const existing = await prisma.couponCode.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      active: true,
    },
  });

  if (!existing) {
    throw new DomainError("Không tìm thấy mã giảm giá.", 404, "COUPON_NOT_FOUND");
  }

  return prisma.couponCode.update({
    where: {
      id,
    },
    data: {
      active: !existing.active,
    },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function validateCoupon(codeInput: string) {
  const payload = validateCouponSchema.parse({
    code: codeInput,
  });

  const code = normalizeCouponCode(payload.code);
  const now = new Date();

  const coupon = await prisma.couponCode.findUnique({
    where: {
      code,
    },
    select: {
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
    },
  });

  if (!coupon) {
    return { valid: false, message: "Mã giảm giá không tồn tại." };
  }

  if (!coupon.active) {
    return { valid: false, message: "Mã giảm giá đã tạm ngưng." };
  }

  if (coupon.expiresAt && coupon.expiresAt <= now) {
    return { valid: false, message: "Mã giảm giá đã hết hạn." };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "Mã giảm giá đã hết lượt sử dụng." };
  }

  return {
    valid: true,
    discountPercent: coupon.discountPercent,
  };
}

export async function listAdminPaymentsForExport(input: unknown) {
  const query = adminPaymentExportQuerySchema.parse(input);
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;

  if (query.from >= query.to) {
    throw new DomainError("`from` must be before `to`", 400, "INVALID_DATE_RANGE");
  }

  if (query.to.getTime() - query.from.getTime() > maxRangeMs) {
    throw new DomainError("Date range cannot exceed 90 days", 400, "DATE_RANGE_TOO_LARGE");
  }

  const records = await prisma.paymentRecord.findMany({
    where: {
      processedAt: {
        gte: query.from,
        lte: query.to,
      },
      ...(query.status !== "ALL"
        ? {
            status: query.status,
          }
        : {}),
    },
    orderBy: {
      processedAt: "desc",
    },
    take: 5001,
    select: {
      id: true,
      provider: true,
      providerTransactionId: true,
      amountVnd: true,
      currency: true,
      status: true,
      processedAt: true,
      parent: {
        select: {
          email: true,
        },
      },
    },
  });

  return {
    rows: records.slice(0, 5000),
    truncated: records.length > 5000,
  };
}

export async function listPaymentRecordsAdmin(input: unknown) {
  const query = adminPaymentQuerySchema.parse(input);

  return prisma.paymentRecord.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: {
      processedAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      parentId: true,
      provider: true,
      providerTransactionId: true,
      amountVnd: true,
      currency: true,
      status: true,
      processedAt: true,
      parent: {
        select: {
          email: true,
        },
      },
    },
  });
}

export async function listWebhookEventsAdmin(input: unknown) {
  const query = adminWebhookQuerySchema.parse(input);

  return prisma.webhookEvent.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      provider: true,
      eventId: true,
      signatureValid: true,
      status: true,
      errorMessage: true,
      processedAt: true,
      createdAt: true,
    },
  });
}

