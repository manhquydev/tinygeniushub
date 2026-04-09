---
description: How to access the server and deploy code to Production (DigitalOcean)
---

# Deploy to Production Workflow

The Cùng Con Tự Học project is hosted on a DigitalOcean Droplet (Ubuntu), running PM2 for the Next.js application, Docker for PostgreSQL/Redis, and NGINX as the reverse proxy.

## 1. Server Access Information

The project uses SSH key authentication. Before doing any server operations, verify your SSH connection.

- **Host IP:** `152.42.246.218`
- **User:** `root`
- **SSH Alias:** `do-server` (Ensure this alias is configured in your local `~/.ssh/config` pointing to the droplet IP).
- **App Path on Server:** `/var/www/cungcontuhoc`

To verify connection, you can run:
```bash
ssh do-server "uptime"
```

## 2. Standard Deployment Steps

If there are new commits in `main` and you need to deploy production, run:

```bash
ssh do-server "cd /var/www/cungcontuhoc && git pull --ff-only origin main && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build && pm2 reload cungcontuhoc-web && pm2 reload cungcontuhoc-worker"
```

Notes:
- PM2 process names are `cungcontuhoc-web` and `cungcontuhoc-worker`.
- Do not use `pm2 reload cungcontuhoc` (process not found on current production).
- `pnpm prisma migrate deploy` must run in deploy flow.

### Recommended Deterministic Flow (Preferred over one-liner)

To reduce hidden failures, run step-by-step and stop immediately at first error:

```bash
ssh do-server "cd /var/www/cungcontuhoc && git pull --ff-only origin main"
ssh do-server "cd /var/www/cungcontuhoc && pnpm install --frozen-lockfile"
ssh do-server "cd /var/www/cungcontuhoc && pnpm prisma migrate deploy"
ssh do-server "cd /var/www/cungcontuhoc && pnpm build"
ssh do-server "pm2 reload cungcontuhoc-web && pm2 reload cungcontuhoc-worker"
```

Why this is preferred:
- Easier to identify failing step (pull/install/migrate/build/reload).
- Easier to retry only failed step.
- Prevents long one-line command from masking intermediate errors.

### Important Warning 🔥: Memory/OOM Issues
The Next.js `pnpm build` process consumes a significant amount of RAM. The server has 4GB RAM + 2GB Swap. 
If the build process hangs or gets stuck for more than 3-4 minutes, it means the server is experiencing Out of Memory (OOM) starvation. 

In the event of OOM or hanging builds, run the **Memory-Safe Deployment** sequence instead:

```bash
# 1. Stop web + worker to free up memory
ssh do-server "pm2 stop cungcontuhoc-web && pm2 stop cungcontuhoc-worker"

# 2. Pull code, install deps, apply migration, and build
ssh do-server "cd /var/www/cungcontuhoc && git pull --ff-only origin main && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm build"

# 3. Start web + worker again
ssh do-server "pm2 start cungcontuhoc-web && pm2 start cungcontuhoc-worker"
```

### Build Lock Recovery (`.next` lock / stale build artifacts)

If build fails with lock/contention symptoms (often `.next` artifacts), recover with:

```bash
# Optional: inspect stuck build process
ssh do-server "ps -ef | grep '[n]ext build' || true"

# Optional: kill stale build process if still running
ssh do-server "pkill -f '[n]ext build' || true"

ssh do-server "pm2 stop cungcontuhoc-web && pm2 stop cungcontuhoc-worker"
ssh do-server "cd /var/www/cungcontuhoc && rm -rf .next && pnpm build"
ssh do-server "pm2 start cungcontuhoc-web && pm2 start cungcontuhoc-worker"
```

Then re-run post-deploy verification commands.

## 3. Database operations
 Prisma is used for the database. To run Prisma migrations or seed the database on production:
```bash
ssh do-server "cd /var/www/cungcontuhoc && pnpm prisma migrate deploy"
ssh do-server "cd /var/www/cungcontuhoc && pnpm db:seed"
```

Important:
- Do not use `pnpm db:migrate` in production because it maps to `prisma migrate dev`.

## 4. Git Remote Security (Required)

Production server must use SSH remote, not PAT in URL.

Check current remote:
```bash
ssh do-server "cd /var/www/cungcontuhoc && git remote -v"
```

Switch to SSH remote:
```bash
ssh do-server "cd /var/www/cungcontuhoc && git remote set-url origin git@github.com:manhquydev/cungcontuhoc.git && git fetch origin"
```

Verify SSH auth from server:
```bash
ssh do-server "ssh -T git@github.com -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
```

If old PAT was exposed in remote URL/history, rotate/revoke it in GitHub immediately.

## 5. Post-Deploy Verification

```bash
ssh do-server "curl -sS http://localhost:3000/api/health && echo && curl -sS http://localhost:3000/api/health/ready && echo && pm2 status"
```

For email verification enforcement check (live):
- Signup parent returns `verification.required=true`
- Signup does not set `ccth_session` cookie
- Login before verify returns `403` with `EMAIL_NOT_VERIFIED`

## 6. Common Issues & Fast Fixes

- `Process or Namespace cungcontuhoc not found`
  - Cause: wrong PM2 name
  - Fix: use `cungcontuhoc-web` / `cungcontuhoc-worker`

- Build hangs/OOM
  - Cause: memory pressure during `pnpm build`
  - Fix: use memory-safe flow (stop PM2 first), or add temporary swap before build

- `prisma migrate deploy` not applied in deploy step
  - Risk: code/db schema mismatch
  - Fix: enforce migration in every deploy command

- `git pull` fails with auth/token issue
  - Cause: HTTPS remote with expired token
  - Fix: switch `origin` to SSH remote and verify `ssh -T git@github.com`

## 7. Administrative Logins
Admin configurations are set in the `.env` file via `ADMIN_EMAILS`.
- Test Admin Account: `demo.parent@cungcontuhoc.vn`
- Password: `DemoPass123!`
- Dashboard Route: `http://152.42.246.218/admin`
