import { describe, expect, it } from "vitest";
import { getNavToneByProgress } from "../use-nav-scroll-tone";

describe("getNavToneByProgress", () => {
  it("returns dark before dark threshold", () => {
    expect(getNavToneByProgress(0)).toBe("dark");
    expect(getNavToneByProgress(0.3799)).toBe("dark");
  });

  it("returns mid from dark threshold to before light threshold", () => {
    expect(getNavToneByProgress(0.38)).toBe("mid");
    expect(getNavToneByProgress(0.7199)).toBe("mid");
  });

  it("returns light at and after light threshold", () => {
    expect(getNavToneByProgress(0.72)).toBe("light");
    expect(getNavToneByProgress(1)).toBe("light");
  });
});
