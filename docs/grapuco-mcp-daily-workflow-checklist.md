# Grapuco MCP Daily Workflow Checklist

Last updated: 2026-04-07

## Goal

Standard pre-edit workflow for team using Codex, Claude Code, OpenCode to reduce risky edits and speed up vibe coding.

## Prerequisites (one-time per machine)

1. Ensure MCP config exists:
   - `.codex/.mcp.json`
   - `.claude/.mcp.json`
   - `.opencode/.mcp.json`
2. Login and index repo:
```bash
pnpm grapuco:login
pnpm grapuco:init
pnpm grapuco:ingest
```
3. Verify:
```bash
pnpm grapuco:status
```

## Daily start checklist

1. Pull latest code and dependencies.
2. Refresh Grapuco index delta:
```bash
pnpm grapuco:push
```
3. Confirm remote index status is `COMPLETED`:
```bash
pnpm grapuco:status
```

## Mandatory pre-edit checklist (before touching any target file)

1. Identify target file(s).
2. Run pre-edit impact check:
```bash
pnpm grapuco:pre-edit -- --stack codex --file src/modules/courses/course-service.ts
```
3. If editing API behavior, also inspect flows:
```bash
pnpm grapuco:pre-edit -- --stack codex --http-path /api/courses/[slug]
```
4. Record blast radius in plan/report:
   - affected flows
   - affected files
   - risk note (low/medium/high)
5. Only then start editing.

## Critical files: mandatory hybrid verification

For these critical files, Grapuco result is not enough by itself:
- `src/modules/courses/course-checkout-service.ts`
- `src/lib/rate-limit.ts`
- `src/modules/platform/security-policy-service.ts`
- `src/modules/platform/security-access-guard.ts`

Required sequence:
1. Run Grapuco pre-edit:
```bash
pnpm grapuco:pre-edit -- --stack codex --file <critical-file>
```
2. Run fallback impact checker (mandatory):
```bash
pnpm grapuco:critical-file-impact-fallback -- --stack codex --file <critical-file>
```
3. Run manual caller grep (must do):
```bash
rg -n "<targetSymbolName>" src/app src/modules src/lib
```
4. Run local test gates before merge:
```bash
pnpm lint && pnpm type-check && pnpm test
```

Rule:
- Grapuco = architecture assist
- `rg` + tests = runtime/source-of-truth for shipping decision

## Tool selection map (what to call first)

1. Find symbol by exact name:
   - `search_code`
2. Understand dependencies of a symbol:
   - `get_dependencies`
3. Understand system-wide architecture:
   - `get_architecture`
4. Check blast radius before refactor:
   - `get_impact_analysis` (mandatory)
5. Trace request path API -> service -> db:
   - `get_data_flows`
6. Exploratory context when unfamiliar domain:
   - `get_context`

## Agent stack quick usage

### Codex

1. Use `.codex/.mcp.json`.
2. Run:
```bash
pnpm grapuco:pre-edit -- --stack codex --file <target-file>
```

### Claude Code

1. Use `.claude/.mcp.json`.
2. Run:
```bash
pnpm grapuco:pre-edit -- --stack claude --file <target-file>
```

### OpenCode

1. Use `.opencode/.mcp.json`.
2. Run:
```bash
pnpm grapuco:pre-edit -- --stack opencode --file <target-file>
```

## During implementation

1. After each meaningful code batch:
```bash
pnpm grapuco:push
```
2. If changing API/controller logic, rerun impact check on touched core file.
3. If adding new endpoint, run `get_data_flows` check for that endpoint path.

## Before PR / merge checklist

1. Final index sync:
```bash
pnpm grapuco:push
```
2. Re-run impact checks for high-risk touched files.
3. Attach summary to PR:
   - what changed
   - impacted flows/files from Grapuco
   - verification commands run
4. Run flow quality report against baseline:
```bash
pnpm grapuco:quality-report
```

## Practical notes

1. Use Grapuco for graph-level reasoning, not as replacement for local tests.
2. Keep local `rg` + tests + lint as truth for compile/runtime health.
3. If semantic search is empty, use fallback command:
```bash
pnpm grapuco:semantic-search-fallback -- --stack codex --query "checkout flow"
```
4. If `httpPath` is missing in native flow metadata, use derived path metrics from `grapuco:quality-report`.
5. Grapuco scripts now suppress MCP child stderr + redact secrets in error output by default.
6. `--limit` inputs are clamped to safe bounds (`1..20`) to prevent accidental large output.

## Coverage gate decisions (2026-04-05)

1. Hard quality gate target (future): `>=25%` flow coverage over API handlers.
2. Current CI mode: warning only, compare against baseline (`scripts/grapuco/flow-quality-baseline.json`).
3. CI warns when:
   - flow count decreases vs baseline
   - coverage decreases vs baseline
   - API-only coverage drops under warning floor
   - non-API flow noise exceeds configured threshold

## Unresolved questions

None.
