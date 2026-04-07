#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

export const STACK_CONFIG_PATH = {
  codex: ".codex/.mcp.json",
  claude: ".claude/.mcp.json",
  opencode: ".opencode/.mcp.json",
};

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    args[name] = value;
  }
  return args;
}

export function parseMcpJsonContent(result) {
  const text = result?.content?.[0]?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export function normalizeRepoPath(filePath) {
  return String(filePath ?? "").replaceAll("\\", "/").replace(/^\.\//, "");
}

export function getStackConfigPath(stack) {
  return STACK_CONFIG_PATH[(stack || "").toLowerCase()] || null;
}

export function asNumber(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function parsePositiveInt(value, fallback = 5, { min = 1, max = 50 } = {}) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

export function toPercent(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

const SECRET_PATTERNS = [
  /\b(?:gyc|grapuco)_sk_[A-Za-z0-9_]+\b/g,
  /\b(?:sk|api_key)_[A-Za-z0-9_-]{12,}\b/gi,
  /(X-Api-Key:\s*)([^,\s"']+)/gi,
];

export function redactSensitiveText(input) {
  if (typeof input !== "string") return input;
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, (full, prefix = "") => `${prefix}[REDACTED]`);
  }
  return output;
}

export function formatSafeError(error) {
  const fallback = "Unknown Grapuco error";
  if (error instanceof Error) {
    const message = redactSensitiveText(error.message || fallback);
    if (!error.stack) return message;
    return redactSensitiveText(error.stack);
  }
  if (typeof error === "string") return redactSensitiveText(error);
  try {
    return redactSensitiveText(JSON.stringify(error));
  } catch {
    return fallback;
  }
}

export function selectRepository(repositories, { repoId = null, repoName = null } = {}) {
  if (!Array.isArray(repositories) || repositories.length === 0) return null;
  if (repoId) {
    const matchById = repositories.find((item) => item?.id === repoId);
    if (matchById) return matchById;
  }
  if (repoName) {
    const matchByName = repositories.find((item) => item?.name === repoName);
    if (matchByName) return matchByName;
  }
  return repositories[0] || null;
}

export async function readLocalRepoConfig() {
  const localConfigPath = ".grapuco/config.json";
  if (!existsSync(localConfigPath)) return {};
  try {
    const raw = await readFile(localConfigPath, "utf8");
    const config = JSON.parse(raw);
    return {
      repoId: config.repoId,
      repoName: config.repoName,
    };
  } catch {
    return {};
  }
}
