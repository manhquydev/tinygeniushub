# Admin-Configurable Security Policy Research (2026-02-21)

## Objective
Support admin-controlled anti-abuse setup without weakening baseline protections for learning APIs.

## Key Findings from Internet Research
1. Cloudflare recommends combining edge DDoS defenses with explicit per-endpoint rate limiting for application-layer abuse control.
2. Cloudflare Rulesets API supports managed rule lifecycle, suitable for generating policy-as-code from admin-managed settings.
3. OWASP API Security Top 10 (API4:2023) highlights unrestricted resource consumption as a primary API risk, matching this project's watch/report/upload surfaces.
4. Cloudflare recommends custom rules + IP allow/block list strategy for path-level access control (for example, readiness/admin endpoints).
5. Node.js `net.BlockList` supports native CIDR matching (`addSubnet` + `check`) for runtime IP policy enforcement.

## Design Implications for This Project
1. Keep layered defense:
   - Edge (WAF/challenge/rate limits)
   - App (route-level throttling keyed by IP/account/resource)
2. Let admin tune limits inside safe min/max ranges only.
3. Persist policy in DB with audit log trail for change accountability.
4. Cache policy in app runtime to avoid DB overhead on every request.
5. Add runtime security controls to support incident response:
   - `ddosMode` (`normal|elevated|emergency`)
   - `globalLimitMultiplier`
   - `blockedIpCidrs`
   - `readinessAllowlistCidrs`
6. Keep edge and app policies synchronized through runbook and endpoint matrix.

## Implemented in This Iteration
1. Added `AdminSecuritySettings` model for persistent security policy.
2. Added `GET|PATCH /api/admin/security/rate-limits` for admin-managed rate-limit tuning.
3. Connected runtime routes to centralized policy service with safe clamp logic.
4. Added admin UI table for editing and saving policy values.
5. Added admin-managed security controls with IP/CIDR policy support and DDoS response modes.
6. Enforced runtime blocklist/allowlist checks on abuse-sensitive routes (auth, watch, webhook, reports, upload-url, readiness).
7. Added edge policy export endpoint (`GET /api/admin/security/edge-export`) for operational synchronization to WAF/CDN rules.

## Primary Sources
1. Cloudflare DDoS proactive defense:
   - https://developers.cloudflare.com/ddos-protection/best-practices/proactive-defense/
2. Cloudflare Rulesets API:
   - https://developers.cloudflare.com/ruleset-engine/rulesets-api/
3. Cloudflare HTTP DDoS managed ruleset:
   - https://developers.cloudflare.com/ddos-protection/managed-rulesets/http/
4. OWASP API Security Top 10 (2023):
   - https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
5. Cloudflare WAF IP access/custom rules guidance:
   - https://developers.cloudflare.com/waf/tools/ip-access-rules/create/
   - https://developers.cloudflare.com/waf/custom-rules/use-cases/allow-traffic-from-ips-in-allowlist/
6. Node.js BlockList reference:
   - https://nodejs.org/api/net.html
