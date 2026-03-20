import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/sign-in/email/route";

describe("auth sign-in/email route", () => {
  it("returns 404 to enforce canonical login route", async () => {
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
