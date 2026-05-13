import Link from "next/link";
import { CreditCard, Gift, Heart, Users } from "lucide-react";
import { ReferralClaimForm } from "@/components/referral-claim-form";

type ReferralSummary = {
  code: string | null;
  totalReferrals: number;
  paidReferrals: number;
  rewardedReferrals: number;
};

type Props = {
  referral: ReferralSummary;
};

export function DashboardReferralSection({ referral }: Props) {
  return (
    <>
      {referral.code ? (
        <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-[0_12px_28px_rgba(251,191,36,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Gift size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.01em] text-slate-900">
                  Refer friends — get rewarded together
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Each family you refer receives a <strong>welcome offer</strong>. You receive{" "}
                  <strong>reward vouchers</strong> after they complete payment.
                </p>
                <p className="mt-2 inline-block rounded-xl border border-amber-200 bg-white px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-amber-700">
                  {referral.code}
                </p>
              </div>
            </div>
            <Link
              href="/referral"
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-amber-500 px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(245,158,11,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-600"
            >
              <Gift size={16} />
              Share now
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Referral code</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Heart size={16} />
              <span className="text-sm font-semibold">Referral code</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">
              {referral.code ?? "Not created yet"}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Users size={16} />
              <span className="text-sm font-semibold">Total referrals</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.totalReferrals}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard size={16} />
              <span className="text-sm font-semibold">Paid</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.paidReferrals}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Gift size={16} />
              <span className="text-sm font-semibold">Received reward</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-slate-900">{referral.rewardedReferrals}</p>
          </article>
        </div>
      </section>

      <ReferralClaimForm ownCode={referral.code} />
    </>
  );
}
