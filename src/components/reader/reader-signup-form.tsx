"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

type ReaderSignupFormProps = {
  nextPath?: string | null;
};

export function ReaderSignupForm({ nextPath }: ReaderSignupFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const safeNextPath = sanitizeNextPath(nextPath) ?? "/blog";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/reader/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          legalAccepted,
        }),
      });

      const body = (await response.json()) as {
        ok?: boolean;
        error?: {
          message?: string;
          details?: {
            issues?: Array<{ path?: Array<string | number> }>;
          };
        };
      };

      if (!response.ok || !body.ok) {
        const issuePath = String(body.error?.details?.issues?.[0]?.path?.[0] ?? "");
        if (issuePath === "legalAccepted") {
          setError("You need to agree to the Terms, Privacy Policy and Cookie Policy to register.");
          return;
        }
        setError(body.error?.message ?? "Unable to register.");
        return;
      }

      router.push(safeNextPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to register.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Subscribe as a reader</h1>
      <p className="text-sm text-slate-600">Create an account to save articles and follow new updates.</p>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Display name
        <input
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Email
        <input
          type="email"
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Password
        <input
          type="password"
          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <label className="inline-checkbox text-sm text-slate-700">
        <input
          type="checkbox"
          checked={legalAccepted}
          onChange={(event) => setLegalAccepted(event.target.checked)}
          required
        />
        <span>
          I agree{" "}
          <Link href="/terms" className="font-semibold text-teal-700 hover:text-teal-800">
            Terms of use
          </Link>
          ,{" "}
          <Link href="/privacy" className="font-semibold text-teal-700 hover:text-teal-800">
            Privacy policy
          </Link>{" "}
          and{" "}
          <Link href="/cookie-policy" className="font-semibold text-teal-700 hover:text-teal-800">
            Cookie Policy
          </Link>
          .
        </span>
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || !legalAccepted}
        className="h-11 rounded-full bg-teal-600 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href={`/reader/login${safeNextPath ? `?next=${encodeURIComponent(safeNextPath)}` : ""}`}
          className="font-bold text-teal-700 hover:text-teal-800"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

