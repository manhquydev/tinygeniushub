export type SignedUploadRequest = {
  objectPath: string;
  contentType: string;
  expiresInSeconds: number;
};

export type SignedUploadResponse = {
  provider: string;
  uploadUrl: string;
  method: "PUT";
  expiresAt: Date;
  requiredHeaders: Record<string, string>;
};

export interface StorageProviderAdapter {
  readonly code: string;
  createSignedUploadUrl(input: SignedUploadRequest): Promise<SignedUploadResponse>;
  objectExists(objectPath: string): Promise<boolean>;
}
