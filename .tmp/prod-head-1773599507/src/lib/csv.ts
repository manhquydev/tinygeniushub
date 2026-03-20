export function toCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value);
  if (!/[",\r\n]/u.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll("\"", "\"\"")}"`;
}

export function toCsvLine(values: ReadonlyArray<unknown>) {
  return values.map((value) => toCsvCell(value)).join(",");
}
