/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadClarity,
  isClarityLoaded,
  setClarityConsent,
  unloadClarity,
} from "../loader";

describe("Clarity Loader", () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = "";
    document.body.innerHTML = "";

    // Reset window state
    delete (window as any).__ccthClarityLoaded;
    delete (window as any).clarity;

    // Reset console mocks
    vi.restoreAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("loadClarity", () => {
    it("injects script tag correctly", () => {
      const result = loadClarity({ projectId: "test-id" });

      expect(result).toBe(true);
      const script = document.getElementById("ccth-clarity-src");
      expect(script).toBeTruthy();
      expect(script?.getAttribute("src")).toContain("test-id");
      expect(script?.getAttribute("src")).toContain("https://www.clarity.ms/tag/");
    });

    it("sets script to async mode", () => {
      loadClarity({ projectId: "test-id" });

      const script = document.getElementById("ccth-clarity-src") as HTMLScriptElement;
      expect(script.async).toBe(true);
    });

    it("prevents double loading", () => {
      const firstResult = loadClarity({ projectId: "test-id" });
      const secondResult = loadClarity({ projectId: "test-id" });

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false);
      expect(document.querySelectorAll("#ccth-clarity-src").length).toBe(1);
    });

    it("prevents loading when window.clarity already exists", () => {
      (window as any).clarity = { event: vi.fn() };

      const result = loadClarity({ projectId: "test-id" });

      expect(result).toBe(false);
      expect(document.getElementById("ccth-clarity-src")).toBeNull();
    });

    it("returns false when disabled in config", () => {
      const result = loadClarity({ projectId: "test-id", enabled: false });

      expect(result).toBe(false);
      expect(document.getElementById("ccth-clarity-src")).toBeNull();
    });

    it("returns false and warns when project ID is empty", () => {
      const result = loadClarity({ projectId: "" });

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        "[Clarity] Project ID is required to load Clarity"
      );
    });

    it("returns false when project ID is whitespace only", () => {
      const result = loadClarity({ projectId: "   " });

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        "[Clarity] Project ID is required to load Clarity"
      );
    });

    it("encodes project ID in URL", () => {
      loadClarity({ projectId: "test/id+with&special=chars" });

      const script = document.getElementById("ccth-clarity-src");
      const src = script?.getAttribute("src") ?? "";
      expect(src).not.toContain("/id+with&special=chars");
      expect(src).toContain(encodeURIComponent("test/id+with&special=chars"));
    });

    it("handles script load error", () => {
      loadClarity({ projectId: "test-id" });

      const script = document.getElementById("ccth-clarity-src") as HTMLScriptElement;

      // Simulate error event
      if (script.onerror) {
        script.onerror(new Event("error"));
      }

      expect(console.error).toHaveBeenCalledWith("[Clarity] Failed to load Clarity script");
      expect((window as any).__ccthClarityLoaded).toBe(false);
    });

    it("returns false in server-side environment", () => {
      // Temporarily remove window
      const originalWindow = global.window;
      // @ts-expect-error - simulating SSR
      delete global.window;

      const result = loadClarity({ projectId: "test-id" });

      expect(result).toBe(false);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe("isClarityLoaded", () => {
    it("returns false when not loaded", () => {
      expect(isClarityLoaded()).toBe(false);
    });

    it("returns true after loadClarity is called", () => {
      loadClarity({ projectId: "test-id" });
      expect(isClarityLoaded()).toBe(true);
    });

    it("returns true when window.clarity exists", () => {
      (window as any).clarity = { event: vi.fn() };
      expect(isClarityLoaded()).toBe(true);
    });

    it("returns false in server-side environment", () => {
      const originalWindow = global.window;
      // @ts-expect-error - simulating SSR
      delete global.window;

      expect(isClarityLoaded()).toBe(false);

      global.window = originalWindow;
    });
  });

  describe("setClarityConsent", () => {
    it("calls clarity.consent when API is available", () => {
      const mockConsent = vi.fn();
      (window as any).clarity = { consent: mockConsent };

      setClarityConsent(true);

      expect(mockConsent).toHaveBeenCalledWith(true);
    });

    it("calls clarity.consent with false when denying consent", () => {
      const mockConsent = vi.fn();
      (window as any).clarity = { consent: mockConsent };

      setClarityConsent(false);

      expect(mockConsent).toHaveBeenCalledWith(false);
    });

    it("does nothing when clarity is not loaded", () => {
      // Should not throw
      expect(() => setClarityConsent(true)).not.toThrow();
    });

    it("returns early in server-side environment", () => {
      const originalWindow = global.window;
      // @ts-expect-error - simulating SSR
      delete global.window;

      // Should not throw
      expect(() => setClarityConsent(true)).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe("unloadClarity", () => {
    it("removes script tag from DOM", () => {
      loadClarity({ projectId: "test-id" });
      expect(document.getElementById("ccth-clarity-src")).toBeTruthy();

      unloadClarity();

      expect(document.getElementById("ccth-clarity-src")).toBeNull();
    });

    it("resets __ccthClarityLoaded flag", () => {
      loadClarity({ projectId: "test-id" });
      expect((window as any).__ccthClarityLoaded).toBe(true);

      unloadClarity();

      expect((window as any).__ccthClarityLoaded).toBe(false);
    });

    it("does nothing if script not present", () => {
      // Should not throw
      expect(() => unloadClarity()).not.toThrow();
    });

    it("returns early in server-side environment", () => {
      loadClarity({ projectId: "test-id" });

      const originalWindow = global.window;
      const originalDocument = global.document;
      // @ts-expect-error - simulating SSR
      delete global.window;
      // @ts-expect-error - simulating SSR
      delete global.document;

      // Should not throw
      expect(() => unloadClarity()).not.toThrow();

      global.window = originalWindow;
      global.document = originalDocument;
    });
  });

  describe("integration scenarios", () => {
    it("handles full lifecycle: load -> check -> set consent -> unload", () => {
      // Load
      expect(loadClarity({ projectId: "test-id" })).toBe(true);
      expect(isClarityLoaded()).toBe(true);

      // Set consent (mock clarity API)
      const mockConsent = vi.fn();
      (window as any).clarity = { consent: mockConsent };
      setClarityConsent(true);
      expect(mockConsent).toHaveBeenCalledWith(true);

      // Unload - removes script and resets flag
      unloadClarity();
      expect(document.getElementById("ccth-clarity-src")).toBeNull();
      expect((window as any).__ccthClarityLoaded).toBe(false);
      // Note: window.clarity is not removed (managed by Clarity script)
    });

    it("can reload after unload", () => {
      loadClarity({ projectId: "test-id" });
      unloadClarity();

      const result = loadClarity({ projectId: "test-id" });

      expect(result).toBe(true);
      expect(isClarityLoaded()).toBe(true);
    });

    it("prevents multiple simultaneous loads", () => {
      const results = [
        loadClarity({ projectId: "test-id" }),
        loadClarity({ projectId: "test-id" }),
        loadClarity({ projectId: "test-id" }),
      ];

      expect(results).toEqual([true, false, false]);
      expect(document.querySelectorAll("#ccth-clarity-src").length).toBe(1);
    });
  });
});
