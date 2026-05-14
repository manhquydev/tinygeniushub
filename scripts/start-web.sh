#!/bin/sh
set -eu

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"

echo "[web] Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" >/dev/null 2>&1; do
  sleep 2
done

echo "[web] Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT}..."
until node -e "const net=require('net');const s=net.createConnection({host:process.env.REDIS_HOST,port:Number(process.env.REDIS_PORT)},()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),2000);" >/dev/null 2>&1; do
  sleep 2
done

echo "[web] Applying Prisma migrations..."
retry=0
until pnpm prisma migrate deploy; do
  retry=$((retry + 1))
  if [ "${retry}" -ge 15 ]; then
    echo "[web] prisma migrate deploy failed after ${retry} attempts."
    exit 1
  fi
  sleep 2
done

if [ "${RUN_DB_SEED:-true}" = "true" ]; then
  echo "[web] Seeding database..."
  pnpm tsx prisma/seed.ts
fi

echo "[web] Starting Next.js dev server on port 3000..."
exec pnpm dev --hostname 0.0.0.0 --port 3000
