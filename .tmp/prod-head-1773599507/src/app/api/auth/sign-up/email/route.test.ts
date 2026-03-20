import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/sign-up/email/route";

describe("auth sign-up/email route", () => {
  it("returns 404 to enforce canonical signup route", async () => {
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
