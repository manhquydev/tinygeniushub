import fs from "node:fs";
import path from "node:path";
import { subDays } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();
const reportsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reports");
const outJsonPath = path.join(reportsDir, "courses-ab-cvr-report.json");
const outMdPath = path.join(reportsDir, "courses-ab-cvr-report.md");

function parseDaysArg() {
  const daysArg = process.argv.find((arg) => arg.startsWith("--days="));
  if (!daysArg) return 14;
  const raw = Number.parseInt(daysArg.split("=")[1] ?? "14", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 14;
}

function asObject(value) {
  return value && typeof value === "object" ? value : null;
}

function asString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeVariant(value) {
  if (value === "A" || value === "B") return value;
  return "unknown";
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function getSessionId(row) {
  const metadata = asObject(row.metadata);
  const fromMetadata = asString(metadata?.sessionId);
  if (fromMetadata) return fromMetadata;
  return asString(row.resourceId);
}

function getVariant(row) {
  const metadata = asObject(row.metadata);
  return normalizeVariant(asString(metadata?.attributionExperimentCoursesVariant));
}

function getTargetInfo(row) {
  const metadata = asObject(row.metadata);
  return {
    targetKind: asString(metadata?.targetKind) ?? "unknown",
    targetSlug: asString(metadata?.targetSlug) ?? "unknown",
  };
}

function mdVariantTable(rows) {
  const header = [
    "| Variant | Checkout started | Purchase succeeded | Checkout->Purchase |",
    "|---|---:|---:|---:|",
  ];
  const body = rows.map(
    (row) =>
      `| ${row.variant} | ${row.checkoutStarted} | ${row.purchaseSucceeded} | ${row.checkoutToPurchaseRatePct}% |`,
  );
  return [...header, ...body].join("\n");
}

function mdVariantTargetTable(rows) {
  const header = [
    "| Variant | Target kind | Target slug | Checkout started | Purchase succeeded | Checkout->Purchase |",
    "|---|---|---|---:|---:|---:|",
  ];
  const body = rows.map(
    (row) =>
      `| ${row.variant} | ${row.targetKind} | ${row.targetSlug} | ${row.checkoutStarted} | ${row.purchaseSucceeded} | ${row.checkoutToPurchaseRatePct}% |`,
  );
  return [...header, ...body].join("\n");
}

async function main() {
  const days = parseDaysArg();
  const since = subDays(new Date(), days);

  const [checkoutLogs, purchaseLogs] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: "course_checkout_started",
        resourceType: "course_checkout",
        createdAt: {
          gte: since,
        },
      },
      select: {
        resourceId: true,
        metadata: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "course_purchase_succeeded",
        resourceType: "course_checkout",
        createdAt: {
          gte: since,
        },
      },
      select: {
        resourceId: true,
        metadata: true,
      },
    }),
  ]);

  const variantSummaryMap = new Map();
  const variantTargetSummaryMap = new Map();

  function ensureVariantSummary(variant) {
    if (!variantSummaryMap.has(variant)) {
      variantSummaryMap.set(variant, {
        variant,
        checkoutSessionIds: new Set(),
        purchaseSessionIds: new Set(),
      });
    }
    return variantSummaryMap.get(variant);
  }

  function ensureVariantTargetSummary(variant, targetKind, targetSlug) {
    const key = `${variant}:${targetKind}:${targetSlug}`;
    if (!variantTargetSummaryMap.has(key)) {
      variantTargetSummaryMap.set(key, {
        variant,
        targetKind,
        targetSlug,
        checkoutSessionIds: new Set(),
        purchaseSessionIds: new Set(),
      });
    }
    return variantTargetSummaryMap.get(key);
  }

  for (const row of checkoutLogs) {
    const sessionId = getSessionId(row);
    if (!sessionId) continue;
    const variant = getVariant(row);
    const { targetKind, targetSlug } = getTargetInfo(row);

    ensureVariantSummary(variant).checkoutSessionIds.add(sessionId);
    ensureVariantTargetSummary(variant, targetKind, targetSlug).checkoutSessionIds.add(sessionId);
  }

  for (const row of purchaseLogs) {
    const sessionId = getSessionId(row);
    if (!sessionId) continue;
    const variant = getVariant(row);
    const { targetKind, targetSlug } = getTargetInfo(row);

    ensureVariantSummary(variant).purchaseSessionIds.add(sessionId);
    ensureVariantTargetSummary(variant, targetKind, targetSlug).purchaseSessionIds.add(sessionId);
  }

  const variantOrder = new Map([
    ["A", 1],
    ["B", 2],
    ["unknown", 3],
  ]);

  const variantRows = [...variantSummaryMap.values()]
    .map((row) => {
      const checkoutStarted = row.checkoutSessionIds.size;
      const purchaseSucceeded = row.purchaseSessionIds.size;
      return {
        variant: row.variant,
        checkoutStarted,
        purchaseSucceeded,
        checkoutToPurchaseRatePct: pct(purchaseSucceeded, checkoutStarted),
      };
    })
    .sort((a, b) => (variantOrder.get(a.variant) ?? 99) - (variantOrder.get(b.variant) ?? 99));

  const variantTargetRows = [...variantTargetSummaryMap.values()]
    .map((row) => {
      const checkoutStarted = row.checkoutSessionIds.size;
      const purchaseSucceeded = row.purchaseSessionIds.size;
      return {
        variant: row.variant,
        targetKind: row.targetKind,
        targetSlug: row.targetSlug,
        checkoutStarted,
        purchaseSucceeded,
        checkoutToPurchaseRatePct: pct(purchaseSucceeded, checkoutStarted),
      };
    })
    .sort((a, b) => {
      if (a.variant !== b.variant) {
        return (variantOrder.get(a.variant) ?? 99) - (variantOrder.get(b.variant) ?? 99);
      }
      if (a.targetKind !== b.targetKind) {
        return a.targetKind.localeCompare(b.targetKind);
      }
      return a.targetSlug.localeCompare(b.targetSlug);
    });

  const totals = variantRows.reduce(
    (acc, row) => {
      acc.checkoutStarted += row.checkoutStarted;
      acc.purchaseSucceeded += row.purchaseSucceeded;
      return acc;
    },
    {
      checkoutStarted: 0,
      purchaseSucceeded: 0,
    },
  );

  const output = {
    generatedAt: new Date().toISOString(),
    periodDays: days,
    since: since.toISOString(),
    summary: {
      checkoutStarted: totals.checkoutStarted,
      purchaseSucceeded: totals.purchaseSucceeded,
      checkoutToPurchaseRatePct: pct(totals.purchaseSucceeded, totals.checkoutStarted),
    },
    variantRows,
    variantTargetRows,
  };

  const lines = [];
  lines.push("# Courses A/B CVR Report");
  lines.push("");
  lines.push(`Generated at: ${output.generatedAt}`);
  lines.push(`Window: last ${days} days (since ${since.toISOString()})`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Checkout started: ${output.summary.checkoutStarted}`);
  lines.push(`- Purchase succeeded: ${output.summary.purchaseSucceeded}`);
  lines.push(`- Checkout -> Purchase: ${output.summary.checkoutToPurchaseRatePct}%`);
  lines.push("");
  lines.push("## Per Variant");
  if (variantRows.length > 0) {
    lines.push(mdVariantTable(variantRows));
  } else {
    lines.push("- No `course_checkout_started` / `course_purchase_succeeded` logs in this window.");
  }
  lines.push("");
  lines.push("## Per Variant x Target");
  if (variantTargetRows.length > 0) {
    lines.push(mdVariantTargetTable(variantTargetRows));
  } else {
    lines.push("- No attributed target rows yet.");
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("- Source: audit logs (`course_checkout_started`, `course_purchase_succeeded`).");
  lines.push("- Variant key: `ab_courses_v` captured as `attributionExperimentCoursesVariant`.");
  lines.push("- CVR uses unique `sessionId` per event type.");
  lines.push("");

  fs.writeFileSync(outJsonPath, JSON.stringify(output, null, 2));
  fs.writeFileSync(outMdPath, `${lines.join("\n")}\n`);

  console.log(`Wrote ${outJsonPath}`);
  console.log(`Wrote ${outMdPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
