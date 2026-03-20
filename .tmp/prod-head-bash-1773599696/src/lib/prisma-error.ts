import { Prisma } from "@prisma/client";

function extractTargetTokens(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.map((item) => String(item).toLowerCase());
  }

  if (typeof target === "string") {
    return [target.toLowerCase()];
  }

  return [];
}

export function isPrismaUniqueConstraintError(error: unknown, expectedTargets?: string[]) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  if (!expectedTargets || expectedTargets.length === 0) {
    return true;
  }

  const tokens = extractTargetTokens(error);
  if (tokens.length === 0) {
    return false;
  }

  const expected = expectedTargets.map((target) => target.toLowerCase());
  return expected.every((target) => tokens.some((token) => token.includes(target)));
}
