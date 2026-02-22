import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/sign-out/route";

describe("auth sign-out route", () => {
  it("returns 404 to enforce canonical logout route", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: {
        message: "Not found",
      },
    });
  });
});
