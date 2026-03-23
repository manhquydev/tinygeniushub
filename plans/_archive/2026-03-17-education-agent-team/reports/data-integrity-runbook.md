# Data Integrity Runbook for Course Split

## Mục đích
Đảm bảo tách nhỏ học liệu không bị:
- thiếu dữ liệu (gap),
- dư/trùng dữ liệu (overlap),
- tràn phạm vi (out-of-range),
- mismatch số lượng theo thiết kế.

## Lệnh chuẩn
```bash
pnpm education:checks
```

Lệnh trên chạy tuần tự:
1. `education:baseline`
2. `education:verify-split`
3. `education:manifest`

Import + verify DB:
```bash
pnpm education:import-pilot
pnpm education:verify-db-pilot
```

Hoặc chạy toàn bộ pipeline một lệnh:
```bash
pnpm education:pipeline
```

## Artifacts cần kiểm tra
- `reports/course-baseline-metrics.json`
- `reports/split-integrity-full.json`
- `reports/split-integrity-pilot.json`
- `reports/split-integrity-summary.md`
- `reports/pilot-sku-manifest.json`
- `reports/pilot-import-result.json`
- `reports/pilot-db-integrity.json`

## Tiêu chí PASS
1. `split-integrity-full.json`:
- `summary.allPassed = true`
2. `split-integrity-pilot.json`:
- `summary.allPassed = true`
3. Không có `failedScopeIds` ở cả full/pilot.
4. (Sau import) `pilot-db-integrity.json` có `summary.allPassed = true`.

## Tiêu chí FAIL
- Có bất kỳ scope nào fail trong full hoặc pilot.
- Có overlap/out-of-range/invalid range.

## Quy trình khi FAIL
1. Dừng duyệt release split.
2. Sửa lại rule chia range ở script hoặc manifest.
3. Chạy lại `pnpm education:checks`.
4. Chỉ mở lại board duyệt khi PASS.

## Quy trình board duyệt
- Gate G0 (Data integrity) phải PASS trước.
- Sau đó mới chấm G1..G4 theo scorecard.
