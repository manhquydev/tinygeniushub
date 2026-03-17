export function sanitizeNextPath(input: string | null | undefined) {
  if (!input) {
    return null;
  }

  const value = input.trim();
  if (!value) {
    return null;
  }

  // Reject absolute/protocol-relative URLs and malformed values.
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  if (value.includes("\\") || value.includes("\r") || value.includes("\n")) {
    return null;
  }

  // Avoid redirect loops back to session-expired/auth shell.
  if (
    value.startsWith("/session-expired") ||
    value.startsWith("/auth/login") ||
    value.startsWith("/auth/signup")
  ) {
    return null;
  }

  return value;
}

