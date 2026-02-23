import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendCaregiverInviteEmail, type CaregiverInviteEmailDelivery } from "@/lib/email/caregiver-invite-email";
import { env } from "@/lib/env";
import { logWarn } from "@/lib/observability/logger";
import { DomainError } from "@/modules/platform/errors";

const DEFAULT_CAREGIVER_LIMIT = 2;
const CAREGIVER_INVITE_TTL_DAYS = 7;

export const caregiverInviteInputSchema = z.object({
  email: z.string().trim().email().max(320),
});

const caregiverInviteTokenSchema = z.string().trim().min(1).max(191);

export type CaregiverInviteStatus = "pending" | "accepted" | "expired";

export type CaregiverInviteSummary = {
  id: string;
  email: string;
  accepted: boolean;
  createdAt: Date;
  expiresAt: Date;
  status: CaregiverInviteStatus;
};

export type CaregiverSnapshot = {
  caregiverLimit: number;
  usedSlots: number;
  caregivers: CaregiverInviteSummary[];
};

function getInviteStatus(invite: { accepted: boolean; expiresAt: Date }, now = new Date()): CaregiverInviteStatus {
  if (invite.accepted) {
    return "accepted";
  }

  if (invite.expiresAt.getTime() <= now.getTime()) {
    return "expired";
  }

  return "pending";
}

function buildInviteExpiryDate(referenceDate = new Date()) {
  const expiresAt = new Date(referenceDate);
  expiresAt.setDate(expiresAt.getDate() + CAREGIVER_INVITE_TTL_DAYS);
  return expiresAt;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getCaregiverLimit(parentId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { parentId },
    select: {
      caregiverLimit: true,
    },
  });

  return subscription?.caregiverLimit ?? DEFAULT_CAREGIVER_LIMIT;
}

export async function listCaregiverInvites(parentId: string): Promise<CaregiverSnapshot> {
  const [caregiverLimit, caregiversCount, invites] = await Promise.all([
    getCaregiverLimit(parentId),
    prisma.caregiverAccount.count({
      where: { parentId },
    }),
    prisma.caregiverInvite.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        accepted: true,
        createdAt: true,
        expiresAt: true,
      },
    }),
  ]);

  const caregivers = invites.map((invite) => ({
    ...invite,
    status: getInviteStatus(invite),
  }));
  const pendingInvites = caregivers.filter((invite) => invite.status === "pending").length;
  const usedSlots = Math.min(caregiverLimit, caregiversCount + pendingInvites);

  return {
    caregiverLimit,
    usedSlots,
    caregivers,
  };
}

export async function createCaregiverInvite(parentId: string, input: z.infer<typeof caregiverInviteInputSchema>) {
  const parsed = caregiverInviteInputSchema.parse(input);
  const normalizedEmail = normalizeEmail(parsed.email);
  const now = new Date();

  const [parent, caregiverLimit, caregiversCount, pendingInvites, existingCaregiver, existingInvite] = await Promise.all([
    prisma.parentAccount.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    }),
    getCaregiverLimit(parentId),
    prisma.caregiverAccount.count({
      where: { parentId },
    }),
    prisma.caregiverInvite.count({
      where: {
        parentId,
        accepted: false,
        expiresAt: {
          gt: now,
        },
      },
    }),
    prisma.caregiverAccount.findFirst({
      where: {
        parentId,
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    }),
    prisma.caregiverInvite.findFirst({
      where: {
        parentId,
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  if (caregiversCount + pendingInvites >= caregiverLimit) {
    throw new DomainError("Caregiver limit reached for current subscription plan", 409, "CAREGIVER_LIMIT_REACHED");
  }

  if (existingCaregiver) {
    throw new DomainError("Email is already linked as caregiver", 409, "CAREGIVER_ALREADY_EXISTS");
  }

  if (existingInvite) {
    throw new DomainError("Invite already exists for this email", 409, "CAREGIVER_INVITE_EXISTS");
  }

  const invite = await prisma.caregiverInvite.create({
    data: {
      parentId,
      email: normalizedEmail,
      expiresAt: buildInviteExpiryDate(now),
    },
    select: {
      id: true,
      email: true,
      token: true,
      accepted: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  const inviteUrl = `${env.BETTER_AUTH_URL}/accept-invite?token=${encodeURIComponent(invite.token)}`;

  let emailDelivery: CaregiverInviteEmailDelivery = {
    provider: env.REPORT_EMAIL_PROVIDER,
    attempted: false,
    sent: false,
  };

  try {
    emailDelivery = await sendCaregiverInviteEmail({
      to: invite.email,
      parentDisplayName: parent.displayName,
      inviteUrl,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    logWarn("caregiver.invite.email_failed", {
      parentId,
      inviteId: invite.id,
      email: invite.email,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return {
    invite: {
      id: invite.id,
      email: invite.email,
      accepted: invite.accepted,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      status: getInviteStatus(invite, now),
    } satisfies CaregiverInviteSummary,
    emailDelivery,
  };
}

export async function revokeCaregiverInvite(parentId: string, inviteId: string) {
  const invite = await prisma.caregiverInvite.findFirst({
    where: {
      id: inviteId,
      parentId,
    },
    select: {
      id: true,
    },
  });

  if (!invite) {
    throw new DomainError("Caregiver invite not found", 404, "CAREGIVER_INVITE_NOT_FOUND");
  }

  await prisma.caregiverInvite.delete({
    where: {
      id: invite.id,
    },
  });

  return {
    inviteId: invite.id,
  };
}

export async function acceptCaregiverInviteByToken(token: string) {
  const parsedToken = caregiverInviteTokenSchema.parse(token);
  const now = new Date();

  const invite = await prisma.caregiverInvite.findUnique({
    where: {
      token: parsedToken,
    },
    select: {
      id: true,
      accepted: true,
      expiresAt: true,
      parent: {
        select: {
          displayName: true,
        },
      },
    },
  });

  if (!invite) {
    throw new DomainError("Lời mời không hợp lệ.", 404, "CAREGIVER_INVITE_INVALID");
  }

  if (invite.accepted) {
    throw new DomainError("Lời mời này đã được chấp nhận trước đó.", 409, "CAREGIVER_INVITE_ACCEPTED");
  }

  if (invite.expiresAt.getTime() <= now.getTime()) {
    throw new DomainError("Lời mời này đã hết hạn.", 410, "CAREGIVER_INVITE_EXPIRED");
  }

  const updatedInvite = await prisma.caregiverInvite.update({
    where: {
      id: invite.id,
    },
    data: {
      accepted: true,
    },
    select: {
      parent: {
        select: {
          displayName: true,
        },
      },
    },
  });

  return {
    parentDisplayName: updatedInvite.parent.displayName,
  };
}
