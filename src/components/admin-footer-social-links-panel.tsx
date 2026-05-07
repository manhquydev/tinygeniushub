"use client";

import { useEffect, useState } from "react";
import { DEFAULT_FOOTER_SOCIAL_LINKS, type FooterSocialLinks } from "@/modules/platform/footer-social-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FOOTER_SOCIAL_FIELDS: Array<{ key: keyof FooterSocialLinks; label: string }> = [
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
];

export function AdminFooterSocialLinksPanel() {
  const [links, setLinks] = useState<FooterSocialLinks>({ ...DEFAULT_FOOTER_SOCIAL_LINKS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadLinks() {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/site-settings/footer-social-links", {
        method: "GET",
        cache: "no-store",
      });
      const body = await response.json();

      if (!response.ok || !body.ok || !body.data?.links) {
        setError(body.error?.message ?? "Không tải được cấu hình footer social.");
        return;
      }

      setLinks(body.data.links as FooterSocialLinks);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLinks();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/admin/site-settings/footer-social-links", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          links,
        }),
      });
      const body = await response.json();

      if (!response.ok || !body.ok || !body.data?.links) {
        setError(body.error?.message ?? "Không cập nhật được link social.");
        return;
      }

      setLinks(body.data.links as FooterSocialLinks);
      setInfo("Đã lưu link social ở footer.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lỗi không xác định.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">Footer social links</h3>
        <p className="text-xs text-[var(--admin-text-secondary)]">Đổi URL đích cho các nền tảng mạng xã hội ở chân trang.</p>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--admin-text-secondary)]">Đang tải...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {FOOTER_SOCIAL_FIELDS.map((field) => (
            <div key={field.key} className="grid gap-1.5">
              <Label htmlFor={`social-${field.key}`}>{field.label}</Label>
              <Input
                id={`social-${field.key}`}
                type="url"
                placeholder="https://..."
                value={links[field.key]}
                onChange={(event) => setLinks((prev) => ({ ...prev, [field.key]: event.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu social links"}
            </Button>
          </div>
        </div>
      )}

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {info ? <p className="text-xs text-[var(--admin-text-secondary)]">{info}</p> : null}
    </div>
  );
}
