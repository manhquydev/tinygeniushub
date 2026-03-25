#!/usr/bin/env node

import { spawn } from "node:child_process";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed (exit ${String(code)}): ${stderr.trim()}`));
        return;
      }
      resolve(stdout);
    });
  });
}

async function run() {
  const remoteName = (process.env.BACKUP_GDRIVE_REMOTE?.trim() || "gdrive").replace(/:$/, "");
  const remotePrefix = (process.env.BACKUP_GDRIVE_PREFIX?.trim() || "postgres/prod").replace(/^\/+|\/+$/g, "");
  const remoteTarget = `${remoteName}:${remotePrefix}`;

  const output = await runCommand("rclone", ["lsf", remoteTarget, "--files-only", "--include", "*.dump"]);
  const backups = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.log("No backup dumps found on Google Drive.");
    return;
  }

  for (const backup of backups) {
    console.log(`${remotePrefix}/${backup}`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
