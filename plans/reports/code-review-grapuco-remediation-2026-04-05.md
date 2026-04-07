# Grapuco Remediation Code Review - 2026-04-05

## 1) Findings (ordered by severity)

### Critical

1. **Secret exposure in runtime logs (`X-Api-Key` printed in clear text).**
   - Running the new Grapuco scripts prints `Using custom headers: {"X-Api-Key":"..."}` to stdout/stderr (observed during `grapuco:quality-report`, `grapuco:pre-edit`, `grapuco:semantic-search-fallback`, `grapuco:critical-file-impact-fallback`).
   - This can leak credentials into local logs and CI logs.
   - File refs:
     - `scripts/grapuco/flow-quality-gate.mjs:110`
     - `scripts/grapuco/pre-edit-check.mjs:59`
     - `scripts/grapuco/semantic-search-fallback.mjs:56`
     - `scripts/grapuco/critical-file-impact-fallback.mjs:58`
     - `README.md:71`

### High

2. **Hard dependency on ignored local `.codex` path breaks portability and non-Codex stacks.**
   - All new scripts import `MCPClientManager` from `../../.codex/skills/...`, but `.codex` is gitignored.
   - Fresh clones / CI agents without this local folder will fail at import time, even if using `--stack claude` or `--stack opencode`.
   - File refs:
     - `scripts/grapuco/flow-quality-gate.mjs:7`
     - `scripts/grapuco/pre-edit-check.mjs:5`
     - `scripts/grapuco/semantic-search-fallback.mjs:5`
     - `scripts/grapuco/critical-file-impact-fallback.mjs:5`
     - `.gitignore:26`
     - `docs/grapuco-mcp-daily-workflow-checklist.md:7`

3. **No automated tests added for the remediation scripts (regression risk is high).**
   - No unit/integration coverage found for:
     - `grapuco-flow-analysis` route/httpPath derivation
     - semantic fallback decision logic
     - critical impact fallback behavior
     - quality-gate threshold evaluation
   - This allowed the above issues to ship undetected.
   - File refs:
     - `scripts/grapuco/grapuco-flow-analysis.mjs:45`
     - `scripts/grapuco/grapuco-fallbacks.mjs:110`
     - `scripts/grapuco/flow-quality-gate.mjs:147`
     - `package.json:44`

### Medium

4. **`--limit` is not validated/clamped; negative values cause unexpected large output.**
   - `Number.parseInt(args.limit || "5", 10) || 5` accepts negative values.
   - With `--limit -1`, `slice(0, -1)` behavior can emit almost all hits, not a safe bounded output.
   - File refs:
     - `scripts/grapuco/semantic-search-fallback.mjs:52`
     - `scripts/grapuco/critical-file-impact-fallback.mjs:53`
     - `scripts/grapuco/grapuco-fallbacks.mjs:101`

## 2) Residual risks / testing gaps

1. No contract tests against real Grapuco payload variants (`array` vs wrapped objects) for `get_data_flows`, `semantic_search`, `search_code`, `get_impact_analysis`.
2. No security test that verifies secrets are redacted from stdout/stderr.
3. No portability smoke test in a clean environment without `.codex` folder.
4. No CLI argument validation tests (`--limit`, missing required args, invalid stack + config combinations).

## 3) Concise recommendation

1. **Patch immediately:** redact/suppress MCP transport logs so API key never appears in output.
2. **Decouple runtime import:** move `MCPClientManager` dependency into tracked repo code (or package dependency), not `.codex` ignored path.
3. **Add fast regression tests:** at minimum for fallback routing logic, metric thresholds, and CLI argument validation; add one CI smoke test running all new `grapuco:*` scripts in a clean checkout.

## Unresolved questions

None.
