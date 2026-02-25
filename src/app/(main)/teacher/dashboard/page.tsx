import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { getOrgStudentProgress } from "@/modules/organizations/organization-service";

export const metadata: Metadata = {
  title: "Lớp học — Cùng Con Tự Học",
};

export default async function TeacherDashboardPage() {
  const parent = await getParentFromServerCookie();
  if (!parent) redirect("/auth/login?next=/teacher/dashboard");

  // Find the organization where this parent is a TEACHER_ADMIN
  const membership = await prisma.organizationMember.findFirst({
    where: { parentId: parent.id, role: "TEACHER_ADMIN" },
    include: { organization: true },
  });

  if (!membership) {
    return (
      <div className="page-stack">
        <section className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Không có quyền truy cập</h1>
          <p className="muted-text" style={{ marginTop: "0.5rem" }}>
            Tài khoản của bạn chưa được gán vai trò giáo viên. Liên hệ quản trị viên để được hỗ trợ.
          </p>
        </section>
      </div>
    );
  }

  const org = membership.organization;
  const students = await getOrgStudentProgress(org.id, parent.id);

  const activeThisWeek = students.filter((s) =>
    s.children.some((c) => c.lessonsCompleted > 0),
  ).length;
  const totalLessons = students.reduce(
    (sum, s) => sum + s.children.reduce((cs, c) => cs + c.lessonsCompleted, 0),
    0,
  );

  return (
    <div className="page-stack">
      {/* Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.02em] text-slate-900">{org.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{org.slug} · {students.length} học sinh</p>
          </div>
          <a
            href={`/api/teacher/class-report?orgId=${org.id}`}
            className="ghost-button"
            download={`bao-cao-${org.slug}.pdf`}
          >
            Tải báo cáo lớp PDF
          </a>
        </div>
      </section>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Tổng học sinh", value: students.length },
          { label: "Học sinh hoạt động (30 ngày)", value: activeThisWeek },
          { label: "Tổng bài hoàn thành", value: totalLessons },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Student progress table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Học sinh / Phụ huynh</th>
                <th className="px-4 py-3">Bé</th>
                <th className="px-4 py-3">Streak cao nhất</th>
                <th className="px-4 py-3">Bài hoàn thành (30 ngày)</th>
                <th className="px-4 py-3">Hoạt động cuối</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Chưa có học sinh nào. Dùng tính năng tải lên hàng loạt để thêm học sinh.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.parentId} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.displayName || s.email}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.children.map((c) => c.nickname).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.children.length > 0
                        ? `${Math.max(...s.children.map((c) => c.streakDays))}🔥`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.children.reduce((sum, c) => sum + c.lessonsCompleted, 0)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {s.children[0]?.lastActiveAt
                        ? new Date(s.children[0].lastActiveAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
