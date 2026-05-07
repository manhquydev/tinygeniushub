# TinyGenius Hub - Master Handover Document (Agent-Ready, Single File)

## 0. Document Metadata
- Version: 2.1
- Date: 2026-02-20
- Product: TinyGenius Hub
- Target region: Singapore (primary)
- Operations model: Fully self-managed
- Intended readers: Product Owner, Tech Lead, Engineering Team, DevOps/SRE, QA, and coding agents (Codex, Claude Code, OpenCode)

## 1. Language Policy (Mandatory)
1. All project documentation must be written in English.
2. The product user interface remains Vietnamese by default.
3. This is intentional: English docs for cross-team handover and agent interoperability, Vietnamese UI for end-user fit.
4. Any new document must include language clarity when relevant (for example: API docs in English, UX copy in Vietnamese).

## 2. Purpose And Scope Of This File
This file is the single source of truth for rebuilding the project from scratch and handing over execution to another team.

This document defines:
1. Product scope and business rules.
2. Technology and architecture decisions.
3. Deployment and cost-scaling strategy from startup to large scale.
4. QA, release, and migration standards.
5. Agent execution standards with evidence-based research rules.

## 3. Source Of Truth Priority
If any conflict exists, use this order:
1. Locked business rules and payment integrity rules in this file.
2. Security and data integrity requirements in this file.
3. Deployment and cost-scaling rules in this file.
4. Latest explicit user instruction for the current task.

## 4. Research Method And Evidence Standard

### 4.1 Evidence Standard
For decisions involving cost, regions, provider capabilities, limits, compliance, or security:
1. Use official provider documentation first.
2. Record access date.
3. Separate `raw_fact` from `inference`.
4. Mark confidence level: high, medium, or low.
5. If a fact cannot be verified, mark it as `unknown`.

### 4.2 Research Log Template
```md
## RES-YYYYMMDD-XX: <topic>
- Date:
- Researcher:
- Question:
- Sources:
  - URL:
    Accessed date:
    Key fact:
    Fact type: raw_fact | inference
- Conclusion:
- Confidence: low | medium | high
- Gaps:
```

### 4.3 Evidence Used For This Revision (2026-02-20)
All key data points below are directly extracted from official sources on 2026-02-20.

1. Hetzner Cloud (Singapore `SG`) raw facts:
   - `CPX12` is listed at `$7.59/month`.
   - `CPX22` is listed at `$14.09/month`.
   - `CPX32` is listed at `$28.59/month`.
   - `CPX42` is listed at `$48.59/month`.
   - `CPX52` is listed at `$67.59/month`.
   - Singapore traffic included is listed as `0.5 TB`, and additional traffic is listed as `$8.49/TB`.
2. DigitalOcean Droplets raw facts:
   - `s-1vcpu-1gb` is listed at `$6/month`.
   - `s-2vcpu-4gb` is listed at `$24/month`.
   - `s-4vcpu-8gb` is listed at `$48/month`.
3. Cloudflare R2 raw facts:
   - Standard storage: `$0.015 / GB-month`.
   - Class A operations: `$4.50 / million`.
   - Class B operations: `$0.36 / million`.
   - R2 egress to Internet is documented as free (with Cloudflare policy caveats).
4. Vietcombank FX reference raw fact:
   - USD sell rate: `26,160 VND` (timestamp in feed: `2026-02-20 21:29:46`).
5. DigitalOcean and AWS region raw facts:
   - DigitalOcean documentation includes Singapore region (`sgp1`).
   - AWS global infrastructure includes Singapore region (`ap-southeast-1`).
6. Agent compatibility raw facts:
   - OpenAI Codex docs describe project-level instruction usage via `AGENTS.md`.
   - Anthropic docs describe Claude Code project memory via `CLAUDE.md`.

### 4.4 Currency And FX Policy (VND)
1. Commercial pricing is in VND.
2. Infrastructure vendors charge primarily in USD/EUR.
3. Budget and reporting are converted to VND using a conservative FX rate:
   - default operational rate: `Vietcombank USD sell`.
4. To absorb volatility, finance reporting should apply a +3% FX risk buffer.
5. Update FX assumption at least monthly or when USD/VND moves by >= 2%.

