#!/usr/bin/env node

import { normalizeRepoPath, toPercent } from "./grapuco-toolkit.mjs";

function isRouteGroupSegment(segment) {
  return /^\(.+\)$/.test(segment) || segment.startsWith("@");
}

function normalizeRouteSegment(segment) {
  const doubleCatchAll = segment.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (doubleCatchAll) {
    return `:${doubleCatchAll[1]}*`;
  }
  const catchAll = segment.match(/^\[\.\.\.(.+)\]$/);
  if (catchAll) {
    return `:${catchAll[1]}*`;
  }
  const dynamic = segment.match(/^\[(.+)\]$/);
  if (dynamic) {
    return `:${dynamic[1]}`;
  }
  return segment;
}

function extractFilePathFromNodeId(entryPointId) {
  if (typeof entryPointId !== "string") return null;
  const normalized = normalizeRepoPath(entryPointId);
  const parts = normalized.split(":");
  if (parts.length >= 3 && parts[1]?.includes("/")) {
    return parts[1];
  }
  return normalized;
}

function extractRouteSegments(entryPointId) {
  const candidate = extractFilePathFromNodeId(entryPointId);
  if (!candidate) return null;
  const routeMatch = candidate.match(/(?:^|\/)(?:src\/)?app\/(.+?)\/route\.(?:m?js|ts|tsx)$/i);
  if (routeMatch) return routeMatch[1].split("/");
  const appMatch = candidate.match(/(?:^|\/)app\/(.+?)\/route\.(?:m?js|ts|tsx)$/i);
  if (appMatch) return appMatch[1].split("/");
  return null;
}

export function deriveHttpPathFromEntryPointId(entryPointId) {
  if (typeof entryPointId !== "string" || entryPointId.trim().length === 0) return null;
  const segments = extractRouteSegments(entryPointId);
  if (!segments) return null;
  const pathSegments = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .filter((segment) => !isRouteGroupSegment(segment))
    .map((segment) => normalizeRouteSegment(segment));
  if (pathSegments.length === 0) return "/";
  return `/${pathSegments.join("/")}`;
}

export function getFlowEntryPointReference(flow) {
  const candidateFields = [
    "entryPointId",
    "entryPointPath",
    "entryPoint",
    "sourcePath",
    "filePath",
    "file",
  ];
  for (const field of candidateFields) {
    const value = flow?.[field];
    if (typeof value === "string" && value.trim().length > 0) {
      return {
        field,
        value: normalizeRepoPath(value),
      };
    }
  }
  return null;
}

export function classifyFlowEndpoint(flow) {
  const reference = getFlowEntryPointReference(flow);
  const entryPointId = typeof flow?.entryPointId === "string" ? normalizeRepoPath(flow.entryPointId) : null;
  const nativeHttpPath = typeof flow?.httpPath === "string" && flow.httpPath.trim().length > 0
    ? flow.httpPath.trim()
    : null;
  const derivedHttpPath = deriveHttpPathFromEntryPointId(entryPointId || reference?.value || null);
  const resolvedHttpPath = nativeHttpPath || derivedHttpPath;
  const entryPointKey = reference?.value || entryPointId || resolvedHttpPath || null;
  const isApiEndpoint =
    typeof resolvedHttpPath === "string"
      ? resolvedHttpPath.startsWith("/api/")
      : typeof entryPointId === "string" && entryPointId.includes("/api/");
  const kind = entryPointKey ? (isApiEndpoint ? "api" : "non-api") : "unknown";

  return {
    entryPointKey,
    entryPointId,
    nativeHttpPath,
    resolvedHttpPath,
    derivedHttpPath,
    kind,
  };
}

export function buildFlowQualityMetrics(flows, apiHandlerCount) {
  const flowList = Array.isArray(flows) ? flows : [];
  const entryPoints = new Map();
  let apiFlowCount = 0;
  let nonApiFlowCount = 0;
  let flowsWithHttpPath = 0;
  let flowsWithDerivedHttpPath = 0;

  for (const flow of flowList) {
    const info = classifyFlowEndpoint(flow);
    if (info.nativeHttpPath) flowsWithHttpPath += 1;
    if (!info.nativeHttpPath && info.derivedHttpPath) flowsWithDerivedHttpPath += 1;
    if (info.kind === "api") apiFlowCount += 1;
    if (info.kind === "non-api") nonApiFlowCount += 1;

    if (!info.entryPointKey) continue;
    const current = entryPoints.get(info.entryPointKey);
    if (!current) {
      entryPoints.set(info.entryPointKey, info.kind);
      continue;
    }
    if (current !== "api" && info.kind === "api") {
      entryPoints.set(info.entryPointKey, "api");
    }
  }

  let apiEntrypointCount = 0;
  let nonApiEntrypointCount = 0;
  for (const kind of entryPoints.values()) {
    if (kind === "api") apiEntrypointCount += 1;
    if (kind === "non-api") nonApiEntrypointCount += 1;
  }

  const totalFlows = flowList.length;
  const entryPointCount = entryPoints.size;
  return {
    apiHandlerCount,
    totalFlows,
    apiFlowCount,
    nonApiFlowCount,
    flowsWithHttpPath,
    flowsWithDerivedHttpPath,
    flowsMissingHttpPath: Math.max(totalFlows - flowsWithHttpPath, 0),
    entryPointCount,
    apiEntrypointCount,
    nonApiEntrypointCount,
    flowCoveragePct: toPercent(totalFlows, apiHandlerCount),
    apiOnlyCoveragePct: toPercent(apiFlowCount, apiHandlerCount),
    entryPointCoveragePct: toPercent(apiEntrypointCount, apiHandlerCount),
    noisePct: toPercent(nonApiFlowCount, totalFlows),
    entryPointNoisePct: toPercent(nonApiEntrypointCount, entryPointCount),
  };
}
