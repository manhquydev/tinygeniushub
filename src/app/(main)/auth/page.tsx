import Link from "next/link";
import { AuthSplitShell } from "@/components/auth-split-shell";
import { MascotEcosystemShowcase } from "@/components/mascot-ecosystem-showcase";

export default function AuthIndexPage() {
  const hourOfDay = new Date().getHours();

  return (
    <AuthSplitShell
      badge="Welcome"
      title="Chọn cổng truy cập phù hợp cho phụ huynh"
      description="Đăng nhập nếu đã có tài khoản hoặc khởi tạo trial mới để trải nghiệm nền tảng học tập tại nhà cùng con."
    >
      <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_52px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="grid gap-2">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">Sẵn sàng bắt đầu?</h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Truy cập dashboard phụ huynh để theo dõi bài học, hồ sơ bé và toàn bộ tiến trình phát triển mỗi ngày.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/auth/login"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-bold text-white shadow-[0_16px_30px_rgba(5,150,105,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(5,150,105,0.35)]"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50/60 px-5 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/70"
          >
            Tạo tài khoản trial
          </Link>
        </div>
        <p className="text-center text-sm text-slate-600">
          Quên mật khẩu?{" "}
          <Link href="/auth/forgot-password" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Khôi phục tại đây
          </Link>
        </p>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <MascotEcosystemShowcase
            compact
            title="Mascot Ecosystem Preview"
            description="Linh vật được chọn theo nhịp thời gian thực của ngày, tạo cảm giác sống và có chủ đích."
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
