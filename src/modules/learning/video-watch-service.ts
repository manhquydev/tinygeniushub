import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getRedisClient } from "@/lib/redis-client";
import { assertCanLearn } from "@/modules/entitlement/assert-can-learn";
import { createAuditLog } from "@/modules/platform/audit-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

const MIN_WATCH_SECONDS_FLOOR = 45;
const WATCH_REQUIRED_RATIO = 0.6;
const COMPLETED_WATCH_ACTION = "learning.lesson.video.watch.completed";
const COMPLETED_WATCH_WINDOW_MS = 1000 * 60 * 60 * 24;
const WATCH_SESSION_STARTED_ACTION = "learning.lesson.video.watch.session.started";
const WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS = 5;
const WATCH_SESSION_TTL_MS = env.WATCH_SESSION_TTL_SECONDS * 1000;
const WATCH_SESSION_REALTIME_GRACE_SECONDS = 10;
const WATCH_SESSION_MIN_HEARTBEAT_GAP_MS = 3000;
const WATCH_SESSION_KEY_PREFIX = "learning:watch-session";

const watchSessionClaimsSchema = z
  .object({
    v: z.literal(1),
    nonce: z.string().min(8),
    parentId: z.string().min(1),
    childId: z.string().min(1),
    lessonId: z.string().min(1),
    issuedAtMs: z.number().int().positive(),
    expiresAtMs: z.number().int().positive(),
  })
  .refine((value) => value.expiresAtMs > value.issuedAtMs, {
    message: "expiresAtMs must be greater than issuedAtMs",
  });

export const markLessonVideoWatchedSchema = z.object({
  childId: z.string().min(1),
  sessionToken: z.string().min(16).optional(),
});

export const createLessonVideoWatchSessionSchema = z.object({
  childId: z.string().min(1),
});

export const markLessonVideoWatchHeartbeatSchema = z.object({
  childId: z.string().min(1),
  sessionToken: z.string().min(16),
  sequence: z.number().int().min(1).max(4000),
  isPlaying: z.boolean().optional(),
});

export function buildLessonWatchResourceId(childId: string, lessonId: string) {
  return `${childId}:${lessonId}`;
}

export function resolveRequiredWatchSeconds(estimatedMinutes: number) {
  const ratioSeconds = Math.floor(estimatedMinutes * 60 * WATCH_REQUIRED_RATIO);
  return Math.max(ratioSeconds, MIN_WATCH_SECONDS_FLOOR);
}

export function resolveWatchHeartbeatCount(input: {
  elapsedSeconds: number;
  heartbeatIntervalSeconds: number;
}) {
  const elapsedSeconds = Math.max(0, Math.floor(input.elapsedSeconds));
  return Math.max(1, Math.floor(elapsedSeconds / input.heartbeatIntervalSeconds));
}

export function isWatchReadyForCompletion(input: {
  watchedSeconds: number;
  requiredWatchSeconds: number;
}) {
  return input.watchedSeconds >= input.requiredWatchSeconds;
}

export function resolveCreditedWatchSecondsFromHeartbeat(input: {
  heartbeatCount: number;
  heartbeatIntervalSeconds: number;
  sessionIssuedAtMs: number;
  nowMs: number;
  requiredWatchSeconds: number;
}) {
  const heartbeatCount = Math.max(1, Math.floor(input.heartbeatCount));
  const rawWatchSeconds = heartbeatCount * input.heartbeatIntervalSeconds;
  const elapsedSeconds = Math.max(0, Math.floor((input.nowMs - input.sessionIssuedAtMs) / 1000));
  const maxCreditableByElapsed = elapsedSeconds + WATCH_SESSION_REALTIME_GRACE_SECONDS;
  return Math.max(0, Math.min(rawWatchSeconds, maxCreditableByElapsed, input.requiredWatchSeconds));
}


