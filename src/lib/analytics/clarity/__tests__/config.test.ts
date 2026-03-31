import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Store original env
const originalEnv = process.env;

describe("Clarity Config", () => {
  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    delete process.env.CLARITY_DATA_EXPORT_TOKEN;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe("isClarityEnabled", () => {
    it("returns false when project ID is not set", async () => {
      const { isClarityEnabled } = await import("../config");
      expect(isClarityEnabled()).toBe(false);
    });

    it("returns false when project ID is empty string", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "";
      const { isClarityEnabled } = await import("../config");
      expect(isClarityEnabled()).toBe(false);
    });

    it("returns false when project ID is whitespace only", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "   ";
      const { isClarityEnabled } = await import("../config");
      expect(isClarityEnabled()).toBe(false);
    });

    it("returns true when project ID is set", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "valid-project-id";
      const { isClarityEnabled } = await import("../config");
      expect(isClarityEnabled()).toBe(true);
    });

    it("returns true when project ID contains special characters", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "project-id_123.test";
      const { isClarityEnabled } = await import("../config");
      expect(isClarityEnabled()).toBe(true);
    });

    it("handles undefined env var", async () => {
      delete process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
      const { isClarityEnabled } = await import("../config");
      expect(isClarityEnabled()).toBe(false);
    });
  });

  describe("getProjectId", () => {
    it("returns null when project ID is not set (non-strict mode)", async () => {
      const { getProjectId } = await import("../config");
      expect(getProjectId(false)).toBeNull();
    });

    it("returns null when project ID is empty (non-strict mode)", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "";
      const { getProjectId } = await import("../config");
      expect(getProjectId(false)).toBeNull();
    });

    it("returns project ID when set (non-strict mode)", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "my-project-123";
      const { getProjectId } = await import("../config");
      expect(getProjectId(false)).toBe("my-project-123");
    });

    it("throws in strict mode when not configured", async () => {
      const { getProjectId } = await import("../config");
      expect(() => getProjectId(true)).toThrow(
        "NEXT_PUBLIC_CLARITY_PROJECT_ID is not configured"
      );
    });

    it("throws in strict mode when empty", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "";
      const { getProjectId } = await import("../config");
      expect(() => getProjectId(true)).toThrow(
        "NEXT_PUBLIC_CLARITY_PROJECT_ID is not configured"
      );
    });

    it("returns project ID in strict mode when configured", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "configured-id";
      const { getProjectId } = await import("../config");
      expect(getProjectId(true)).toBe("configured-id");
    });

    it("uses strict=false by default", async () => {
      const { getProjectId } = await import("../config");
      // Should not throw when not configured with default param
      expect(() => getProjectId()).not.toThrow();
      expect(getProjectId()).toBeNull();
    });

    it("handles complex project IDs", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc123-def_ghi.jkl";
      const { getProjectId } = await import("../config");
      expect(getProjectId()).toBe("abc123-def_ghi.jkl");
    });
  });

  describe("isDataExportEnabled", () => {
    it("returns false when data export token is not set", async () => {
      const { isDataExportEnabled } = await import("../config");
      expect(isDataExportEnabled()).toBe(false);
    });

    it("returns false when data export token is empty", async () => {
      process.env.CLARITY_DATA_EXPORT_TOKEN = "";
      const { isDataExportEnabled } = await import("../config");
      expect(isDataExportEnabled()).toBe(false);
    });

    it("returns true when data export token is set", async () => {
      process.env.CLARITY_DATA_EXPORT_TOKEN = "valid-token-123";
      const { isDataExportEnabled } = await import("../config");
      expect(isDataExportEnabled()).toBe(true);
    });
  });

  describe("CLARITY_PROJECT_ID export", () => {
    it("exports the environment variable", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "test-export";
      const { CLARITY_PROJECT_ID } = await import("../config");
      expect(CLARITY_PROJECT_ID).toBe("test-export");
    });

    it("is undefined when env var not set", async () => {
      const { CLARITY_PROJECT_ID } = await import("../config");
      expect(CLARITY_PROJECT_ID).toBeUndefined();
    });
  });

  describe("CLARITY_DATA_EXPORT_CONFIG export", () => {
    it("has correct base URL", async () => {
      const { CLARITY_DATA_EXPORT_CONFIG } = await import("../config");
      expect(CLARITY_DATA_EXPORT_CONFIG.baseUrl).toBe(
        "https://clarity.microsoft.com/api/export"
      );
    });

    it("reads token from environment", async () => {
      process.env.CLARITY_DATA_EXPORT_TOKEN = "my-token";
      const { CLARITY_DATA_EXPORT_CONFIG } = await import("../config");
      expect(CLARITY_DATA_EXPORT_CONFIG.token).toBe("my-token");
    });
  });

  describe("integration with loader", () => {
    it("config enables loading when project ID is set", async () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "valid-id";
      const { isClarityEnabled, getProjectId } = await import("../config");

      if (isClarityEnabled()) {
        const projectId = getProjectId();
        expect(projectId).toBe("valid-id");
      }
    });

    it("config prevents loading when project ID is not set", async () => {
      // Ensure env is clean
      delete process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
      const { isClarityEnabled } = await import("../config");

      expect(isClarityEnabled()).toBe(false);
    });
  });

  describe("environment variable naming", () => {
    it("uses NEXT_PUBLIC_ prefix for client-side config", async () => {
      // This test documents the expected naming convention
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "test";
      const { CLARITY_PROJECT_ID } = await import("../config");
      expect(CLARITY_PROJECT_ID).toBeDefined();
    });

    it("uses non-prefixed name for server-side config", async () => {
      // Server-side tokens should not use NEXT_PUBLIC_ prefix
      process.env.CLARITY_DATA_EXPORT_TOKEN = "server-token";
      const { CLARITY_DATA_EXPORT_CONFIG } = await import("../config");
      expect(CLARITY_DATA_EXPORT_CONFIG.token).toBe("server-token");
    });
  });
});
