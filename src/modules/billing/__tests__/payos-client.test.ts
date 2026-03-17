import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("payos client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("PAYOS_CLIENT_ID", "client-id");
    vi.stubEnv("PAYOS_API_KEY", "api-key");
    vi.stubEnv("PAYOS_CHECKSUM_KEY", "checksum-key");
    vi.stubEnv("PAYOS_API_BASE_URL", "https://api-merchant.payos.vn");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds deterministic payload and ignores signature field", async () => {
    const { buildPayosSignaturePayload } = await import("@/modules/billing/payos-client");
    const payload = buildPayosSignaturePayload({
      b: 2,
      signature: "should-be-ignored",
      a: 1,
    });

    expect(payload).toBe("a=1&b=2");
  });

  it("signs create payment link using PayOS required fields only", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: "00",
          data: {
            checkoutUrl: "https://pay.payos.vn/web/abc",
            paymentLinkId: "plink_123",
            orderCode: 123456,
            amount: 120000,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { createPayosPaymentLink } = await import("@/modules/billing/payos-client");
    await createPayosPaymentLink({
      orderCode: 123456,
      amount: 120000,
      description: "CCTH12345",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      buyerEmail: "parent@example.com",
      items: [{ name: "Course", quantity: 1, price: 120000 }],
    });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    const requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const signingContract = [
      "amount=120000",
      "cancelUrl=https://example.com/cancel",
      "description=CCTH12345",
      "orderCode=123456",
      "returnUrl=https://example.com/return",
    ].join("&");
    const expected = createHmac("sha256", "checksum-key").update(signingContract).digest("hex");

    expect(requestBody.signature).toBe(expected);
  });

  it("verifies webhook signature using data payload contract", async () => {
    const { isValidPayosSignature, buildPayosSignaturePayload } = await import("@/modules/billing/payos-client");
    const webhookData = {
      orderCode: 123456,
      amount: 120000,
      description: "CCTH12345",
      accountNumber: "123456789",
      reference: "FT202603160001",
      transactionDateTime: "2026-03-16 10:00:00",
      currency: "VND",
      code: "00",
      desc: "success",
    };

    const contract = buildPayosSignaturePayload(webhookData);
    const signature = createHmac("sha256", "checksum-key").update(contract).digest("hex");

    expect(isValidPayosSignature({ signature, data: webhookData })).toBe(true);
    expect(isValidPayosSignature({ signature: "not-a-hex-signature", data: webhookData })).toBe(false);
  });
});

