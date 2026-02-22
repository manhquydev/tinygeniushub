import { randomUUID } from "node:crypto";
import { EvidenceMediaType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createAuditLog } from "@/modules/platform/audit-service";
import { DomainError } from "@/modules/platform/errors";
import { resolveStorageProvider } from "@/modules/platform/storage/providers";

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;

export const createEvidenceMediaUploadSchema = z.object({
  childId: z.string().min(1),
  lessonId: z.string().min(1),
  type: z.nativeEnum(EvidenceMediaType),
  contentType: z.string().min(3).max(120),
  sizeBytes: z.number().int().min(1),
  durationSeconds: z.number().int().min(1).max(3600).optional(),
  checksum: z.string().max(128).optional(),
});

export function validateEvidenceMediaUploadRules(input: z.infer<typeof createEvidenceMediaUploadSchema>) {
  if (input.type === EvidenceMediaType.PHOTO) {
    if (!input.contentType.startsWith("image/")) {
      throw new DomainError("Photo upload requires image/* content type", 400, "INVALID_MEDIA_CONTENT_TYPE");
    }

    if (input.sizeBytes > MAX_PHOTO_SIZE_BYTES) {
      throw new DomainError("Photo exceeds max size of 10MB", 400, "MEDIA_SIZE_LIMIT_EXCEEDED");
    }

    return;
  }

  if (!input.contentType.startsWith("audio/")) {
    throw new DomainError("Audio upload requires audio/* content type", 400, "INVALID_MEDIA_CONTENT_TYPE");
  }

  if (input.sizeBytes > MAX_AUDIO_SIZE_BYTES) {
    throw new DomainError("Audio exceeds max size of 20MB", 400, "MEDIA_SIZE_LIMIT_EXCEEDED");
  }
}

function resolveExtension(contentType: string) {
  const [, subType] = contentType.split("/", 2);
  const normalizedSubType = subType?.trim().toLowerCase() || "bin";
  return normalizedSubType.replace(/[^a-z0-9]+/g, "");
}

function buildObjectPath(input: {
  childId: string;
  lessonId: string;
  type: EvidenceMediaType;
  contentType: string;
}) {
  const extension = resolveExtension(input.contentType);
  const typePrefix = input.type.toLowerCase();
  return `evidence/${input.childId}/${input.lessonId}/${typePrefix}-${Date.now()}-${randomUUID()}.${extension}`;
}

export async function createEvidenceMediaUploadSession(params: {
  parentId: string;
  input: z.infer<typeof createEvidenceMediaUploadSchema>;
}) {
  const payload = createEvidenceMediaUploadSchema.parse(params.input);
  validateEvidenceMediaUploadRules(payload);

  const [child, lesson, evidence] = await Promise.all([
    prisma.childProfile.findFirst({
      where: {
        id: payload.childId,
        parentId: params.parentId,
      },
      select: { id: true },
    }),
    prisma.lesson.findUnique({
      where: {
        id: payload.lessonId,
      },
      select: { id: true },
    }),
    prisma.evidence.findFirst({
      where: {
        childId: payload.childId,
        lessonId: payload.lessonId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  if (!lesson) {
    throw new DomainError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  if (!evidence) {
    throw new DomainError(
      "Evidence record not found for child and lesson. Complete the lesson before uploading media.",
      409,
      "EVIDENCE_NOT_FOUND",
    );
  }

  const objectPath = buildObjectPath({
    childId: payload.childId,
    lessonId: payload.lessonId,
    type: payload.type,
    contentType: payload.contentType,
  });

  const mediaRecord = await prisma.evidenceMedia.create({
    data: {
      evidenceId: evidence.id,
      type: payload.type,
      objectPath,
      sizeBytes: payload.sizeBytes,
      durationSeconds: payload.durationSeconds,
      checksum: payload.checksum,
      uploadedByParentId: params.parentId,
    },
    select: {
      id: true,
      evidenceId: true,
      type: true,
      objectPath: true,
      sizeBytes: true,
      durationSeconds: true,
      checksum: true,
      createdAt: true,
    },
  });

  const storageProvider = resolveStorageProvider();
  const uploadSession = await storageProvider.createSignedUploadUrl({
    objectPath,
    contentType: payload.contentType,
    expiresInSeconds: env.MEDIA_UPLOAD_URL_TTL_SECONDS,
  });

  await createAuditLog({
    actorType: "parent",
    actorId: params.parentId,
    action: "evidence.media.upload_url_created",
    resourceType: "evidence_media",
    resourceId: mediaRecord.id,
    metadata: {
      evidenceId: mediaRecord.evidenceId,
      type: mediaRecord.type,
      objectPath: mediaRecord.objectPath,
      storageProvider: uploadSession.provider,
      expiresAt: uploadSession.expiresAt.toISOString(),
    },
  });

  return {
    media: mediaRecord,
    upload: {
      provider: uploadSession.provider,
      uploadUrl: uploadSession.uploadUrl,
      method: uploadSession.method,
      requiredHeaders: uploadSession.requiredHeaders,
      expiresAt: uploadSession.expiresAt,
    },
  };
}
