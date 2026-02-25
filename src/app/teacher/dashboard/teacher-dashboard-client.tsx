"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeacherProgressGrid } from "./teacher-progress-grid";
import { TeacherBulkEnroll } from "./teacher-bulk-enroll";

export type StudentProgress = {
  parentId: string;
  email: string;
  displayName: string | null;
  children: Array<{
    nickname: string;
    lessonsCompleted: number;
    streakDays: number;
    lastActiveAt: string | null;
  }>;
};

type Tab = "progress" | "enroll";

export function TeacherDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") ?? "";

  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("progress");

  useEffect(() => {
    if (!orgId) {
      setError("Thiếu orgId trong URL.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/organizations/${orgId}/progress`, { signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth/login");
          return;
        }
        if (!res.ok) throw new Error(`Lỗi ${res.status}`);
        const json = (await res.json()) as { ok: boolean; data: { students: StudentProgress[] } };
        setStudents(json.data.students);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name !== "AbortError") {
          setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [orgId, router]);

  const handleDownloadReport = async () => {
    const res = await fetch(`/api/organizations/${orgId}/class-report`);
    if (!res.ok) {
      alert("Không thể tải báo cáo. Vui lòng thử lại.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-lop-${orgId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="page-stack" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "var(--ink-700)" }}>Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack" style={{ textAlign: "center", padding: "4rem 0" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="teacher-dashboard-header">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Dashboard Giáo viên</h1>
          <p style={{ color: "var(--ink-700)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Theo dõi tiến độ học sinh và quản lý lớp học
          </p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={handleDownloadReport}
          style={{ flexShrink: 0 }}
        >
          Tải báo cáo PDF
        </button>
      </div>

      <div className="teacher-tabs">
        <button
          type="button"
          className={activeTab === "progress" ? "teacher-tab-active" : "teacher-tab"}
          onClick={() => setActiveTab("progress")}
        >
          Tiến độ học sinh ({students.length})
        </button>
        <button
          type="button"
          className={activeTab === "enroll" ? "teacher-tab-active" : "teacher-tab"}
          onClick={() => setActiveTab("enroll")}
        >
          Đăng ký hàng loạt
        </button>
      </div>

      {activeTab === "progress" && <TeacherProgressGrid students={students} />}
      {activeTab === "enroll" && <TeacherBulkEnroll orgId={orgId} />}
    </div>
  );
}
