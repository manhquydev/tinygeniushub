import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { addSeconds } from "date-fns";
import { env } from "@/lib/env";
import { DomainError } from "@/modules/platform/errors";
import type { SignedUploadRequest, SignedUploadResponse, StorageProviderAdapter } from "@/modules/platform/storage/providers/types";

function ensureR2Config() {
  if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET_NAME || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new DomainError(
      "R2 credentials are not fully configured",
      500,
      "R2_CONFIGURATION_MISSING",
    );
  }

  return {
    accountId: env.R2_ACCOUNT_ID,
    bucketName: env.R2_BUCKET_NAME,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
}

export class CloudflareR2StorageProviderAdapter implements StorageProviderAdapter {
  readonly code = "cloudflare_r2";

  private createClient(config: ReturnType<typeof ensureR2Config>) {
    return new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async createSignedUploadUrl(input: SignedUploadRequest): Promise<SignedUploadResponse> {
    const config = ensureR2Config();
    const client = this.createClient(config);

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.objectPath,
      ContentType: input.contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: input.expiresInSeconds,
    });

    return {
      provider: this.code,
      uploadUrl,
      method: "PUT",
      expiresAt: addSeconds(new Date(), input.expiresInSeconds),
      requiredHeaders: {
        "content-type": input.contentType,
      },
    };
  }

  async objectExists(objectPath: string): Promise<boolean> {
    const config = ensureR2Config();
    const client = this.createClient(config);

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: config.bucketName,
          Key: objectPath,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
