# DDoS and Abuse Mitigation Runbook

## Scope
This runbook aligns edge protections with current app-layer safeguards for learning, auth, billing, and report endpoints.
Admin can update app-layer limits via `GET|PATCH /api/admin/security/rate-limits`.
Admin can also switch `ddosMode`, apply `globalLimitMultiplier`, and manage `blockedIpCidrs` / `readinessAllowlistCidrs`.
Use `GET /api/admin/security/edge-export` to export current policy-as-code JSON for edge rule synchronization.
Sensitive mutation endpoints are configured fail-closed for distributed rate-limit store unavailability (deny instead of local fallback).
For production, set `RATE_LIMIT_TRUST_PROXY=true` and `RATE_LIMIT_TRUSTED_HOPS` correctly behind your edge/proxy; startup now fails when `RATE_LIMIT_TRUST_PROXY=false` in production.

## Endpoint Protection Matrix

| Endpoint pattern | App limit keying | App policy (current) | Edge policy (recommended) |
| --- | --- | --- | --- |
| `/api/auth/login` | IP + email bucket | 20/10m per IP, 15/10m per email | Managed challenge + 30/10m per IP |
| `/api/auth/signup` | IP + email bucket | 5/10m per IP, 4/1h per email | Managed challenge + 10/10m per IP |
| `/api/auth/logout` | IP | 120/10m per IP | Log/challenge at 150/10m per IP |
| `/api/admin/security/rate-limits` (`PATCH`) + `/api/admin/lessons/*/trial-flag` (`PATCH`) | IP + admin authz | 120/10m per IP | Managed challenge + strict ASN allowlist where possible |
| `/api/children*` (`POST|PATCH|DELETE`) | IP + parent | 90/10m per IP, 60/10m per parent | Managed challenge + 120/10m per IP |
| `/api/referrals/claim` | IP + parent | 30/10m per IP, 15/10m per parent | Managed challenge + 45/10m per IP |
| `/api/lessons/*/watch/session` | IP + parent | 120/10m per IP, 60/10m per parent | 150/10m per IP, bot score challenge |
| `/api/lessons/*/watch/heartbeat` | IP + parent | 240/1m per IP, 120/1m per parent | 300/1m per IP, burst smoothing |
| `/api/lessons/*/watch` | IP + parent | 80/10m per IP, 40/10m per parent | 100/10m per IP |
| `/api/lessons/*/complete` | IP + parent | 80/10m per IP, 40/10m per parent | 100/10m per IP |
| `/api/billing/webhooks/mock` | IP + signature gate + body limit | 180/1m per IP, signature required, payload <= configured max bytes | Allowlist provider IPs if available, strict body-size rule |
| `/api/billing/checkout` | IP + parent | 30/10m per IP, 20/10m per parent | 40/10m per IP |
| `/api/reports/generate` | IP + parent | 30/1h per IP, 12/1h per parent | 40/1h per IP |
| `/api/reports/send-email` | IP + parent | 20/1h per IP, 8/1h per parent | 30/1h per IP |
| `/api/evidence/media/upload-url` | IP + parent | 180/10m per IP, 120/10m per parent | 220/10m per IP |
| `/api/storage/mock-upload` | IP + signed URL gate | 300/10m per IP, valid signature required | 360/10m per IP |
| `/api/health/ready` | IP + cached checks | 90/1m per IP, check cache window enabled | Restrict to internal allowlist / monitoring sources |

## Incident Triggers
1. 429 rate on any endpoint family rises above normal baseline for 5 minutes.
2. Sudden spike in invalid webhook signatures.
3. Elevated readiness probe traffic from unknown ASN/IP ranges.
4. Redis or DB latency increases with correlated request-volume anomalies.

## First 15 Minutes Playbook
1. Enable stricter edge challenge for affected route family.
2. If webhook endpoint targeted, temporarily enforce provider allowlist mode.
3. Reduce edge body-size thresholds for attacked POST paths.
4. In admin panel, switch `ddosMode` to `elevated` or `emergency` and lower `globalLimitMultiplier`.
5. Add top offender IP/CIDR entries into `blockedIpCidrs`.
6. Verify app metrics:
   - request rate
   - 429 rate
   - DB query latency
   - Redis command latency
7. Keep availability for learning paths by prioritizing `/api/lessons/*` over non-critical report endpoints.

## Stabilization Actions
1. Increase edge rate-limit strictness in progressive steps (avoid hard lockout).
2. If attack persists, reduce app-level limits on non-critical mutation endpoints.
3. For readiness abuse, enforce `readinessAllowlistCidrs` and move probe endpoint behind private network rule only.
4. Capture top offender fingerprints (IP, ASN, user-agent patterns).

## Recovery and Postmortem Checklist
1. Return edge rules to baseline once traffic normalizes.
2. Validate no backlog/regression in:
   - billing webhook processing
   - watch heartbeat flow
   - weekly report jobs
3. Export timeline of mitigations and observed metrics.
4. Update this matrix and thresholds based on real traffic evidence.

## Owner Notes
1. Keep this runbook synchronized with `src/lib/rate-limit.ts` and route handlers.
2. Any limit changes must be reflected in both app and edge layers.
