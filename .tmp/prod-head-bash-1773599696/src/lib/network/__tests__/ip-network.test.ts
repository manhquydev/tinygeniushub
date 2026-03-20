import { describe, expect, it } from "vitest";
import { createIpNetworkMatcher, normalizeIpNetwork, parseIpNetwork } from "@/lib/network/ip-network";

describe("parseIpNetwork", () => {
  it("parses ipv4 address and subnet", () => {
    expect(parseIpNetwork("198.51.100.10")).toEqual({
      kind: "address",
      family: "ipv4",
      address: "198.51.100.10",
    });

    expect(parseIpNetwork("203.0.113.0/24")).toEqual({
      kind: "subnet",
      family: "ipv4",
      address: "203.0.113.0",
      prefix: 24,
    });
  });

  it("normalizes ipv6 and rejects invalid entries", () => {
    expect(normalizeIpNetwork("2001:DB8::1")).toBe("2001:db8::1");
    expect(normalizeIpNetwork("bad-value")).toBeNull();
    expect(parseIpNetwork("203.0.113.0/99")).toBeNull();
  });
});

describe("createIpNetworkMatcher", () => {
  it("matches both direct IP and CIDR range", () => {
    const matcher = createIpNetworkMatcher(["198.51.100.10", "203.0.113.0/24"]);
    expect(matcher.matches("198.51.100.10")).toBe(true);
    expect(matcher.matches("203.0.113.12")).toBe(true);
    expect(matcher.matches("203.0.114.1")).toBe(false);
  });
});
