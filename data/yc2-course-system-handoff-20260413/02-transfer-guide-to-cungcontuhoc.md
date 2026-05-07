# Transfer Guide to D:\project\cungcontuhoc

Muc tieu: copy 1 folder handoff vao du an dich, sau do map duong dan DB va goi API/script theo nhu cau.

## 1) Copy folder handoff

Nguon:
`C:\Users\manhquy\.gemini\antigravity\scratch\abeka_tools\handoff\yc2-course-system-handoff-20260413`

Dich de xuat:
`D:\project\cungcontuhoc\data\yc2-course-system-handoff-20260413`

PowerShell:

```powershell
$src = 'C:\Users\manhquy\.gemini\antigravity\scratch\abeka_tools\handoff\yc2-course-system-handoff-20260413'
$dst = 'D:\project\cungcontuhoc\data\yc2-course-system-handoff-20260413'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item -Recurse -Force "$src\*" $dst
```

## 2) Verify checksum sau copy

Tai dich:

```powershell
Get-FileHash -Algorithm SHA256 "$dst\databases\topic-courses-yc2.db"
Get-FileHash -Algorithm SHA256 "$dst\databases\unified_content.db"
```

So sanh voi `MANIFEST-SHA256.txt`.

## 3) Su dung database

Lua chon A (dung file DB truc tiep):
- Dat env `YC2_DATABASE_PATH` tro toi:
`D:\project\cungcontuhoc\data\yc2-course-system-handoff-20260413\databases\topic-courses-yc2.db`

Lua chon B (import tu SQL dump):
- Dung `databases/topic-courses-yc2.sql` de restore vao SQLite moi.

## 4) Chay lai pipeline khi can

Trong thu muc handoff:

```powershell
py -3 scripts\run-dual-course-pipelines.py --source-native-strict
```

## 5) File can uu tien cho team du an

- DB runtime: `databases/topic-courses-yc2.db`
- Bao cao chat luong: `03-current-metrics.json` + `reports/*.md`
- Logic chia: `scripts/source_native_rules.py`, `scripts/generate-source-native-courses.py`, `scripts/generate-courses.py`

Unresolved questions:
- Neu ben dich can mapping schema khac SQLite (Postgres/MySQL), can them buoc migration script rieng.
