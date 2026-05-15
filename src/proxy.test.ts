import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("proxy hidden marketing routes", () => {
  it.each([
    "http://localhost/pricing",
    "http://localhost/for-schools",
    "http://localhost/pricing?utm_source=test",
  ])("redirects %s to /courses with 308", (url) => {
    const request = new NextRequest(url);
    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toContain("/courses");
  });
});