## 5. Executive Decisions (Recommended Defaults)
These decisions resolve previously open items so a new team can start immediately.

1. Caregiver role: defer to post-MVP.
2. Plan strategy: keep yearly as primary, keep monthly as controlled experiment.
3. Trial breadth: open only 10-15% of total lesson inventory, focused on highest conversion tracks.
4. Background job framework: BullMQ + Redis/Valkey.
5. Redis model:
   - Small stage: self-hosted Redis on same VPS.
   - Medium and above: dedicated Redis node.
6. Scaling trigger (small to medium): when any 7-day rolling trigger is true:
   - App CPU > 60%,
   - DB CPU > 60%,
   - p95 API latency > 500 ms,
   - Infrastructure cost > 20% of MRR.
7. DR target:
   - Small: daily backup + weekly restore test.
   - Medium and above: RPO <= 15 minutes, RTO <= 2 hours.
8. On-call and incident SLA:
   - Sev-1 acknowledge <= 15 minutes (24/7),
   - Sev-1 mitigation started <= 60 minutes.

## 6. Product Definition

### 6.1 Product Summary
- Product name: TinyGenius Hub
- Domain: Learning Journey OS for children age 2-6
- Primary user: Parent
- Secondary user: Child
- Value proposition: Parent-visible daily progress in short learning sessions

### 6.2 Core Problem
Most video-only learning apps fail to retain parents because they lack:
1. Clear curriculum progression.
2. Verifiable learning progress evidence.
3. Parent controls around screen-time and safety context.

### 6.3 Product Goals
1. Improve onboarding activation.
2. Improve trial-to-paid conversion.
3. Improve retention via weekly proof-of-progress.
4. Preserve parent trust through safety and billing integrity.

### 6.4 User Roles
1. Parent: account owner, payment, child management, progress monitoring.
2. Child: learning interaction and reward engagement.
3. Admin: content, billing operations, moderation, settings.
4. Caregiver: post-MVP read-only or limited contributor role.

## 7. Functional Scope

### 7.1 In Scope (MVP Rebuild)
1. Parent authentication and onboarding.
2. Child profile management.
3. Content hierarchy: Track -> Level -> Unit -> Lesson.
4. Lesson flow: watch + interact + complete.
5. Progress and gamification: streak, stars, badges.
6. Parent dashboard and weekly report.
7. Trial to paid conversion and webhook-based payment reconciliation.
8. Admin operations for users, content, payments.

### 7.2 Out Of Scope (MVP)
1. Live classes and tutoring.
2. Child social/chat system.
3. Native mobile apps.
4. Advanced adaptive AI learning pathing.

## 8. Locked Business Rules
1. Child profile limit is plan-dependent.
2. Progress evidence retention default: 90 days; premium tiers can extend to 365 days.
3. Trial users can only access trial-enabled lessons.
4. Each lesson completion rewards once per child per lesson.
5. One payment provider transaction ID maps to one internal payment record.
6. Auto-charge runs only for active, eligible subscriptions.
7. Any billing webhook processing must be idempotent and auditable.

## 9. Core User Flows And Acceptance Criteria

### 9.1 Parent Signup To First Lesson
Flow:
1. Parent signs up.
2. Email verification is optional/soft in MVP.
3. Parent creates child profile.
4. Parent selects learning track.
5. Child starts first lesson.

Acceptance criteria:
1. End-to-end flow <= 3 minutes median.
2. No unnecessary mandatory fields in first-run experience.

### 9.2 Lesson Completion To Reward
Flow:
1. Child opens lesson.
2. Child watches/interacts.
3. System marks completion.
4. System grants rewards and updates streak.

Acceptance criteria:
1. Completion endpoint is idempotent.
2. Retry-safe under unstable network.

### 9.3 Trial To Paid Conversion
Flow:
1. Parent selects plan.
2. Checkout starts.
3. Payment webhook validates signature.
4. Subscription status updates.
5. Renewal/auto-charge scheduler handles next cycle.

Acceptance criteria:
1. Signature verification is mandatory.
2. No duplicate charge for same billing cycle.
3. Full audit trail on each state transition.

