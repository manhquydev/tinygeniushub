import { describe, expect, it } from "vitest";

import {
  formatSafeError,
  parsePositiveInt,
  redactSensitiveText,
} from "../../scripts/grapuco/grapuco-toolkit.mjs";

describe("grapuco-toolkit", () => {
  it("clamps positive int values", () => {
    expect(parsePositiveInt(undefined, 5, { min: 1, max: 20 })).toBe(5);
    expect(parsePositiveInt("-9", 5, { min: 1, max: 20 })).toBe(1);
    expect(parsePositiveInt("999", 5, { min: 1, max: 20 })).toBe(20);
    expect(parsePositiveInt("6", 5, { min: 1, max: 20 })).toBe(6);
  });

  it("redacts known secret patterns", () => {
    const text = 'Using custom headers: {"X-Api-Key":"gyc_sk_abc123456789"}';
    const redacted = redactSensitiveText(text);
    expect(redacted).not.toContain("gyc_sk_abc123456789");
    expect(redacted).toContain("[REDACTED]");
  });

  it("formats errors safely", () => {
    const err = new Error("Request failed with X-Api-Key: gyc_sk_abcdef123456");
    const safe = formatSafeError(err);
    expect(safe).not.toContain("gyc_sk_abcdef123456");
    expect(safe).toContain("[REDACTED]");
  });
});
