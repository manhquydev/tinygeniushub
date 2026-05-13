import { Mascot } from "@/components/mascot";

type Props = {
  parentDisplayName: string;
  heroMessage: string;
  hasRecentCompletion: boolean;
};

export function DashboardHeroSection({ parentDisplayName, heroMessage, hasRecentCompletion }: Props) {
  return (
    <section className="relative isolate overflow-visible rounded-3xl border border-white/45 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-6 shadow-[0_30px_64px_rgba(14,116,144,0.35)] sm:p-8 lg:p-10">
      <div
        aria-hidden
        className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_10%_12%,rgba(255,255,255,0.34)_0%,transparent_40%),radial-gradient(circle_at_82%_80%,rgba(14,165,233,0.34)_0%,transparent_44%),linear-gradient(125deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0)_42%)]"
      />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid max-w-[62ch] gap-3">
          <p className="inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            Parent Dashboard
          </p>
          <h1 className="text-balance text-3xl font-black leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.4rem]">
            Home control panel
          </h1>
          <p className="text-base font-semibold text-cyan-50 sm:text-lg">Hello, {parentDisplayName}</p>
          <p className="text-sm leading-relaxed text-sky-50/95 sm:text-base">{heroMessage}</p>
        </div>
        <div className="relative mx-auto flex w-full max-w-[270px] justify-center lg:mx-0 lg:-mb-16 lg:-mt-10 lg:max-w-[290px]">
          <div
            aria-hidden
            className="absolute bottom-5 h-44 w-44 rounded-full bg-cyan-100/45 blur-[58px] lg:bottom-10 lg:h-48 lg:w-48"
          />
          <Mascot
            variant="big"
            state={hasRecentCompletion ? "celebrating" : "happy"}
            actionProp={hasRecentCompletion ? "magic" : "none"}
            size={240}
            className="relative h-[220px] w-[220px] drop-shadow-[0_24px_44px_rgba(2,6,23,0.34)] sm:h-[240px] sm:w-[240px] lg:h-[260px] lg:w-[260px]"
            motionLevel="full"
            pauseWhenOffscreen
          />
        </div>
      </div>
    </section>
  );
}