### 9.4 Weekly Report Delivery
Flow:
1. Aggregate weekly activity.
2. Generate report artifact.
3. Deliver in-app and optional email.

Acceptance criteria:
1. Report includes at least: total minutes, completed lessons, streak.
2. Report generation is repeatable if rerun is required.

## 10. Architecture And Technology Stack

### 10.1 Architecture Pattern
- Modular monolith in early stages.
- Explicit module boundaries to allow future extraction.

### 10.2 Core Modules
1. `identity`
2. `content`
3. `learning`
4. `progress`
5. `billing`
6. `reports`
7. `admin`
8. `referral`
9. `platform` (storage, queue, email, observability)

### 10.3 Recommended Stack
1. Web: Next.js 16 + React 19 + TypeScript
2. Data: PostgreSQL 16+ with Prisma ORM
3. Auth: Better Auth
4. Object storage: Cloudflare R2
5. Cache/queue: Redis or Valkey
6. Jobs: BullMQ worker service (separate process)
7. Edge/WAF/DNS/CDN: Cloudflare
8. Reverse proxy: Nginx
9. Observability: Sentry + structured logs + metrics dashboard

### 10.4 Engineering Rules
1. Keep route handlers thin; move business logic into domain services.
2. Use transactions for payment and progress critical paths.
3. Apply schema migrations with review and rollback plan.
4. Secure first for webhook, auth, and admin routes.

## 11. Deployment Strategy (Singapore, Self-Managed)

### 11.1 Provider Strategy
Primary recommendation:
1. Compute VPS: Hetzner Cloud Singapore (`sin`) for cost-efficient self-managed baseline.
2. Storage: Cloudflare R2 for media and backup objects.
3. Edge/WAF/CDN/DNS: Cloudflare.

Secondary fallback:
1. DigitalOcean Singapore (`sgp1`) when Hetzner constraints appear (for example procurement policy, temporary capacity, or feature preference).
2. AWS Singapore (`ap-southeast-1`) reserved for later high-compliance/high-integration phases because of higher complexity and likely higher cost.

### 11.2 Stage Topology
Small stage:
1. Single VPS running app + PostgreSQL + Redis + worker + Nginx.
2. Cloudflare R2 for media.
3. Daily backup and basic alerting.

Medium stage:
1. VPS-A: app + Nginx.
2. VPS-B: PostgreSQL primary.
3. VPS-C: Redis + worker.
4. Optional load balancer and read replica.

Large stage:
1. Two or more app nodes.
2. PostgreSQL primary + replica with failover runbook.
3. Dedicated worker nodes.
4. Autoscaling policy with capacity thresholds.

### 11.3 Migration Path Without Rewrite
1. Keep app stateless.
2. Keep jobs out of web process.
3. Use environment-based config only.
4. Package with Docker from day one.
5. Keep data contracts stable across stages.

## 12. Cost Strategy And Scaling Triggers

### 12.1 Cost Principles
1. Start with minimum viable topology.
2. Scale only on measured bottlenecks.
3. Offload media delivery to CDN/object storage to reduce origin traffic cost.
4. Keep infra cost under 20% of MRR as control target.

### 12.2 Monitoring Triggers (7-day rolling)
Scale app tier if:
1. App CPU > 60%,
2. p95 response > 500 ms,
3. Error rate > 1% sustained.

Scale database tier if:
1. DB CPU > 60%,
2. p95 query > 100 ms,
3. lock wait spikes affect checkout/progress endpoints.

Scale worker tier if:
1. queue lag > 2 minutes for P0 jobs,
2. retry ratio > 5% sustained.

Cost optimization sprint is mandatory if:
1. Infrastructure cost > 20% of MRR, or
2. unexpected egress or storage growth exceeds forecast by > 25%.

### 12.3 Practical Cost Notes From Research
1. Hetzner states location-dependent pricing behavior and specific traffic differences for Singapore.
2. DigitalOcean publishes low-entry Droplet pricing useful as conservative baseline budgeting.
3. Cloudflare R2 publishes no-egress-fee positioning, reducing media delivery risk versus origin egress-heavy designs.

