import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getWeeklyTrend } from "@/modules/reports/weekly-report-service";
import type { NextRequest } from "next/server";

type TrendVisual = {
  text: string;
  className: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: Date) {
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildTrendVisual(change: number, unit: string): TrendVisual {
  if (change > 0) {
    return {
      text: `+${change} ${unit}`,
      className: "trend-positive",
    };
  }

  if (change < 0) {
    return {
      text: `${change} ${unit}`,
      className: "trend-negative",
    };
  }

  return {
    text: "=",
    className: "trend-neutral",
  };
}

function parseRecommendations(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [] as string[];
  }

  const candidate = (value as { nextWeek?: unknown }).nextWeek;
  if (!Array.isArray(candidate)) {
    return [] as string[];
  }

  return candidate.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { reportId } = await params;
    if (!reportId) {
      return fail("Report id is required", 400);
    }

    const report = await prisma.weeklyReport.findFirst({
      where: {
        id: reportId,
        child: {
          parentId: parent.id,
        },
      },
      select: {
        id: true,
        childId: true,
        weekStart: true,
        weekEnd: true,
        generatedAt: true,
        lessonsCompleted: true,
        minutesLearned: true,
        streakDays: true,
        recommendations: true,
        child: {
          select: {
            nickname: true,
          },
        },
      },
    });

    if (!report) {
      return fail("Weekly report not found", 404);
    }

    const previousReport = await prisma.weeklyReport.findFirst({
      where: {
        childId: report.childId,
        generatedAt: {
          lt: report.generatedAt,
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
      select: {
        lessonsCompleted: true,
        minutesLearned: true,
        streakDays: true,
      },
    });

    const trend = getWeeklyTrend(report.childId, report, previousReport);
    const lessonsTrend = buildTrendVisual(trend.lessonsChange, "post");
    const minutesTrend = buildTrendVisual(trend.minutesChange, "minute");
    const streakTrend = buildTrendVisual(trend.streakChange, "day");
    const recommendations = parseRecommendations(report.recommendations);
    const recommendationsHtml =
      recommendations.length > 0
        ? `<ul>${recommendations
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        : "<p>Continue to maintain a short learning rhythm every day to keep your child's progress steady.</p>";

    const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Weekly report - ${escapeHtml(report.child.nickname)}</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: linear-gradient(160deg, #f0f9ff 0%, #eff6ff 48%, #f8fafc 100%);
        color: #0f172a;
      }
      .sheet {
        max-width: 860px;
        margin: 24px auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 22px 52px rgba(15, 23, 42, 0.1);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
      }
      .brand {
        font-size: 20px;
        font-weight: 800;
      }
      .meta {
        text-align: right;
        font-size: 13px;
        color: #475569;
      }
      h1 {
        margin: 20px 0 4px;
        font-size: 28px;
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 0;
        color: #475569;
      }
      .metrics {
        margin-top: 18px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .metric {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px;
        background: #f8fafc;
      }
      .metric-label {
        font-size: 13px;
        color: #64748b;
      }
      .metric-value {
        margin-top: 6px;
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .trend {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 8px;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 12px;
        font-weight: 700;
      }
      .trend-positive {
        background: #dcfce7;
        color: #166534;
      }
      .trend-negative {
        background: #ffe4e6;
        color: #9f1239;
      }
      .trend-neutral {
        background: #e2e8f0;
        color: #334155;
      }
      .section {
        margin-top: 18px;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px;
      }
      .section h2 {
        margin: 0 0 8px;
        font-size: 17px;
      }
      .section p,
      .section li {
        color: #334155;
        line-height: 1.55;
      }
      .section ul {
        margin: 0;
        padding-left: 18px;
      }
      .footer {
        margin-top: 22px;
        border-top: 1px solid #e2e8f0;
        padding-top: 12px;
        font-size: 12px;
        color: #64748b;
        text-align: center;
      }
      .print-actions {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
      }
      .print-button {
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, #0d9488, #0891b2);
        color: #fff;
        font-weight: 700;
        padding: 10px 14px;
        cursor: pointer;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .sheet {
          margin: 0;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          max-width: none;
          padding: 0;
        }
        .print-actions {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="header">
        <div>
          <div class="brand">TinyGenius Hub</div>
          <div class="subtitle">Weekly study report</div>
        </div>
        <div class="meta">
          <div>Created: ${escapeHtml(formatDate(report.generatedAt))}</div>
          <div>Week: ${escapeHtml(formatDate(report.weekStart))} - ${escapeHtml(formatDate(report.weekEnd))}</div>
        </div>
      </header>

      <h1>${escapeHtml(report.child.nickname)}</h1>
      <p class="subtitle">Overview of current week's progress and trend compared to last week.</p>

      <section class="metrics">
        <article class="metric">
          <div class="metric-label">Lesson completed</div>
          <div class="metric-value">${report.lessonsCompleted}</div>
          <span class="trend ${lessonsTrend.className}">${escapeHtml(lessonsTrend.text)}</span>
        </article>
        <article class="metric">
          <div class="metric-label">Study time</div>
          <div class="metric-value">${report.minutesLearned}</div>
          <span class="trend ${minutesTrend.className}">${escapeHtml(minutesTrend.text)}</span>
        </article>
        <article class="metric">
          <div class="metric-label">Continuous series</div>
          <div class="metric-value">${report.streakDays}</div>
          <span class="trend ${streakTrend.className}">${escapeHtml(streakTrend.text)}</span>
        </article>
      </section>

      <section class="section">
        <h2>Suggestions for next week</h2>
        ${recommendationsHtml}
      </section>

      <div class="print-actions">
        <button class="print-button" onclick="window.print()">Print/Save PDF</button>
      </div>

      <footer class="footer">The report is automatically generated</footer>
    </main>
  </body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
