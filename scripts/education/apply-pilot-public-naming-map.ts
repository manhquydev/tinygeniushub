import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.cwd();
const reportsDir = path.join(root, "plans", "2026-03-17-education-agent-team", "reports");
const mapPath = path.join(reportsDir, "pilot-public-naming-map.json");
const importResultPath = path.join(reportsDir, "pilot-import-result.json");
const outJsonPath = path.join(reportsDir, "pilot-public-naming-apply-result.json");
const outMdPath = path.join(reportsDir, "pilot-public-naming-apply-result.md");
const dryRun = process.argv.includes("--dry-run");
const strictMode = process.argv.includes("--strict");

type NamingMap = {
  items: Array<{
    sku: string;
    publicTitle: string;
    publicShortDescription: string;
  }>;
};

type ImportResult = {
  plannedCourses?: Array<{
    sku: string;
    slug: string;
  }>;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function makeMarkdown(report: {
  generatedAt: string;
  dryRun: boolean;
  status: "PASS" | "FAIL";
  summary: {
    totalItems: number;
    updatedItems: number;
    failedItems: number;
  };
  rows: Array<{
    sku: string;
    slug: string | null;
    status: "updated" | "failed";
    reason?: string;
    beforeTitle?: string | null;
    afterTitle?: string | null;
  }>;
}) {
  const lines: string[] = [];
  lines.push("# Pilot Public Naming Apply Result");
  lines.push("");
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push(`Dry run: ${report.dryRun ? "YES" : "NO"}`);
  lines.push(`Status: ${report.status}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total map items: ${report.summary.totalItems}`);
  lines.push(`- Updated: ${report.summary.updatedItems}`);
  lines.push(`- Failed: ${report.summary.failedItems}`);
  lines.push("");
  lines.push("## Rows");
  lines.push("| SKU | Slug | Status | Note |");
  lines.push("|---|---|---|---|");

  for (const row of report.rows) {
    const note =
      row.status === "failed"
        ? row.reason ?? "Unknown failure"
        : row.beforeTitle && row.afterTitle
          ? `Title: "${row.beforeTitle}" -> "${row.afterTitle}"`
          : "Updated";
    lines.push(`| ${row.sku} | ${row.slug ?? "-"} | ${row.status.toUpperCase()} | ${note} |`);
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("- This applies only display copy (`title`, `description`) on pilot split-course rows.");
  lines.push("- Course slug, lesson range, and lesson ordering are unchanged.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const namingMap = readJson<NamingMap>(mapPath);
  const importResult = readJson<ImportResult>(importResultPath);

  const slugBySku = new Map((importResult.plannedCourses ?? []).map((item) => [item.sku, item.slug]));
  const rows: Array<{
    sku: string;
    slug: string | null;
    status: "updated" | "failed";
    reason?: string;
    beforeTitle?: string | null;
    afterTitle?: string | null;
  }> = [];

  for (const item of namingMap.items) {
    const slug = slugBySku.get(item.sku) ?? null;
    if (!slug) {
      rows.push({
        sku: item.sku,
        slug: null,
        status: "failed",
        reason: "Missing slug mapping from pilot-import-result.json",
      });
      continue;
    }

    const existing = await prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
      },
    });

    if (!existing) {
      rows.push({
        sku: item.sku,
        slug,
        status: "failed",
        reason: "Course slug not found in DB",
      });
      continue;
    }

    if (!dryRun) {
      await prisma.course.update({
        where: { id: existing.id },
        data: {
          title: item.publicTitle.trim(),
          description: item.publicShortDescription.trim(),
        },
      });
    }

    rows.push({
      sku: item.sku,
      slug,
      status: "updated",
      beforeTitle: existing.title,
      afterTitle: item.publicTitle.trim(),
    });
  }

  const failedItems = rows.filter((row) => row.status === "failed").length;
  const updatedItems = rows.filter((row) => row.status === "updated").length;
  const status: "PASS" | "FAIL" = failedItems === 0 ? "PASS" : "FAIL";
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    strictMode,
    status,
    source: {
      namingMap: path.relative(root, mapPath).replaceAll("\\", "/"),
      importResult: path.relative(root, importResultPath).replaceAll("\\", "/"),
    },
    summary: {
      totalItems: namingMap.items.length,
      updatedItems,
      failedItems,
    },
    rows,
  };

  fs.writeFileSync(outJsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(outMdPath, makeMarkdown(report));
  console.log(`Wrote ${outJsonPath}`);
  console.log(`Wrote ${outMdPath}`);
  console.log(`Pilot public naming apply: ${status}`);

  if (strictMode && status !== "PASS") {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
