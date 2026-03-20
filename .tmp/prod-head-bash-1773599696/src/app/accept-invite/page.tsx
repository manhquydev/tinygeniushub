import Link from "next/link";
import { redirect } from "next/navigation";
import { Mascot } from "@/components/mascot";
import { acceptCaregiverInviteByToken } from "@/modules/caregivers/service";
import { DomainError } from "@/modules/platform/errors";

interface AcceptInvitePageProps {
  searchParams?:
    | Promise<{ token?: string | string[] }>
    | { token?: string | string[] };
}

function resolveToken(searchParams: { token?: string | string[] } | undefined) {
  const rawToken = searchParams?.token;
  if (Array.isArray(rawToken)) {
    return rawToken[0];
  }
  return rawToken;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = resolveToken(resolvedSearchParams);
  if (!token) {
    redirect("/");
  }

  let parentDisplayName: string | null = null;
  let errorMessage: string | null = null;

  try {
    const result = await acceptCaregiverInviteByToken(token);
    parentDisplayName = result.parentDisplayName;
  } catch (error) {
    if (error instanceof DomainError) {
      errorMessage = error.message;
    } else {
      errorMessage = "Không thể xử lý lời mời lúc này. Vui lòng thử lại sau.";
    }
  }

  const hasSuccess = !errorMessage;

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <p className="inline-flex w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Caregiver Invite
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-900 sm:text-4xl">
          Xác nhận lời mời caregiver
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-slate-600 sm:text-base">
          Hoàn tất bước xác nhận để cùng phụ huynh theo dõi tiến độ học tập của bé.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200/75 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] sm:p-7">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Mascot
            variant="big"
            state={hasSuccess ? "celebrating" : "thinking"}
            actionProp={hasSuccess ? "magic" : "reading"}
            size={188}
            motionLevel="soft"
            pauseWhenOffscreen
          />

          {hasSuccess ? (
            <>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.02em] text-slate-900">
                Bạn đã được thêm làm caregiver!
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                {parentDisplayName
                  ? `Lời mời từ ${parentDisplayName} đã được xác nhận thành công.`
                  : "Lời mời đã được xác nhận thành công."}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-2xl font-black tracking-[-0.02em] text-slate-900">
                Không thể chấp nhận lời mời
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                {errorMessage}
              </p>
            </>
          )}

          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5"
          >
            Về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
