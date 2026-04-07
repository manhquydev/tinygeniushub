#!/usr/bin/env node

import { existsSync } from "node:fs";
import process from "node:process";
import { MCPClientManager } from "./mcp-client-manager.mjs";
import {
  formatSafeError,
  getStackConfigPath,
  normalizeRepoPath,
  parseArgs,
  parsePositiveInt,
  parseMcpJsonContent,
  readLocalRepoConfig,
  selectRepository,
} from "./grapuco-toolkit.mjs";
import { runCriticalImpactFallback } from "./grapuco-fallbacks.mjs";

function printUsage() {
  console.log(`
Grapuco Critical File Impact Fallback

Usage:
  node scripts/grapuco/critical-file-impact-fallback.mjs --file <path> [--stack codex|claude|opencode]

Options:
  --stack      MCP config stack to use (default: codex)
  --file       Target file for impact analysis
  --repo-id    Override repository id
  --repo-name  Override repository name matching
  --limit      Max evidence items to print (default: 5)
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === "true" || !args.file) {
    printUsage();
    process.exit(args.help === "true" ? 0 : 1);
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
  const requestedRepoId = args["repo-id"] || localRepoConfig.repoId || null;
  const requestedRepoName = args["repo-name"] || localRepoConfig.repoName || null;
  const limit = parsePositiveInt(args.limit, 5, { min: 1, max: 20 });
  const filePath = normalizeRepoPath(args.file);

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

    const result = await runCriticalImpactFallback({
      manager,
      repositoryId: repo.id,
      filePath,
      limit,
    });

    console.log(`Stack: ${stack}`);
    console.log(`Repository: ${repo.name} (${repo.id})`);
    console.log(`File: ${filePath}`);
    console.log(`Fallback used: ${result.fallbackUsed ? "yes" : "no"}`);
    if (result.derivedHttpPath) {
      console.log(`Derived httpPath: ${result.derivedHttpPath}`);
    }

    console.log("\nImpact Analysis");
    if (!result.impact) {
      console.log("- No structured impact result returned.");
    } else {
      console.log(`- Target file: ${result.impact.targetFile || filePath}`);
      console.log(`- Affected flows: ${result.impact.totalFlows ?? 0}`);
      const affectedFiles = Array.isArray(result.impact.allAffectedFiles)
        ? result.impact.allAffectedFiles.length
        : 0;
      console.log(`- Affected files: ${affectedFiles}`);
    }

    if (result.fallbackUsed) {
      console.log("\nDependency Evidence");
      for (const line of result.summaryLines.slice(1)) {
        console.log(line);
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
