"use client";

import { useState, useMemo } from "react";
import type { StudentProgress } from "./teacher-dashboard-client";

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function lastActiveLabel(dateStr: string | null): string {
  const days = daysSince(dateStr);
  if (days === Infinity) return "Chưa hoạt động";
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

interface Props {
  students: StudentProgress[];
}

export function TeacherProgressGrid({ students }: Props) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    const flat: Array<{
      key: string;
      parentEmail: string;
      displayName: string;
      nickname: string;
      lessonsCompleted: number;
      streakDays: number;
      lastActiveAt: string | null;
      atRisk: boolean;
    }> = [];

    for (const s of students) {
      for (const child of s.children) {
        const name = (s.displayName ?? s.email).toLowerCase();
        const nick = child.nickname.toLowerCase();
        if (q && !name.includes(q) && !nick.includes(q) && !s.email.toLowerCase().includes(q)) continue;
        flat.push({
          key: `${s.parentId}-${child.nickname}`,
          parentEmail: s.email,
          displayName: s.displayName ?? s.email,
          nickname: child.nickname,
          lessonsCompleted: child.lessonsCompleted,
          streakDays: child.streakDays,
          lastActiveAt: child.lastActiveAt,
          atRisk: daysSince(child.lastActiveAt) > 7,
        });
      }
    }
    return flat;
  }, [students, search]);

  if (students.length === 0) {
    return (
      <div className="page-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <p style={{ color: "var(--ink-700)" }}>Chưa có học sinh nào trong lớp.</p>
      </div>
    );
  }

  return (
    <div className="page-stack" style={{ gap: "1rem" }}>
      <input
        type="search"
        placeholder="Tìm theo tên bé hoặc email phụ huynh..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="teacher-search-input"
        aria-label="Tìm kiếm học sinh"
      />

      <div className="teacher-table-wrap">
        <table className="teacher-table">
          <thead>
            <tr>
              <th>Tên bé</th>
              <th>Phụ huynh</th>
              <th>Bài học (30 ngày)</th>
              <th>Streak</th>
              <th>Hoạt động</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={row.atRisk ? "teacher-row-at-risk" : ""}>
                <td className="teacher-cell-bold">{row.nickname}</td>
                <td className="teacher-cell-muted">{row.parentEmail}</td>
                <td>{row.lessonsCompleted}</td>
                <td>{row.streakDays} 🔥</td>
                <td className="teacher-cell-muted">{lastActiveLabel(row.lastActiveAt)}</td>
                <td>
                  {row.atRisk ? (
                    <span className="teacher-badge-risk">Cần chú ý</span>
                  ) : (
                    <span className="teacher-badge-ok">Tốt</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--ink-700)" }}>
            Không tìm thấy học sinh nào.
          </p>
        )}
      </div>
    </div>
  );
}
