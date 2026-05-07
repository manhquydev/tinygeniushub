# Phase 10: Documentation

## Context Links
- Scout report: lines 290–316
- ~100+ files in `docs/` directory
- **Skip**: `plans/_archive/` and `plans/reports/`

## Overview
- **Priority**: P3 (Low)
- **Status**: completed (2026-05-08)
- **Effort**: ~3h
- Update documentation files with new project name, domain, and branding.
- Documentation is non-functional — missing a doc ref won't break the app.

## Scope

### IN SCOPE — Update these:
- `docs/` — All `.md` files
- `docs/*.md` — Top-level docs
- `docs/deployment/` — Deployment guides
- `docs/business/` — Business docs (monetization, strategy)
- `docs/marketing/` — Marketing docs
- `docs/handover/` — Handover docs
- `docs/review/` — Review docs
- `docs/research/` — Research docs
- `docs/design/` — Design docs

### OUT OF SCOPE — Skip these:
- `plans/_archive/` — Historical plans (filenames already have `cungcontuhoc`)
- `plans/reports/` — Historical reports
- `.claude/` and `.opencode/` skill docs (these are generic templates, not project-specific)
- `node_modules/` — Obviously

## Replace Patterns

| Find Pattern | Replace With | Context |
|-------------|-------------|---------|
| `Cùng Con Tự Học` | `TinyGenius Hub` | Brand name |
| `cungcontuhoc` (in text) | `tinygeniushub` | Project name (NOT in code blocks or URLs that are intentionally shown as old) |
| `cungcontuhoc.io.vn` | `tinygeniushubvn.tech` | Domain references |
| `cungcontuhoc-web` | `tinygeniushub-web` | PM2 process name references |
| `cungcontuhoc-worker` | `tinygeniushub-worker` | PM2 process name references |
| `cungcontuhoc.vn` | `tinygeniushubvn.tech` | Email domain references |
| `@cungcontuhoc` | `@tinygeniushub` | Social media handle references |

## Implementation Strategy

### Step 1: Bulk replacements
```bash
cd docs/

# Brand name
find . -name "*.md" -exec sed -i 's/Cùng Con Tự Học/TinyGenius Hub/g' {} +

# Domain (use regex-friendly approach)
find . -name "*.md" -exec sed -i 's|cungcontuhoc\.io\.vn|tinygeniushubvn\.tech|g' {} +

# Email domain
find . -name "*.md" -exec sed -i 's|@cungcontuhoc\.vn|@tinygeniushubvn\.tech|g' {} +
find . -name "*.md" -exec sed -i 's|cungcontuhoc\.vn|tinygeniushubvn\.tech|g' {} +

# PM2 process names
find . -name "*.md" -exec sed -i 's|cungcontuhoc-web|tinygeniushub-web|g' {} +
find . -name "*.md" -exec sed -i 's|cungcontuhoc-worker|tinygeniushub-worker|g' {} +

# General project name (careful: don't replace in git URLs if those aren't being renamed)
# Use word boundaries where possible
find . -name "*.md" -exec sed -i 's|cungcontuhoc|tinygeniushub|g' {} +
```

### Step 2: Manual review of key docs
Priority files to review carefully:
1. `docs/README.md` — Project title
2. `docs/project-roadmap.md` — Domain reference
3. `docs/project-changelog.md` — PM2 process name references
4. `docs/DEPLOYMENT-CHECKLIST.md` — Footer "Generated for Cung Con Tu Hoc"
5. `docs/SERVER-DEPLOYMENT-PLAN.md` — Title reference
6. `docs/deployment/VPS-DEPLOYMENT-GUIDE.md` — Echo line
7. `docs/interactive-lesson-production-workflow.md` — Server path, pm2 names
8. `docs/implementation-plan.md` — Plan file references

### Step 3: Verify
```bash
# Should return 0 results
rg "Cùng Con Tự Học" docs/
rg "cungcontuhoc\.io\.vn" docs/
rg "cungcontuhoc\.vn" docs/
```

### Step 4: Git diff review
```bash
git diff docs/
```
Scan for any unintended replacements (e.g., changing `cungcontuhoc` in a URL that was intentionally showing the old code).

## Acceptance Criteria
- [x] `rg "Cùng Con Tự Học" docs/` returns 0
- [x] `rg "cungcontuhoc\.io\.vn" docs/` returns 0
- [x] `rg "@cungcontuhoc" docs/` returns 0
- [x] Key docs (README, roadmap, changelog, deployment) reviewed manually
- [x] No broken relative links in docs (run `rg "\[.*\]\(.*cungcontuhoc.*\)" docs/` to check)

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Bulk replace changes code block examples that intentionally show old name | Add `sed` guard or manually revert code blocks after bulk replace |
| Historical docs lose context about when brand changed | Add a note in README about the rebrand date (2026-05) |
| `plans/_archive/` accidentally modified | Explicitly skip. Use `find docs/` not `find .` in working directory. |
