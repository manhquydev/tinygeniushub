# Grapuco Reliability Hardening - Gap Remediation Proposal (2026-04-05)

## Scope

Target gaps:
1. Low flow coverage
2. Missing `httpPath` in flows
3. Under-reported `get_impact_analysis` for critical files
4. Non-API page entrypoint noise in flow set
5. `semantic_search` returns zero while `search_code` works

Context refs:
- `docs/grapuco-knowledge-graph-gap-audit-2026-04-05.md`
- `docs/grapuco-mcp-daily-workflow-checklist.md`
- `scripts/grapuco/pre-edit-check.mjs`
- `scripts/grapuco/flow-quality-gate.mjs`
- `.github/workflows/release-check.yml`

## Priority Plan

## P0 (implement first, same sprint)

### P0.1 API-only coverage + non-API noise isolation

Why: Current coverage metric uses all flows, includes page entrypoints, and hides API signal quality.

File-level changes:
- `scripts/grapuco/flow-quality-gate.mjs`
  - Add flow classifier:
    - `isApiEntrypoint(flow)` based on `entryPointId`/`entryPointFile` path prefix `src/app/api/`.
    - `isNonApiEntrypoint(flow)` for `src/app/*` not under `api`.
  - Compute new metrics:
    - `apiEntryFlowCount`
    - `nonApiEntryFlowCount`
    - `apiCoveragePct = apiEntryFlowCount / apiHandlers`
    - `nonApiNoisePct = nonApiEntryFlowCount / flowCount`
  - Keep legacy `flowCount` for continuity, but use `apiCoveragePct` as main quality signal.
  - Add warnings:
    - `apiCoveragePct < minApiCoveragePct`
    - `nonApiNoisePct > maxNonApiNoisePct`
  - Persist metrics in JSON report and summary markdown.
- `scripts/grapuco/flow-quality-baseline.json`
  - Extend schema with:
    - `apiEntryFlowCount`
    - `nonApiEntryFlowCount`
    - `apiCoveragePct`
    - thresholds: `minApiCoveragePct`, `maxNonApiNoisePct`
- `.github/workflows/release-check.yml`
  - Keep warning mode, but publish new API-only metrics in step summary.

Validation:
- Run:
  - `pnpm grapuco:push`
  - `pnpm grapuco:quality-report -- --stack codex`
- Pass criteria:
  - Report includes `apiEntryFlowCount`, `nonApiEntryFlowCount`, `apiCoveragePct`, `nonApiNoisePct`.
  - Warning triggers on intentionally lowered threshold test.

---

### P0.2 `httpPath` missing: add derived fallback + explicit completeness metric

Why: `httpPath=0` blocks endpoint-level triage.

File-level changes:
- `scripts/grapuco/flow-quality-gate.mjs`
  - Add `deriveHttpPathFromEntrypoint(flow)`:
    - Parse route file path patterns like `src/app/api/**/route.ts` into `/api/**`.
    - Keep dynamic segments (`[slug]`) as-is.
  - Add metrics:
    - `flowsWithNativeHttpPath`
    - `flowsWithDerivedHttpPath`
    - `httpPathCompletenessPct` using native+derived.
  - Add warnings:
    - `flowsWithNativeHttpPath === 0` (hard warning)
    - `httpPathCompletenessPct < minHttpPathCompletenessPct`.
- `scripts/grapuco/flow-quality-baseline.json`
  - Add thresholds:
    - `minHttpPathCompletenessPct` (initial pragmatic target: 70 via derived path; native can stay tracked separately).
- `docs/grapuco-mcp-daily-workflow-checklist.md`
  - Update flow-check step: if native `httpPath` is absent, use derived path output from quality report/pre-edit output.

Validation:
- Run `pnpm grapuco:quality-report` and inspect JSON:
  - `flowsWithNativeHttpPath` expected low/0 (current known state).
  - `flowsWithDerivedHttpPath` should be materially > 0.
  - `httpPathCompletenessPct` stable across runs.

---

### P0.3 Impact under-report hardening for critical files (hybrid blast radius)

Why: `get_impact_analysis` currently returns false-low (`0`) in known critical files.

File-level changes:
- `scripts/grapuco/pre-edit-check.mjs`
  - Add critical file map (current list from checklist).
  - Add fallback verification mode for `--file`:
    - If `impact.totalFlows === 0` OR file is in critical map:
      - Run local `rg` call graph proxy (`rg -n "<exportedFunctionOrKeySymbol>" src/app src/modules src/lib`).
      - Output:
        - `grapucoAffectedFiles`
        - `rgCallerHits`
        - `impactConfidence = low|medium|high`
      - If mismatch high (e.g., `totalFlows=0` and `rgCallerHits>0`), force `HIGH RISK` note + non-zero exit with `--strict`.
  - Add `--strict` option for CI/pre-merge usage.
- `docs/grapuco-mcp-daily-workflow-checklist.md`
  - Replace “critical files manual grep” with script-enforced hybrid check command:
    - `pnpm grapuco:pre-edit -- --stack codex --file <critical-file> --strict`