### 12.4 Quantified Cost Model (VND, Monthly)
Assumptions for this baseline model:
1. FX rate for budgeting: `1 USD = 26,160 VND` (Vietcombank sell, 2026-02-20).
2. Costs exclude VAT/taxes, promotional credits, and optional commercial support plans.
3. Ranges include a practical operational buffer for backups, monitoring, and traffic variance.

Reference unit costs (raw fact -> converted VND):
1. Hetzner `CPX22`: `$14.09` -> `368,594 VND`.
2. Hetzner `CPX32`: `$28.59` -> `747,914 VND`.
3. Hetzner `CPX42`: `$48.59` -> `1,271,114 VND`.
4. Hetzner `CCX23`: `$44.59` -> `1,166,474 VND`.
5. Hetzner `CCX33`: `$83.59` -> `2,186,714 VND`.

Recommended monthly ranges by stage (inference from topology + unit pricing):
1. Small stage:
   - Topology: 1 node (`CPX32`) + R2 + Cloudflare baseline.
   - Budget range: `~800,000 VND to ~1,600,000 VND`.
2. Medium stage:
   - Topology: app (`CPX32`) + db (`CCX23`) + worker/redis (`CPX22`) + R2.
   - Budget range: `~2,400,000 VND to ~3,800,000 VND`.
3. Large stage:
   - Topology: 2 app nodes (`CPX42` x2) + db primary (`CCX33`) + db replica (`CCX23`) + worker (`CPX32` x2) + R2.
   - Budget range: `~7,900,000 VND to ~11,300,000 VND`.

Decision threshold for stage migration (cost perspective):
1. Move small -> medium when either:
   - performance trigger is hit, or
   - projected next-30-day infra cost exceeds `20%` of MRR.
2. Move medium -> large when:
   - sustained capacity pressure remains after medium optimization sprint, and
   - projected growth would breach SLO/SLA in the next two release cycles.

## 13. QA, Release, And Launch Gates

### 13.1 Test Strategy
1. Unit tests for pure domain logic.
2. Integration tests for API, auth, DB, billing workflows.
3. E2E tests for P0 user journeys.

### 13.2 Minimum Coverage Targets
1. API/business services: >= 80%.
2. Critical UI flows: >= 60%.
3. P0 journeys: fully covered with smoke checks.

### 13.3 Mandatory Release Gates
1. `pnpm lint`
2. `pnpm type-check`
3. `pnpm test` (unit/integration)
4. `pnpm test:e2e` (at least smoke suite)
5. security scan baseline
6. performance sanity check

### 13.4 Launch Exit Criteria
1. No unresolved Sev-0 or Sev-1 defects.
2. All P0 acceptance criteria pass.
3. Production dry run passes.
4. Product owner, tech lead, and QA sign off.

### 13.5 SLA And Incident Model (Recommended)
Service classification:
1. Paid consumer learning platform (important business impact, not life-critical).

SLA target by stage:
1. Small stage target availability: `99.5%` monthly.
2. Medium and large stage target availability: `99.9%` monthly.

Support coverage model:
1. Sev-1 and Sev-0: 24/7 on-call coverage.
2. Sev-2 and lower: 07:00-22:00 ICT (UTC+7), daily.

Response targets:
1. Sev-1:
   - acknowledgement <= 15 minutes (24/7),
   - mitigation started <= 60 minutes,
   - stable workaround <= 4 hours.
2. Sev-2:
   - acknowledgement <= 60 minutes (support window),
   - mitigation started <= 4 hours.
3. Sev-3:
   - acknowledgement <= 1 business day,
   - planned fix in next scheduled release cycle.

Maintenance policy:
1. Planned maintenance window: Sunday 00:00-04:00 ICT.
2. Emergency maintenance can occur anytime with incident broadcast.
3. All maintenance events require post-incident notes and action items.

## 14. Migration And Cutover

### 14.1 Data Priority
Tier 1: users, children, subscriptions, payments  
Tier 2: progress, streaks, stars, badges  
Tier 3: content metadata, reports, evidence metadata  
Tier 4: logs, analytics, cache

### 14.2 Cutover Procedure
1. Freeze writes in short maintenance window.
2. Export snapshot.
3. Transform and import into staging rehearsal.
4. Verify row counts and checksums.
5. Repeat for production cutover.

