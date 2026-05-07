# Phase 1: Critical Infrastructure

## Context Links
- Scout report: lines 19–46
- `package.json`, `.env.example`, `docker-compose.yml`, `ecosystem.config.js`
- `.github/workflows/deploy.yml`, `.github/workflows/deploy-digitalocean-ssh.yml`
- `.github/workflows/release-check.yml`, `.github/workflows/nightly-local-full.yml`

## Overview
- **Priority**: P0 (Critical)
- **Status**: completed (2026-05-08)
- **Effort**: ~2h
- Files with configuration that if wrong, will **break deploy, CI/CD, or local dev entirely**.

## Requirements

### Functional
- All package/environment names updated from `cungcontuhoc` → `tinygeniushub`
- All server paths updated: `/var/www/cungcontuhoc` → `/var/www/tinygeniushub`, `/srv/cungcontuhoc` → `/srv/tinygeniushub`
- All DB names updated: `cungcontuhoc` → `tinygeniushub`
- All PM2 process names updated: `cungcontuhoc-web` → `tinygeniushub-web`, `cungcontuhoc-worker` → `tinygeniushub-worker`
- CI/CD concurrency groups, env vars, and health check commands updated
- GitHub repo URL in package.json: **skip per confirmed decision**

### Non-Functional
- `pnpm build` passes after changes
- Docker Compose validates

## Files to Modify (with exact patterns)

### 1. `package.json`
| Line | Find | Replace |
|------|------|---------|
| 2 | `"name": "cungcontuhoc"` | `"name": "tinygeniushub"` |
| 199* | `github.com/manhquydev/cungcontuhoc` | **SKIP** (per confirmed decision) |
| 207* | `github.com/manhquydev/cungcontuhoc` | **SKIP** (per confirmed decision) |
| 209* | `github.com/manhquydev/cungcontuhoc` | **SKIP** (per confirmed decision) |

*Verify actual line numbers in current file. Search for pattern.

### 2. `.env.example`
| Line | Find | Replace |
|------|------|---------|
| 1 | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cungcontuhoc?schema=public` | `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tinygeniushub?schema=public` |
| 47 | `BACKUP_POSTGRES_DATABASE=cungcontuhoc` | `BACKUP_POSTGRES_DATABASE=tinygeniushub` |
| 63 | `OBSERVABILITY_SERVICE_NAME=cungcontuhoc-web` | `OBSERVABILITY_SERVICE_NAME=tinygeniushub-web` |
| 70 | `SEED_PARENT_EMAIL=demo.parent@cungcontuhoc.vn` | `SEED_PARENT_EMAIL=demo.parent@tinygeniushubvn.tech` |

### 3. `docker-compose.yml`
| Line | Find | Replace |
|------|------|---------|
| 6 | `POSTGRES_DB: cungcontuhoc` | `POSTGRES_DB: tinygeniushub` |
| 12 | `-d cungcontuhoc` | `-d tinygeniushub` |
| 53* | `DATABASE_URL=.../cungcontuhoc?...` | `DATABASE_URL=.../tinygeniushub?...` |
| 75* | `SEED_PARENT_EMAIL: demo.parent@cungcontuhoc.vn` | `SEED_PARENT_EMAIL: demo.parent@tinygeniushubvn.tech` |
| 111* | `DATABASE_URL=.../cungcontuhoc?...` | `DATABASE_URL=.../tinygeniushub?...` |

*Line numbers approximate. Run `grep -n cungcontuhoc docker-compose.yml` for exact positions.

### 4. `ecosystem.config.js`
| Line | Find | Replace |
|------|------|---------|
| 2 | `Cùng Con Tự Học` (comment) | `TinyGenius Hub` |
| 13 | `name: 'cungcontuhoc-web'` | `name: 'tinygeniushub-web'` |
| 16,17 | `/var/www/cungcontuhoc` | `/var/www/tinygeniushub` |
| 34–36 | `cungcontuhoc-web` in log paths | `tinygeniushub-web` |
| 53 | `name: 'cungcontuhoc-worker'` | `name: 'tinygeniushub-worker'` |
| 56,57 | `/var/www/cungcontuhoc` | `/var/www/tinygeniushub` |
| 72–74 | `cungcontuhoc-worker` in log paths | `tinygeniushub-worker` |
| 92 | `host: 'cungcontuhoc.io.vn'` | `host: 'tinygeniushubvn.tech'` |
| 94 | `repo: 'https://github.com/manhquydev/cungcontuhoc.git'` | **SKIP** (per confirmed decision) |
| 95 | `path: '/var/www/cungcontuhoc'` | `path: '/var/www/tinygeniushub'` |

### 5. `.github/workflows/deploy.yml`
| Line | Find | Replace |
|------|------|---------|
| 23 | `deploy-production-cungcontuhoc` | `deploy-production-tinygeniushub` |
| 61 | `PROD_APP_DIR: /var/www/cungcontuhoc` | `PROD_APP_DIR: /var/www/tinygeniushub` |
| 62 | `PROD_PUBLIC_BASE_URL: https://cungcontuhoc.io.vn` | `PROD_PUBLIC_BASE_URL: https://tinygeniushubvn.tech` |
| 120–121* | `pm2 describe cungcontuhoc-web` / `cungcontuhoc-worker` | `pm2 describe tinygeniushub-web` / `tinygeniushub-worker` |

