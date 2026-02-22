import { ChildrenManager } from "@/components/children-manager";
import { requireParent } from "@/lib/auth/require-parent";
import { prisma } from "@/lib/db";

export default async function ParentChildrenPage() {
  const parent = await requireParent();

  const [children, subscription] = await Promise.all([
    prisma.childProfile.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nickname: true,
        ageBand: true,
      },
    }),
    prisma.subscription.findUnique({
      where: { parentId: parent.id },
    }),
  ]);

  return (
    <div className="page-stack">
      <ChildrenManager initialChildren={children} childLimit={subscription?.childProfileLimit ?? 3} />
    </div>
  );
}
