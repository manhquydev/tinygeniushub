import Link from "next/link";
import { AuthSplitShell } from "@/components/auth-split-shell";
import { MascotEcosystemShowcase } from "@/components/mascot-ecosystem-showcase";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";

interface AuthIndexPageProps {
  searchParams?:
    | Promise<{ next?: string | string[]; intent?: string | string[] }>
    | { next?: string | string[]; intent?: string | string[] };
}

function readSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function AuthIndexPage({ searchParams }: AuthIndexPageProps) {
  const hourOfDay = new Date().getHours();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(readSingleParam(resolvedSearchParams?.next));
  const intent = readSingleParam(resolvedSearchParams?.intent);
  const isCheckoutIntent = intent === "checkout";

  const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  const signInHref = `/auth/login${nextQuery}`;
  const signUpHref = `/auth/signup${nextQuery}`;
  const forgotPasswordHref = nextPath
    ? `/auth/forgot-password?next=${encodeURIComponent(nextPath)}`
    : "/auth/forgot-password";

  return (
    <AuthSplitShell
      badge={isCheckoutIntent ? "Pay" : "Welcome"}
      title={isCheckoutIntent ? "Continue paying for the course" : "Select the parent access portal"}
      description={
        isCheckoutIntent
          ? "Sign in if you already have an account, or create a new account. After authentication, the system will return you to the selected course."
          : "Log in if you already have an account or create a new one to manage your child's profile and buy courses."
      }
    >
      <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_52px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="grid gap-2">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">
            {isCheckoutIntent ? "Complete login to continue" : "Ready to get started?"}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {isCheckoutIntent
              ? "After logging in or registering, you will return to the correct course page you just selected."
              : "Go to the parent dashboard to manage your child's profile, track progress and open purchased courses."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={signInHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-bold text-white shadow-[0_16px_30px_rgba(5,150,105,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(5,150,105,0.35)]"
          >
            Log in
          </Link>
          <Link
            href={signUpHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50/60 px-5 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/70"
          >
            Create an account
          </Link>
        </div>
        <p className="text-center text-sm text-slate-600">
          Forgot password?{" "}
          <Link href={forgotPasswordHref} className="font-semibold text-emerald-700 hover:text-emerald-800">
            Restore here
          </Link>
        </p>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <MascotEcosystemShowcase
            compact
            title="Mascot ecosystem"
            description="The mascot changes according to the time of day so that your child's learning journey is always lively."
            context={{
              surface: "auth-entry",
              hourOfDay,
            }}
          />
        </div>
      </div>
    </AuthSplitShell>
  );
}
