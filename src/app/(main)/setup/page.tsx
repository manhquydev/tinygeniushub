import { redirect } from "next/navigation";
import { ParentSetupFlow } from "@/components/parent-setup-flow";
import { requireParent } from "@/lib/auth/require-parent";
import { getParentOnboardingState, isSetupRequired } from "@/lib/onboarding/parent-onboarding";

export default async function ParentSetupPage() {
  const parent = await requireParent();
  const onboardingState = await getParentOnboardingState(parent.id);

  if (!isSetupRequired(onboardingState)) {
    redirect("/parent/dashboard");
  }

  return (
    <div className="page-stack">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/75 bg-gradient-to-br from-white via-teal-50 to-sky-50 p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)] sm:p-7">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(20,184,166,0.18)_0%,transparent_45%),radial-gradient(circle_at_88%_76%,rgba(14,165,233,0.2)_0%,transparent_42%)]"
        />
        <div className="relative z-[1] space-y-2">
          <p className="inline-flex w-fit rounded-full border border-teal-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            Thiết lập phụ huynh
          </p>
          <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900 sm:text-4xl">Khởi tạo hành trình đầu tiên cho bé</h1>
          <p className="max-w-[70ch] text-sm leading-relaxed text-slate-600 sm:text-base">
            Chào {parent.displayName ?? parent.email}. Hoàn tất 3 bước thiết lập để kích hoạt bảng điều khiển thông minh dành riêng cho gia đình bạn.
          </p>
        </div>
      </section>

      <ParentSetupFlow parentDisplayName={parent.displayName ?? parent.email} />
    </div>
  );
}
