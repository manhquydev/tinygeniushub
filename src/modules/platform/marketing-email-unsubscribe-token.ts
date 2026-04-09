import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function buildSignature(parentId: string, parentEmail: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${parentId}:${parentEmail.trim().toLowerCase()}`)
    .digest("hex");
}

export function createMarketingEmailUnsubscribeToken(input: {
  parentId: string;
  parentEmail: string;
}) {
  const signature = buildSignature(input.parentId, input.parentEmail);
  return `${input.parentId}.${signature}`;
}

export function parseMarketingEmailUnsubscribeToken(token: string) {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  const parentId = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (parentId.length === 0 || signature.length === 0) {
    return null;
  }

  return { parentId, signature };
}

export function verifyMarketingEmailUnsubscribeToken(input: {
  token: string;
  parentEmail: string;
}) {
  const parsed = parseMarketingEmailUnsubscribeToken(input.token);
  if (!parsed) {
    return null;
  }

  const expectedSignature = buildSignature(parsed.parentId, input.parentEmail);
  const receivedBuffer = Buffer.from(parsed.signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  return parsed.parentId;
}
