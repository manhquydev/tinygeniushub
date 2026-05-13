export const scanRoots = [
  ".github",
  "assets",
  "data",
  "docker",
  "docs",
  "prisma",
  "public",
  "remotion",
  "scripts",
  "src",
  "tests",
  "__tests__",
];

export const rootFiles = [
  "AGENTS.md",
  "CLAUDE.md",
  "Dockerfile",
  "README.md",
  "components.json",
  "docker-compose.yml",
  "ecosystem.config.js",
  "eslint.config.mjs",
  "next.config.ts",
  "package.json",
  "playwright.config.ts",
  "playwright.integration.config.ts",
  "postcss.config.mjs",
  "prisma.config.ts",
  "tailwind.config.js",
  "tsconfig.json",
  "vercel.json",
  "vitest.config.ts",
  "vitest.setup.ts",
];

export const sourceRoots = new Set([
  ".github",
  "docker",
  "prisma",
  "public",
  "remotion",
  "scripts",
  "src",
  "tests",
  "__tests__",
]);

export const sourceRootFiles = new Set(rootFiles.filter((file) => !file.endsWith(".md")));

export const textExtensions = new Set([
  ".cjs",
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".prisma",
  ".py",
  ".sh",
  ".sql",
  ".svg",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

export const excludedDirectories = new Set([
  ".agents",
  ".claude",
  ".codex",
  ".git",
  ".gitnexus",
  ".grapuco",
  ".next",
  ".opencode",
  ".playwright-mcp",
  ".pnpm-store",
  ".runtime",
  "coverage",
  "log",
  "node_modules",
  "out",
  "output",
  "plans",
  "reports",
  "test-results",
]);

export const excludedFiles = new Set([
  "i18n-vietnamese-text-inventory.md",
  "pnpm-lock.yaml",
  "release-manifest.json",
  "tsconfig.tsbuildinfo",
]);

export const excludedNamePatterns = [
  /^\.env/,
  /^tmp-/i,
  /^\.tmp/i,
  /\.png$/i,
  /\.jpe?g$/i,
  /\.webp$/i,
  /\.gif$/i,
  /\.ico$/i,
  /\.pdf$/i,
  /\.xlsx$/i,
  /\.db$/i,
  /\.dump$/i,
];

export const vietnameseRegex = new RegExp("[\\u00c0-\\u024f\\u1e00-\\u1eff]", "u");
