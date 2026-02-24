import { GlobalLoader } from "@/components/global-loader";
import { Mascot } from "@/components/mascot";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50">
      {/* Thin progress bar top */}
      <div
        className="fixed left-0 top-0 z-[240] h-[3px] w-full overflow-hidden"
        aria-hidden
      >
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400"
          style={{ animation: "loadingBar 1.4s cubic-bezier(0.65,0,0.35,1) infinite" }}
        />
      </div>

      <GlobalLoader />

      {/* Mascot corner overlay */}
      <div className="pointer-events-none fixed inset-0 z-[230] flex items-end justify-end p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-sky-200/35 bg-slate-950/82 px-3 py-2 text-cyan-100 shadow-[0_14px_28px_rgba(2,6,23,0.45)]">
          <Mascot variant="small" state="sleepy" gazeDirection="center" size={88} motionLevel="minimal" />
          <p className="animate-pulse text-sm font-semibold">Đang tải...</p>
        </div>
      </div>
    </div>
  );
}

