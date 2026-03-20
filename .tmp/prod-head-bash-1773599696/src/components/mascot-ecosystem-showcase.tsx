import { Mascot } from "@/components/mascot";
import {
  buildMascotNarrativeMap,
  type MascotNarrativeContext,
  type MascotNarrativeScene,
  type MascotNarrativeTone,
} from "@/components/mascot/narrative-map";

interface MascotEcosystemShowcaseProps {
  compact?: boolean;
  title?: string;
  description?: string;
  context?: MascotNarrativeContext;
  scenes?: MascotNarrativeScene[];
}

const TONE_CLASSNAME: Record<MascotNarrativeTone, string> = {
  sky: "bg-[linear-gradient(145deg,#ecfeff_0%,#cffafe_42%,#bfdbfe_100%)] border-cyan-200/80 shadow-[0_14px_30px_rgba(6,182,212,0.18)]",
  indigo:
    "bg-[linear-gradient(150deg,#eff6ff_0%,#dbeafe_48%,#ddd6fe_100%)] border-indigo-200/80 shadow-[0_14px_30px_rgba(79,70,229,0.16)]",
  rose: "bg-[linear-gradient(150deg,#fff1f2_0%,#ffe4e6_44%,#fce7f3_100%)] border-rose-200/80 shadow-[0_14px_30px_rgba(244,63,94,0.14)]",
  mint: "bg-[linear-gradient(145deg,#ecfdf5_0%,#d1fae5_46%,#ccfbf1_100%)] border-emerald-200/80 shadow-[0_14px_30px_rgba(16,185,129,0.16)]",
};

const DEFAULT_CONTEXT: MascotNarrativeContext = {
  surface: "auth-entry",
};

export function MascotEcosystemShowcase({
  compact = false,
  title = "Hệ Sinh Thái Linh Vật",
  description = "Mỗi linh vật được gắn với một ngữ cảnh rõ ràng, tạo cảm xúc có chủ đích thay vì trang trí đại trà.",
  context = DEFAULT_CONTEXT,
  scenes,
}: MascotEcosystemShowcaseProps) {
  const resolvedScenes = scenes ?? buildMascotNarrativeMap(context);

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-3xl">{title}</h2>
        <p className="max-w-[72ch] text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>
      </header>

      <div
        className={
          compact
            ? "grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 overflow-x-auto pb-1"
            : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        }
      >
        {resolvedScenes.map((scene) => (
          <article
            key={scene.id}
            className={`grid gap-3 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 ${TONE_CLASSNAME[scene.tone]}`}
          >
            <span className="inline-flex w-fit rounded-full border border-white/70 bg-white/55 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-700">
              {scene.badge}
            </span>
            <div className="grid place-items-center rounded-xl bg-white/55 py-3">
              <Mascot
                variant={scene.variant}
                state={scene.state}
                actionProp={scene.actionProp}
                parentState={scene.parentState}
                childState={scene.childState}
                parentActionProp={scene.parentActionProp}
                childActionProp={scene.childActionProp}
                size={scene.size}
                motionLevel={scene.motionLevel ?? (compact ? "minimal" : "soft")}
                pauseWhenOffscreen
              />
            </div>
            <div className="grid gap-1">
              <h3 className="text-base font-extrabold text-slate-900">{scene.title}</h3>
              <p className="text-sm leading-relaxed text-slate-700">{scene.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
