"use client";

import { useEffect, useState } from "react";
import { DEFAULT_FOOTER_SOCIAL_LINKS, type FooterSocialLinks } from "@/modules/platform/footer-social-links";

const FOOTER_SOCIAL_FIELDS: Array<{ key: keyof FooterSocialLinks; label: string }> = [
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "zalo", label: "Zalo" },
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
    <section className="card page-stack">
      <h3>Footer social links</h3>
      <p className="muted-text">Đổi URL đích cho các nền tảng mạng xã hội ở chân trang.</p>

      {loading ? (
        <p className="muted-text">Đang tải...</p>
      ) : (
        <div className="admin-controls">
          {FOOTER_SOCIAL_FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <input
                type="url"
                placeholder="https://..."
                value={links[field.key]}
                onChange={(event) =>
                  setLinks((prev) => ({
                    ...prev,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}

          <button type="button" className="solid-button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu social links"}
          </button>
        </div>
      )}

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </section>
  );
}
