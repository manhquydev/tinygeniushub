# Deploy Clarity to Production Plan

**Date:** 2026-03-31  
**Feature:** Microsoft Clarity Integration  
**Server:** 152.42.246.218 (DigitalOcean)

## Phase Breakdown

### Phase 1: Commit & Push (Independent)
**Owner:** git-manager  
**Tasks:**
- Stage Clarity-related files
- Security scan for secrets
- Commit with conventional message
- Push to origin/main

**Files to Commit:**
- `src/lib/analytics/clarity/` (new)
- `src/app/api/clarity/` (new)
- `src/lib/auth/admin-guard.ts` (new)
- `tests/e2e/clarity-integration.spec.ts` (new)
- `src/app/layout.tsx` (modified)
- `src/components/legal/analytics-by-consent.tsx` (modified)
- `src/lib/env.ts` (modified)
- `src/lib/legal/cookie-consent.ts` (modified)
- `.env.example` (modified)
- `plans/20260331-clarity-integration/` (new)

### Phase 2: SSH Env Configuration (Independent)
**Owner:** devops-agent  
**Tasks:**
- SSH to do-server
- Backup current .env
- Add Clarity env variables
- Verify env file syntax

**Env Variables to Add:**
```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=w49qfrxwu5
CLARITY_DATA_EXPORT_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ4M0FCMDhFNUYwRDMxNjdEOTRFMTQ3M0FEQTk2RTcyRDkwRUYwRkYiLCJ0eXAiOiJKV1QifQ.eyJqdGkiOiJiYWVjZDNiZS1kMTYzLTQxNmQtODc3ZC04ZDk3MGRkOTRiMDUiLCJzdWIiOiIzMjYxOTY1ODgwNzYxMjEzIiwic2NvcGUiOiJEYXRhLkV4cG9ydCIsIm5iZiI6MTc3NDk0MzY0OCwiZXhwIjo0OTI4NTQzNjQ4LCJpYXQiOjE3NzQ5NDM2NDgsImlzcyI6ImNsYXJpdHkiLCJhdWQiOiJjbGFyaXR5LmRhdGEtZXhwb3J0ZXIifQ.drEiWgrsmHKjGVh4ve49yD4Jz-Ge_QmCX5JkV4JyQN8sRMdGmPXJWF_-lFNkpDQq7zxca7dcWviFGIXI4b4u2dhAn0K0GWtTtXdB4J4JL9Vlk3ktQKYfDfOdiieeA-XPFWQcSQyTnFsMWVtj9jYMKF3XWbiG8t8OlcYZWyrbLlH-01cnj69j8BGiLr-Kio-nyaHH8RmJcX8bQQVwfeSp3ef7TfYt8OXG-ySWQWL5zgzVpZcBGGu1y06ypQxY_N0ODS7Bb6PdlOmprisDud3RSOGbaNWq2nU3rB323H6KWLzUdjgs-B96k_w4AlZlUhm4LfjItFGC1bMzQOwB2-8RQQ
```

### Phase 3: Deploy (Depends on Phase 1 & 2)
**Owner:** devops-agent  
**Tasks:**
- SSH to do-server
- cd /var/www/cungcontuhoc
- git pull origin main
- pnpm install
- pnpm build (watch for OOM)
- pm2 reload cungcontuhoc
- Verify deployment (health check)

**OOM Watch:** If build hangs > 4 min, use memory-safe sequence:
1. pm2 stop cungcontuhoc
2. pnpm build
3. pm2 start cungcontuhoc

## Execution Strategy

**Parallel:** Phases 1 & 2 → simultaneously  
**Sequential:** Phase 3 → after both 1 & 2 complete

## Verification Steps

1. **Health Check:** curl http://152.42.246.218/api/health
2. **Clarity Check:** Verify script loads in browser after cookie consent
3. **Dashboard:** Check sessions appear in Clarity within 5 min

## Rollback Plan

If issues detected:
```bash
ssh do-server "cd /var/www/cungcontuhoc && git revert HEAD && pm2 reload cungcontuhoc"
```

## Acceptance Criteria

- [ ] All commits pushed to origin/main
- [ ] Env variables configured on server
- [ ] Deployment successful (pm2 status shows "online")
- [ ] Health check returns 200
- [ ] Clarity dashboard shows test sessions
