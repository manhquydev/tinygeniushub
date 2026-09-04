import { beforeEach, describe, expect, it, vi } from "vitest";

const { getParentFromRequestMock, prismaMock } = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  prismaMock: {
    childProfile: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { requireParentAndOwnedChild } from "@/lib/auth/require-parent-child";

describe("requireParentAndOwnedChild", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without a parent session", async () => {
    getParentFromRequestMock.mockResolvedValueOnce(null);
    const result = await requireParentAndOwnedChild({} as never, "child-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 403 when the child is not owned by the parent", async () => {
    getParentFromRequestMock.mockResolvedValueOnce({ id: "parent-1" });
    prismaMock.childProfile.findFirst.mockResolvedValueOnce(null);
    const result = await requireParentAndOwnedChild({} as never, "child-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });
});
