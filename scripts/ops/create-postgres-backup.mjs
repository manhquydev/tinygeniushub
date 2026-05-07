#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

function parseArg(name, fallback) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!raw) return fallback;
  return raw.slice(name.length + 1).trim();
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function parseBool(value, fallback) {
  if (value == null) return fallback;
  return value.trim().toLowerCase() === "true";
}

async function sha256File(filePath) {
  const hash = createHash("sha256");
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest("hex");
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

async function runOffsiteUpload(filePath) {
  const scriptPath = path.join(process.cwd(), "scripts", "ops", "upload-postgres-backup-offsite.mjs");
  const args = [scriptPath, `--file=${filePath}`];
  const child = spawn(process.execPath, args, {
    stdio: ["ignore", "inherit", "pipe"],
    env: process.env,
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(
      `Offsite upload failed (exit ${String(exitCode)}). node ${args.join(" ")}\n${stderr.trim()}`,
    );
  }
}

async function runGDriveUpload(filePath) {
  const scriptPath = path.join(process.cwd(), "scripts", "ops", "upload-postgres-backup-gdrive.mjs");
  const args = [scriptPath, `--file=${filePath}`];
  const child = spawn(process.execPath, args, {
    stdio: ["ignore", "inherit", "pipe"],
    env: process.env,
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(
      `Google Drive upload failed (exit ${String(exitCode)}). node ${args.join(" ")}\n${stderr.trim()}`,
    );
  }
}

async function run() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
  const outputDir =
    parseArg("--out-dir", process.env.BACKUP_OUTPUT_DIR) ?? path.join(process.cwd(), "backups", "postgres");
  const dockerService = process.env.BACKUP_POSTGRES_SERVICE?.trim() || "postgres";
  const pgUser = process.env.BACKUP_POSTGRES_USER?.trim() || "postgres";
  const pgDatabase = getDatabaseName();
  const shouldUploadOffsite = hasFlag("--offsite") || parseBool(process.env.BACKUP_OFFSITE_ENABLED, false);
  const shouldUploadGDrive = hasFlag("--gdrive") || parseBool(process.env.BACKUP_GDRIVE_ENABLED, false);
  const fileName = `ccth-postgres-${timestamp}.dump`;
  const filePath = path.join(outputDir, fileName);

  await mkdir(outputDir, { recursive: true });

  const args = ["compose", "exec", "-T", dockerService, "pg_dump", "-U", pgUser, "-d", pgDatabase, "-Fc"];
  const child = spawn("docker", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const destination = createWriteStream(filePath);
  await pipeline(child.stdout, destination);

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  if (exitCode !== 0) {
    throw new Error(
      `Backup failed (exit ${String(exitCode)}). docker ${args.join(" ")}\n${stderr.trim()}`,
    );
  }

  const checksum = await sha256File(filePath);
  await writeFile(`${filePath}.sha256`, `${checksum}  ${path.basename(filePath)}\n`, "utf8");
  await writeFile(
    `${filePath}.json`,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        fileName: path.basename(filePath),
        checksumSha256: checksum,
        dockerService,
        database: pgDatabase,
        user: pgUser,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Backup created: ${filePath}`);
  console.log(`Checksum: ${checksum}`);

  if (shouldUploadOffsite) {
    await runOffsiteUpload(filePath);
  }

  if (shouldUploadGDrive) {
    await runGDriveUpload(filePath);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
