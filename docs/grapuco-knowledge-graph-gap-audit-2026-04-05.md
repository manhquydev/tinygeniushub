# Grapuco Knowledge Graph Gap Audit (2026-04-05)

## Scope

Audit project state with Grapuco MCP capabilities:
- Knowledge Graph (`get_architecture`)
- Data Flow Tracing (`get_data_flows`, `get_impact_analysis`)
- Semantic Search (`semantic_search`)
- Symbol graph (`search_code`, `get_dependencies`)

Sources:
- Grapuco MCP calls executed in this session:
  - `list_repositories`
  - `get_architecture`
  - `get_data_flows`
  - `search_code`
  - `get_dependencies`
  - `get_impact_analysis`
  - `semantic_search`
  - `get_context`
- Local cross-check:
  - route-handler scan under `src/app/api`
  - `rg` caller counts on security/rate-limit symbols

## Current State (Observed)

- Repository status: `COMPLETED`
- Last push: `2026-04-05T04:30:31.575Z`
- Cached files: `1064`
- Graph size: `2377 nodes`, `3938 edges`
- Data flows: `50`
- API handlers (local scan): `265`
- Flow coverage over API handlers: `18.87%`

## What Grapuco Is Good At (in this repo)

1. Symbol lookup works well (`search_code`).
2. Dependency tracing works for known symbols (`get_dependencies`).
3. Architecture-level map exists and is useful for first-pass impact reasoning.
4. Incremental delta push works fast (`grapuco:push`).

## Gaps / Missing Coverage

## P0 - Flow coverage still low for merge-confidence use

- 50 flows vs 265 handlers => 18.87% approximate coverage.
- Domain coverage mismatch (flow entries vs handlers):
  - `admin`: 22 / 116 (~18.97%)
  - `auth`: 5 / 13 (~38.46%)
  - `billing`: 1 / 4 (25%)
  - `courses`: 2 / 13 (~15.38%)
  - `learning`: 4 / 8 (50%)
  - `other-api`: 8 / 92 (~8.7%)
  - `reader`: 0 / 11 (0%)
  - `reports`: 0 / 5 (0%)
  - `referrals`: 0 / 3 (0%)

Impact: cannot trust flow graph as single source for release decisions.

## P0 - No `httpPath` in flow metadata

- Flow report shows `flowsWithHttpPath = 0`.
- `get_data_flows` output currently has `entryPointId/terminalId`, but no endpoint path.

Impact: endpoint-level triage by URL path is effectively blocked.

## P0 - Impact analysis under-reports in critical spots

Examples:
- `src/modules/courses/course-checkout-service.ts` => `totalFlows: 0`
  while dependencies show incoming callers.
- `src/app/api/auth/login/route.ts` => `totalFlows: 0`
  while symbol dependencies show route POST has incoming/outgoing links.
- `src/modules/platform/security-access-guard.ts` => only `3 flows`
  while local code has `46 route files / 48 calls` using this guard.

Impact: blast-radius can be falsely low on security/payment edits.

## P1 - Data flow entrypoints include non-API pages

- `42` flows start from API routes, `8` flows start from app pages.
- Non-API entrypoints include blog/course/admin pages.

Impact: quality metric "API flow coverage" gets noisy unless API-only filtering is enforced.

## P1 - Semantic Search currently ineffective

Observed:
- `semantic_search` returns `0` for multiple relevant queries (`login`, `checkout`, `security`, `weekly report`).
- `search_code` still returns symbol hits for same topics.

Impact: semantic workflows are currently not usable; must fallback to lexical + graph traversal.

## P1 - Context tool unavailable due credit state

`get_context` returns:
- `Credit balance is negative (-5)...`

Impact: RAG explanation mode is disabled until credit is topped up.

## P2 - Flow terminal bias toward utilities

Top terminal files are utility/security files:
- `src/lib/rate-limit.ts`
- `src/modules/platform/security-policy.ts`
- `src/lib/redis-connection.ts`

Impact: business-end outcome tracing (e.g. conversion, subscription state transitions) is weaker than infra/guard tracing.

## Recommended Working Mode (Now)

Hybrid only:
1. Grapuco for structure hints (`search_code`, `get_dependencies`, `get_impact_analysis`).
2. Mandatory local validation:
   - `rg` caller scan
   - `lint/type-check/test`
3. For critical files (security/rate-limit/checkout), never rely on Grapuco impact alone.

## Priority Action Plan

1. Restore AI features:
   - Top up Grapuco credits so `get_context` works.
2. Improve flow extraction quality:
   - Keep delta push after feature batches.
   - Monitor `flowsWithHttpPath`; escalate to Grapuco if still zero.
3. Tighten CI metrics (already warning-mode):
   - Keep baseline in `scripts/grapuco/flow-quality-baseline.json`.
   - Warn on flow/coverage regression.
4. Expand helper standardization on route layer:
   - Continue migrating duplicated guard/rate-limit patterns to shared helper.

## Remediation Progress

Status as of 2026-04-07:
1. Implemented:
   - API-only/noise metrics in quality gate script.
   - Semantic fallback tooling (`semantic_search` -> `search_code`).
   - Critical file impact fallback tooling.
   - Local tracked MCP client manager (`scripts/grapuco/mcp-client-manager.mjs`) replacing `.codex` runtime dependency.
   - Secret-safe runtime logging (stderr suppression + error redaction).
   - CLI guardrails for `--limit` (clamped to safe range).
   - Regression tests for flow analysis, fallback behavior, and secret redaction (`src/grapuco/*.test.ts`).
2. In progress:
   - Team-wide adoption in daily workflow and CI interpretation.
3. Pending:
   - Native `httpPath` metadata completeness from Grapuco backend.
   - Semantic/context quality recovery after credit top-up.

## Conclusion

Grapuco is already useful for graph-aware engineering, but current state is still "assist-level", not "gate-level" due:
- low coverage,
- zero `httpPath` metadata,
- under-reported impacts in critical paths,
- semantic/context limitations.

Use Grapuco + `rg` + test gates together for production-safe development.

## Unresolved questions

None.

