import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminFromRequestMock, assertTrustedOriginMock, renderMarkdownMock } = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  renderMarkdownMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/modules/blog/blog-markdown", () => ({
  renderMarkdown: renderMarkdownMock,
}));

import { POST } from "@/app/api/blog/preview-markdown/route";

describe("blog preview-markdown route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
    });
    renderMarkdownMock.mockResolvedValue("<p>preview</p>");
  });

  it("returns 400 when body is invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/preview-markdown", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: "{invalid-json",
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid JSON payload");
  });

  it("renders markdown for authorized admin requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/preview-markdown", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ markdown: "# Heading" }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ html: "<p>preview</p>" });
    expect(renderMarkdownMock).toHaveBeenCalledWith("# Heading");
  });
});
