import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";

/**
 * Teacher layout — injects org branding (logo, primaryColor) as CSS variable
 * for white-label appearance.
 */
export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const parent = await getParentFromServerCookie();
  if (!parent) redirect("/session-expired?next=/teacher/dashboard");

  const membership = await prisma.organizationMember.findFirst({
    where: { parentId: parent.id, role: "TEACHER_ADMIN" },
    include: { organization: { select: { name: true, logoUrl: true, primaryColor: true } } },
  });

  const org = membership?.organization;
  const primaryColor = org?.primaryColor ?? "#4F46E5";

  return (
    <>
      {/* Inject org primary color as CSS variable */}
      <style>{`:root { --brand-600: ${primaryColor}; --brand-700: ${primaryColor}; }`}</style>

      {/* Org header bar (only shown when org has branding) */}
      {org && (
        <div
          style={{
            background: primaryColor,
            color: "#fff",
            padding: "0.5rem 1.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          {org.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt={org.name} style={{ height: 24, objectFit: "contain" }} />
          )}
          <span>{org.name}</span>
          <span style={{ opacity: 0.7, fontWeight: 400 }}>· Teacher Dashboard</span>
        </div>
      )}

      {children}
    </>
  );
}