### 14.3 Reconciliation Checklist
1. User count match.
2. Active subscription count match.
3. Paid amount aggregate match.
4. Progress completion count match.
5. Manual sampled record audit passes.

### 14.4 Rollback Triggers
1. Payment inconsistency.
2. Widespread authentication failure.
3. Material data mismatch after cutover.

## 15. Agent Execution Contract (Codex, Claude Code, OpenCode)

### 15.1 Required Task Input
```yaml
goal: <single objective>
scope:
  in: [ ... ]
  out: [ ... ]
constraints:
  region: singapore
  ops: self-managed
  budget: <if known>
  deadline: <YYYY-MM-DD>
inputs:
  required_docs: [docs/handover/handover-master-agent-ready.md]
  required_files: [ ... ]
acceptance:
  - <check 1>
  - <check 2>
```

### 15.2 Required Task Output
```md
## Summary
- ...

## Files Changed
- path/to/file

## Verification
- command: <cmd>
  result: pass | fail

## Risks/Assumptions
- ...

## Unresolved Questions
- ...
```

### 15.3 Agent-Specific Compatibility Notes
1. OpenAI Codex supports project-level instruction patterns through `AGENTS.md`.
2. Claude Code supports project memory via `CLAUDE.md`.
3. Keep this handover doc explicit, deterministic, and machine-readable to reduce agent drift.

## 16. Decision, Risk, And Research Logs

### 16.1 Decision Log Template
```md
## DEC-YYYYMMDD-XX: <title>
- Date:
- Owner:
- Context:
- Inputs:
  - Business:
  - Technical:
  - Cost:
- Options considered:
  - A
  - B
  - C
- Decision:
- Why:
- Impact:
  - Product
  - Engineering
  - Cost
  - Ops
- Follow-up actions:
- Review date:
```

### 16.2 Risk Log Template
```md
## RISK-YYYYMMDD-XX: <title>
- Probability: low | medium | high
- Impact: low | medium | high
- Trigger signal:
- Mitigation:
- Contingency:
- Owner:
- Due date:
```

### 16.3 Research Log Template
```md
## RES-YYYYMMDD-XX: <topic>
- Date:
- Researcher:
- Question:
- Sources:
  - URL:
    Accessed date:
    Key fact:
    Fact type: raw_fact | inference
- Conclusion:
- Confidence: low | medium | high
- Gaps:
```

## 17. Initial Backlog For Rebuild Team (First 4 Weeks)
1. Week 1:
   - Confirm scope lock and acceptance criteria.
   - Finalize ADRs for storage, queue, billing, and deployment topology.
2. Week 2:
   - Implement identity, child profile, and content hierarchy.
   - Set up CI gates and baseline observability.
3. Week 3:
   - Implement lesson completion, rewards, and progress aggregation.
   - Add retry-safe logic for critical endpoints.
4. Week 4:
   - Implement checkout, webhook verification, subscription transitions.
   - Ship weekly report job and delivery channel.

## 18. Handover Acceptance Criteria
This handover package is accepted when:
1. A new team can begin implementation without asking for basic context.
2. Deployment path from small to medium to large is operationally clear.
3. Cost control triggers are measurable and actionable.
4. Agent task inputs/outputs and research standards are explicit.
5. Language policy is unambiguous: docs in English, product UI in Vietnamese.

## 19. Sources (Official, Accessed 2026-02-20)
1. Hetzner data center locations: https://docs.hetzner.com/general/others/data-centers-and-connection/
2. Hetzner cloud pricing: https://www.hetzner.com/cloud/
3. DigitalOcean available regions: https://docs.digitalocean.com/products/platform/availability-matrix/
4. DigitalOcean pricing: https://www.digitalocean.com/pricing
5. AWS global infrastructure: https://aws.amazon.com/about-aws/global-infrastructure/regions_az/
6. Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
7. OpenAI Codex announcement: https://openai.com/index/introducing-codex/
8. OpenAI Codex repository documentation: https://raw.githubusercontent.com/openai/codex/main/docs/config.md
9. Anthropic Claude Code memory docs: https://docs.anthropic.com/en/docs/claude-code/memory
10. Vietcombank FX XML feed: https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=68
