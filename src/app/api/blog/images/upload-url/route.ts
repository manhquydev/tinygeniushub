import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/route-error";
import { resolveStorageProvider } from "@/modules/platform/storage/providers";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"] as const;

const requestSchema = z.object({
  contentType: z.string().min(1).max(100),
  filename: z.string().min(1).max(300),
  sizeBytes: z.number().int().min(1).max(MAX_IMAGE_SIZE_BYTES * 2),
});

function resolveExtension(contentType: string) {
  if (contentType === "image/jpeg") {
    return "jpg";
  }

  if (contentType === "image/svg+xml") {
    return "svg";
  }

  const [, subtype] = contentType.split("/", 2);
  return (subtype || "bin").replace(/[^a-z0-9]+/gi, "").toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const { contentType, sizeBytes } = requestSchema.parse(await request.json());

    if (!ALLOWED_TYPES.includes(contentType as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG/PNG/GIF/WebP/SVG allowed." },
        { status: 400 },
      );
    }

    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    const objectPath = `blog/images/${randomUUID()}.${resolveExtension(contentType)}`;
    const storageAdapter = resolveStorageProvider();
    const uploadResponse = await storageAdapter.createSignedUploadUrl({
      objectPath,
      contentType,
      expiresInSeconds: 300,
    });

    const publicRoot = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "") ?? "";
    const publicUrl = publicRoot ? `${publicRoot}/${objectPath}` : objectPath;

    return NextResponse.json({
      ok: true,
      data: {
        upload: {
          uploadUrl: uploadResponse.uploadUrl,
          method: uploadResponse.method,
          requiredHeaders: uploadResponse.requiredHeaders,
          expiresAt: uploadResponse.expiresAt,
        },
        image: {
          objectPath,
          publicUrl,
        },
      },
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "blog.images.upload_url",
    });
  }
}
