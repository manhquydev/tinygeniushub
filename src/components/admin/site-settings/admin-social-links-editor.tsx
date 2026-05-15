"use client";

import { useState } from "react";
import { Facebook, Youtube, Save, RotateCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import type { FooterSocialLinks } from "@/modules/platform/footer-social-links";

type Props = {
  initialLinks: FooterSocialLinks;
};

const SOCIAL_FIELDS: {
  key: keyof FooterSocialLinks;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
}[] = [
  {
    key: "facebook",
    label: "Facebook",
    icon: <Facebook size={16} className="text-[#1877F2]" />,
    placeholder: "https://facebook.com/tinygeniushub",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: <Youtube size={16} className="text-[#FF0000]" />,
    placeholder: "https://youtube.com/@TinyGeniusHubUs",
  },
];

export function AdminSocialLinksEditor({ initialLinks }: Props) {
  const [form, setForm] = useState<FooterSocialLinks>({ ...initialLinks });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: keyof FooterSocialLinks, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
    setError(null);
  }

  function handleReset() {
    setForm({ ...initialLinks });
    setSuccess(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/site-settings/footer-social-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? "Save failed. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminSectionCard
      title="Social network links"
      description="Update the URL displayed in the social network icons section of the website footer."
      icon={<MessageCircle size={16} />}
    >
      <div className="space-y-4">
        {SOCIAL_FIELDS.map(({ key, label, icon, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label
              htmlFor={`social-${key}`}
              className="flex items-center gap-2 text-sm text-[var(--admin-text-primary)]"
            >
              {icon}
              {label}
            </Label>
            <Input
              id={`social-${key}`}
              type="url"
              value={form[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="bg-[var(--admin-content-bg)] border-[var(--admin-card-border)] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-secondary)] focus-visible:ring-teal-500"
            />
          </div>
        ))}

        {error && (
          <p className="text-sm text-rose-500">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-500">Social network link saved successfully.</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Save size={14} className="mr-1.5" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            onClick={handleReset}
            disabled={saving}
            variant="outline"
            size="sm"
            className="border-[var(--admin-card-border)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Reset
          </Button>
        </div>
      </div>
    </AdminSectionCard>
  );
}
