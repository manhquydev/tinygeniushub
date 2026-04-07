# Grapuco Gap Remediation Plan (2026-04-05)

Status: pending (execution-ready)
Scope source: `docs/grapuco-knowledge-graph-gap-audit-2026-04-05.md`
Target repo: `D:/project/cungcontuhoc`

## Phase 1 - API-only coverage metric + endpoint mapping fallback
Status: pending

TODO
- [ ] Update `scripts/grapuco/flow-quality-gate.mjs` to split flow counts into `apiEntryFlows` vs `nonApiEntryFlows`.
- [ ] Compute and report `apiOnlyCoveragePct` (API-entry flows / API handlers) alongside existing aggregate coverage.
- [ ] Add endpoint mapping fallback when `httpPath` is missing:
  - use flow entry metadata (`entryPointId`/name/path fields when available) to infer route file;
  - match inferred route file against local `src/app/api/**/route.ts` inventory;
  - emit `mappedByFallbackCount` and `unmappedFlowCount`.
- [ ] Extend Markdown summary output with API-only section and fallback mapping section.

Success criteria
- Quality JSON includes `apiEntryFlows`, `nonApiEntryFlows`, `apiOnlyCoveragePct`, `mappedByFallbackCount`, `unmappedFlowCount`.
- Summary clearly distinguishes API-only coverage from mixed (API + page) coverage.
- No runtime break in `pnpm grapuco:quality-report`.

Verification commands
```bash
pnpm grapuco:quality-report -- --stack codex --report-file reports/grapuco/flow-quality-latest.json --summary-file reports/grapuco/flow-quality-summary.md
node -e "const r=require('./reports/grapuco/flow-quality-latest.json');console.log({apiEntryFlows:r.metrics.apiEntryFlows,nonApiEntryFlows:r.metrics.nonApiEntryFlows,apiOnlyCoveragePct:r.metrics.apiOnlyCoveragePct,mappedByFallbackCount:r.metrics.mappedByFallbackCount,unmappedFlowCount:r.metrics.unmappedFlowCount});"
```

## Phase 2 - Hybrid impact fallback checks for critical files
Status: pending

TODO
- [ ] Update `scripts/grapuco/pre-edit-check.mjs` to support critical-file fallback mode.
- [ ] Add built-in critical list (from checklist) + optional override flag (`--critical-file`).
- [ ] When target is critical and Grapuco flow count is 0/low, run local fallback checks:
  - caller scan (`rg`) for key exported symbols;
  - route usage scan under `src/app/api`.
- [ ] Print final risk line (`LOW|MEDIUM|HIGH`) based on Grapuco + local caller evidence.

Success criteria
- Critical file pre-edit output always includes both Grapuco impact and local caller counts.
- False-safe case (`totalFlows: 0` but real callers exist) is visible in one command run.
- Non-critical files keep lightweight behavior.

Verification commands
```bash
pnpm grapuco:pre-edit -- --stack codex --file src/modules/courses/course-checkout-service.ts
pnpm grapuco:pre-edit -- --stack codex --file src/modules/platform/security-access-guard.ts
rg -n "assertRequestAllowedBySecurityControls|createCourseCheckoutSession" src/app src/modules src/lib
```

## Phase 3 - Semantic search fallback strategy (tooling + checklist)
Status: pending

TODO
- [ ] Extend `scripts/grapuco/pre-edit-check.mjs` with query mode (`--query "..."`).
- [ ] Query order: `semantic_search` first; if 0/error then fallback to `search_code` + `get_dependencies` hints.
- [ ] Standardize fallback output format: semantic result count, lexical result count, next recommended command.
- [ ] Update `docs/grapuco-mcp-daily-workflow-checklist.md` to make fallback sequence mandatory.

Success criteria
- Query mode never returns empty guidance: if semantic misses, lexical fallback always returns actionable hits.
- Checklist reflects exact fallback sequence used by tool.

Verification commands
```bash
pnpm grapuco:pre-edit -- --stack codex --query "login"
pnpm grapuco:pre-edit -- --stack codex --query "weekly report"
pnpm grapuco:pre-edit -- --stack codex --query "security policy"
```

## Phase 4 - CI warning outputs + baseline hygiene
Status: pending

TODO
- [ ] Update `scripts/grapuco/flow-quality-gate.mjs` to emit explicit warning categories:
  - coverage regression
  - flow-count regression
  - `httpPath` completeness regression
  - fallback-mapping degradation.
- [ ] Add baseline hygiene checks:
  - baseline timestamp age warning;
  - warning when baseline file fields are missing/outdated.
- [ ] Update `.github/workflows/release-check.yml` summary block to print categorized Grapuco warnings and baseline age.
- [ ] Keep warning-only behavior (no CI fail) until API-only coverage and mapping stabilize.

Success criteria
- CI step summary shows categorized warnings, not generic text only.
- Baseline staleness is visible in local and CI summaries.
- Artifact still includes `reports/grapuco/flow-quality-latest.json` + summary markdown.

Verification commands
```bash
pnpm grapuco:quality-report -- --stack codex --baseline-file scripts/grapuco/flow-quality-baseline.json --report-file reports/grapuco/flow-quality-latest.json --summary-file reports/grapuco/flow-quality-summary.md
pnpm lint && pnpm type-check
```

## Phase 5 - Team workflow docs alignment
Status: pending

TODO
- [ ] Update `docs/grapuco-mcp-daily-workflow-checklist.md` with:
  - API-only metric interpretation;
  - critical-file hybrid pre-edit requirement;
  - semantic fallback sequence;
  - baseline hygiene cadence.
- [ ] Update `docs/grapuco-knowledge-graph-gap-audit-2026-04-05.md` with remediation tracking section (phase status + owner + date).
- [ ] Update Grapuco section in `README.md` with revised daily/PR checklist commands.

Success criteria
- Team has one unambiguous, executable Grapuco workflow from README -> checklist -> scripts.
- No mismatch between docs and actual CLI flags/output.

Verification commands
```bash
rg -n "api-only|hybrid|semantic_search|baseline|critical" docs/grapuco-mcp-daily-workflow-checklist.md docs/grapuco-knowledge-graph-gap-audit-2026-04-05.md README.md
pnpm grapuco:pre-edit -- --help
pnpm grapuco:quality-report -- --help
```

## Execution order
1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5

## Done definition
- All phase success criteria met.
- Verification commands run cleanly in local dev environment.
- CI release-check summary includes Grapuco warnings + baseline hygiene info.
- Docs reflect final workflow exactly.

## Unresolved questions
None.
