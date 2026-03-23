import { env } from "@/lib/env";
import { DomainError } from "@/modules/platform/errors";
import { CloudflareR2StorageProviderAdapter } from "@/modules/platform/storage/providers/cloudflare-r2-provider";
import { MockR2StorageProviderAdapter } from "@/modules/platform/storage/providers/mock-r2-provider";
import type { StorageProviderAdapter } from "@/modules/platform/storage/providers/types";

const providers: Record<string, StorageProviderAdapter> = {
  mock_r2: new MockR2StorageProviderAdapter(),
  cloudflare_r2: new CloudflareR2StorageProviderAdapter(),
};

export function resolveStorageProvider(providerCode = env.STORAGE_PROVIDER) {
  if (env.NODE_ENV === "production" && providerCode === "mock_r2") {
    throw new DomainError("Mock storage provider is disabled in production", 500, "MOCK_STORAGE_DISABLED");
  }

  const provider = providers[providerCode];
  if (!provider) {
    throw new DomainError(`Unsupported storage provider: ${providerCode}`, 500, "UNSUPPORTED_STORAGE_PROVIDER");
  }

  return provider;
}
