import { DomainError } from "@/modules/platform/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function resolveRequestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      throw new DomainError("Invalid request origin", 403, "CSRF_ORIGIN_INVALID");
    }
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    try {
      return new URL(refererHeader).origin;
    } catch {
      throw new DomainError("Invalid request referer", 403, "CSRF_REFERER_INVALID");
    }
  }

  throw new DomainError("Missing request origin", 403, "CSRF_ORIGIN_MISSING");
}

function resolveExpectedOrigin(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.headers.get(":authority");

  if (!host) {
    throw new DomainError("Missing request host", 403, "CSRF_HOST_MISSING");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  let protocol = forwardedProto ? forwardedProto.split(",", 1)[0]?.trim().toLowerCase() : "";
  if (!protocol) {
    try {
      protocol = new URL(request.url).protocol.replace(":", "").toLowerCase();
    } catch {
      protocol = "http";
    }
  }

  if (protocol !== "http" && protocol !== "https") {
    throw new DomainError("Invalid request protocol", 403, "CSRF_PROTOCOL_INVALID");
  }

  return `${protocol}://${host}`;
}

export function assertTrustedOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") {
    throw new DomainError("Cross-site requests are not allowed", 403, "CSRF_FETCH_METADATA_BLOCKED");
  }

  const requestOrigin = resolveRequestOrigin(request);
  const expectedOrigin = resolveExpectedOrigin(request);
  if (requestOrigin !== expectedOrigin) {
    throw new DomainError("Mismatched request origin", 403, "CSRF_ORIGIN_MISMATCH");
  }
}
