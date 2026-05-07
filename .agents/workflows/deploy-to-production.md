---
description: Production deploy workflow with tracked execution and no-manual-SSH default
---

# Deploy to Production Workflow

Mục tiêu: deploy an toàn, theo dõi được toàn bộ tiến trình, giảm thao tác tay, giảm rủi ro production drift.

## 1. Deployment model (recommended)

### Primary: GitHub Actions + Self-hosted Runner (no manual SSH)

- Workflow: `.github/workflows/deploy.yml`
- Trigger:
  - Auto: sau khi `Release Check` pass trên `main`
  - Manual: `workflow_dispatch` (cho hotfix/ref cụ thể)
- Runtime:
  - Runner chạy trực tiếp trên production host
  - Deploy trong `APP_DIR` bằng `scripts/deploy/remote-deploy.sh`
- Theo dõi:
  - Build/deploy logs xuất artifact
  - PM2 snapshot xuất artifact
  - Health checks nội bộ + external probes
  - Summary hiển thị ngay trong GitHub Actions run

=> Team không cần SSH tay để deploy thường ngày.

### Fallback: GitHub Actions SSH deploy

- Workflow: `.github/workflows/deploy-digitalocean-ssh.yml`
- Chỉ dùng khi self-hosted runner unavailable.

## 2. Required production config

- GitHub Environment: `production` (nên bật required reviewers)
- Repo Variables (khuyến nghị):
  - `PROD_APP_DIR` (default `/var/www/cungcontuhoc`)
  - `PROD_PUBLIC_BASE_URL` (default `https://cungcontuhoc.io.vn`)
- Server prerequisites:
  - `node` >= 22, `pnpm`, `pm2`, `pg_dump`, `pg_restore`, repo code tại `PROD_APP_DIR`
  - PM2 process names:
    - `cungcontuhoc-web`
    - `cungcontuhoc-worker`
  - env production file: `.env.production`
  - optional backup retention env:
    - `DEPLOY_PRE_MIGRATE_BACKUP_DIR` (default `backups/pre-migrate`)
    - `DEPLOY_PRE_MIGRATE_BACKUP_KEEP_DAYS` (default `14`)
    - `DEPLOY_PRE_MIGRATE_BACKUP_KEEP_COUNT` (default `20`)

### One-time self-hosted runner setup (on production server)

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
# download runner package from GitHub Actions UI
./config.sh --url https://github.com/manhquydev/cungcontuhoc --token <RUNNER_TOKEN> --labels production
./svc.sh install
./svc.sh start
```

Required labels for workflow matching:
- `self-hosted`
- `linux`
- `x64`
- `production`

## 3. Standard deploy flow (no manual SSH)

1. Merge PR vào `main` (Release Check must pass).
2. Workflow `Deploy to Production (No SSH Manual)` chạy tự động.
3. Pipeline thực thi tuần tự:
   - Resolve ref + preflight
   - `remote-deploy.sh`:
     - fetch + checkout exact commit
     - `pnpm install --frozen-lockfile`
     - `pnpm db:generate`
     - mandatory pre-migrate PostgreSQL backup (`pg_dump`) + dump readability check (`pg_restore --list`)
     - backup file permission locked (`0700` dir, `0600` dump)
     - backup retention prune by age/count
     - `pnpm prisma migrate deploy` (retry)
     - `pnpm build`
     - restart `cungcontuhoc-web` + `cungcontuhoc-worker`
     - generate `.deploy/latest.json` + `.deploy/rollback-policy.md`
   - Post deploy gates:
     - `pm2 describe` 2 process
     - `/api/health`, `/api/health/ready`
     - `pnpm prisma migrate status`
     - external probes
4. Download artifacts nếu cần audit:
   - deploy log
   - pm2 status snapshot

## 4. Hotfix deploy flow

Manual trigger workflow `deploy.yml`:
- input `ref`: commit SHA / tag / branch cần deploy
- input `health_probe_count`: số lần external check

Use case: deploy patch nhanh mà vẫn giữ full log + health gates.

## 5. Rollback strategy

### Application rollback (nhanh, không restore DB)
1. Chọn run manual của `deploy.yml`
2. Set `ref` = commit SHA stable trước đó
3. Trigger deploy lại
4. Verify health + PM2 snapshot trong workflow artifacts

### Full rollback (DB + app, bắt buộc maintenance window)
1. Lấy backup path từ `.deploy/latest.json` (`preMigrateBackupFile`)
2. Chuẩn bị `DB_RESTORE_URL` đã sanitize (xóa Prisma-only params: `schema`, `connection_limit`, `pool_timeout`, `pgbouncer`, `statement_cache_size`)
3. Restore DB bằng:
   - `pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$DB_RESTORE_URL" "<backup-file>"`
4. Rollback app về SHA cũ (manual dispatch `ref=<last-known-good-sha>`)
5. Verify `/api/health` + `/api/health/ready`
6. Lưu incident notes + root-cause sau khi ổn định

## 6. Operational quality gates (must keep)

- Không deploy nếu `Release Check` fail.
- Không skip migration trong production deploy.
- Không dùng wildcard PM2 commands (`restart all`, `reload all`).
- Không dùng `prisma migrate dev` trên production.
- Không deploy tay bằng one-liner SSH nếu không có incident đặc biệt.

## 7. Why this creates real value

- Giảm MTTR: deploy/rollback bằng workflow + input ref.
- Auditability: có artifact logs + summary mỗi lần deploy.
- Deterministic: checkout exact commit thay vì pull mơ hồ.
- Safer operations: health gates bắt lỗi sớm trước khi coi deploy là thành công.

## 8. Incident path

Khi production incident:
1. Tạm dừng auto deploy (disable workflow hoặc lock environment).
2. Trigger rollback bằng `deploy.yml` với last-known-good SHA.
3. Thu thập artifact từ run failed để RCA.
4. Sau fix, redeploy qua cùng workflow để giữ audit trail.

## 9. Resolved decisions

- Runner root -> deploy user riêng:
  - **Decision:** Có, nhưng làm theo phased migration (chạy song song + cutover có kiểm soát), không đổi đột ngột.
  - **Reason:** Giảm blast radius mà vẫn giữ khả năng rollback vận hành.
- Backup bắt buộc trước `prisma migrate deploy` + rollback policy:
  - **Decision:** Có, đã triển khai trong `scripts/deploy/remote-deploy.sh`.
  - **Result:** Deploy fail-closed nếu backup không tạo/verify được; có rollback policy artifact theo từng lần deploy.
- Pin action/toolchain còn warning Node20:
  - **Decision:** Có, pin SHA cho actions chính và nâng runtime CI lên Node 22.