async function hasRecentCompletedVideoWatch(input: {
  parentId: string;
  childId: string;
  lessonId: string;
}) {
  const resourceId = buildLessonWatchResourceId(input.childId, input.lessonId);
  const threshold = new Date(Date.now() - COMPLETED_WATCH_WINDOW_MS);

  const existing = await prisma.auditLog.findFirst({
    where: {
      actorType: "parent",
      actorId: input.parentId,
      action: COMPLETED_WATCH_ACTION,
      resourceType: "lesson_video_watch",
      resourceId,
      createdAt: {
        gte: threshold,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}

function encodeWatchSessionClaims(claims: z.infer<typeof watchSessionClaimsSchema>) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function decodeWatchSessionClaims(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new DomainError("Invalid watch session token format", 400, "WATCH_SESSION_INVALID");
  }

  const [payloadSegment, signatureSegment] = parts;
  const expectedSignature = createHmac("sha256", env.SESSION_SECRET)
    .update(payloadSegment)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signatureSegment, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new DomainError("Watch session signature is invalid", 400, "WATCH_SESSION_INVALID");
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
  } catch {
    throw new DomainError("Watch session payload is invalid", 400, "WATCH_SESSION_INVALID");
  }

  return watchSessionClaimsSchema.parse(parsedPayload);
}

function buildWatchSessionKey(nonce: string) {
  return `${WATCH_SESSION_KEY_PREFIX}:${nonce}`;
}

type WatchSessionState = {
  parentId: string;
  childId: string;
  lessonId: string;
  nonce: string;
  issuedAtMs: number;
  expiresAtMs: number;
  requiredWatchSeconds: number;
  heartbeatIntervalSeconds: number;
  lastSequence: number;
  creditedWatchSeconds: number;
  lastHeartbeatAtMs: number;
};

function parseIntStrict(value: string | undefined, fallback = 0) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function parseWatchSessionState(hash: Record<string, string> | null) {
  if (!hash || Object.keys(hash).length === 0) {
    return null;
  }

  return {
    parentId: hash.parentId ?? "",
    childId: hash.childId ?? "",
    lessonId: hash.lessonId ?? "",
    nonce: hash.nonce ?? "",
    issuedAtMs: parseIntStrict(hash.issuedAtMs),
    expiresAtMs: parseIntStrict(hash.expiresAtMs),
    requiredWatchSeconds: parseIntStrict(hash.requiredWatchSeconds),
    heartbeatIntervalSeconds: parseIntStrict(hash.heartbeatIntervalSeconds, WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS),
    lastSequence: parseIntStrict(hash.lastSequence),
    creditedWatchSeconds: parseIntStrict(hash.creditedWatchSeconds),
    lastHeartbeatAtMs: parseIntStrict(hash.lastHeartbeatAtMs),
  } satisfies WatchSessionState;
}

async function loadWatchSessionState(nonce: string) {
  const redis = getRedisClient();
  if (redis.status !== "ready" && redis.status !== "connecting") {
    try {
      await redis.connect();
    } catch {
      throw new DomainError(
        "Watch session service is temporarily unavailable",
        503,
        "WATCH_SESSION_STORE_UNAVAILABLE",
      );
    }
  }

  const key = buildWatchSessionKey(nonce);
  let rawState: Record<string, string> | null = null;
  try {
    rawState = await redis.hgetall(key);
  } catch {
    throw new DomainError(
      "Watch session service is temporarily unavailable",
      503,
      "WATCH_SESSION_STORE_UNAVAILABLE",
    );
  }

  const state = parseWatchSessionState(rawState);
  return { key, redis, state };
}

function assertWatchSessionContext(params: {
  claims: z.infer<typeof watchSessionClaimsSchema>;
  parentId: string;
  childId: string;
  lessonId: string;
}) {
  if (
    params.claims.parentId !== params.parentId ||
    params.claims.childId !== params.childId ||
    params.claims.lessonId !== params.lessonId
  ) {
    throw new DomainError("Watch session does not match lesson context", 403, "WATCH_SESSION_MISMATCH");
  }
}

function assertWatchSessionNotExpired(claims: z.infer<typeof watchSessionClaimsSchema>) {
  if (Date.now() > claims.expiresAtMs) {
    throw new DomainError("Watch session expired. Please start a new session.", 401, "WATCH_SESSION_EXPIRED");
  }
}

async function resolveWatchAccessContext(input: {
  parentId: string;
  childId: string;
  lessonId: string;
}) {
  const { child, lesson } = await assertCanLearn(input);
  return { child, lesson };
}

export async function createLessonVideoWatchSession(params: {
  parentId: string;
  lessonId: string;
  payload: z.infer<typeof createLessonVideoWatchSessionSchema>;
}) {
  const payload = createLessonVideoWatchSessionSchema.parse(params.payload);
  const { lesson } = await resolveWatchAccessContext({
    parentId: params.parentId,
    lessonId: params.lessonId,
    childId: payload.childId,
  });

  if (!lesson.videoSource) {
    return {
      watchRequired: false,
      readyForCompletion: true,
      requiredWatchSeconds: 0,
      heartbeatIntervalSeconds: WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS,
      sessionToken: null,
      issuedAt: null,
      expiresAt: null,
    };
  }

  const nowMs = Date.now();
  const claims = watchSessionClaimsSchema.parse({
    v: 1,
    nonce: randomUUID(),
    parentId: params.parentId,
    childId: payload.childId,
    lessonId: params.lessonId,
    issuedAtMs: nowMs,
    expiresAtMs: nowMs + WATCH_SESSION_TTL_MS,
  });
  const sessionToken = encodeWatchSessionClaims(claims);
  const requiredWatchSeconds = resolveRequiredWatchSeconds(lesson.estimatedMinutes);

  await createAuditLog({
    actorType: "parent",
    actorId: params.parentId,
    action: WATCH_SESSION_STARTED_ACTION,
    resourceType: "lesson_video_watch",
    resourceId: buildLessonWatchResourceId(payload.childId, params.lessonId),
    metadata: {
      issuedAt: new Date(claims.issuedAtMs).toISOString(),
      expiresAt: new Date(claims.expiresAtMs).toISOString(),
      requiredWatchSeconds,
      heartbeatIntervalSeconds: WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS,
      nonce: claims.nonce,
    },
  });

  const { key, redis } = await loadWatchSessionState(claims.nonce);
  await redis
    .multi()
    .hset(key, {
      parentId: claims.parentId,
      childId: claims.childId,
      lessonId: claims.lessonId,
      nonce: claims.nonce,
      issuedAtMs: String(claims.issuedAtMs),
      expiresAtMs: String(claims.expiresAtMs),
      requiredWatchSeconds: String(requiredWatchSeconds),
      heartbeatIntervalSeconds: String(WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS),
      lastSequence: "0",
      creditedWatchSeconds: "0",
      lastHeartbeatAtMs: String(claims.issuedAtMs),
    })
    .pexpire(key, WATCH_SESSION_TTL_MS)
    .exec();

  return {
    watchRequired: true,
    readyForCompletion: false,
    requiredWatchSeconds,
    heartbeatIntervalSeconds: WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS,
    sessionToken,
    issuedAt: new Date(claims.issuedAtMs).toISOString(),
    expiresAt: new Date(claims.expiresAtMs).toISOString(),
  };
}

export async function markLessonVideoWatchHeartbeat(params: {
  parentId: string;
  lessonId: string;
  payload: z.infer<typeof markLessonVideoWatchHeartbeatSchema>;
}) {
  const payload = markLessonVideoWatchHeartbeatSchema.parse(params.payload);
  await resolveWatchAccessContext({
    parentId: params.parentId,
    lessonId: params.lessonId,
    childId: payload.childId,
  });

  const claims = decodeWatchSessionClaims(payload.sessionToken);
  assertWatchSessionContext({
    claims,
    parentId: params.parentId,
    childId: payload.childId,
    lessonId: params.lessonId,
  });
  assertWatchSessionNotExpired(claims);

  const { key, redis, state } = await loadWatchSessionState(claims.nonce);
  if (!state) {
    throw new DomainError("Watch session not found. Please start a new session.", 409, "WATCH_SESSION_NOT_FOUND");
  }

  if (
    state.parentId !== params.parentId ||
    state.childId !== payload.childId ||
    state.lessonId !== params.lessonId
  ) {
    throw new DomainError("Watch session state mismatch", 409, "WATCH_SESSION_MISMATCH");
  }

  if (payload.sequence !== state.lastSequence + 1) {
    throw new DomainError("Invalid heartbeat sequence", 409, "WATCH_HEARTBEAT_SEQUENCE_INVALID");
  }

  const nowMs = Date.now();
  if (state.lastHeartbeatAtMs > 0 && nowMs - state.lastHeartbeatAtMs < WATCH_SESSION_MIN_HEARTBEAT_GAP_MS) {
    throw new DomainError("Heartbeat sent too fast", 429, "WATCH_HEARTBEAT_TOO_FAST");
  }

  // Backward-compatible default:
  // if older clients do not send playback state, treat as playing.
  const isPlaying = payload.isPlaying ?? true;
  const heartbeatCreditSeconds = isPlaying ? state.heartbeatIntervalSeconds : 0;
  const rawWatchSeconds = state.creditedWatchSeconds + heartbeatCreditSeconds;
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - state.issuedAtMs) / 1000));
  const maxCreditableByElapsed = elapsedSeconds + WATCH_SESSION_REALTIME_GRACE_SECONDS;
  const watchedSeconds = Math.max(
    0,
    Math.min(rawWatchSeconds, maxCreditableByElapsed, state.requiredWatchSeconds),
  );
  const readyForCompletion = isWatchReadyForCompletion({
    watchedSeconds,
    requiredWatchSeconds: state.requiredWatchSeconds,
  });

  await redis
    .multi()
    .hset(key, {
      lastSequence: String(payload.sequence),
      creditedWatchSeconds: String(watchedSeconds),
      lastHeartbeatAtMs: String(nowMs),
    })
    .pexpire(key, Math.max(1000, state.expiresAtMs - nowMs))
    .exec();

  return {
    watchRequired: true,
    readyForCompletion,
    watchedSeconds,
    requiredWatchSeconds: state.requiredWatchSeconds,
    heartbeatIntervalSeconds: state.heartbeatIntervalSeconds,
    sequence: payload.sequence,
    isPlaying,
  };
}

