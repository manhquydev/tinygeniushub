import { beforeEach, describe, expect, it, vi } from "vitest";

const { redisMock, pipelineExecMock } = vi.hoisted(() => {
  const pipelineExec = vi.fn();
  const pipeline = {
    sadd: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: pipelineExec,
  };

  return {
    pipelineExecMock: pipelineExec,
    redisMock: {
      pipeline: vi.fn(() => pipeline),
      scard: vi.fn(),
    },
  };
});

vi.mock("@/lib/redis", () => ({
  redis: redisMock,
}));

import { getActiveSessionCount, getActiveUserCount, trackUserActivity } from "@/lib/analytics/realtime/counters-service";

describe("counters-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns realtime counters from redis when connection is healthy", async () => {
    redisMock.scard.mockResolvedValueOnce(7).mockResolvedValueOnce(11);

    await expect(getActiveUserCount()).resolves.toBe(7);
    await expect(getActiveSessionCount()).resolves.toBe(11);
  });

  it("returns zero counters when redis is unavailable", async () => {
    redisMock.scard
      .mockRejectedValueOnce(new Error("Stream isn't writeable and enableOfflineQueue options is false"))
      .mockRejectedValueOnce(new Error("Connection is closed."));

    await expect(getActiveUserCount()).resolves.toBe(0);
    await expect(getActiveSessionCount()).resolves.toBe(0);
  });

  it("rethrows unexpected counter errors", async () => {
    redisMock.scard.mockRejectedValueOnce(new Error("unexpected_redis_error"));
    await expect(getActiveUserCount()).rejects.toThrow("unexpected_redis_error");
  });

  it("swallows redis unavailability in tracking path", async () => {
    pipelineExecMock.mockRejectedValueOnce(new Error("connect ECONNREFUSED"));
    await expect(trackUserActivity("user-1", "session-1")).resolves.toBeUndefined();
  });

  it("rethrows unexpected tracking errors", async () => {
    pipelineExecMock.mockRejectedValueOnce(new Error("pipeline broken"));
    await expect(trackUserActivity("user-1", "session-1")).rejects.toThrow("pipeline broken");
  });
});
