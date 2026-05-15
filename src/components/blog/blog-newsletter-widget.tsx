"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

export function BlogNewsletterWidget() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/blog/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error("SUBSCRIBE_FAILED");
      }

      setSuccess(true);
      setEmail("");
    } catch {
      setError("Registration has not been successful. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 p-6 text-white shadow-lg sm:p-8">
      <div className="space-y-4">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
          <Mail size={14} /> Newsletter
        </p>
        <h3 className="text-2xl font-black tracking-[-0.02em] sm:text-3xl">Receive new articles every week</h3>
        <p className="max-w-[60ch] text-sm text-teal-50 sm:text-base">
          Tips for teaching children at home, sample lessons and practical instructions specifically for Vietnamese parents.
        </p>

        {success ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} /> Thanks! Check email your inbox.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="blog-newsletter-email">
              Email
            </label>
            <input
              id="blog-newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@domain.com"
              className="min-h-11 rounded-xl border border-white/40 bg-white/95 px-3 text-sm text-slate-900 outline-none ring-teal-200 transition focus:ring-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-11 rounded-xl border border-white/30 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Register"}
            </button>
          </form>
        )}

        {error ? <p className="text-sm font-medium text-rose-100">{error}</p> : null}

        <p className="text-xs text-teal-50/90">We respect your privacy and you can unsubscribe at any time.</p>
      </div>
    </section>
  );
}

