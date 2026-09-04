import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireParentAndOwnedChildMock } = vi.hoisted(() => ({
  requireParentAndOwnedChildMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-parent-child", () => ({
  requireParentAndOwnedChild: requireParentAndOwnedChildMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    abekaAssignment: { findUnique: vi.fn(), update: vi.fn() },
    abekaWatchProgress: { upsert: vi.fn() },
  },
}));

import { POST } from "@/app/api/curriculum/complete/route";

describe("POST /api/curriculum/complete auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without a parent session cookie", async () => {
    requireParentAndOwnedChildMock.mockResolvedValueOnce({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const response = await POST(
      new Request("http://localhost/api/curriculum/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId: "child-1", assignmentId: "asg-1" }),
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(requireParentAndOwnedChildMock).toHaveBeenCalled();
  });
});
