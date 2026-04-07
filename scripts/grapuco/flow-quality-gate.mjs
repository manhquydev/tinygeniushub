#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { MCPClientManager } from "./mcp-client-manager.mjs";
import {
  asNumber,
  formatSafeError,
  getStackConfigPath,
  parseArgs,
  parseMcpJsonContent,
  selectRepository,
  readJsonFile,
} from "./grapuco-toolkit.mjs";
import { buildFlowQualityMetrics } from "./grapuco-flow-analysis.mjs";

async function countApiRouteHandlers(apiRootDir) {
  if (!existsSync(apiRootDir)) return 0;
  const handlerRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;
  const stack = [apiRootDir];
  let count = 0;
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!fullPath.endsWith(`${path.sep}route.ts`)) continue;
      const content = await readFile(fullPath, "utf8");
      count += [...content.matchAll(handlerRegex)].length;
    }
  }
  return count;
}

function buildSummaryMarkdown(report) {
  const lines = [
    "# Grapuco Flow Quality",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Repository: ${report.repository.name} (${report.repository.id})`,
    `- Repository status: ${report.repository.status}`,
    `- API handlers: ${report.metrics.apiHandlerCount}`,
    `- Grapuco flows: ${report.metrics.totalFlows}`,
    `- Flow coverage: ${report.metrics.flowCoveragePct}%`,
    `- API-only coverage: ${report.metrics.apiOnlyCoveragePct}%`,
    `- API flows: ${report.metrics.apiFlowCount}`,
    `- Non-API flows: ${report.metrics.nonApiFlowCount}`,
    `- Noise ratio: ${report.metrics.noisePct}%`,
    `- API entrypoints: ${report.metrics.apiEntrypointCount}`,
    `- Non-API entrypoints: ${report.metrics.nonApiEntrypointCount}`,
    `- EntryPoint coverage: ${report.metrics.entryPointCoveragePct}%`,
    `- EntryPoint noise ratio: ${report.metrics.entryPointNoisePct}%`,
    `- Flows with httpPath: ${report.metrics.flowsWithHttpPath}`,
    `- Flows with derived httpPath fallback: ${report.metrics.flowsWithDerivedHttpPath}`,
    "",
    "## Baseline",
    `- Baseline flows: ${report.baseline.flowCount}`,
    `- Baseline coverage: ${report.baseline.coveragePct}%`,
    `- Warn min coverage: ${report.baseline.warningThresholds.minCoveragePct}%`,
    `- Warn max flow drop: ${report.baseline.warningThresholds.maxFlowDrop}`,
    `- Warn max coverage drop: ${report.baseline.warningThresholds.maxCoverageDropPct}%`,
    "",
    "## Result",
  ];

  if (report.warnings.length === 0) {
    lines.push("- No regressions detected against baseline.");
  } else {
    for (const warning of report.warnings) {
      lines.push(`- WARNING: ${warning}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stack = (args.stack || "codex").toLowerCase();
  const configPath = getStackConfigPath(stack);
  const baselinePath = args["baseline-file"] || "scripts/grapuco/flow-quality-baseline.json";
  const reportPath = args["report-file"] || "reports/grapuco/flow-quality-latest.json";
  const summaryPath = args["summary-file"] || "reports/grapuco/flow-quality-summary.md";
  const failOnWarning = args["fail-on-warning"] === "true";

  if (!configPath) {
    throw new Error(`Invalid --stack "${stack}". Use codex, claude, or opencode.`);
  }
  if (!existsSync(configPath)) {
    console.log(`Grapuco MCP config not found at ${configPath}. Skip quality report.`);
    process.exit(0);
  }
  if (!existsSync(baselinePath)) {
    console.log(`Baseline file not found at ${baselinePath}. Skip quality report.`);
    process.exit(0);
  }

  const baseline = await readJsonFile(baselinePath);
  const warnings = [];

  const manager = new MCPClientManager();
  let report;
  try {
    await manager.loadConfig(configPath);
    await manager.connectAll();

    const repositoriesResult = await manager.callTool("grapuco", "list_repositories", {});
    const repositories = parseMcpJsonContent(repositoriesResult) || [];
    const repository = selectRepository(repositories, {
      repoId: args["repo-id"],
      repoName: args["repo-name"],
    });

    if (!repository) {
      throw new Error("No Grapuco repository found.");
    }

    const flowsResult = await manager.callTool("grapuco", "get_data_flows", {
      repositoryId: repository.id,
    });
    const flows = parseMcpJsonContent(flowsResult);
    const apiHandlerCount = await countApiRouteHandlers(path.join(process.cwd(), "src", "app", "api"));
    const metrics = buildFlowQualityMetrics(flows, apiHandlerCount);
    const coveragePct = metrics.flowCoveragePct;

    const baselineFlowCount = asNumber(baseline.flowCount);
    const baselineCoveragePct = asNumber(baseline.coveragePct);
    const warningThresholds = baseline.warningThresholds ?? {};
    const minCoveragePct = asNumber(warningThresholds.minCoveragePct, 0);
    const maxFlowDrop = asNumber(warningThresholds.maxFlowDrop, 0);
    const maxCoverageDropPct = asNumber(warningThresholds.maxCoverageDropPct, 0);
    const minApiOnlyCoveragePct = asNumber(
      warningThresholds.minApiOnlyCoveragePct,
      warningThresholds.minCoveragePct,
    );
    const maxNoisePct = asNumber(warningThresholds.maxNoisePct, -1);

    const flowDrop = baselineFlowCount - metrics.totalFlows;
    const coverageDrop = Number((baselineCoveragePct - coveragePct).toFixed(2));

    if (coveragePct < minCoveragePct) {
      warnings.push(
        `Coverage ${coveragePct}% is below warning minimum ${minCoveragePct}%`,
      );
    }
    if (Number.isFinite(minApiOnlyCoveragePct) && metrics.apiOnlyCoveragePct < minApiOnlyCoveragePct) {
      warnings.push(
        `API-only coverage ${metrics.apiOnlyCoveragePct}% is below warning minimum ${minApiOnlyCoveragePct}%`,
      );
    }
    if (flowDrop > maxFlowDrop) {
      warnings.push(
        `Flow count dropped by ${flowDrop} (baseline ${baselineFlowCount} -> current ${metrics.totalFlows}, max allowed drop ${maxFlowDrop})`,
      );
    }
    if (coverageDrop > maxCoverageDropPct) {
      warnings.push(
        `Coverage dropped by ${coverageDrop}% (baseline ${baselineCoveragePct}% -> current ${coveragePct}%, max allowed drop ${maxCoverageDropPct}%)`,
      );
    }
    if (maxNoisePct >= 0 && metrics.noisePct > maxNoisePct) {
      warnings.push(
        `Noise ratio ${metrics.noisePct}% is above warning maximum ${maxNoisePct}%`,
      );
    }

    report = {
      generatedAt: new Date().toISOString(),
      repository: {
        id: repository.id,
        name: repository.name,
        status: repository.status,
      },
      baseline,
      metrics,
      deltas: {
        flowDrop,
        coverageDropPct: coverageDrop,
      },
      warnings,
    };
  } finally {
    await manager.cleanup();
  }

  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
  const summaryMarkdown = buildSummaryMarkdown(report);
  await writeFile(summaryPath, summaryMarkdown, "utf8");

  console.log(summaryMarkdown);
  console.log(`JSON report: ${reportPath}`);
  console.log(`Summary: ${summaryPath}`);

  if (failOnWarning && report.warnings.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(formatSafeError(error));
  process.exit(1);
});
