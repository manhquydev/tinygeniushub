import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  consumeParentEmailVerificationTokenMock,
  enqueueLifecycleEmailMock,
  logWarnMock,
} = vi.hoisted(() => ({
  consumeParentEmailVerificationTokenMock: vi.fn(),
  enqueueLifecycleEmailMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/modules/identity/parent-email-verification-service", () => ({
  consumeParentEmailVerificationToken: consumeParentEmailVerificationTokenMock,
}));

vi.mock("@/worker/queue", () => ({
  enqueueLifecycleEmail: enqueueLifecycleEmailMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn: logWarnMock,
}));

vi.mock("@/lib/email/project-email-template-builder", () => ({
  resolveEmailPublicBaseUrl: vi.fn(() => "https://tinygeniushubvn.tech"),
}));

import { GET } from "@/app/api/auth/verify-email/route";

describe("auth verify-email route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueueLifecycleEmailMock.mockResolvedValue(undefined);
  });

  it("redirects to login with missing status when token is absent", async () => {
    const response = await GET(new Request("http://localhost/api/auth/verify-email"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tinygeniushubvn.tech/auth/login?verify=missing");
    expect(consumeParentEmailVerificationTokenMock).not.toHaveBeenCalled();
  });

  it("redirects to login with invalid status for unknown token", async () => {
    consumeParentEmailVerificationTokenMock.mockResolvedValueOnce({ status: "invalid" });

    const response = await GET(new Request("http://localhost/api/auth/verify-email?token=abc"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tinygeniushubvn.tech/auth/login?verify=invalid");
  });

  it("redirects to login with expired status when token expired", async () => {
    consumeParentEmailVerificationTokenMock.mockResolvedValueOnce({ status: "expired" });

    const response = await GET(new Request("http://localhost/api/auth/verify-email?token=abc"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tinygeniushubvn.tech/auth/login?verify=expired");
  });

  it("redirects to login success and enqueues lifecycle email when token is verified", async () => {
    consumeParentEmailVerificationTokenMock.mockResolvedValueOnce({
      status: "verified",
      parentId: "parent-1",
    });

    const response = await GET(new Request("http://localhost/api/auth/verify-email?token=abc"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tinygeniushubvn.tech/auth/login?verify=success");
    expect(enqueueLifecycleEmailMock).toHaveBeenCalledWith("parent-1", "TRIAL_WELCOME");
  });
});
