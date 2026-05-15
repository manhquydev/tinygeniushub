#!/bin/sh
set -eu

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"

echo "[worker] Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" >/dev/null 2>&1; do
  sleep 2
done

echo "[worker] Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT}..."
until node -e "const net=require('net');const s=net.createConnection({host:process.env.REDIS_HOST,port:Number(process.env.REDIS_PORT)},()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),2000);" >/dev/null 2>&1; do
  sleep 2
done

echo "[worker] Starting background worker..."
exec pnpm worker:dev
