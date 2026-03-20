import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const ENCRYPTED_VIDEO_SOURCE_PREFIX = "encv1";
const VIDEO_PLAYBACK_TOKEN_VERSION = 1;
const VIDEO_PLAYBACK_TOKEN_TTL_SECONDS = 60 * 5;
const DEFAULT_ALLOWED_VIDEO_HOSTS = ["fileta.hoctienganh.xyz", "cdn.littlefox.com"];

type VideoPlaybackClaims = {
  v: number;
  parentId: string;
  lessonId: string;
  exp: number;
};

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

function deriveVideoKey(secret: string) {
  return createHash("sha256").update(`video-source:${secret}`).digest();
}

function deriveTokenKey(secret: string) {
  return createHash("sha256").update(`video-token:${secret}`).digest("hex");
}

function getAllowedVideoHosts() {
  const override = process.env.VIDEO_SOURCE_ALLOWED_HOSTS;
  if (!override || override.trim().length === 0) {
    return new Set(DEFAULT_ALLOWED_VIDEO_HOSTS);
  }

  const hosts = override
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);

  return new Set(hosts.length > 0 ? hosts : DEFAULT_ALLOWED_VIDEO_HOSTS);
}

export function isEncryptedVideoSource(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(`${ENCRYPTED_VIDEO_SOURCE_PREFIX}:`);
}

export function isHttpVideoSource(value: string | null | undefined): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function isVideoSourceProtected(value: string | null | undefined): value is string {
  return isEncryptedVideoSource(value) || isHttpVideoSource(value);
}

export function isAllowedVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return env.NODE_ENV !== "production";
    }

    return getAllowedVideoHosts().has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function encryptVideoSource(rawUrl: string, secret = env.SESSION_SECRET) {
  const key = deriveVideoKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(rawUrl, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTED_VIDEO_SOURCE_PREFIX}:${toBase64Url(iv)}:${toBase64Url(tag)}:${toBase64Url(encrypted)}`;
}

export function decryptVideoSource(encryptedSource: string, secret = env.SESSION_SECRET) {
  if (!isEncryptedVideoSource(encryptedSource)) {
    return null;
  }

  const [, ivPart, tagPart, dataPart] = encryptedSource.split(":");
  if (!ivPart || !tagPart || !dataPart) {
    return null;
  }

  try {
    const key = deriveVideoKey(secret);
    const iv = fromBase64Url(ivPart);
    const tag = fromBase64Url(tagPart);
    const encrypted = fromBase64Url(dataPart);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function resolveProtectedVideoUrl(videoSource: string | null | undefined) {
  if (!videoSource) return null;
  if (isEncryptedVideoSource(videoSource)) {
    return decryptVideoSource(videoSource);
  }
  if (isHttpVideoSource(videoSource)) {
    return videoSource;
  }
  return null;
}

export function buildVideoPlaybackToken(input: { parentId: string; lessonId: string; ttlSeconds?: number }) {
  const ttl = Math.max(30, input.ttlSeconds ?? VIDEO_PLAYBACK_TOKEN_TTL_SECONDS);
  const claims: VideoPlaybackClaims = {
    v: VIDEO_PLAYBACK_TOKEN_VERSION,
    parentId: input.parentId,
    lessonId: input.lessonId,
    exp: Date.now() + ttl * 1000,
  };

  const payload = toBase64Url(JSON.stringify(claims));
  const signature = createHmac("sha256", deriveTokenKey(env.SESSION_SECRET)).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyVideoPlaybackToken(token: string): VideoPlaybackClaims | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  const expected = createHmac("sha256", deriveTokenKey(env.SESSION_SECRET)).update(payload).digest("base64url");
  const signatureBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (
    signatureBuf.length !== expectedBuf.length ||
    !timingSafeEqual(signatureBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(fromBase64Url(payload).toString("utf8")) as VideoPlaybackClaims;
    if (
      claims.v !== VIDEO_PLAYBACK_TOKEN_VERSION ||
      typeof claims.parentId !== "string" ||
      typeof claims.lessonId !== "string" ||
      typeof claims.exp !== "number"
    ) {
      return null;
    }

    if (Date.now() > claims.exp) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}
