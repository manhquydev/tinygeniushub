import { GlobalLoader } from "@/components/global-loader";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed left-0 top-0 z-[240] h-[3px] w-full overflow-hidden" aria-hidden>
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400"
          style={{ animation: "loadingBar 1.4s cubic-bezier(0.65,0,0.35,1) infinite" }}
        />
      </div>
      <GlobalLoader />
    </div>
  );
}
