import { beforeEach, describe, expect, it, vi } from "vitest";

const { scardMock, execMock, saddMock, expireMock, pipelineMock, logWarnMock } = vi.hoisted(() => ({
  scardMock: vi.fn(),
  execMock: vi.fn(),
  saddMock: vi.fn(),
  expireMock: vi.fn(),
  pipelineMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    scard: scardMock,
    pipeline: pipelineMock,
  },
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn: logWarnMock,
}));

import {
  getActiveSessionCount,
  getActiveUserCount,
  trackUserActivity,
} from "@/lib/analytics/realtime/counters-service";

describe("counters-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    saddMock.mockReturnValue(undefined);
    expireMock.mockReturnValue(undefined);
    execMock.mockResolvedValue(undefined);
    pipelineMock.mockReturnValue({
      sadd: saddMock,
      expire: expireMock,
      exec: execMock,
    });
  });

  it("returns zero when redis is unavailable for active user count", async () => {
    scardMock.mockRejectedValueOnce(new Error("Stream isn't writeable and enableOfflineQueue options is false"));

    await expect(getActiveUserCount()).resolves.toBe(0);
  });

  it("returns zero when redis is unavailable for active session count", async () => {
    scardMock.mockRejectedValueOnce(new Error("connection is closed"));

    await expect(getActiveSessionCount()).resolves.toBe(0);
  });

  it("rethrows unexpected redis errors", async () => {
    scardMock.mockRejectedValueOnce(new Error("unexpected timeout happened"));

    await expect(getActiveUserCount()).rejects.toThrow("unexpected timeout happened");
  });

  it("suppresses redis unavailable error in trackUserActivity", async () => {
    execMock.mockRejectedValueOnce(new Error("Stream isn't writeable and enableOfflineQueue options is false"));

    await expect(trackUserActivity("user-1", "session-1")).resolves.toBeUndefined();
  });
});
