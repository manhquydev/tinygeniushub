#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

function parseArg(name, fallback) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!raw) return fallback;
  return raw.slice(name.length + 1).trim();
}

function runCommand(command, args, allowFailure = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !allowFailure) {
        reject(new Error(`${command} ${args.join(" ")} failed (exit ${String(code)}): ${stderr.trim()}`));
        return;
      }
      resolve({ code, stderr });
    });
  });
}

function normalizeRemoteKey(input, defaultPrefix) {
  const trimmed = input.replace(/^\/+/, "");
  if (trimmed.includes("/")) {
    return trimmed;
  }
  return `${defaultPrefix}/${trimmed}`.replace(/\/+/g, "/");
}

async function downloadOptionalSidecar(remoteName, remoteKey, localPath) {
  const remoteTarget = `${remoteName}:${remoteKey}`;
  await runCommand("rclone", ["copyto", remoteTarget, localPath], true);
}

async function run() {
  const remoteKeyArg = parseArg("--remote-key", null);
  if (!remoteKeyArg) {
    throw new Error(
      "Missing required argument: --remote-key=<prefix/file.dump OR file.dump>",
    );
  }

  const outputDir = parseArg("--out-dir", process.env.BACKUP_OUTPUT_DIR) ?? path.join(process.cwd(), "backups", "postgres");
  const remoteName = (process.env.BACKUP_GDRIVE_REMOTE?.trim() || "gdrive").replace(/:$/, "");
  const remotePrefix = (process.env.BACKUP_GDRIVE_PREFIX?.trim() || "postgres/prod").replace(/^\/+|\/+$/g, "");
  const remoteKey = normalizeRemoteKey(remoteKeyArg, remotePrefix);
  const fileName = path.basename(remoteKey);
  const localDumpPath = path.join(outputDir, fileName);

  await mkdir(outputDir, { recursive: true });

  const remoteTarget = `${remoteName}:${remoteKey}`;
  await runCommand("rclone", ["copyto", remoteTarget, localDumpPath]);
  await downloadOptionalSidecar(remoteName, `${remoteKey}.sha256`, `${localDumpPath}.sha256`);
  await downloadOptionalSidecar(remoteName, `${remoteKey}.json`, `${localDumpPath}.json`);

  console.log(`Downloaded backup: ${localDumpPath}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
