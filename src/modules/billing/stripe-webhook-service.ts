import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export { mapStripeEventToBillingWebhookPayload } from "@/modules/billing/stripe-webhook-map";

function parseStripeSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) {
    return null;
  }

  const segments = signatureHeader
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }

  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const segment of segments) {
    const [key, value] = segment.split("=", 2);
    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        timestamp = parsed;
      }
      continue;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function hasMatchingSignature(expected: string, candidates: string[]) {
  const expectedBuffer = Buffer.from(expected, "hex");
  for (const candidate of candidates) {
    const candidateBuffer = Buffer.from(candidate, "hex");
    if (candidateBuffer.length !== expectedBuffer.length) {
      continue;
    }

    if (timingSafeEqual(expectedBuffer, candidateBuffer)) {
      return true;
    }
  }

  return false;
}

export function isValidStripeWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  secrets?: string[];
  toleranceSeconds?: number;
  nowMs?: number;
}) {
  const parsedSignature = parseStripeSignatureHeader(input.signatureHeader);
  if (!parsedSignature) {
    return false;
  }

  const nowMs = input.nowMs ?? Date.now();
  const toleranceSeconds = input.toleranceSeconds ?? env.STRIPE_WEBHOOK_TOLERANCE_SECONDS;
  const ageSeconds = Math.floor(Math.abs(nowMs - parsedSignature.timestamp * 1000) / 1000);
  if (ageSeconds > toleranceSeconds) {
    return false;
  }

  const secrets = (input.secrets ?? env.STRIPE_WEBHOOK_SECRETS).filter((item) => item.length > 0);
  if (secrets.length === 0) {
    return false;
  }

  const signedPayload = `${parsedSignature.timestamp}.${input.rawBody}`;
  for (const secret of secrets) {
    const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
    if (hasMatchingSignature(expected, parsedSignature.signatures)) {
      return true;
    }
  }

  return false;
}
