---
title: Dependabot and CodeQL research
date: 2026-09-05
type: research
---

# Research Report: Dependabot + CodeQL for TinyGenius Hub

## Executive Summary

Dependabot (`@dependabot[bot]`) updates dependencies. CodeQL scans source. Not the same tool.

Repo is public (`manhquydev/tinygeniushub`). CodeQL is free. Default setup would also scan Python + Actions in `.claude` skill trees. Advanced setup with JS/TS only + path ignores is the right fit.

CI tests are **broad enough to review Dependabot PRs by hand**. They are **not** a merge gate: `main` has no branch protection; last `release-check` on GitHub failed (2026-07-11). Do not auto-merge.

## Research Methodology

- Sources consulted: GitHub docs (Dependabot options, CodeQL advanced setup, workflow config, supported ecosystems), live `gh` API/runs, repo workflows/tests, 5 web searches
- Date range: GitHub docs current as of 2026-09-05; codeql-action v4.37.9 (2026-08-26)
- Key search terms: CodeQL javascript-typescript build-mode none; Dependabot pnpm groups; Dependabot GITHUB_TOKEN; CodeQL paths-ignore; security_update_not_possible pnpm

## Brainstorm contract

- **Outcome:** Dependabot version+security PRs and CodeQL alerts on the public repo.
- **Constraints:** SHA-pinned Actions; pnpm 10.24.0; release-check ~55 min; public CodeQL only; no GHAS purchase.
- **Non-goals:** auto-merge; default setup (would scan Python in skills); secret scanning; rewriting test suite; branch protection (separate decision).
- **Acceptance:** `dependabot.yml` + CodeQL workflow on a PR to `main`; security APIs enabled; CI/test verdict with evidence.

## Key Findings

### 1. Technology Overview

| Tool | Bot | Job |
|---|---|---|
| Dependabot | `@dependabot[bot]` | Alerts + PRs for npm/docker/compose/actions |
| CodeQL | code scanning | SAST on JS/TS |

pnpm uses `package-ecosystem: npm` ([supported ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)). `docker-compose` YAML value is `docker-compose`.

### 2. Current State

- Visibility: PUBLIC. Code scanning default-setup: `not-configured`. Languages GitHub detected: actions, javascript, javascript-typescript, python, typescript.
- Dependabot alerts + security updates: ON (API PUT earlier this session).
- Security update job for `qs`: failed `security_update_not_possible` — latest resolvable `6.15.0`, fix `6.16.0`, transitive. Run: https://github.com/manhquydev/tinygeniushub/actions/runs/33936438655
- `main` branch protection: none. Rulesets: none.
- Last `release-check`: failure 2026-07-11 https://github.com/manhquydev/tinygeniushub/actions/runs/29148678613

### 3. Best Practices (applied)

- Group npm minor/patch by prod vs dev; majors stay solo.
- Weekly Mon 09:00 Asia/Ho_Chi_Minh. PR limits 5/3. Heavy CI.
- Pin CodeQL to `github/codeql-action@cdf488f595d80d6e07e03d4674febd5ab45fa938` (v4.37.9). Reuse existing `actions/checkout@93cb6efe`.
- `build-mode: none` for JS/TS. Config `paths-ignore` for `.claude`, `.opencode`, tests.
- Do not enable default setup alongside advanced workflow (duplicate alerts).
- Dependabot PRs: read-only `GITHUB_TOKEN`. Set `permissions` on `release-check` for artifact upload.

### 4. Security Considerations

- Public repo: CodeQL + Dependabot free.
- Transitive CVEs may never get a PR (`security_update_not_possible`). Still need `pnpm security:baseline` / parent bumps.
- Do not auto-merge. No required checks on `main`.

### 5. Performance

- CodeQL JS/TS `none` is cheaper than a full Next build.
- Each Dependabot PR still triggers 55-min `release-check`. Grouping is the cost control.

## Comparative Analysis

| Approach | Pros | Fails first when |
|---|---|---|
| A. Default setup API only | GitHub-maintained | Python/Actions in skill trees flood alerts |
| B. Advanced workflow, JS/TS + ignores | Matches SHA-pin convention; scoped | Workflow file drifts from GitHub defaults |
| C. Default + advanced | — | Duplicate alerts |

Recommend **B**. Assumption: public stays public. If repo goes private again, CodeQL needs GHAS (already failed `422 Advanced security has not been purchased`).

## Advise: CI / tests enough?

**Verdict:** enough to **review** Dependabot/CodeQL PRs. Not enough to **auto-ship**.

Verified:

- PR gate `release:check` = lint + type-check + vitest + e2e smoke + `security:baseline` (`pnpm audit`, fail on high prod) + perf sanity. Plus P0 e2e + video layout in `release-check.yml`.
- Large unit/API test surface under `src/**` (`*.test.ts`) and `tests/e2e/*.spec.ts`. Security e2e exists (`test:e2e:security`) but is **not** in the PR gate.
- Nightly `test:local:full` is the deep net.

Not verified / against auto-merge:

- No branch protection.
- Last recorded `release-check` on GitHub: failed, Jul 2026.
- Dependabot cannot fix some transitive CVEs (`qs`).

Do: merge Dependabot after `release-check` green on that PR; treat CodeQL alerts in Security tab; keep `security:baseline`.
Don't: Dependabot auto-merge; skip CI on Dependabot; enable default CodeQL.

## Implementation Recommendations

### Quick Start

1. Merge `chore/github-security-scanning`.
2. Confirm CodeQL run + Security > Code scanning.
3. Confirm Dependabot version updates after first Monday (or Insights > Dependency graph > Dependabot).
4. For `qs`-class failures: bump the parent package, not Dependabot config.

### Common Pitfalls

- Default setup + workflow = duplicate alerts
- Scanning `.claude` Python
- Auto-merge without required checks
- Assuming every Dependabot security job produces a PR

## Resources

- https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-version-updates
- https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning
- https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options
- https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories
- https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions

## Unresolved questions

- Enable branch protection + required `release-check` + CodeQL?
- Bump parent of `qs` separately?
- Put `test:e2e:security` on the PR gate (cost vs coverage)?
