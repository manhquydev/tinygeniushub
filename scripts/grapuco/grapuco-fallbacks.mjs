#!/usr/bin/env node

import path from "node:path";
import {
  normalizeRepoPath,
  parseMcpJsonContent,
} from "./grapuco-toolkit.mjs";
import {
  classifyFlowEndpoint,
  deriveHttpPathFromEntryPointId,
} from "./grapuco-flow-analysis.mjs";

function getResultItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.matches)) return payload.matches;
  if (Array.isArray(payload?.flows)) return payload.flows;
  return [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))];
}

const GENERIC_FILE_TOKENS = new Set([
  "route",
  "page",
  "layout",
  "index",
  "src",
  "app",
  "api",
  "ts",
  "tsx",
  "js",
  "mjs",
]);

function buildSearchTerms(filePath) {
  const normalized = normalizeRepoPath(filePath);
  const basename = path.basename(normalized, path.extname(normalized));
  const directory = path.dirname(normalized);
  const routePath = deriveHttpPathFromEntryPointId(normalized);
  const segments = normalized.split("/").filter(Boolean);
  const filteredSegments = segments.filter((segment) => {
    const token = segment.replace(/\[[^\]]+\]/g, "").replace(/\./g, "").toLowerCase();
    return token.length > 0 && !GENERIC_FILE_TOKENS.has(token);
  });
  const pairTerms = [];
  for (let i = 0; i < filteredSegments.length - 1; i += 1) {
    pairTerms.push(`${filteredSegments[i]} ${filteredSegments[i + 1]}`);
  }

  return uniqueStrings([
    normalized,
    directory,
    GENERIC_FILE_TOKENS.has(basename.toLowerCase()) ? null : basename,
    routePath,
    ...filteredSegments,
    ...pairTerms,
  ]);
}

function summarizeHit(hit) {
  if (typeof hit === "string") return hit;
  if (!hit || typeof hit !== "object") return JSON.stringify(hit);
  const location = hit.filePath || hit.path || hit.file || hit.uri || hit.location || hit.modulePath || "";
  const name = hit.symbol || hit.name || hit.title || hit.id || "";
  const score = typeof hit.score === "number" ? ` score=${hit.score.toFixed(3)}` : "";
  const snippet = hit.snippet || hit.text || hit.summary || hit.reason || "";
  const pieces = [];
  if (location) pieces.push(location);
  if (name) pieces.push(name);
  if (snippet) pieces.push(snippet);
  return `${pieces.join(" | ")}${score}`.trim();
}

function dedupeSerializedHits(hits) {
  const seen = new Set();
  const result = [];
  for (const hit of hits) {
    const key = typeof hit === "string" ? hit : JSON.stringify(hit);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(hit);
  }
  return result;
}

async function callToolOrNull(manager, serverName, toolName, args) {
  try {
    return await manager.callTool(serverName, toolName, args);
  } catch (error) {
    return { error };
  }
}

export function formatSearchResultLines(results, limit = 5) {
  const lines = [];
  for (const hit of getResultItems(results).slice(0, limit)) {
    lines.push(`  - ${summarizeHit(hit)}`);
  }
  if (lines.length === 0) {
    lines.push("  - No results.");
  }
  return lines;
}

export async function runSemanticSearchFallback({
  manager,
  repositoryId,
  query,
  limit = 5,
  serverName = "grapuco",
}) {
  const args = { repositoryId, query, limit };
  const semanticResult = await callToolOrNull(manager, serverName, "semantic_search", args);
  const semanticPayload = parseMcpJsonContent(semanticResult);
  const semanticHits = getResultItems(semanticPayload);
  if (semanticHits.length > 0) {
    return {
      usedTool: "semantic_search",
      query,
      results: semanticHits.slice(0, limit),
      fallbackUsed: false,
    };
  }

  const codeResult = await callToolOrNull(manager, serverName, "search_code", args);
  const codePayload = parseMcpJsonContent(codeResult);
  const codeHits = getResultItems(codePayload);
  return {
    usedTool: "search_code",
    query,
    results: codeHits.slice(0, limit),
    fallbackUsed: true,
  };
}

function buildFallbackSummary(impact, evidence, terms) {
  const lines = [];
  lines.push(`- Target file: ${impact?.targetFile || "unknown"}`);
  lines.push(`- Affected flows: ${impact?.totalFlows ?? 0}`);
  lines.push(`- Affected files: ${Array.isArray(impact?.allAffectedFiles) ? impact.allAffectedFiles.length : 0}`);
  if (terms.length > 0) {
    lines.push(`- Evidence queries: ${terms.join(", ")}`);
  }
  if (evidence.length === 0) {
    lines.push("- No dependency evidence found.");
  } else {
    lines.push("- Dependency evidence:");
    for (const item of evidence) {
      lines.push(`  - ${summarizeHit(item)}`);
    }
  }
  return lines;
}

export async function runCriticalImpactFallback({
  manager,
  repositoryId,
  filePath,
  limit = 5,
  serverName = "grapuco",
}) {
  const normalizedFilePath = normalizeRepoPath(filePath);
  const impactResult = await callToolOrNull(manager, serverName, "get_impact_analysis", {
    repositoryId,
    filePath: normalizedFilePath,
  });
  const impact = parseMcpJsonContent(impactResult);
  const totalFlows = typeof impact?.totalFlows === "number" ? impact.totalFlows : 0;
  if (totalFlows > 0) {
    return {
      impact,
      fallbackUsed: false,
      derivedHttpPath: deriveHttpPathFromEntryPointId(normalizedFilePath),
      searchTerms: [],
      evidence: [],
      summaryLines: buildFallbackSummary(impact, [], []),
    };
  }

  const derivedHttpPath = deriveHttpPathFromEntryPointId(normalizedFilePath);
  const searchTerms = buildSearchTerms(normalizedFilePath);
  if (derivedHttpPath && !searchTerms.includes(derivedHttpPath)) {
    searchTerms.unshift(derivedHttpPath);
  }

  const evidence = [];
  const evidenceKeys = new Set();

  if (derivedHttpPath) {
    const flowResult = await callToolOrNull(manager, serverName, "get_data_flows", {
      repositoryId,
      httpPath: derivedHttpPath,
    });
    const flowPayload = parseMcpJsonContent(flowResult);
    for (const flow of getResultItems(flowPayload)) {
      const info = classifyFlowEndpoint(flow);
      const key = info.entryPointKey || JSON.stringify(flow);
      if (evidenceKeys.has(key)) continue;
      evidenceKeys.add(key);
      evidence.push({
        ...flow,
        summary: flow?.name || flow?.id || derivedHttpPath,
        reason: "derived httpPath lookup",
      });
      if (evidence.length >= limit) break;
    }
  }

  for (const query of searchTerms) {
    if (evidence.length >= limit) break;
    const result = await runSemanticSearchFallback({
      manager,
      repositoryId,
      query,
      limit,
      serverName,
    });
    for (const hit of result.results) {
      const key = typeof hit === "string" ? hit : JSON.stringify(hit);
      if (evidenceKeys.has(key)) continue;
      evidenceKeys.add(key);
      evidence.push(hit);
      if (evidence.length >= limit) break;
    }
  }

  const summaryLines = buildFallbackSummary(impact, evidence, searchTerms);
  return {
    impact,
    fallbackUsed: true,
    derivedHttpPath,
    searchTerms,
    evidence: dedupeSerializedHits(evidence).slice(0, limit),
    summaryLines,
  };
}
