import { EvidenceMediaType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const { prismaMock, createAuditLogMock, createSignedUploadUrlMock, randomUuidMock } = vi.hoisted(() => ({
  prismaMock: {
    childProfile: {
      findFirst: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    evidence: {
      findFirst: vi.fn(),
    },
    evidenceMedia: {
      create: vi.fn(),
    },
  },
  createAuditLogMock: vi.fn(),
  createSignedUploadUrlMock: vi.fn(),
  randomUuidMock: vi.fn(() => "uuid-fixed-1234"),
}));

vi.mock("@/lib/env", () => ({
  env: {
    MEDIA_UPLOAD_URL_TTL_SECONDS: 900,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

vi.mock("@/modules/platform/storage/providers", () => ({
  resolveStorageProvider: () => ({
    createSignedUploadUrl: createSignedUploadUrlMock,
  }),
}));

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return {
    ...actual,
    randomUUID: randomUuidMock,
  };
});

import {
  createEvidenceMediaUploadSchema,
  createEvidenceMediaUploadSession,
  validateEvidenceMediaUploadRules,
} from "@/modules/progress/evidence-media-service";

describe("createEvidenceMediaUploadSchema", () => {
  it("accepts valid photo payload", () => {
    const parsed = createEvidenceMediaUploadSchema.parse({
      childId: "child_1",
      lessonId: "lesson_1",
      type: EvidenceMediaType.PHOTO,
      contentType: "image/jpeg",
      sizeBytes: 1024,
    });

    expect(parsed.type).toBe(EvidenceMediaType.PHOTO);
  });
});

describe("validateEvidenceMediaUploadRules", () => {
  it("rejects invalid content type for photo", () => {
    const payload = createEvidenceMediaUploadSchema.parse({
      childId: "child_1",
      lessonId: "lesson_1",
      type: EvidenceMediaType.PHOTO,
      contentType: "audio/mpeg",
      sizeBytes: 1024,
    });

    expect(() => validateEvidenceMediaUploadRules(payload)).toThrow(DomainError);
  });

  it("rejects oversize audio", () => {
    const payload = createEvidenceMediaUploadSchema.parse({
      childId: "child_1",
      lessonId: "lesson_1",
      type: EvidenceMediaType.AUDIO,
      contentType: "audio/mpeg",
      sizeBytes: 25 * 1024 * 1024,
    });

    expect(() => validateEvidenceMediaUploadRules(payload)).toThrow(DomainError);
  });
});

describe("createEvidenceMediaUploadSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.childProfile.findFirst.mockResolvedValue({ id: "child-1" });
    prismaMock.lesson.findUnique.mockResolvedValue({ id: "lesson-1" });
    prismaMock.evidence.findFirst.mockResolvedValue({ id: "evidence-1" });
    prismaMock.evidenceMedia.create.mockResolvedValue({
      id: "media-1",
      evidenceId: "evidence-1",
      type: EvidenceMediaType.PHOTO,
      objectPath: "evidence/child-1/lesson-1/photo-1700000000000-uuid-fixed-1234.jpeg",
      sizeBytes: 2048,
      durationSeconds: null,
      checksum: "checksum-1",
      createdAt: new Date("2026-02-21T00:00:00.000Z"),
    });
    createSignedUploadUrlMock.mockResolvedValue({
      provider: "mock_r2",
      uploadUrl: "https://upload.example.com",
      method: "PUT",
      requiredHeaders: {
        "content-type": "image/jpeg",
      },
      expiresAt: new Date("2026-02-21T00:15:00.000Z"),
    });
    createAuditLogMock.mockResolvedValue(undefined);
  });

  it("creates upload session and audit entry for valid evidence media", async () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const result = await createEvidenceMediaUploadSession({
      parentId: "parent-1",
      input: {
        childId: "child-1",
        lessonId: "lesson-1",
        type: EvidenceMediaType.PHOTO,
        contentType: "image/jpeg",
        sizeBytes: 2048,
        checksum: "checksum-1",
      },
    });

    nowSpy.mockRestore();

    expect(result.media.id).toBe("media-1");
    expect(result.upload).toMatchObject({
      provider: "mock_r2",
      uploadUrl: "https://upload.example.com",
      method: "PUT",
    });

    expect(prismaMock.evidenceMedia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          evidenceId: "evidence-1",
          uploadedByParentId: "parent-1",
          type: EvidenceMediaType.PHOTO,
          objectPath: "evidence/child-1/lesson-1/photo-1700000000000-uuid-fixed-1234.jpeg",
        }),
      }),
    );
    expect(createSignedUploadUrlMock).toHaveBeenCalledWith({
      objectPath: "evidence/child-1/lesson-1/photo-1700000000000-uuid-fixed-1234.jpeg",
      contentType: "image/jpeg",
      expiresInSeconds: 900,
    });
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "evidence.media.upload_url_created",
        actorId: "parent-1",
        resourceId: "media-1",
      }),
    );
  });

  it("throws CHILD_NOT_FOUND when child is not owned by parent", async () => {
    prismaMock.childProfile.findFirst.mockResolvedValueOnce(null);

    await expect(
      createEvidenceMediaUploadSession({
        parentId: "parent-1",
        input: {
          childId: "child-missing",
          lessonId: "lesson-1",
          type: EvidenceMediaType.PHOTO,
          contentType: "image/jpeg",
          sizeBytes: 2048,
        },
      }),
    ).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
      status: 404,
    });
  });

  it("throws LESSON_NOT_FOUND when lesson does not exist", async () => {
    prismaMock.lesson.findUnique.mockResolvedValueOnce(null);

    await expect(
      createEvidenceMediaUploadSession({
        parentId: "parent-1",
        input: {
          childId: "child-1",
          lessonId: "lesson-missing",
          type: EvidenceMediaType.PHOTO,
          contentType: "image/jpeg",
          sizeBytes: 2048,
        },
      }),
    ).rejects.toMatchObject({
      code: "LESSON_NOT_FOUND",
      status: 404,
    });
  });

  it("throws EVIDENCE_NOT_FOUND when lesson is not completed yet", async () => {
    prismaMock.evidence.findFirst.mockResolvedValueOnce(null);

    await expect(
      createEvidenceMediaUploadSession({
        parentId: "parent-1",
        input: {
          childId: "child-1",
          lessonId: "lesson-1",
          type: EvidenceMediaType.AUDIO,
          contentType: "audio/mpeg",
          sizeBytes: 1024,
          durationSeconds: 40,
        },
      }),
    ).rejects.toMatchObject({
      code: "EVIDENCE_NOT_FOUND",
      status: 409,
    });
  });
});
