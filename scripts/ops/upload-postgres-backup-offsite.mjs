#!/usr/bin/env node

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

function parseArg(name) {
  const raw = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.slice(name.length + 1).trim();
}

function parseBool(value, fallback) {
  if (value == null) return fallback;
  return value.trim().toLowerCase() === "true";
}

function getR2Config() {
  const accountId = process.env.BACKUP_OFFSITE_R2_ACCOUNT_ID?.trim() || process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.BACKUP_OFFSITE_R2_BUCKET?.trim() || process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.BACKUP_OFFSITE_R2_ACCESS_KEY_ID?.trim() || process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.BACKUP_OFFSITE_R2_SECRET_ACCESS_KEY?.trim() || process.env.R2_SECRET_ACCESS_KEY?.trim();
  const endpoint =
    process.env.BACKUP_OFFSITE_R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const region = process.env.BACKUP_OFFSITE_R2_REGION?.trim() || "auto";
  const prefix = (process.env.BACKUP_OFFSITE_R2_PREFIX?.trim() || "postgres/prod").replace(/^\/+|\/+$/g, "");

  if (!bucket || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Missing R2 offsite backup configuration. Required: BACKUP_OFFSITE_R2_BUCKET(or R2_BUCKET_NAME), R2 account/endpoint, access key and secret.",
    );
  }

  return {
    bucket,
    endpoint,
    region,
    prefix,
    accessKeyId,
    secretAccessKey,
  };
}

function toObjectKey(prefix, filePath) {
  const fileName = path.basename(filePath);
  return `${prefix}/${fileName}`;
}

function detectContentType(filePath) {
  if (filePath.endsWith(".sha256")) return "text/plain";
  if (filePath.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

async function resolveArtifactList(backupFilePath) {
  const artifacts = [backupFilePath, `${backupFilePath}.sha256`, `${backupFilePath}.json`];
  const existingArtifacts = [];

  for (const artifactPath of artifacts) {
    try {
      await access(artifactPath, constants.R_OK);
      existingArtifacts.push(artifactPath);
    } catch {
      if (artifactPath === backupFilePath) {
        throw new Error(`Backup file not found or not readable: ${backupFilePath}`);
      }
    }
  }

  return existingArtifacts;
}

async function uploadArtifact(client, config, artifactPath) {
  const key = toObjectKey(config.prefix, artifactPath);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: createReadStream(artifactPath),
    ContentType: detectContentType(artifactPath),
  });

  await client.send(command);
  return key;
}

async function run() {
  const enabled = parseBool(process.env.BACKUP_OFFSITE_ENABLED, true);
  if (!enabled) {
    throw new Error("Offsite backup disabled. Set BACKUP_OFFSITE_ENABLED=true to upload.");
  }

  const fileArg = parseArg("--file");
  if (!fileArg) {
    throw new Error("Missing required argument: --file=<path-to-backup.dump>");
  }

  const backupFilePath = path.resolve(fileArg);
  const artifactPaths = await resolveArtifactList(backupFilePath);
  const config = getR2Config();

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const uploadedKeys = [];
  for (const artifactPath of artifactPaths) {
    const key = await uploadArtifact(client, config, artifactPath);
    uploadedKeys.push(key);
  }

  console.log(`Offsite upload completed. Bucket: ${config.bucket}`);
  for (const key of uploadedKeys) {
    console.log(`Uploaded: ${key}`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
