import { prisma } from "@/lib/db";
import { AdminGiftCodePanel } from "@/components/admin-gift-code-panel";

export default async function AdminGiftCodesPage() {
  const giftCodes = await prisma.giftCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <AdminGiftCodePanel
      initialCodes={giftCodes.map((g) => ({
        ...g,
        usedAt: g.usedAt?.toISOString() ?? null,
        expiresAt: g.expiresAt.toISOString(),
        createdAt: g.createdAt.toISOString(),
      }))}
    />
  );
}
