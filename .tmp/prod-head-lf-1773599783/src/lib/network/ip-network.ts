import { BlockList, isIP } from "node:net";

export type IpNetworkFamily = "ipv4" | "ipv6";

export type ParsedIpNetwork =
  | {
      kind: "address";
      family: IpNetworkFamily;
      address: string;
    }
  | {
      kind: "subnet";
      family: IpNetworkFamily;
      address: string;
      prefix: number;
    };

function getFamily(value: string): IpNetworkFamily | null {
  const family = isIP(value);
  if (family === 4) {
    return "ipv4";
  }
  if (family === 6) {
    return "ipv6";
  }
  return null;
}

function normalizeAddress(address: string, family: IpNetworkFamily) {
  if (family === "ipv6") {
    return address.toLowerCase();
  }
  return address;
}

export function parseIpNetwork(value: string): ParsedIpNetwork | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!trimmed.includes("/")) {
    const family = getFamily(trimmed);
    if (!family) {
      return null;
    }
    return {
      kind: "address",
      family,
      address: normalizeAddress(trimmed, family),
    };
  }

  const segments = trimmed.split("/");
  if (segments.length !== 2) {
    return null;
  }

  const [rawAddress, rawPrefix] = segments;
  const family = getFamily(rawAddress);
  if (!family) {
    return null;
  }

  if (!/^\d+$/.test(rawPrefix)) {
    return null;
  }

  const prefix = Number.parseInt(rawPrefix, 10);
  const maxPrefix = family === "ipv4" ? 32 : 128;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) {
    return null;
  }

  return {
    kind: "subnet",
    family,
    address: normalizeAddress(rawAddress, family),
    prefix,
  };
}

export function normalizeIpNetwork(value: string) {
  const parsed = parseIpNetwork(value);
  if (!parsed) {
    return null;
  }

  if (parsed.kind === "address") {
    return parsed.address;
  }

  return `${parsed.address}/${parsed.prefix}`;
}

export function createIpNetworkMatcher(entries: string[]) {
  const blockList = new BlockList();

  for (const entry of entries) {
    const parsed = parseIpNetwork(entry);
    if (!parsed) {
      continue;
    }

    if (parsed.kind === "address") {
      blockList.addAddress(parsed.address, parsed.family);
      continue;
    }

    blockList.addSubnet(parsed.address, parsed.prefix, parsed.family);
  }

  return {
    matches(ip: string) {
      const family = getFamily(ip);
      if (!family) {
        return false;
      }

      return blockList.check(ip, family);
    },
  };
}