export async function markLessonVideoWatched(params: {
  parentId: string;
  lessonId: string;
  payload: z.infer<typeof markLessonVideoWatchedSchema>;
}) {
  const payload = markLessonVideoWatchedSchema.parse(params.payload);
  const { lesson } = await resolveWatchAccessContext({
    parentId: params.parentId,
    lessonId: params.lessonId,
    childId: payload.childId,
  });

  if (!lesson.videoSource) {
    return {
      watchRequired: false,
      readyForCompletion: true,
      watchedSeconds: 0,
      requiredWatchSeconds: 0,
      heartbeatIntervalSeconds: WATCH_SESSION_HEARTBEAT_INTERVAL_SECONDS,
    };
  }

  if (!payload.sessionToken) {
    throw new DomainError(
      "Watch session token is required for video lessons",
      409,
      "WATCH_SESSION_REQUIRED",
    );
  }

  const claims = decodeWatchSessionClaims(payload.sessionToken);
  assertWatchSessionContext({
    claims,
    parentId: params.parentId,
    childId: payload.childId,
    lessonId: params.lessonId,
  });
  assertWatchSessionNotExpired(claims);

  const { key, redis, state } = await loadWatchSessionState(claims.nonce);
  if (!state) {
    throw new DomainError("Watch session not found. Please start a new session.", 409, "WATCH_SESSION_NOT_FOUND");
  }
  if (
    state.parentId !== params.parentId ||
    state.childId !== payload.childId ||
    state.lessonId !== params.lessonId
  ) {
    throw new DomainError("Watch session state mismatch", 409, "WATCH_SESSION_MISMATCH");
  }

  const watchedSeconds = state.creditedWatchSeconds;
  const requiredWatchSeconds = state.requiredWatchSeconds || resolveRequiredWatchSeconds(lesson.estimatedMinutes);
  const readyForCompletion = isWatchReadyForCompletion({
    watchedSeconds,
    requiredWatchSeconds,
  });

  const resourceId = buildLessonWatchResourceId(payload.childId, params.lessonId);
  await createAuditLog({
    actorType: "parent",
    actorId: params.parentId,
    action: "learning.lesson.video.watch",
    resourceType: "lesson_video_watch",
    resourceId,
    metadata: {
      watchedSeconds,
      requiredWatchSeconds,
      heartbeatCount: state.lastSequence,
      heartbeatIntervalSeconds: state.heartbeatIntervalSeconds,
      sessionIssuedAt: new Date(claims.issuedAtMs).toISOString(),
      sessionExpiresAt: new Date(claims.expiresAtMs).toISOString(),
    },
  });

  if (readyForCompletion) {
    await redis.del(key);

    const hasExistingCompletedEvent = await hasRecentCompletedVideoWatch({
      parentId: params.parentId,
      childId: payload.childId,
      lessonId: params.lessonId,
    });

    if (!hasExistingCompletedEvent) {
      await createAuditLog({
        actorType: "parent",
        actorId: params.parentId,
        action: COMPLETED_WATCH_ACTION,
        resourceType: "lesson_video_watch",
        resourceId,
        metadata: {
          watchedSeconds,
          requiredWatchSeconds,
        },
      });
    }
  }

  return {
    watchRequired: true,
    readyForCompletion,
    watchedSeconds,
    requiredWatchSeconds,
    heartbeatIntervalSeconds: state.heartbeatIntervalSeconds,
  };
}

export async function assertLessonVideoWatchCompleted(input: {
  parentId: string;
  childId: string;
  lessonId: string;
  requiresVideoWatch: boolean;
}) {
  if (!input.requiresVideoWatch) {
    return;
  }

  const hasCompletedEvent = await hasRecentCompletedVideoWatch({
    parentId: input.parentId,
    childId: input.childId,
    lessonId: input.lessonId,
  });

  if (!hasCompletedEvent) {
    throw new DomainError(
      "Watch the lesson video before marking lesson completion",
      409,
      "VIDEO_WATCH_REQUIRED",
    );
  }
}
