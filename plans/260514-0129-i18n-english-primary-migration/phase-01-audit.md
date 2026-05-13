# Phase 01 - Audit

## Context Links
- Prompt: `prompt/prompt.md`
- README: `README.md`
- Repo instructions: `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`

## Overview
- Priority: high
- Status: complete
- Inventory Vietnamese text across runtime source/code artifacts before migration.

## Key Insights
- Filesystem MCP cannot access this repo; fallback is code-index MCP plus `rg`.
- Initial source scan found hundreds of files with Vietnamese diacritics.
- Existing `check:i18n` script only detects suspicious unaccented Vietnamese in `src/**/*.ts(x)` and is not sufficient for this prompt.

## Requirements
- Scan frontend components, backend responses, emails, validation, constants, config, seed data, and tests.
- Produce a reproducible inventory artifact.
- Commit audit artifact with `chore(i18n): audit Vietnamese text inventory`.

## Related Code Files
- Create: `scripts/i18n/audit-vietnamese-text.mjs`
- Create: `docs/i18n-vietnamese-text-inventory.md`

## Implementation Steps
1. Add scanner for text/code files, excluding build artifacts and binaries.
2. Extract file, line number, and Vietnamese-containing line.
3. Group findings by source area and extension.
4. Write Markdown inventory with summary and evidence.
5. Commit only audit-related files.

## Todo List
- [x] Add audit script.
- [x] Run audit script.
- [x] Review summary counts.
- [x] Commit audit.

## Success Criteria
- Inventory exists and records scope, exclusions, counts, and findings.
- Commit created with required message.

## Risk Assessment
- Large source volume can make manual inventory noisy; use generated reproducible report.

## Security Considerations
- Do not read or commit `.env` secrets.
- Exclude binary and generated artifacts.

## Next Steps
- Initialize i18n framework after audit commit.

## Unresolved Questions
- None.
