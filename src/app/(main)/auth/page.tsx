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
      badge={isCheckoutIntent ? "Thanh toán" : "Chào mừng"}
      title={isCheckoutIntent ? "Tiếp tục thanh toán khóa học" : "Chọn cổng truy cập phụ huynh"}
      description={
        isCheckoutIntent
          ? "Đăng nhập nếu bạn đã có tài khoản, hoặc tạo tài khoản mới. Sau xác thực, hệ thống sẽ đưa bạn quay lại khóa học đang chọn."
          : "Đăng nhập nếu đã có tài khoản hoặc tạo mới để quản lý hồ sơ của bé và mua khóa học."
      }
    >
      <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_52px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="grid gap-2">
          <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900 sm:text-[2rem]">
            {isCheckoutIntent ? "Hoàn tất đăng nhập để tiếp tục" : "Sẵn sàng bắt đầu?"}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {isCheckoutIntent
              ? "Sau khi đăng nhập hoặc đăng ký xong, bạn sẽ quay lại đúng trang khóa học vừa chọn."
              : "Vào bảng điều khiển phụ huynh để quản lý hồ sơ bé, theo dõi tiến độ và mở khóa học đã mua."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={signInHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-bold text-white shadow-[0_16px_30px_rgba(5,150,105,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(5,150,105,0.35)]"
          >
            Đăng nhập
          </Link>
          <Link
            href={signUpHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50/60 px-5 text-sm font-bold text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100/70"
          >
            Tạo tài khoản
          </Link>
        </div>
        <p className="text-center text-sm text-slate-600">
          Quên mật khẩu?{" "}
          <Link href={forgotPasswordHref} className="font-semibold text-emerald-700 hover:text-emerald-800">
            Khôi phục tại đây
          </Link>
        </p>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
          <MascotEcosystemShowcase
            compact
            title="Hệ sinh thái linh vật"
            description="Linh vật thay đổi theo nhịp thời gian trong ngày để hành trình học của bé luôn sinh động."
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