### 6. `.github/workflows/deploy-digitalocean-ssh.yml`
| Line | Find | Replace |
|------|------|---------|
| 17 | `deploy-production-cungcontuhoc` | `deploy-production-tinygeniushub` |
| 29 | `APP_DIR: /var/www/cungcontuhoc` | `APP_DIR: /var/www/tinygeniushub` |
| 94* | `cungcontuhoc-web` / `cungcontuhoc-worker` | `tinygeniushub-web` / `tinygeniushub-worker` |

### 7. `.github/workflows/release-check.yml`
| Line | Find | Replace |
|------|------|---------|
| 19 | `DATABASE_URL: .../cungcontuhoc?...` | `DATABASE_URL: .../tinygeniushub?...` |
| 30* | `POSTGRES_DB: cungcontuhoc` | `POSTGRES_DB: tinygeniushub` |
| 36* | `DATABASE_URL: .../cungcontuhoc?...` | `DATABASE_URL: .../tinygeniushub?...` |

### 8. `.github/workflows/nightly-local-full.yml`
| Line | Find | Replace |
|------|------|---------|
| 18 | `DATABASE_URL: .../cungcontuhoc?...` | `DATABASE_URL: .../tinygeniushub?...` |
| 48 | `demo.admin@cungcontuhoc.vn` | `demo.admin@tinygeniushubvn.tech` |

### 9. `src/lib/env.ts`
| Line | Find | Replace |
|------|------|---------|
| 101* | `OBSERVABILITY_SERVICE_NAME: "cungcontuhoc-web"` | `OBSERVABILITY_SERVICE_NAME: "tinygeniushub-web"` |
| 132* | `DATABASE_URL` fallback with `cungcontuhoc` | `tinygeniushub` |

## Implementation Steps

1. **Pre-flight**: Run `git stash` or commit current work. Create branch `rebrand-phase-01`.
2. **package.json**: Edit line 2 only (name field). Skip repo URLs per confirmed decision.
3. **.env.example**: Replace all 4 patterns above.
4. **docker-compose.yml**: Replace all 5 occurrences of `cungcontuhoc` with `tinygeniushub`.
5. **ecosystem.config.js**: Replace all PM2 names, paths, host. Skip repo URL.
6. **CI/CD workflows**: Update deploy.yml, deploy-digitalocean-ssh.yml, release-check.yml, nightly-local-full.yml with patterns above.
7. **src/lib/env.ts**: Update default values.
8. **Verify**: Run `grep -rn "cungcontuhoc" package.json .env.example docker-compose.yml ecosystem.config.js .github/ src/lib/env.ts` — should return 0 results.
9. **Validate**: Run `docker compose config --quiet` to verify YAML validity. Run `pnpm build` to verify no compile errors from env changes.

## Acceptance Criteria
- [x] `git grep cungcontuhoc` in `package.json .env.example docker-compose.yml ecosystem.config.js .github/ src/lib/env.ts` returns 0
- [x] `docker compose config` validates without errors
- [x] `pnpm build` succeeds
- [x] CI/CD workflows reference `tinygeniushub` in all names/paths/URLs

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Missed a DB reference in docker-compose | Grep `docker-compose.yml` for `cungcontuhoc` before finalizing |
| PM2 names mismatch breaks deploy script | Verify deploy script references match ecosystem.config.js exactly |
| env.ts change breaks runtime defaults | Only change default values (the `??` fallback), not env variable names |

## Next Steps
- Phase 2 (Domain URLs) and Phase 3 (Emails) can run in parallel after this.
- Phase 8 (Infrastructure Scripts) should run after this since scripts reference same PM2 names and server paths.
