// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOperationsOfferingsSection } from "./admin-operations-offerings-section";
import { AdminOperationsTabs } from "@/components/admin-operations-tabs";

const liveOffering = {
  id: "off-1",
  code: "platform-pass",
  kind: "RECURRING",
  catalogKey: "platform:pass",
  active: true,
};

describe("AdminOperationsOfferingsSection", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("lists offering code kind catalogKey and active from GET /api/admin/offerings", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: { offerings: [liveOffering] } }),
    } as Response);

    render(<AdminOperationsOfferingsSection />);

    await waitFor(() => {
      expect(screen.getByText("platform-pass")).toBeTruthy();
    });
    expect(screen.getByText("RECURRING")).toBeTruthy();
    expect(screen.getByText("platform:pass")).toBeTruthy();
    expect(screen.getByText("ON")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/admin/offerings", { method: "GET", cache: "no-store" });
  });

  it("toggles active via PATCH /api/admin/offerings/:id", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: { offerings: [liveOffering] } }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: { offering: { ...liveOffering, active: false } },
        }),
      } as Response);

    render(<AdminOperationsOfferingsSection />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Turn off" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Turn off" }));

    await waitFor(() => {
      expect(screen.getByText("TURN OFF")).toBeTruthy();
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/offerings/off-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
  });
});

describe("AdminOperationsTabs offerings", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes Offerings on the operations tabs bar", () => {
    render(<AdminOperationsTabs payments={[]} webhooks={[]} lessonTrialRows={[]} />);
    expect(screen.getByRole("button", { name: "Offerings" })).toBeTruthy();
  });
});
