import { addSeconds } from "date-fns";
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import type { SignedUploadRequest, SignedUploadResponse, StorageProviderAdapter } from "@/modules/platform/storage/providers/types";

function signPayload(payload: string) {
  return createHmac("sha256", env.MOCK_UPLOAD_SIGNING_SECRET).update(payload).digest("hex");
}

export class MockR2StorageProviderAdapter implements StorageProviderAdapter {
  readonly code = "mock_r2";

  async createSignedUploadUrl(input: SignedUploadRequest): Promise<SignedUploadResponse> {
    const expiresAt = addSeconds(new Date(), input.expiresInSeconds);
    const payload = `${input.objectPath}:${expiresAt.toISOString()}`;
    const signature = signPayload(payload);

    const uploadUrl = new URL("/api/storage/mock-upload", env.BETTER_AUTH_URL);
    uploadUrl.searchParams.set("path", input.objectPath);
    uploadUrl.searchParams.set("expiresAt", expiresAt.toISOString());
    uploadUrl.searchParams.set("sig", signature);

    return {
      provider: this.code,
      uploadUrl: uploadUrl.toString(),
      method: "PUT",
      expiresAt,
      requiredHeaders: {
        "content-type": input.contentType,
      },
    };
  }
}
