#!/usr/bin/env node

import { existsSync } from "node:fs";
import process from "node:process";
import { MCPClientManager } from "./mcp-client-manager.mjs";
import {
  formatSafeError,
  getStackConfigPath,
  parseArgs,
  parsePositiveInt,
  parseMcpJsonContent,
  readLocalRepoConfig,
  selectRepository,
} from "./grapuco-toolkit.mjs";
import { formatSearchResultLines, runSemanticSearchFallback } from "./grapuco-fallbacks.mjs";

function printUsage() {
  console.log(`
Grapuco Semantic Search Fallback

Usage:
  node scripts/grapuco/semantic-search-fallback.mjs --query "<text>" [--stack codex|claude|opencode]

Options:
  --stack      MCP config stack to use (default: codex)
  --query      Search query text
  --repo-id    Override repository id
  --repo-name  Override repository name matching
  --limit      Max results to print (default: 5)
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help === "true" || !args.query) {
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

    const result = await runSemanticSearchFallback({
      manager,
      repositoryId: repo.id,
      query: args.query,
      limit,
    });

    console.log(`Stack: ${stack}`);
    console.log(`Repository: ${repo.name} (${repo.id})`);
    console.log(`Query: ${args.query}`);
    console.log(`Used tool: ${result.usedTool}`);
    console.log(`Fallback used: ${result.fallbackUsed ? "yes" : "no"}`);
    for (const line of formatSearchResultLines(result.results, limit)) {
      console.log(line);
    }
  } finally {
    await manager.cleanup();
  }
}

main().catch((error) => {
  console.error(formatSafeError(error));
  process.exit(1);
});
