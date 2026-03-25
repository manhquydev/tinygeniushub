#!/usr/bin/env node

import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function parseArg(name) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.slice(name.length + 1).trim();
}

function buildRemoteTarget(remoteName, remotePath) {
  return `${remoteName}:${remotePath.replace(/^\/+/, "")}`;
}

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
      resolve({ stdout, stderr });
    });
  });
}

async function ensureRcloneAvailable() {
  await runCommand("rclone", ["version"]);
}

async function resolveArtifacts(backupFilePath) {
  const candidates = [backupFilePath, `${backupFilePath}.sha256`, `${backupFilePath}.json`];
  const artifacts = [];

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.R_OK);
      artifacts.push(candidate);
    } catch {
      if (candidate === backupFilePath) {
        throw new Error(`Backup file not found or not readable: ${backupFilePath}`);
      }
    }
  }

  return artifacts;
}

async function uploadArtifact(localFilePath, remoteName, remotePrefix) {
  const fileName = path.basename(localFilePath);
  const remotePath = `${remotePrefix}/${fileName}`.replace(/\/+/g, "/");
  const remoteTarget = buildRemoteTarget(remoteName, remotePath);
  await runCommand("rclone", ["copyto", localFilePath, remoteTarget]);
  return remotePath;
}

async function run() {
  const fileArg = parseArg("--file");
  if (!fileArg) {
    throw new Error("Missing required argument: --file=<path-to-backup.dump>");
  }

  const backupFilePath = path.resolve(fileArg);
  const remoteName = (process.env.BACKUP_GDRIVE_REMOTE?.trim() || "gdrive").replace(/:$/, "");
  const remotePrefix = (process.env.BACKUP_GDRIVE_PREFIX?.trim() || "postgres/prod").replace(/^\/+|\/+$/g, "");
  const artifacts = await resolveArtifacts(backupFilePath);

  await ensureRcloneAvailable();

  const uploaded = [];
  for (const artifact of artifacts) {
    const key = await uploadArtifact(artifact, remoteName, remotePrefix);
    uploaded.push(key);
  }

  console.log(`Google Drive upload completed via remote "${remoteName}"`);
  for (const key of uploaded) {
    console.log(`Uploaded: ${key}`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
