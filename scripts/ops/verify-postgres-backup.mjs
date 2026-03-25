#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function parseArg(name) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.slice(name.length + 1).trim();
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function verifyChecksum(filePath) {
  const checksumFile = `${filePath}.sha256`;
  try {
    await access(checksumFile, constants.R_OK);
  } catch {
    console.log("Checksum file not found, skip checksum verification.");
    return;
  }

  const raw = await readFile(checksumFile, "utf8");
  const expected = raw.trim().split(/\s+/)[0];
  if (!expected) {
    throw new Error("Checksum file is invalid.");
  }

  const actual = await sha256File(filePath);
  if (actual !== expected) {
    throw new Error(`Checksum mismatch. expected=${expected} actual=${actual}`);
  }
  console.log(`Checksum verified: ${actual}`);
}

async function verifyDumpReadable(filePath) {
  const dockerService = process.env.BACKUP_POSTGRES_SERVICE?.trim() || "postgres";
  const pgUser = process.env.BACKUP_POSTGRES_USER?.trim() || "postgres";
  const args = ["compose", "exec", "-T", dockerService, "pg_restore", "--list", "-U", pgUser];
  const child = spawn("docker", args, {
    stdio: ["pipe", "ignore", "pipe"],
  });

  const input = createReadStream(filePath);
  input.pipe(child.stdin);

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(
      `Backup dump is not readable by pg_restore (exit ${String(exitCode)}).\n${stderr.trim()}`,
    );
  }
}

async function run() {
  const fileArg = parseArg("--file");
  if (!fileArg) {
    throw new Error("Missing required argument: --file=<path-to-backup.dump>");
  }

  const resolvedFile = path.resolve(fileArg);
  await access(resolvedFile, constants.R_OK);

  await verifyChecksum(resolvedFile);
  await verifyDumpReadable(resolvedFile);

  console.log(`Backup verification passed: ${resolvedFile}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
