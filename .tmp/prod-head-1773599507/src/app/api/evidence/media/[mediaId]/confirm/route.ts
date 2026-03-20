import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { resolveStorageProvider } from "@/modules/platform/storage/providers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { mediaId } = await params;
    if (!mediaId) {
      return fail("Media id is required", 400);
    }

    const media = await prisma.evidenceMedia.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        objectPath: true,
        uploadedByParentId: true,
        uploadStatus: true,
      },
    });

    if (!media) {
      return fail("Evidence media not found", 404);
    }

    if (media.uploadedByParentId !== parent.id) {
      return fail("Forbidden", 403);
    }

    if (media.uploadStatus === "UPLOADED") {
      return ok({ ok: true, mediaId: media.id, alreadyConfirmed: true });
    }

    const storageProvider = resolveStorageProvider();
    const objectExists = await storageProvider.objectExists(media.objectPath);
    if (!objectExists) {
      return fail("Upload not found in storage", 422);
    }

    await prisma.evidenceMedia.update({
      where: { id: media.id },
      data: {
        uploadStatus: "UPLOADED",
        uploadedAt: new Date(),
      },
    });

    return ok({ ok: true, mediaId: media.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
