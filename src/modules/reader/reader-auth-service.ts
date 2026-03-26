import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { LEGAL_POLICY_VERSION } from "@/lib/legal/legal-policy-version";
import { DomainError } from "@/modules/platform/errors";
import { createAuditLog } from "@/modules/platform/audit-service";
import {
  createReaderSession,
  deleteExpiredReaderSessions,
  deleteReaderSessionByTokenHash,
  findReaderByEmail,
  findReaderSessionByTokenHash,
  updateReaderLastLogin,
} from "@/modules/reader/reader-repository";

export const READER_SESSION_COOKIE_NAME = "ccth_reader_session";
export const READER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const signupReaderSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(120),
  displayName: z.string().trim().min(1).max(80).optional(),
  legalAccepted: z.literal(true),
});

const loginReaderSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(120),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildReaderDisplayName(email: string, displayName?: string) {
  if (displayName && displayName.trim().length > 0) {
    return displayName.trim();
  }
  return email.split("@")[0] ?? email;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function getReaderSessionTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const segments = cookieHeader.split(";");
  for (const segment of segments) {
    const [rawName, ...rawValueParts] = segment.trim().split("=");
    if (rawName !== READER_SESSION_COOKIE_NAME) {
      continue;
    }
    const rawValue = rawValueParts.join("=").trim();
    if (rawValue.length === 0) {
      return null;
    }
    return rawValue;
  }

  return null;
}

export async function signupReader(
  input: unknown,
  context?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const payload = signupReaderSchema.parse(input);
  const normalizedEmail = normalizeEmail(payload.email);

  const existing = await findReaderByEmail(normalizedEmail);
  if (existing) {
    throw new DomainError("Email already exists", 409, "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(payload.password);
  const sessionToken = generateSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const sessionExpiresAt = new Date(Date.now() + READER_SESSION_MAX_AGE_SECONDS * 1000);
  const acceptedAt = new Date().toISOString();

  const reader = await prisma.$transaction(async (tx) => {
    const nextReader = await tx.readerAccount.create({
      data: {
        email: normalizedEmail,
        displayName: buildReaderDisplayName(normalizedEmail, payload.displayName),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        image: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.readerSession.create({
      data: {
        readerId: nextReader.id,
        tokenHash: sessionTokenHash,
        expiresAt: sessionExpiresAt,
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
      },
    });

    await createAuditLog({
      dbClient: tx,
      actorType: "reader",
      actorId: nextReader.id,
      action: "LEGAL_CONSENT_ACCEPTED",
      resourceType: "reader_account",
      resourceId: nextReader.id,
      metadata: {
        policyVersion: LEGAL_POLICY_VERSION,
        policyScope: ["terms", "privacy", "cookie"],
        acceptedAt,
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
        source: "signup_form",
      },
    });

    return nextReader;
  });

  return {
    reader,
    sessionToken,
  };
}

export async function loginReader(
  input: unknown,
  context?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const payload = loginReaderSchema.parse(input);
  const normalizedEmail = normalizeEmail(payload.email);

  const reader = await findReaderByEmail(normalizedEmail);
  if (!reader || !reader.isActive) {
    throw new DomainError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const matched = await verifyPassword(payload.password, reader.passwordHash);
  if (!matched) {
    throw new DomainError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const updatedReader = await updateReaderLastLogin(reader.id);
  const sessionToken = generateSessionToken();

  await createReaderSession({
    readerId: updatedReader.id,
    tokenHash: hashSessionToken(sessionToken),
    expiresAt: new Date(Date.now() + READER_SESSION_MAX_AGE_SECONDS * 1000),
    ipAddress: context?.ipAddress ?? null,
    userAgent: context?.userAgent ?? null,
  });

  return {
    reader: updatedReader,
    sessionToken,
  };
}

export async function getReaderBySessionToken(sessionToken: string | null | undefined) {
  if (!sessionToken) {
    return null;
  }

  await deleteExpiredReaderSessions();
  const session = await findReaderSessionByTokenHash(hashSessionToken(sessionToken));
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now() || !session.reader.isActive) {
    await deleteReaderSessionByTokenHash(session.tokenHash);
    return null;
  }

  return session.reader;
}

export async function logoutReader(sessionToken: string | null | undefined) {
  if (!sessionToken) {
    return { count: 0 };
  }

  return deleteReaderSessionByTokenHash(hashSessionToken(sessionToken));
}
