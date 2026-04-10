import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    childProfile: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import {
  createChildProfile,
  deleteChildProfile,
  isProfileLimitReached,
  listChildProfiles,
  updateChildProfile,
} from "@/modules/progress/children-service";

describe("isProfileLimitReached", () => {
  it("returns false when profile count is below limit", () => {
    expect(isProfileLimitReached(2, 3)).toBe(false);
  });

  it("returns true when profile count equals limit", () => {
    expect(isProfileLimitReached(3, 3)).toBe(true);
  });

  it("returns true when profile count exceeds limit", () => {
    expect(isProfileLimitReached(4, 3)).toBe(true);
  });
});

describe("children-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
      callback(prismaMock),
    );
  });

  it("lists child profiles for parent in created order", async () => {
    prismaMock.childProfile.findMany.mockResolvedValueOnce([{ id: "child-1" }]);

    const result = await listChildProfiles("parent-1");

    expect(result).toEqual([{ id: "child-1" }]);
    expect(prismaMock.childProfile.findMany).toHaveBeenCalledWith({
      where: { parentId: "parent-1" },
      orderBy: { createdAt: "asc" },
    });
  });

  it("creates child profile when parent has no existing profile", async () => {
    prismaMock.childProfile.count.mockResolvedValueOnce(0);
    prismaMock.childProfile.create.mockResolvedValueOnce({
      id: "child-1",
      nickname: "Kid One",
      ageBand: "4-5",
      avatarId: "avatar-1",
    });

    const result = await createChildProfile("parent-1", {
      nickname: "Kid One",
      ageBand: "4-5",
      avatarId: "avatar-1",
    });

    expect(result).toMatchObject({
      id: "child-1",
      nickname: "Kid One",
    });
    expect(prismaMock.childProfile.create).toHaveBeenCalledWith({
      data: {
        parentId: "parent-1",
        nickname: "Kid One",
        ageBand: "4-5",
        avatarId: "avatar-1",
      },
    });
  });

  it("throws PROFILE_LIMIT_REACHED when parent already has a profile", async () => {
    prismaMock.childProfile.count.mockResolvedValueOnce(1);

    await expect(
      createChildProfile("parent-1", {
        nickname: "Kid Limit",
        ageBand: "5-6",
      }),
    ).rejects.toMatchObject({
      code: "PROFILE_LIMIT_REACHED",
      status: 409,
    });

    expect(prismaMock.childProfile.create).not.toHaveBeenCalled();
  });

  it("retries create when serializable transaction conflicts once", async () => {
    const serializationError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
      code: "P2034",
    });
    prismaMock.$transaction
      .mockRejectedValueOnce(serializationError)
      .mockImplementationOnce(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock));
    prismaMock.childProfile.count.mockResolvedValueOnce(0);
    prismaMock.childProfile.create.mockResolvedValueOnce({
      id: "child-2",
      nickname: "Kid Retry",
      ageBand: "4-5",
    });

    const result = await createChildProfile("parent-1", {
      nickname: "Kid Retry",
      ageBand: "4-5",
    });

    expect(result).toMatchObject({
      id: "child-2",
      nickname: "Kid Retry",
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
  });

  it("updates existing child profile scoped to parent", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce({
      id: "child-1",
      parentId: "parent-1",
    });
    prismaMock.childProfile.update.mockResolvedValueOnce({
      id: "child-1",
      nickname: "Kid Updated",
      ageBand: "5-6",
    });

    const result = await updateChildProfile("parent-1", "child-1", {
      nickname: "Kid Updated",
      ageBand: "5-6",
    });

    expect(result).toMatchObject({
      id: "child-1",
      nickname: "Kid Updated",
    });
    expect(prismaMock.childProfile.update).toHaveBeenCalledWith({
      where: { id: "child-1" },
      data: {
        nickname: "Kid Updated",
        ageBand: "5-6",
      },
    });
  });

  it("throws CHILD_NOT_FOUND when updating missing child", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce(null);

    await expect(
      updateChildProfile("parent-1", "child-missing", {
        nickname: "Kid Updated",
      }),
    ).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
      status: 404,
    });
  });

  it("deletes existing child profile scoped to parent", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce({
      id: "child-1",
      parentId: "parent-1",
    });
    prismaMock.childProfile.delete.mockResolvedValueOnce({
      id: "child-1",
    });

    const result = await deleteChildProfile("parent-1", "child-1");

    expect(result).toEqual({ deleted: true });
    expect(prismaMock.childProfile.delete).toHaveBeenCalledWith({
      where: { id: "child-1" },
    });
  });

  it("throws CHILD_NOT_FOUND when deleting missing child", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce(null);

    await expect(deleteChildProfile("parent-1", "child-missing")).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
      status: 404,
    });
  });
});
