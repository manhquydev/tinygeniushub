import { beforeEach, describe, expect, it, vi } from "vitest";
import PricingPage from "@/app/(main)/pricing/page";
import ForSchoolsPage from "@/app/(main)/for-schools/page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT_CALLED");
  }),
}));

describe("hidden marketing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects /pricing to /courses", () => {
    expect(() => PricingPage()).toThrow("REDIRECT_CALLED");
    expect(redirect).toHaveBeenCalledWith("/courses");
  });

  it("redirects /for-schools to /courses", () => {
    expect(() => ForSchoolsPage()).toThrow("REDIRECT_CALLED");
    expect(redirect).toHaveBeenCalledWith("/courses");
  });
});
