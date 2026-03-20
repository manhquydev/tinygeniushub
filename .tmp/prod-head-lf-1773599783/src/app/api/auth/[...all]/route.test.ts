import { describe, expect, it } from "vitest";
import { DELETE, GET, PATCH, POST, PUT } from "@/app/api/auth/[...all]/route";

describe("auth catch-all route", () => {
  it("returns 404 for GET requests (e.g. get-session)", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: {
        message: "Not found",
      },
    });
  });

  it("returns 404 for mutation verbs", async () => {
    const responses = await Promise.all([POST(), PATCH(), PUT(), DELETE()]);
    for (const response of responses) {
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body).toEqual({
        ok: false,
        error: {
          message: "Not found",
        },
      });
    }
  });
});
