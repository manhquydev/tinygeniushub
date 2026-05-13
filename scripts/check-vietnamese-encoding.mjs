import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);
const EXCLUDED_PATH_SEGMENTS = ["src/modules/billing/"];
const literalRegex = /(["'`])(?:\\.|(?!\1)[^\\])*\1/g;
const suspectWordRegex = /\b(not|name|muc|da|duoc|cover|learning|new|loi|collection|het han)\b/i;
const vietnameseDiacriticRegex = new RegExp("[\\u00c0-\\u024f\\u1e00-\\u1eff]", "u");

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectSourceFiles(absolutePath);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!FILE_EXTENSIONS.has(extension)) {
      continue;
    }

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

    files.push(absolutePath);
  }

  return files;
}

function scanLineForUnaccentedVietnamese(line) {
  const matches = line.matchAll(literalRegex);
  for (const match of matches) {
    const literal = match[0];
    const value = literal.slice(1, -1);
    if (!suspectWordRegex.test(value)) {
      continue;
    }
    if (vietnameseDiacriticRegex.test(value)) {
      continue;
    }
    return true;
  }

  return false;
}

async function main() {
  const files = await collectSourceFiles(SOURCE_ROOT);
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

      if (scanLineForUnaccentedVietnamese(line)) {
        warnings.push(`WARN: ${relativePath}:${index + 1}  possible unaccented Vietnamese`);
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
