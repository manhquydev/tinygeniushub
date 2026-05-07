# YC2 Course Split Handoff (Single Folder)

Muc tieu: 1 thu muc duy nhat de ban giao cho du an `D:\project\cungcontuhoc`, gom DB da chia, report xac minh, script tai tao, va huong dan import.

## Folder map

- `databases/`: DB da chia + schema/init/seed + SQL dump
- `reports/`: report ket qua 2 pipeline
- `scripts/`: script can thiet de tai tao/chay lai
- `api/`: service/router lien quan course/topic
- `01-requirements-and-alignment.md`: doi chieu yeu cau ban dau vs hien tai
- `02-transfer-guide-to-cungcontuhoc.md`: cac buoc copy/import
- `03-current-metrics.json`: so lieu kiem chung moi nhat
- `MANIFEST-SHA256.txt`: checksum de doi chieu khi copy

## Quick checks (hien tai)

- 4 sources dung: `abeka`, `littlefox`, `playtt`, `playgg`
- `phim` bi loai hoan toan: `phim_items = 0`
- 2 pipelines:
  - `topic-mixed`: 15 khoa hoc
  - `source-native`: 46 khoa hoc
- Tong course items: 36,244

Chi tiet xem `03-current-metrics.json` va `reports/`.

## Run lai nhanh

```powershell
py -3 scripts\run-dual-course-pipelines.py --source-native-strict
```

Unresolved questions:
- none
