import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  excludedDirectories,
  excludedFiles,
  excludedNamePatterns,
  rootFiles,
  scanRoots,
  sourceRootFiles,
  sourceRoots,
  textExtensions,
  vietnameseRegex,
} from "./vietnamese-audit-config.mjs";

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "docs", "i18n-vietnamese-text-inventory.md");

function normalize(relativePath) {
  return relativePath.replaceAll("\\", "/");
}

function shouldExclude(relativePath) {
  const normalized = normalize(relativePath);
  const parts = normalized.split("/");
  if (parts.some((part) => excludedDirectories.has(part))) {
    return true;
  }
  const name = parts.at(-1) ?? normalized;
  return excludedFiles.has(name) || excludedNamePatterns.some((pattern) => pattern.test(name));
}

function isTextFile(relativePath) {
  return textExtensions.has(path.extname(relativePath).toLowerCase());
}

function sourceArea(relativePath) {
  const normalized = normalize(relativePath);
  const top = normalized.split("/")[0];
  if (sourceRoots.has(top) || sourceRootFiles.has(normalized)) {
    return "runtime-source";
  }
  return "docs-data-assets";
}

async function collectFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = normalize(path.relative(projectRoot, absolutePath));
    if (shouldExclude(relativePath)) {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }
    if (entry.isFile() && isTextFile(relativePath)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function summarizeFindings(findings, selector) {
  const summary = new Map();
  for (const finding of findings) {
    const key = selector(finding);
    summary.set(key, (summary.get(key) ?? 0) + 1);
  }
  return [...summary.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function sanitizeLine(line) {
  return line.trim().replaceAll("`", "'").slice(0, 500);
}

async function main() {
  const files = [];
  for (const root of scanRoots) {
    files.push(...(await collectFiles(path.join(projectRoot, root))));
  }
  for (const file of rootFiles) {
    const absolutePath = path.join(projectRoot, file);
    if (!shouldExclude(file) && isTextFile(file)) {
      files.push(absolutePath);
    }
  }

  const findings = [];
  for (const file of [...new Set(files)].sort()) {
    const relativePath = normalize(path.relative(projectRoot, file));
    const content = await readFile(file, "utf8");
    const lines = content.split(/\r?\n/u);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (vietnameseRegex.test(line)) {
        findings.push({
          area: sourceArea(relativePath),
          extension: path.extname(relativePath).toLowerCase() || "[none]",
          file: relativePath,
          line: index + 1,
          text: sanitizeLine(line),
        });
      }
    }
  }

  const now = new Date().toISOString();
  const byArea = summarizeFindings(findings, (finding) => finding.area);
  const byTopDirectory = summarizeFindings(findings, (finding) => finding.file.split("/")[0]);
  const byExtension = summarizeFindings(findings, (finding) => finding.extension);
  const byFile = summarizeFindings(findings, (finding) => finding.file);

  const lines = [
    "# Vietnamese Text Inventory",
    "",
    `Generated: ${now}`,
    "",
    "## Scope",
    "",
    "- Scanned runtime source/code roots plus docs, data, public, and asset text files.",
    "- Excluded secrets, build outputs, logs, binary media, databases, lockfiles, and generated manifests.",
    "- Detection uses Vietnamese diacritic characters. Unaccented Vietnamese requires manual review.",
    "",
    "## Summary",
    "",
    `- Files scanned: ${new Set(files).size}`,
    `- Vietnamese-containing lines: ${findings.length}`,
    "",
    "### By Area",
    "",
    ...byArea.map(([name, count]) => `- ${name}: ${count}`),
    "",
    "### By Top Directory",
    "",
    ...byTopDirectory.map(([name, count]) => `- ${name}: ${count}`),
    "",
    "### By Extension",
    "",
    ...byExtension.map(([name, count]) => `- ${name}: ${count}`),
    "",
    "### Top Files",
    "",
    ...byFile.slice(0, 100).map(([name, count]) => `- ${name}: ${count}`),
    "",
    "## Findings",
    "",
  ];

  let currentFile = "";
  for (const finding of findings) {
    if (finding.file !== currentFile) {
      currentFile = finding.file;
      lines.push("", `### ${currentFile}`, "");
    }
    lines.push(`- ${finding.area}:${finding.line}: \`${finding.text}\``);
  }

  lines.push("", "## Unresolved Questions", "", "- None.");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
  process.stdout.write(`Wrote ${outputPath}\n`);
  process.stdout.write(`Vietnamese-containing lines: ${findings.length}\n`);
}

void main();
