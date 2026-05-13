"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import slugify from "slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminBlogAuthorCreateForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/blog/authors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: slugify(displayName, {
            lower: true,
            locale: "vi",
            strict: true,
          }),
          displayName: displayName.trim(),
          role: role.trim(),
          email: email.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("CREATE_FAILED");
      }

      setDisplayName("");
      setRole("");
      setEmail("");
      setBio("");
      router.refresh();
    } catch {
      setError("Unable to create author.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4 sm:grid-cols-2">
      <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" required />
      <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role" required />
      <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
      <Input value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Introduce" />
      <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 sm:col-span-2">
        {submitting ? "Creating..." : "Create author"}
      </Button>
      {error ? <p className="text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
