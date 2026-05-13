import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_TARGETS = [
  "src",
  "scripts",
  "prisma",
  "tests",
  "__tests__",
  "remotion",
  "public",
  ".github",
  "docker",
  "create-learning-doc.js",
];
const FILE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".mdx",
  ".svg",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);
const EXCLUDED_PATH_SEGMENTS = [
  ".next/",
  ".tmp/",
  "coverage/",
  "locales/",
  "node_modules/",
  "test-results/",
];
const vietnameseDiacriticRegex = new RegExp("[\\u00c0-\\u024f\\u1e00-\\u1eff]", "u");

async function collectSourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const normalizedRelativePath = path
      .relative(process.cwd(), absolutePath)
      .replaceAll("\\", "/")
      .toLowerCase();

    const shouldExclude = EXCLUDED_PATH_SEGMENTS.some((segment) =>
      normalizedRelativePath.startsWith(segment),
    );

    if (shouldExclude) {
      continue;
    }

    if (entry.isDirectory()) {
      const nested = await collectSourceFiles(absolutePath);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!FILE_EXTENSIONS.has(extension) && extension !== "") {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

async function main() {
  const files = (
    await Promise.all(
      SOURCE_TARGETS.map(async (target) => {
        const absoluteTarget = path.resolve(process.cwd(), target);
        const extension = path.extname(absoluteTarget);
        if (extension) {
          return [absoluteTarget];
        }
        return collectSourceFiles(absoluteTarget);
      }),
    )
  ).flat();
  const warnings = [];

  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/u);
    const relativePath = path.relative(process.cwd(), filePath).replaceAll("\\", "/");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line) {
        continue;
      }

      if (vietnameseDiacriticRegex.test(line)) {
        warnings.push(`WARN: ${relativePath}:${index + 1}  Vietnamese diacritic text remains`);
      }
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      process.stdout.write(`${warning}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write("i18n check passed\n");
}

void main();
