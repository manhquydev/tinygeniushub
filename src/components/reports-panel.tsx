"use client";

import { WeeklyReport } from "@prisma/client";
import { BookOpenCheck, Brain, Clock3, Flame, Lightbulb, Mail, RefreshCcw, Trophy } from "lucide-react";
import { useState } from "react";
import type { ApiSuccess, WeeklyReportDTO } from "@/lib/api-types";
import { Mascot } from "@/components/mascot";
import { WeeklyProgressChart } from "@/components/weekly-progress-chart";

type TrackSummary = {
  lessons: number;
  avgQuiz: number;
};

type ReportRecommendations = {
  nextWeek?: string[];
};

type WeeklyTrend = {
  lessonsChange: number;
  minutesChange: number;
  streakChange: number;
  overallDirection: "up" | "down" | "stable";
};

type ReportWithChild = WeeklyReport & {
  child: {
    id: string;
    nickname: string;
  };
  trend?: WeeklyTrend;
};

type SkillScore = {
  id: string;
  label: string;
  value: number;
  toneClass: string;
};

interface ReportsPanelProps {
  initialReports: ReportWithChild[];
}

type TrendBadgeModel = {
  text: string;
  className: string;
};

type ReportsWeeklyApiResponse = {
  ok: boolean;
  data?: ApiSuccess<{ reports: WeeklyReportDTO[] }>["data"];
  error?: {
    message?: string;
  };
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
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

function averageQuiz(skillsSummary: Record<string, TrackSummary> | null) {
  if (!skillsSummary || Object.keys(skillsSummary).length === 0) {
    return 0;
  }

  const values = Object.values(skillsSummary).map((track) => track.avgQuiz);
  return Math.round(values.reduce((total, score) => total + score, 0) / values.length);
}

function buildTrendBadge(change: number, unit: string): TrendBadgeModel {
  if (change > 0) {
    return {
      text: `+${change} ${unit}`,
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (change < 0) {
    return {
      text: `${change} ${unit}`,
      className: "bg-rose-100 text-rose-700",
    };
  }

  return {
    text: "=",
    className: "bg-slate-100 text-slate-600",
  };
}

function buildSkillScores(report: ReportWithChild, skillsSummary: Record<string, TrackSummary> | null): SkillScore[] {
  const avgQuiz = averageQuiz(skillsSummary);
  const mathQuiz = skillsSummary?.MATH?.avgQuiz ?? Math.round(avgQuiz * 0.84);
  const languageQuiz = skillsSummary?.ENGLISH?.avgQuiz ?? Math.round(avgQuiz * 0.88);
  const habitLessons = skillsSummary?.HABIT?.lessons ?? 0;

  const focus = clampPercent(report.streakDays * 13 + report.lessonsCompleted * 4 + habitLessons * 3);
  const memory = clampPercent(Math.max(38, avgQuiz || report.lessonsCompleted * 12));
  const math = clampPercent(Math.max(32, mathQuiz || avgQuiz));
  const language = clampPercent(Math.max(35, languageQuiz || avgQuiz));

  return [
    {
      id: "focus",
      label: "Mức độ tập trung",
      value: focus,
      toneClass: "from-teal-500 to-cyan-500",
    },
    {
      id: "memory",
      label: "Trí nhớ",
      value: memory,
      toneClass: "from-amber-500 to-orange-500",
    },
    {
      id: "math",
      label: "Toán học",
      value: math,
      toneClass: "from-sky-500 to-blue-500",
    },
    {
      id: "language",
      label: "Ngôn ngữ",
      value: language,
      toneClass: "from-violet-500 to-indigo-500",
    },
  ];
}

function buildRadarPoints(scores: SkillScore[]) {
  const center = 100;
  const baseRadius = 72;

  const vectors = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  return scores
    .map((score, index) => {
      const ratio = score.value / 100;
      const radius = baseRadius * ratio;
      const vector = vectors[index];
      const x = center + vector.x * radius;
      const y = center + vector.y * radius;
      return `${x},${y}`;
    })
    .join(" ");
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
      const refreshBody = (await refresh.json()) as ReportsWeeklyApiResponse;
      if (refresh.ok && refreshBody.ok) {
        setReports((refreshBody.data?.reports ?? []) as unknown as ReportWithChild[]);
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

  function openPrintableReport(reportId: string) {
    window.open(`/api/reports/${encodeURIComponent(reportId)}/pdf`, "_blank", "noopener,noreferrer");
  }

  const chartPayload = (() => {
    if (reports.length === 0) {
      return null;
    }

    const countsByChildId = reports.reduce<Map<string, number>>((acc, report) => {
      acc.set(report.child.id, (acc.get(report.child.id) ?? 0) + 1);
      return acc;
    }, new Map());

    let selectedChildId = reports[0]?.child.id ?? "";
    let selectedCount = countsByChildId.get(selectedChildId) ?? 0;
    for (const [childId, count] of countsByChildId.entries()) {
      if (count > selectedCount) {
        selectedChildId = childId;
        selectedCount = count;
      }
    }

    const selectedChildReports = reports
      .filter((report) => report.child.id === selectedChildId)
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
      .slice(-6);

    if (selectedChildReports.length === 0) {
      return null;
    }

    return {
      childNickname: selectedChildReports[0].child.nickname,
      weeks: selectedChildReports.map((report) => ({
        weekStart: report.weekStart.toISOString(),
        minutesLearned: report.minutesLearned,
        lessonsCompleted: report.lessonsCompleted,
        streakDays: report.streakDays,
      })),
    };
  })();

  return (
    <div className="page-stack">
      <section className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.02em] text-slate-900">Báo cáo học tập tuần</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Theo dõi tiến độ học, năng lực kỹ năng và gợi ý hành động cho phụ huynh.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={regenerateReports}
              disabled={loading}
            >
              <RefreshCcw size={15} />
              {loading ? "Đang tạo..." : "Tạo báo cáo ngay"}
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={sendWeeklyEmails}
              disabled={sending}
            >
              <Mail size={15} />
              {sending ? "Đang gửi..." : "Gửi email báo cáo"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
        {info ? <p className="mt-3 text-sm font-medium text-slate-600">{info}</p> : null}
      </section>

      {chartPayload ? (
        <WeeklyProgressChart weeks={chartPayload.weeks} childNickname={chartPayload.childNickname} />
      ) : null}

      {reports.length === 0 ? (
        <section className="rounded-3xl border border-slate-200/75 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <div className="mascot-empty-state">
            <Mascot variant="small" state="sleepy" size={164} actionProp="none" motionLevel="minimal" pauseWhenOffscreen />
            <h3>Chưa có gì ở đây cả...</h3>
            <p className="muted-text">Chưa có báo cáo tuần nào được tạo.</p>
          </div>
        </section>
      ) : (
        reports.map((report) => {
          const skillsSummary = parseSkillsSummary(report.skillsSummary);
          const recommendations = parseRecommendations(report.recommendations);
          const skillScores = buildSkillScores(report, skillsSummary);
          const radarPoints = buildRadarPoints(skillScores);
          const trend = report.trend;
          const minutesTrend = buildTrendBadge(trend?.minutesChange ?? 0, "phút");
          const lessonsTrend = buildTrendBadge(trend?.lessonsChange ?? 0, "bài");
          const streakTrend = buildTrendBadge(trend?.streakChange ?? 0, "ngày");
          const overallScore =
            skillScores.length > 0
              ? Math.round(skillScores.reduce((total, skill) => total + skill.value, 0) / skillScores.length)
              : 0;

          return (
            <section key={report.id} className="rounded-3xl border border-slate-200/75 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-[-0.02em] text-slate-900">{report.child.nickname}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    Tuần:{" "}
                    {new Date(report.weekStart).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(report.weekEnd).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    Cập nhật: {new Date(report.generatedAt).toLocaleDateString("vi-VN")}
                  </span>
                  <button
                    type="button"
                    className="inline-flex min-h-8 items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5"
                    onClick={() => {
                      openPrintableReport(report.id);
                    }}
                  >
                    Tải về PDF
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Trophy size={18} />
                  </div>
                  <h4 className="text-lg font-black tracking-[-0.01em] text-slate-900">Tóm tắt thành tích</h4>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock3 size={16} />
                      <span className="text-sm font-semibold">Thời gian học</span>
                    </div>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${minutesTrend.className}`}>
                      {minutesTrend.text}
                    </span>
                    <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-900">{report.minutesLearned}</p>
                    <p className="text-xs font-semibold text-slate-500">phút / tuần</p>
                  </article>
                  <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BookOpenCheck size={16} />
                      <span className="text-sm font-semibold">Bài học</span>
                    </div>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${lessonsTrend.className}`}>
                      {lessonsTrend.text}
                    </span>
                    <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-900">{report.lessonsCompleted}</p>
                    <p className="text-xs font-semibold text-slate-500">bài hoàn thành</p>
                  </article>
                  <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Flame size={16} />
                      <span className="text-sm font-semibold">Chuỗi liên tục</span>
                    </div>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${streakTrend.className}`}>
                      {streakTrend.text}
                    </span>
                    <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-900">{report.streakDays}</p>
                    <p className="text-xs font-semibold text-slate-500">ngày học liên tiếp</p>
                  </article>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <Brain size={18} />
                  </div>
                  <h4 className="text-lg font-black tracking-[-0.01em] text-slate-900">Đánh giá kỹ năng</h4>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-500">Radar tổng quan</p>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">{overallScore}%</span>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <svg viewBox="0 0 200 200" className="h-44 w-44">
                        <polygon points="100,28 172,100 100,172 28,100" fill="none" stroke="#cbd5e1" strokeWidth="1.25" />
                        <polygon points="100,46 154,100 100,154 46,100" fill="none" stroke="#dbeafe" strokeWidth="1.25" />
                        <polygon points="100,64 136,100 100,136 64,100" fill="none" stroke="#e2e8f0" strokeWidth="1.25" />
                        <line x1="100" y1="20" x2="100" y2="180" stroke="#e2e8f0" strokeWidth="1" />
                        <line x1="20" y1="100" x2="180" y2="100" stroke="#e2e8f0" strokeWidth="1" />
                        <polygon points={radarPoints} fill="#0ea5e955" stroke="#0284c7" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {skillScores.map((skill) => (
                      <article key={skill.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-700">{skill.label}</span>
                          <span className="text-sm font-black text-slate-900">{skill.value}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <span
                            className={`block h-full rounded-full bg-gradient-to-r ${skill.toneClass} transition-all duration-500`}
                            style={{ width: `${skill.value}%` }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200/75 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Lightbulb size={18} />
                  </div>
                  <h4 className="text-lg font-black tracking-[-0.01em] text-amber-900">Lời khuyên từ chuyên gia AI</h4>
                </div>

                {recommendations?.nextWeek && recommendations.nextWeek.length > 0 ? (
                  <ul className="grid list-disc gap-2 pl-5 text-sm leading-7 text-amber-900/85">
                    {recommendations.nextWeek.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-relaxed text-amber-900/80">
                    Tuần này bé học ổn định. Phụ huynh nên duy trì nhịp học ngắn mỗi ngày và tăng hoạt động tương tác gia đình vào cuối tuần.
                  </p>
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