Validation:
- Test with known weak file:
  - `pnpm grapuco:pre-edit -- --stack codex --file src/modules/courses/course-checkout-service.ts --strict`
- Pass criteria:
  - Output shows explicit confidence and fallback grep hit count.
  - Strict mode fails when Grapuco says 0 but grep finds callers.

## P1 (next sprint)

### P1.1 Semantic search reliability fallback pipeline

Why: `semantic_search`=0 makes natural-language lookup unusable.

File-level changes:
- `scripts/grapuco/pre-edit-check.mjs`
  - Add `--query "..."` mode:
    1. Call `semantic_search`
    2. If zero results, tokenize query (stopword-trimmed), call `search_code` per token, merge/rank by filename + symbol frequency.
    3. Optional dependency expansion for top K hits (`get_dependencies`) to recover context.
  - Print source of truth label:
    - `semantic` or `lexical-fallback`.
- `package.json`
  - Keep `grapuco:pre-edit`; optionally add helper alias:
    - `grapuco:query`: `node scripts/grapuco/pre-edit-check.mjs --query`
- `docs/grapuco-mcp-daily-workflow-checklist.md`
  - Add query fallback rule with explicit command examples.

Validation:
- Run known failing terms: `login`, `checkout`, `security`, `weekly report`.
- Pass criteria:
  - If semantic returns 0, fallback still returns non-empty hit set for at least 3/4 terms.

---

### P1.2 Flow extraction quality escalation packet (vendor-facing)

Why: Low native `httpPath` + under-reported impacts likely upstream extraction issues.

File-level changes:
- `reports/grapuco/flow-quality-latest.json` (already generated artifact)
  - Ensure includes new diagnostic fields from P0 for reproducible escalation.
- `docs/grapuco-knowledge-graph-gap-audit-2026-04-05.md`
  - Add “Escalation payload” appendix with:
    - repository id/status
    - sample false-negative files
    - sample `entryPointId` without `httpPath`
    - API/non-API split metrics

Validation:
- Build one export from latest run and confirm it is enough for Grapuco support issue.

## P2 (stabilization)

### P2.1 CI guard tightening strategy (progressive)

Why: Need reliability without blocking team on current Grapuco limitations.

File-level changes:
- `.github/workflows/release-check.yml`
  - Stage policy:
    - Phase A: warning-only (current) using new P0 metrics.
    - Phase B: fail-on-warning only for regressions (`apiCoveragePct` drop, `nonApiNoisePct` spike), still not failing on low native `httpPath`.
- `scripts/grapuco/flow-quality-baseline.json`
  - Keep explicit target bands and promotion criteria dates.
- `docs/grapuco-mcp-daily-workflow-checklist.md`
  - Add “gate promotion criteria” section.

Validation:
- Open a PR with synthetic threshold branch to verify warnings/fail transitions behave as intended.

---

### P2.2 Optional route inventory cross-check for true API denominator

Why: Handler regex may over/under count; denominator drift affects coverage signal.

File-level changes:
- `scripts/grapuco/flow-quality-gate.mjs`
  - Track both:
    - `apiRouteFilesCount`
    - `apiHandlersCount`
  - Include mismatch warning if large divergence from historical baseline.

Validation:
- Compare with local route inventory (`rg --files src/app/api/**/route.ts`).

## Suggested execution order

1. `flow-quality-gate.mjs` + baseline schema (P0.1, P0.2)
2. `pre-edit-check.mjs` strict hybrid impact (P0.3)
3. Checklist/workflow docs updates
4. Semantic fallback mode (P1.1)
5. CI promotion policy + stabilization (P2)

## Risks / Tradeoffs

1. Derived `httpPath` can be wrong for rewrites/middleware/custom routing; treat as fallback, not canonical truth.
2. `rg`-based impact fallback increases false positives (string matches, shared util names); improves recall but reduces precision.
3. API-only filtering improves endpoint governance but can hide useful page->server action flows if entirely excluded; keep both metrics.
4. More checks increase script runtime and CI noise; mitigate with strict mode only on critical files and pre-merge steps.
5. Vendor dependency remains: native flow completeness/semantic behavior still needs Grapuco-side fixes.

## Minimal acceptance criteria for this hardening track

1. Quality report exposes API-only coverage, non-API noise, and native-vs-derived `httpPath` completeness.
2. Pre-edit check can fail strict mode when Grapuco impact is false-low on critical files.
3. Query workflow always returns practical results via semantic or lexical fallback.
4. Daily checklist and release workflow reflect new hybrid reliability protocol.

## Unresolved questions

1. Should strict hybrid pre-edit fail only for listed critical files, or all files with `impact.totalFlows=0` + caller hits?
2. Is CI allowed to use `rg` fallback logic in gated jobs, or only local developer workflow?
3. What target date should switch Phase B from warning-only to fail-on-regression?
