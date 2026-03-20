#!/usr/bin/env node
/**
 * render-course-demo.ts
 * Renders 7 demo course lesson videos using Remotion CLI.
 * Usage:
 *   npx ts-node scripts/render-course-demo.ts           # render all 7
 *   npx ts-node scripts/render-course-demo.ts --lesson=3  # render lesson 3 only
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out", "course-demo");

const LESSON_IDS = [
  "Lesson01",
  "Lesson02",
  "Lesson03",
  "Lesson04",
  "Lesson05",
  "Lesson06",
  "Lesson07",
];

function parseLessonFlag(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--lesson="));
  if (!arg) return null;
  const num = parseInt(arg.replace("--lesson=", ""), 10);
  if (isNaN(num) || num < 1 || num > 7) {
    console.error(`Invalid --lesson value. Must be 1-7.`);
    process.exit(1);
  }
  return num;
}

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
}

function renderLesson(compositionId: string, outputFile: string) {
  const cmd = [
    "npx remotion render",
    `remotion/index.ts`,
    compositionId,
    outputFile,
    "--codec=h264",
  ].join(" ");

  console.log(`\nRendering ${compositionId}...`);
  console.log(`  -> ${outputFile}`);

  try {
    execSync(cmd, { cwd: ROOT, stdio: "inherit" });
    console.log(`  Done: ${compositionId}`);
  } catch (err) {
    console.error(`  Failed: ${compositionId}`);
    throw err;
  }
}

function main() {
  ensureOutDir();

  const lessonNum = parseLessonFlag();
  const targets = lessonNum
    ? [LESSON_IDS[lessonNum - 1]]
    : LESSON_IDS;

  console.log(`Rendering ${targets.length} lesson(s) to ${OUT_DIR}`);

  let failed = 0;
  for (const id of targets) {
    const paddedNum = id.replace("Lesson", "");
    const outputFile = path.join(OUT_DIR, `lesson-${paddedNum}.mp4`);
    try {
      renderLesson(id, outputFile);
    } catch {
      failed++;
    }
  }

  console.log(`\nDone. ${targets.length - failed}/${targets.length} lessons rendered successfully.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main();
