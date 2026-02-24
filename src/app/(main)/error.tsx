"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
import { Mascot } from "@/components/mascot";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-5 rounded-3xl border border-slate-200/70 bg-slate-50 px-6 py-12 text-center shadow-[0_24px_60px_rgba(15,23,42,0.13)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.12)_0%,transparent_34%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.11)_0%,transparent_35%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.14)_0%,transparent_42%)]"
        />
        <m.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
        >
          <Mascot
            variant="small"
            state="sad"
            gazeDirection="center"
            size={200}
            motionLevel="full"
            className="drop-shadow-[0_16px_30px_rgba(15,23,42,0.2)]"
          />
        </m.div>

        <h1 className="relative z-10 max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-4xl">
          Trang này gặp sự cố rồi...
        </h1>
        <p className="relative z-10 max-w-[44ch] text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
          Thử lại hoặc quay về trang trước nhé!
        </p>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-500 px-6 text-sm font-bold text-white shadow-[0_14px_28px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            Quay lại
          </button>
        </div>

        {isDevelopment && error.digest ? (
          <p className="relative z-10 text-xs italic text-slate-500">digest: {error.digest}</p>
        ) : null}
      </section>
    </LazyMotion>
  );
}
