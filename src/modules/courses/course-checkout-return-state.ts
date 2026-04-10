import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const CHECKOUT_RETURN_STATE_VERSION = 1;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

type CheckoutReturnStatePayload = {
  v: number;
  o: string;
  p: string;
  iat: number;
};

function buildSignature(payloadSegment: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(payloadSegment)
    .digest("base64url");
}

function parsePayloadSegment(payloadSegment: string): CheckoutReturnStatePayload | null {
  try {
    const decoded = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<CheckoutReturnStatePayload>;
    if (
      parsed.v !== CHECKOUT_RETURN_STATE_VERSION ||
      typeof parsed.o !== "string" ||
      parsed.o.length === 0 ||
      typeof parsed.p !== "string" ||
      parsed.p.length === 0 ||
      typeof parsed.iat !== "number" ||
      !Number.isFinite(parsed.iat)
    ) {
      return null;
    }

    return {
      v: parsed.v,
      o: parsed.o,
      p: parsed.p,
      iat: parsed.iat,
    };
  } catch {
    return null;
  }
}

export function createCheckoutReturnState(input: {
  orderCode: string;
  parentId: string;
  issuedAtMs?: number;
}) {
  const payload: CheckoutReturnStatePayload = {
    v: CHECKOUT_RETURN_STATE_VERSION,
    o: input.orderCode,
    p: input.parentId,
    iat: input.issuedAtMs ?? Date.now(),
  };
  const payloadSegment = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signatureSegment = buildSignature(payloadSegment);
  return `${payloadSegment}.${signatureSegment}`;
}

export function hashCheckoutReturnState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export function verifyCheckoutReturnState(input: {
  state: string;
  orderCode: string;
  parentId: string;
  maxAgeMs: number;
  nowMs?: number;
}) {
  const parts = input.state.split(".", 2);
  if (parts.length !== 2) {
    return false;
  }

  const [payloadSegment, signatureSegment] = parts;
  if (!payloadSegment || !signatureSegment) {
    return false;
  }

  const expectedSignature = buildSignature(payloadSegment);
  const providedBuffer = Buffer.from(signatureSegment, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  const payload = parsePayloadSegment(payloadSegment);
  if (!payload) {
    return false;
  }

  if (payload.o !== input.orderCode || payload.p !== input.parentId) {
    return false;
  }

  const nowMs = input.nowMs ?? Date.now();
  if (payload.iat > nowMs + MAX_CLOCK_SKEW_MS) {
    return false;
  }

  if (nowMs - payload.iat > input.maxAgeMs) {
    return false;
  }

  return true;
}
