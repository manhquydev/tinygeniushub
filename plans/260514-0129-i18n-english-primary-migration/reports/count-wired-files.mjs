import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = walk("src");
const wired = [];
for (const f of files) {
  const content = readFileSync(f, "utf8");
  if (/useTranslations|getTranslations|translate\(/.test(content)) {
    const generatedHits = (content.match(/["']generated["']/g) || []).length;
    const tCalls = (content.match(/\bt\(["']/g) || []).length;
    wired.push({ f: f.replace(/\\/g, "/"), generatedHits, tCalls });
  }
}
console.log("Files wired through i18n helpers:", wired.length);
for (const r of wired) console.log("  " + r.f + " (generated-ns=" + r.generatedHits + ", t() calls=" + r.tCalls + ")");
console.log("Total .tsx/.ts files in src:", files.length);
