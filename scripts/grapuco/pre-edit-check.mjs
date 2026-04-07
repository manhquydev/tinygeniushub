#!/usr/bin/env node

import { existsSync } from "node:fs";
import process from "node:process";
import { MCPClientManager } from "./mcp-client-manager.mjs";
import {
  formatSafeError,
  getStackConfigPath,
  normalizeRepoPath,
  parseArgs,
  parseMcpJsonContent,
  readLocalRepoConfig,
  selectRepository,
} from "./grapuco-toolkit.mjs";
import { runCriticalImpactFallback } from "./grapuco-fallbacks.mjs";

function printUsage() {
  console.log(`
Grapuco Pre-Edit Check

Usage:
  node scripts/grapuco/pre-edit-check.mjs --file <path> [--stack codex|claude|opencode]
  node scripts/grapuco/pre-edit-check.mjs --http-path <path> [--stack codex|claude|opencode]

Options:
  --stack      MCP config stack to use (default: codex)
  --file       Target file for impact analysis
  --http-path  HTTP path filter for data flows (optional)
  --repo-id    Override repository id
  --repo-name  Override repository name matching
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === "true") {
    printUsage();
    process.exit(0);
  }

  const stack = (args.stack || "codex").toLowerCase();
  const configPath = getStackConfigPath(stack);
  if (!configPath) {
    console.error(`Invalid --stack "${stack}". Use codex, claude, or opencode.`);
    process.exit(1);
  }
  if (!existsSync(configPath)) {
    console.error(`MCP config not found: ${configPath}`);
    process.exit(1);
  }

  const localRepoConfig = await readLocalRepoConfig();
  const requestedFile = args.file ? normalizeRepoPath(args.file) : null;
  const requestedHttpPath = args["http-path"] || null;
  const requestedRepoId = args["repo-id"] || localRepoConfig.repoId || null;
  const requestedRepoName = args["repo-name"] || localRepoConfig.repoName || null;

  const manager = new MCPClientManager();
  try {
    await manager.loadConfig(configPath);
    await manager.connectAll();

    const repositoriesResult = await manager.callTool("grapuco", "list_repositories", {});
    const repositories = parseMcpJsonContent(repositoriesResult) || [];
    const repo = selectRepository(repositories, {
      repoId: requestedRepoId,
      repoName: requestedRepoName,
    });

    if (!repo) {
      console.error("No Grapuco repositories found for this account.");
      process.exit(1);
    }

    console.log(`Stack: ${stack}`);
    console.log(`Repository: ${repo.name} (${repo.id})`);
    console.log(`Status: ${repo.status}`);

    if (!requestedFile && !requestedHttpPath) {
      console.log("No --file or --http-path provided. Only repository discovery was executed.");
      process.exit(0);
    }

    if (requestedFile) {
      const fallback = await runCriticalImpactFallback({
        manager,
        repositoryId: repo.id,
        filePath: requestedFile,
      });

      console.log("\nImpact Analysis");
      if (!fallback.impact) {
        console.log("- No structured impact result returned.");
      } else {
        console.log(`- Target file: ${fallback.impact.targetFile || requestedFile}`);
        console.log(`- Affected flows: ${fallback.impact.totalFlows ?? 0}`);
        const affectedFiles = Array.isArray(fallback.impact.allAffectedFiles)
          ? fallback.impact.allAffectedFiles.length
          : 0;
        console.log(`- Affected files: ${affectedFiles}`);
      }

      if (fallback.fallbackUsed) {
        console.log("\nDependency Evidence Fallback");
        if (fallback.derivedHttpPath) {
          console.log(`- Derived httpPath: ${fallback.derivedHttpPath}`);
        }
        for (const line of fallback.summaryLines.slice(1)) {
          console.log(line);
        }
      }
    }

    if (requestedHttpPath) {
      const flowResult = await manager.callTool("grapuco", "get_data_flows", {
        repositoryId: repo.id,
        httpPath: requestedHttpPath,
      });
      const flows = parseMcpJsonContent(flowResult);
      const flowCount = Array.isArray(flows) ? flows.length : 0;
      console.log("\nData Flows");
      console.log(`- HTTP path: ${requestedHttpPath}`);
      console.log(`- Matching flows: ${flowCount}`);
      if (Array.isArray(flows) && flows.length > 0) {
        for (const flow of flows.slice(0, 5)) {
          console.log(`  - ${flow.name} (${flow.id})`);
        }
      }
    }
  } finally {
    await manager.cleanup();
  }
}

main().catch((error) => {
  console.error(formatSafeError(error));
  process.exit(1);
});
