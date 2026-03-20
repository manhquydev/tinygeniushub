import { SubscriptionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createAuditLogMock, redisStore, redisMock, randomUuidMock } = vi.hoisted(() => {
  const redisStore = new Map<string, Record<string, string>>();

  const redisMock = {
    status: "ready",
    connect: vi.fn(async () => undefined),
    hgetall: vi.fn(async (key: string) => redisStore.get(key) ?? {}),
    del: vi.fn(async (key: string) => {
      redisStore.delete(key);
      return 1;
    }),
    multi: vi.fn(() => {
      const chain = {
        hset: vi.fn((key: string, values: Record<string, string>) => {
          const existing = redisStore.get(key) ?? {};
          redisStore.set(key, { ...existing, ...values });
          return chain;
        }),
        pexpire: vi.fn((key: string, ttlMs: number) => {
          void key;
          void ttlMs;
          return chain;
        }),
        exec: vi.fn(async () => []),
      };
      return chain;
    }),
  };

  return {
    prismaMock: {
      childProfile: {
        findFirst: vi.fn(),
      },
      lesson: {
        findUnique: vi.fn(),
      },
      subscription: {
        findUnique: vi.fn(),
      },
      auditLog: {
        findFirst: vi.fn(),
      },
    },
    createAuditLogMock: vi.fn(),
    redisStore,
    redisMock,
    randomUuidMock: vi.fn(() => "nonce-fixed-12345678"),
  };
});

