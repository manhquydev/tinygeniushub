import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { DomainError } from "@/modules/platform/errors";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function normalizeSignatureValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value as JsonValue);
}

export function buildPayosSignaturePayload(data: Record<string, unknown>) {
  const keys = Object.keys(data).sort((a, b) => a.localeCompare(b));
  return keys
    .filter((key) => key !== "signature")
    .map((key) => `${key}=${normalizeSignatureValue(data[key])}`)
    .join("&");
}

export function signPayosPayload(data: Record<string, unknown>) {
  const payload = buildPayosSignaturePayload(data);
  return createHmac("sha256", env.PAYOS_CHECKSUM_KEY ?? "").update(payload).digest("hex");
}

export function isValidPayosSignature(input: {
  signature: string | null | undefined;
  data: Record<string, unknown>;
}) {
  if (!input.signature || !env.PAYOS_CHECKSUM_KEY) {
    return false;
  }
  if (!/^[a-f0-9]+$/i.test(input.signature) || input.signature.length % 2 !== 0) {
    return false;
  }

  const expected = signPayosPayload(input.data);
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(input.signature, "hex");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export type CreatePayosPaymentLinkInput = {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number;
  buyerName?: string;
  buyerEmail?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

export type PayosPaymentLink = {
  checkoutUrl: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
  status?: string;
  expiredAt?: number;
};

type PayosCreateLinkResponse = {
  code?: unknown;
  desc?: unknown;
  data?: {
    checkoutUrl?: unknown;
    paymentLinkId?: unknown;
    orderCode?: unknown;
    amount?: unknown;
    status?: unknown;
    expiredAt?: unknown;
  } | null;
};

function buildPayosCreateLinkSignatureInput(input: CreatePayosPaymentLinkInput) {
  // PayOS create-payment-link signature contract:
  // amount, cancelUrl, description, orderCode, returnUrl
  return {
    amount: input.amount,
    cancelUrl: input.cancelUrl,
    description: input.description,
    orderCode: input.orderCode,
    returnUrl: input.returnUrl,
  };
}

function assertPayosConfigured() {
  if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) {
    throw new DomainError("PayOS is not configured", 500, "PAYOS_MISCONFIGURED");
  }
}

export async function createPayosPaymentLink(input: CreatePayosPaymentLinkInput): Promise<PayosPaymentLink> {
  assertPayosConfigured();
  const clientId = env.PAYOS_CLIENT_ID;
  const apiKey = env.PAYOS_API_KEY;
  if (!clientId || !apiKey) {
    throw new DomainError("PayOS is not configured", 500, "PAYOS_MISCONFIGURED");
  }

  const payload: Record<string, unknown> = {
    orderCode: input.orderCode,
    amount: input.amount,
    description: input.description,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
  };

  if (input.expiredAt) payload.expiredAt = input.expiredAt;
  if (input.buyerName) payload.buyerName = input.buyerName;
  if (input.buyerEmail) payload.buyerEmail = input.buyerEmail;
  if (input.items && input.items.length > 0) payload.items = input.items;

  payload.signature = signPayosPayload(buildPayosCreateLinkSignatureInput(input));

  let response: Response;
  try {
    response = await fetch(`${env.PAYOS_API_BASE_URL}/v2/payment-requests`, {
      method: "POST",
      headers: {
        "x-client-id": clientId,
        "x-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new DomainError("PayOS request failed", 502, "PAYOS_REQUEST_FAILED");
  }

  const body = (await response.json().catch(() => null)) as PayosCreateLinkResponse | null;
  if (!response.ok || !body || body.code !== "00" || !body.data) {
    throw new DomainError("PayOS create payment link failed", 502, "PAYOS_REQUEST_FAILED");
  }

  const checkoutUrl = typeof body.data.checkoutUrl === "string" ? body.data.checkoutUrl : null;
  const paymentLinkId = typeof body.data.paymentLinkId === "string" ? body.data.paymentLinkId : null;
  const orderCode = typeof body.data.orderCode === "number" ? body.data.orderCode : null;
  const amount = typeof body.data.amount === "number" ? body.data.amount : null;

  if (!checkoutUrl || !paymentLinkId || !orderCode || amount === null) {
    throw new DomainError("PayOS response payload is invalid", 502, "PAYOS_INVALID_RESPONSE");
  }

  return {
    checkoutUrl,
    paymentLinkId,
    orderCode,
    amount,
    status: typeof body.data.status === "string" ? body.data.status : undefined,
    expiredAt: typeof body.data.expiredAt === "number" ? body.data.expiredAt : undefined,
  };
}

