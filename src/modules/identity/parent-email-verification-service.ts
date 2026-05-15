import { createHash, randomBytes } from "node:crypto";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { resolveEmailPublicBaseUrl } from "@/lib/email/project-email-template-builder";
import { enqueueTransactionalEmail } from "@/worker/queue";

type ParentIdentity = {
  id: string;
  email: string;
  displayName: string | null;
};

type VerificationResult =
  | { status: "verified"; parentId: string }
  | { status: "invalid" }
  | { status: "expired" };

const TOKEN_BYTES = 32;

function normalizeTtlMinutes(value: number) {
  if (!Number.isFinite(value)) {
    return 15;
  }

  return Math.min(Math.max(Math.floor(value), 5), 1440);
}

function generateVerificationToken() {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildParentLabel(displayName: string | null, email: string) {
  const trimmedDisplayName = displayName?.trim();
  if (trimmedDisplayName && trimmedDisplayName.length > 0) {
    return trimmedDisplayName;
  }

  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : "parents";
}

function buildVerificationUrl(token: string) {
  const baseUrl = resolveEmailPublicBaseUrl();
  return `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function issueParentEmailVerificationChallenge(input: {
  parent: ParentIdentity;
  ttlMinutes: number;
}) {
  const ttlMinutes = normalizeTtlMinutes(input.ttlMinutes);
  const token = generateVerificationToken();
  const tokenHash = hashVerificationToken(token);
  const expiresAt = addMinutes(new Date(), ttlMinutes);

  await prisma.$transaction(async (tx) => {
    await tx.parentEmailVerificationToken.deleteMany({
      where: {
        parentId: input.parent.id,
        consumedAt: null,
      },
    });

    await tx.parentEmailVerificationToken.create({
      data: {
        parentId: input.parent.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  const verificationUrl = buildVerificationUrl(token);
  const parentLabel = buildParentLabel(input.parent.displayName, input.parent.email);
  const text = [
    `Hello${parentLabel},`,
    "",
    "Please verify your email to activate your TinyGenius Hub account.",
    `Click on the verification link:${verificationUrl}`,
    `The link is valid in${ttlMinutes}minute.`,
    "",
    "If you did not register, please ignore this email.",
  ].join("\n");

  await enqueueTransactionalEmail({
    to: input.parent.email,
    subject: "Verify TinyGenius Hub account email",
    text,
    tags: [
      { name: "feature", value: "parent_email_verify" },
      { name: "parent_id", value: input.parent.id },
    ],
  });

  return {
    expiresAt,
  };
}

export async function markParentEmailVerified(parentId: string) {
  await prisma.user.updateMany({
    where: { parentId },
    data: { emailVerified: true },
  });
}

export async function isParentEmailVerified(parentId: string) {
  const user = await prisma.user.findFirst({
    where: { parentId },
    select: { emailVerified: true },
  });

  return user?.emailVerified ?? false;
}

export async function consumeParentEmailVerificationToken(rawToken: string): Promise<VerificationResult> {
  const token = rawToken.trim();
  if (token.length === 0 || token.length > 512) {
    return { status: "invalid" };
  }

  const tokenHash = hashVerificationToken(token);
  const challenge = await prisma.parentEmailVerificationToken.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      parentId: true,
      expiresAt: true,
      consumedAt: true,
    },
  });

  if (!challenge) {
    return { status: "invalid" };
  }

  const now = new Date();
  if (challenge.consumedAt || challenge.expiresAt.getTime() <= now.getTime()) {
    return { status: "expired" };
  }

  const verified = await prisma.$transaction(async (tx) => {
    const consumed = await tx.parentEmailVerificationToken.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        consumedAt: now,
      },
    });

    if (consumed.count === 0) {
      return false;
    }

    await tx.parentEmailVerificationToken.updateMany({
      where: {
        parentId: challenge.parentId,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    await tx.user.updateMany({
      where: {
        parentId: challenge.parentId,
      },
      data: {
        emailVerified: true,
      },
    });

    return true;
  });

  if (!verified) {
    return { status: "expired" };
  }

  return {
    status: "verified",
    parentId: challenge.parentId,
  };
}
