#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

function parseArg(name) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.slice(name.length + 1).trim();
}

function getDatabaseName() {
  const explicit = process.env.BACKUP_POSTGRES_DATABASE;
  if (explicit && explicit.trim().length > 0) {
    return explicit.trim();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const dbName = parsed.pathname.replace(/^\//, "");
      if (dbName.length > 0) {
        return dbName;
      }
    } catch {
      // ignore parse issues and use fallback
    }
  }

  return "tinygeniushub";
}

async function run() {
  const fileArg = parseArg("--file");
  if (!fileArg) {
    throw new Error("Missing required argument: --file=<path-to-backup.dump>");
  }

  const resolvedFile = path.resolve(fileArg);
  await access(resolvedFile, constants.R_OK);

  const dockerService = process.env.BACKUP_POSTGRES_SERVICE?.trim() || "postgres";
  const pgUser = process.env.BACKUP_POSTGRES_USER?.trim() || "postgres";
  const pgDatabase = getDatabaseName();
  const skipClean = process.argv.includes("--no-clean");

  const args = ["compose", "exec", "-T", dockerService, "pg_restore", "-U", pgUser, "-d", pgDatabase];
  if (!skipClean) {
    args.push("--clean", "--if-exists");
  }
  args.push("--no-owner", "--no-privileges");

  const child = spawn("docker", args, {
    stdio: ["pipe", "inherit", "pipe"],
  });

  const input = createReadStream(resolvedFile);
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
      `Restore failed (exit ${String(exitCode)}). docker ${args.join(" ")}\n${stderr.trim()}`,
    );
  }

  console.log(`Restore completed from: ${resolvedFile}`);
  console.log(`Target database: ${pgDatabase}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
