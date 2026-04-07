---
title: "Switch Report Sender to no-reply@my-domain.com"
description: "Minimal Brevo sender-address switch with env/docs consistency checks."
status: pending
priority: P2
effort: 1h
branch: main
tags: [email, brevo, env, docs]
created: 2026-04-07
---

## Objective
Set `REPORT_EMAIL_FROM=no-reply@my-domain.com` for report emails (provider already `brevo`) with minimal change scope.

## Scope (YAGNI/KISS/DRY)
- Runtime config/env update only.
- Docs/sample env alignment where sender example is outdated.
- No provider migration, no template logic changes, no secret/value hardcoding in repo.

## Implementation Steps
1. Pre-check runtime config
- Confirm target env has `REPORT_EMAIL_PROVIDER=brevo`.
- Confirm Brevo sender/domain for `my-domain.com` is verified (SPF/DKIM, sender identity).
- Confirm rollout order: staging first, then production.

2. Apply env change
- Update deployment secret/env: `REPORT_EMAIL_FROM=no-reply@my-domain.com`.
- Keep existing `REPORT_EMAIL_BREVO_API_KEY` and base URL unchanged.
- Do not commit real secrets to git.

3. Docs/env consistency update list
- Update [docs/deployment/VPS-DEPLOYMENT-GUIDE.md](/D:/project/cungcontuhoc/docs/deployment/VPS-DEPLOYMENT-GUIDE.md) sender example at `REPORT_EMAIL_FROM`.
- Review [README.md](/D:/project/cungcontuhoc/README.md), [docs/DEPLOYMENT-CHECKLIST.md](/D:/project/cungcontuhoc/docs/DEPLOYMENT-CHECKLIST.md), [docs/SERVER-DEPLOYMENT-PLAN.md](/D:/project/cungcontuhoc/docs/SERVER-DEPLOYMENT-PLAN.md), [.env.example](/D:/project/cungcontuhoc/.env.example) for consistency.
- Keep `.env.example` generic (no real domain/secrets).

## Risk Checks
- Sender identity risk: Brevo rejects unverified `from` domain/address.
- Deliverability risk: SPF/DKIM/DMARC misalignment can cause spam/reject.
- Fallback recipient risk: routes using `ADMIN_EMAILS[0] ?? REPORT_EMAIL_FROM` may target the new sender when admin list missing.
- Process gap risk: current production gate checks `resend` keys, not `brevo`; use explicit deploy checklist verification.

## Verification Steps
1. Config validation
- Restart app with updated env and verify boot succeeds (env schema accepts `REPORT_EMAIL_FROM`).

2. Functional smoke (staging)
- Trigger one report email flow end-to-end.
- Confirm Brevo API success and email received with `From: no-reply@my-domain.com`.
- Confirm reply-to behavior remains expected.

3. Production validation
- Trigger one controlled test report after deploy.
- Check app logs + Brevo event log (accepted/sent, no sender rejection).

4. Regression spot check
- Verify contact/waitlist admin-notification routes still send to intended recipient when `ADMIN_EMAILS` is set.

## Definition of Done
- Runtime env switched in staging + production.
- One successful test delivery in each environment from new sender.
- Deployment docs updated and consistent with Brevo setup.
- No secrets committed.

## Unresolved Questions
- Is `no-reply@my-domain.com` already verified in Brevo sender/domain settings?
- Should `REPORT_EMAIL_REPLY_TO` stay current or move to same domain for DMARC alignment?
