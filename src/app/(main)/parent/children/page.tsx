import { CaregiverManager } from "@/components/caregiver-manager";
import { ChildrenManager } from "@/components/children-manager";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";

type CaregiverInviteStatus = "pending" | "accepted" | "expired";

export default async function ParentChildrenPage() {
  const parent = await requireParent();

  const [children, caregiverInvites, caregiversCount] = await Promise.all([
    prisma.childProfile.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nickname: true,
        ageBand: true,
        avatarId: true,
      },
    }),
    prisma.caregiverInvite.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        accepted: true,
        createdAt: true,
        expiresAt: true,
      },
    }),
    prisma.caregiverAccount.count({
      where: {
        parentId: parent.id,
      },
    }),
  ]);

  const caregiverLimit = 2;
  const childLimit = 1;
  const now = new Date();
  const pendingInvites = caregiverInvites.filter(
    (invite) => !invite.accepted && invite.expiresAt.getTime() > now.getTime(),
  ).length;
  const usedSlots = Math.min(caregiverLimit, caregiversCount + pendingInvites);
  const invitesWithStatus = caregiverInvites.map((invite) => {
    const status: CaregiverInviteStatus = invite.accepted
      ? "accepted"
      : invite.expiresAt.getTime() <= now.getTime()
        ? "expired"
        : "pending";

    return {
      id: invite.id,
      email: invite.email,
      accepted: invite.accepted,
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
      status,
    };
  });

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200/75 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <p className="inline-flex w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Parent Children
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-900 sm:text-4xl">Manage baby records</h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-slate-600 sm:text-base">
          Each account has one main profile throughout. Adjust your child's information and quickly access daily lessons here.
        </p>
      </section>

      <ChildrenManager initialChildren={children} childLimit={childLimit} />
      <CaregiverManager
        initialCaregivers={invitesWithStatus}
        initialCaregiverLimit={caregiverLimit}
        initialUsedSlots={usedSlots}
      />
    </div>
  );
}
