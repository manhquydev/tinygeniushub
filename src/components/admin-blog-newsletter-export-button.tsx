"use client";

import { Button } from "@/components/ui/button";

type SubscriberRow = {
  email: string;
  nameVi: string | null;
  subscribedAt: string;
};

export function AdminBlogNewsletterExportButton() {
  async function handleExport() {
    const response = await fetch("/api/admin/blog/newsletter/subscribers");
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { subscribers: SubscriberRow[] };
    const csv =
      "Email, Name, Registration time\\n" +
      payload.subscribers
        .map((subscriber) => `${subscriber.email},${subscriber.nameVi || ""},${subscriber.subscribedAt}`)
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "newsletter-subscribers.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" onClick={handleExport} className="bg-teal-600 hover:bg-teal-700">
      Export CSV
    </Button>
  );
}
