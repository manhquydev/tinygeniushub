import { beforeEach, describe, expect, it, vi } from "vitest";
import PricingPage from "@/app/(main)/pricing/page";
import ForSchoolsPage from "@/app/(main)/for-schools/page";
import { notFound } from "next/navigation";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND_CALLED");
  }),
}));

describe("hidden marketing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides /pricing", () => {
    expect(() => PricingPage()).toThrow("NOT_FOUND_CALLED");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("hides /for-schools", () => {
    expect(() => ForSchoolsPage()).toThrow("NOT_FOUND_CALLED");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
