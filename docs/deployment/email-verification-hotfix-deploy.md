# Email Verification Hotfix Deploy

## One-command deploy + verify

Run from repository root:

```bash
bash scripts/deploy/production-email-verify-hotfix.sh do-server main
```

If you deploy by direct host:

```bash
bash scripts/deploy/production-email-verify-hotfix.sh deploy@<server-ip> main
```

## Optional environment overrides

```bash
APP_DIR=/var/www/tinygeniushub \
BASE_URL=https://www.tinygeniushubvn.tech \
WEB_PROCESS=tinygeniushub-web \
WORKER_PROCESS=tinygeniushub-worker \
REMOTE_ENV_FILE=.env.production \
bash scripts/deploy/production-email-verify-hotfix.sh do-server main
```

Always verify PM2 process names before restart:
- `pm2 status`
- Ensure `tinygeniushub-web` and `tinygeniushub-worker` exist.

## What this script verifies

1. Deploy code on server and run `prisma migrate deploy`.
2. Restart web + worker process.
3. Verify DB setting: `parentEmailVerificationRequired=true`.
4. Run live public API behavior check:
   - signup must return `verification.required=true`.
   - signup must not issue parent session cookie.
   - login before verify must be blocked with `EMAIL_NOT_VERIFIED`.