vi.mock("@/lib/env", () => ({
  env: {
    SESSION_SECRET: "test-session-secret",
    WATCH_SESSION_TTL_SECONDS: 120,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/redis-client", () => ({
  getRedisClient: () => redisMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return {
    ...actual,
    randomUUID: randomUuidMock,
  };
});

import {
  assertLessonVideoWatchCompleted,
  buildLessonWatchResourceId,
  createLessonVideoWatchSession,
  createLessonVideoWatchSessionSchema,
  isWatchReadyForCompletion,
  markLessonVideoWatchHeartbeat,
  markLessonVideoWatchHeartbeatSchema,
  markLessonVideoWatched,
  markLessonVideoWatchedSchema,
  resolveCreditedWatchSecondsFromHeartbeat,
  resolveWatchHeartbeatCount,
  resolveRequiredWatchSeconds,
} from "@/modules/learning/video-watch-service";

function decodeWatchTokenClaims(token: string) {
  const [payloadSegment] = token.split(".");
  if (!payloadSegment) {
    throw new Error("invalid token format");
  }

  return JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as {
    nonce: string;
    issuedAtMs: number;
    expiresAtMs: number;
  };
}

describe("video watch service integration paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisStore.clear();

    prismaMock.childProfile.findFirst.mockResolvedValue({
      id: "child-1",
    });
    prismaMock.lesson.findUnique.mockResolvedValue({
      id: "lesson-1",
      trialEnabled: true,
      estimatedMinutes: 5,
      videoSource: "https://cdn.example.com/video.mp4",
    });
    prismaMock.subscription.findUnique.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE_STANDARD,
    });
    prismaMock.auditLog.findFirst.mockResolvedValue(null);
    createAuditLogMock.mockResolvedValue(undefined);
    redisMock.status = "ready";
  });

  it("creates watch session token and persists redis state for video lesson", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    const result = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    nowSpy.mockRestore();

    expect(result.watchRequired).toBe(true);
    expect(result.readyForCompletion).toBe(false);
    expect(result.sessionToken).toBeTypeOf("string");
    expect(result.requiredWatchSeconds).toBe(180);
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "learning.lesson.video.watch.session.started",
        actorId: "parent-1",
      }),
    );

    const claims = decodeWatchTokenClaims(result.sessionToken!);
    const key = `learning:watch-session:${claims.nonce}`;
    expect(redisStore.get(key)).toMatchObject({
      parentId: "parent-1",
      childId: "child-1",
      lessonId: "lesson-1",
      lastSequence: "0",
      creditedWatchSeconds: "0",
    });
  });

  it("skips watch session requirement when lesson has no video source", async () => {
    prismaMock.lesson.findUnique.mockResolvedValueOnce({
      id: "lesson-1",
      trialEnabled: true,
      estimatedMinutes: 5,
      videoSource: null,
    });

    const result = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    expect(result).toEqual({
      watchRequired: false,
      readyForCompletion: true,
      requiredWatchSeconds: 0,
      heartbeatIntervalSeconds: 5,
      sessionToken: null,
      issuedAt: null,
      expiresAt: null,
    });
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("accepts valid heartbeat sequence and updates watched seconds", async () => {
    const nowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_000_000)
      .mockReturnValueOnce(1_006_000);

    const session = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    const result = await markLessonVideoWatchHeartbeat({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        sessionToken: session.sessionToken!,
        sequence: 1,
      },
    });

    nowSpy.mockRestore();

    expect(result).toMatchObject({
      watchRequired: true,
      readyForCompletion: false,
      watchedSeconds: 5,
      sequence: 1,
    });
  });

  it("rejects heartbeat when sequence is invalid", async () => {
    const nowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_000_000)
      .mockReturnValueOnce(1_006_000);

    const session = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    await expect(
      markLessonVideoWatchHeartbeat({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
          sessionToken: session.sessionToken!,
          sequence: 2,
        },
      }),
    ).rejects.toMatchObject({
      code: "WATCH_HEARTBEAT_SEQUENCE_INVALID",
      status: 409,
    });

    nowSpy.mockRestore();
  });

  it("requires session token for video lesson completion check", async () => {
    await expect(
      markLessonVideoWatched({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
        },
      }),
    ).rejects.toMatchObject({
      code: "WATCH_SESSION_REQUIRED",
      status: 409,
    });
  });

  it("returns 401 when watch session token is expired", async () => {
    const nowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_000_000)
      .mockReturnValueOnce(1_121_000);

    const session = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    await expect(
      markLessonVideoWatched({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
          sessionToken: session.sessionToken!,
        },
      }),
    ).rejects.toMatchObject({
      code: "WATCH_SESSION_EXPIRED",
      status: 401,
    });

    nowSpy.mockRestore();
  });

  it("returns 403 when watch session token context does not match child", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    const session = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    await expect(
      markLessonVideoWatched({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-2",
          sessionToken: session.sessionToken!,
        },
      }),
    ).rejects.toMatchObject({
      code: "WATCH_SESSION_MISMATCH",
      status: 403,
    });

    nowSpy.mockRestore();
  });

  it("marks watch ready and writes completion audit only once per window", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    const session = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    const claims = decodeWatchTokenClaims(session.sessionToken!);
    const key = `learning:watch-session:${claims.nonce}`;
    const existing = redisStore.get(key)!;
    redisStore.set(key, {
      ...existing,
      lastSequence: "36",
      creditedWatchSeconds: "180",
      requiredWatchSeconds: "180",
      lastHeartbeatAtMs: String(claims.issuedAtMs + 90_000),
    });

    createAuditLogMock.mockClear();

    const result = await markLessonVideoWatched({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        sessionToken: session.sessionToken!,
      },
    });

    nowSpy.mockRestore();

    expect(result.readyForCompletion).toBe(true);
    expect(createAuditLogMock).toHaveBeenCalledTimes(2);
    expect(createAuditLogMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: "learning.lesson.video.watch",
      }),
    );
    expect(createAuditLogMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: "learning.lesson.video.watch.completed",
      }),
    );
  });

  it("rejects replaying the same completion token", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    const session = await createLessonVideoWatchSession({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: { childId: "child-1" },
    });

    const claims = decodeWatchTokenClaims(session.sessionToken!);
    const key = `learning:watch-session:${claims.nonce}`;
    const existing = redisStore.get(key)!;
    redisStore.set(key, {
      ...existing,
      lastSequence: "36",
      creditedWatchSeconds: "180",
      requiredWatchSeconds: "180",
      lastHeartbeatAtMs: String(claims.issuedAtMs + 90_000),
    });

    await markLessonVideoWatched({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        sessionToken: session.sessionToken!,
      },
    });

    await expect(
      markLessonVideoWatched({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
          sessionToken: session.sessionToken!,
        },
      }),
    ).rejects.toMatchObject({
      code: "WATCH_SESSION_NOT_FOUND",
      status: 409,
    });

    nowSpy.mockRestore();
  });

  it("enforces watch completion audit requirement when lesson completion requires video watch", async () => {
    prismaMock.auditLog.findFirst.mockResolvedValueOnce(null);

    await expect(
      assertLessonVideoWatchCompleted({
        parentId: "parent-1",
        childId: "child-1",
        lessonId: "lesson-1",
        requiresVideoWatch: true,
      }),
    ).rejects.toMatchObject({
      code: "VIDEO_WATCH_REQUIRED",
      status: 409,
    });
  });
});

