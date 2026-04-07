# WS4: Production Verification and Observability

## Owner
- DevOps + QA

## Scope
- Tăng độ an toàn deploy, phát hiện drift sớm, xử lý worker instability.

## Tasks
1. Thiết lập pre/post deploy gate scripts:
   - UI smoke
   - package parity
   - allocation SQL checks
   - health checks
2. Ổn định worker:
   - xác minh đầy đủ env secrets
   - giảm restart storm
3. Lưu evidence vào `plans/reports/`:
   - before/after snapshots
   - API samples
   - DB count tables
4. Thiết lập theo dõi 24h:
   - 5xx
   - PM2 restarts
   - critical API errors

## Deliverables
- Deploy checklist mới có gates cứng.
- Worker stable report.
- Production verification report.

## Success Criteria
- Không còn restart storm.
- Có đủ bằng chứng rollout pass gates.
