export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) {
            return "";
          }
          // Convert to string
          const stringValue = String(value);
          // Escape values with commas, quotes, or newlines
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n") ||
            stringValue.includes("\r")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Add BOM for UTF-8 encoding to support Vietnamese characters
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAnalyticsToCSV(
  data: Record<string, unknown>[],
  type: string,
  dateRange?: { from?: Date; to?: Date }
): void {
  const date = new Date().toISOString().split("T")[0];
  const rangeSuffix = dateRange?.from
    ? `_${dateRange.from.toISOString().split("T")[0]}_to_${
        dateRange.to?.toISOString().split("T")[0] || date
      }`
    : "";
  const filename = `analytics_${type}${rangeSuffix}_${date}.csv`;
  exportToCSV(data, filename);
}

export function formatNumberForCSV(num: number): string {
  return num.toLocaleString("vi-VN");
}

export function formatCurrencyForCSV(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
