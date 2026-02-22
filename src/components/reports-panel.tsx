"use client";

import { WeeklyReport } from "@prisma/client";
import { useState } from "react";

type TrackSummary = {
  lessons: number;
  avgQuiz: number;
};

type ReportRecommendations = {
  nextWeek?: string[];
};

type ReportWithChild = WeeklyReport & {
  child: {
    id: string;
    nickname: string;
  };
};

interface ReportsPanelProps {
  initialReports: ReportWithChild[];
}

function parseTrackSummary(value: unknown): TrackSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as { lessons?: unknown; avgQuiz?: unknown };
  if (typeof source.lessons !== "number" || typeof source.avgQuiz !== "number") {
    return null;
  }

  return {
    lessons: source.lessons,
    avgQuiz: source.avgQuiz,
  };
}

function parseSkillsSummary(value: WeeklyReport["skillsSummary"]): Record<string, TrackSummary> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const parsed = Object.entries(value as Record<string, unknown>).reduce<Record<string, TrackSummary>>(
    (acc, [track, candidate]) => {
      const trackSummary = parseTrackSummary(candidate);
      if (trackSummary) {
        acc[track] = trackSummary;
      }
      return acc;
    },
    {},
  );

  return Object.keys(parsed).length > 0 ? parsed : null;
}

function parseRecommendations(value: WeeklyReport["recommendations"]): ReportRecommendations | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const nextWeek = (value as { nextWeek?: unknown }).nextWeek;
  if (!Array.isArray(nextWeek)) {
    return null;
  }

  const normalized = nextWeek.filter((item): item is string => typeof item === "string" && item.length > 0);
  if (normalized.length === 0) {
    return null;
  }

  return { nextWeek: normalized };
}

export function ReportsPanel({ initialReports }: ReportsPanelProps) {
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function regenerateReports() {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể tạo lại báo cáo tuần");
        return;
      }

      const refresh = await fetch("/api/reports/weekly");
      const refreshBody = await refresh.json();
      if (refresh.ok && refreshBody.ok) {
        setReports(refreshBody.data.reports);
      }
    } catch (regenerateError) {
      setError(regenerateError instanceof Error ? regenerateError.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function sendWeeklyEmails() {
    setSending(true);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch("/api/reports/send-email", {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok || !body.ok) {
        setError(body.error?.message ?? "Không thể gửi weekly email");
        return;
      }

      const result = body.data.result as { sent: number; skipped: number; bounced: number };
      setInfo(`Đã gửi: ${result.sent}, bỏ qua: ${result.skipped}, lỗi/bounce: ${result.bounced}`);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Lỗi không xác định");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="section-header">
          <h2>Báo cáo học tập tuần</h2>
          <div className="hero-actions">
            <button className="solid-button" onClick={regenerateReports} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo báo cáo mới"}
            </button>
            <button className="ghost-button" onClick={sendWeeklyEmails} disabled={sending}>
              {sending ? "Đang gửi..." : "Gửi email báo cáo"}
            </button>
          </div>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {info ? <p className="muted-text">{info}</p> : null}
      </section>

      {reports.length === 0 ? (
        <section className="card">
          <p className="muted-text" style={{ textAlign: "center", padding: "2rem 0" }}>
            Chưa có báo cáo tuần nào được tạo.
          </p>
        </section>
      ) : (
        reports.map((report) => {
          const skillsSummary = parseSkillsSummary(report.skillsSummary);
          const recommendations = parseRecommendations(report.recommendations);

          return (
            <section key={report.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.3rem" }}>{report.child.nickname}</h3>
                  <span className="muted-text">
                    Tuần bắt đầu từ: {new Date(report.weekStart).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
              </div>

              <div className="metrics">
                <article className="metric" style={{ background: "color-mix(in srgb, var(--surface-100) 40%, white)" }}>
                  <span className="muted-text">Bài học hoàn thành</span>
                  <strong style={{ color: "var(--brand-500)", fontSize: "1.8rem" }}>{report.lessonsCompleted}</strong>
                </article>
                <article className="metric" style={{ background: "color-mix(in srgb, var(--surface-100) 40%, white)" }}>
                  <span className="muted-text">Thời gian học</span>
                  <strong style={{ color: "var(--brand-500)", fontSize: "1.8rem" }}>{report.minutesLearned} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink-700)" }}>phút</span></strong>
                </article>
                <article className="metric" style={{ background: "color-mix(in srgb, var(--surface-100) 40%, white)" }}>
                  <span className="muted-text">Chuỗi chăm chỉ (Streak)</span>
                  <strong style={{ color: "var(--warning-500)", fontSize: "1.8rem" }}>{report.streakDays} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink-700)" }}>ngày</span></strong>
                </article>
              </div>

              {/* Insights: Skills Summary */}
              {skillsSummary && Object.keys(skillsSummary).length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <h4 style={{ marginBottom: "1rem", fontSize: "1.1rem", color: "var(--ink-800)" }}>Năng lực nổi bật</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    {Object.entries(skillsSummary).map(([track, stats]) => {
                      const trackLabels: Record<string, string> = {
                        ENGLISH: "Tiếng Anh",
                        MATH: "Toán & Logic",
                        HABIT: "Thói quen & Kỹ năng",
                      };
                      const label = trackLabels[track] || track;
                      return (
                        <div key={track} style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--surface-200)", background: "white" }}>
                          <div style={{ fontWeight: 600, color: "var(--ink-900)", marginBottom: "0.25rem" }}>{label}</div>
                          <div style={{ fontSize: "0.9rem", color: "var(--ink-600)", marginBottom: "0.5rem" }}>
                            Đã học: <strong style={{ color: "var(--brand-600)" }}>{stats.lessons}</strong> bài
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--ink-600)", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                            <span>Điểm TB:</span>
                            <strong>{Math.round(stats.avgQuiz)}%</strong>
                          </div>
                          <div style={{ width: "100%", height: "8px", background: "var(--surface-200)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.round(stats.avgQuiz)}%`, height: "100%", background: "linear-gradient(90deg, var(--brand-500), #34d399)", borderRadius: "4px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendations?.nextWeek && recommendations.nextWeek.length > 0 && (
                <div style={{ marginTop: "2rem", padding: "1.5rem", borderRadius: "12px", background: "color-mix(in srgb, var(--brand-100) 30%, white)", border: "1px solid var(--brand-100)" }}>
                  <h4 style={{ marginBottom: "1rem", fontSize: "1.1rem", color: "var(--brand-700)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Góc ba mẹ (Lời khuyên)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "var(--ink-700)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {recommendations.nextWeek.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

            </section>
          );
        })
      )}
    </div>
  );
}