describe("buildLessonWatchResourceId", () => {
  it("builds deterministic resource id", () => {
    expect(buildLessonWatchResourceId("child-1", "lesson-1")).toBe("child-1:lesson-1");
  });
});

describe("resolveRequiredWatchSeconds", () => {
  it("uses ratio and floor", () => {
    expect(resolveRequiredWatchSeconds(15)).toBe(540);
    expect(resolveRequiredWatchSeconds(1)).toBe(45);
  });
});

describe("markLessonVideoWatchedSchema", () => {
  it("accepts valid payload", () => {
    const parsed = markLessonVideoWatchedSchema.parse({
      childId: "child-1",
      sessionToken: "token-value-123456",
    });

    expect(parsed.sessionToken).toBe("token-value-123456");
  });

  it("allows payload without session token at schema level", () => {
    const parsed = markLessonVideoWatchedSchema.parse({
      childId: "child-1",
    });
    expect(parsed.childId).toBe("child-1");
  });
});

describe("markLessonVideoWatchHeartbeatSchema", () => {
  it("accepts valid payload", () => {
    const parsed = markLessonVideoWatchHeartbeatSchema.parse({
      childId: "child-1",
      sessionToken: "token-value-123456",
      sequence: 1,
    });
    expect(parsed.sequence).toBe(1);
  });

  it("rejects invalid sequence", () => {
    expect(() =>
      markLessonVideoWatchHeartbeatSchema.parse({
        childId: "child-1",
        sessionToken: "token-value-123456",
        sequence: 0,
      }),
    ).toThrow();
  });
});

describe("createLessonVideoWatchSessionSchema", () => {
  it("accepts valid payload", () => {
    const parsed = createLessonVideoWatchSessionSchema.parse({
      childId: "child-1",
    });
    expect(parsed.childId).toBe("child-1");
  });
});

describe("isWatchReadyForCompletion", () => {
  it("requires watched seconds to meet threshold", () => {
    expect(
      isWatchReadyForCompletion({
        watchedSeconds: 120,
        requiredWatchSeconds: 180,
      }),
    ).toBe(false);
    expect(
      isWatchReadyForCompletion({
        watchedSeconds: 180,
        requiredWatchSeconds: 180,
      }),
    ).toBe(true);
  });
});

describe("resolveWatchHeartbeatCount", () => {
  it("converts elapsed seconds to heartbeat count with floor and minimum", () => {
    expect(
      resolveWatchHeartbeatCount({
        elapsedSeconds: 0,
        heartbeatIntervalSeconds: 5,
      }),
    ).toBe(1);
    expect(
      resolveWatchHeartbeatCount({
        elapsedSeconds: 18,
        heartbeatIntervalSeconds: 5,
      }),
    ).toBe(3);
  });
});

describe("resolveCreditedWatchSecondsFromHeartbeat", () => {
  it("caps credited seconds by elapsed realtime budget and required seconds", () => {
    expect(
      resolveCreditedWatchSecondsFromHeartbeat({
        heartbeatCount: 50,
        heartbeatIntervalSeconds: 5,
        sessionIssuedAtMs: 1_000,
        nowMs: 21_000,
        requiredWatchSeconds: 300,
      }),
    ).toBe(30);

    expect(
      resolveCreditedWatchSecondsFromHeartbeat({
        heartbeatCount: 100,
        heartbeatIntervalSeconds: 5,
        sessionIssuedAtMs: 1_000,
        nowMs: 401_000,
        requiredWatchSeconds: 180,
      }),
    ).toBe(180);
  });
});
