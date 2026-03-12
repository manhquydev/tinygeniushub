# Bao cao tong hop nguon API video - hoctienganh.xyz

## 1) Snapshot bao cao
- Thoi diem tong hop: 2026-03-10 (UTC)
- Unified summary: `unified_content_summary.json` (generated_at_utc: `2026-03-10T15:37:52.893284+00:00`)
- Tong so nguon: `6`
- Tong so collection: `2,659`
- Tong so video: `36,360`

## 2) Danh sach nguon da tong hop

| Source key | Resource root | Collection | Video | Health |
|---|---:|---:|---:|---|
| `abeka` | `/abeka` | 2380 | 20195 | `unknown` |
| `littlefox` | `/littlefox` | 136 | 8718 | `unknown` |
| `littlefoxcn` | `/littlefoxcn` | 48 | 1983 | `unknown` |
| `playtt` | `/playtt` | 57 | 4938 | `unknown` |
| `playgg` | `/playgg` | 26 | 514 | `unknown` |
| `phim` | `/phim` | 12 | 12 | `unavailable` (upstream 502) |

Ghi chu:
- Nguon `phim` duoc danh dau `unavailable` de client khong hieu nham la loi noi bo backend.
- `playtt/playgg` da duoc chuan hoa URL (quote path/query) de backend goi truc tiep.

## 3) Chi tiet theo tung mang

### 3.1 PlayTT
- JSON DB: `playtt_database.json`
- API split root: `api/playtt/`
- Page count: `57`
- Video count: `4938`
- Host chinh: `fileta.hoctienganh.xyz`
- Provider da thay: `Acellus`, `TEDed`, `Heinemann`, `Numberblocks`, `PeppaPig`, `Ben10`, ...

### 3.2 PlayGG
- JSON DB: `playgg_database.json`
- API split root: `api/playgg/`
- Page count: `26`
- Video count: `514`
- Host chinh: `rclone2.2tech.vn`
- Provider da thay: `Muzzy`, `KLE`, `KhoaHoc`, `GOGO`, `Single Stories`, ...

### 3.3 Phim
- JSON DB: `phim_database.json`
- API split root: `api/phim/`
- Page count: `12`
- Video count: `12`
- Upstream host: `vip.opstream*.com`
- Health: `unavailable` (ly do: upstream tra ve HTTP 502 trong mau kiem tra QA)

### 3.4 Abeka
- JSON DB: `abeka_database.json`
- API split root: `api/abeka/`
- So row/video: `20195`
- Grade: `k4, k5, g1..g12` (14 grade)
- Lesson range: `1..170`
- Split index theo grade/lesson:
  - `api/abeka/index.json`
  - `api/abeka/providers/<grade>/index.json`
  - `api/abeka/providers/<grade>/lessons/<lesson>.json`

### 3.5 Littlefox EN
- JSON DB: `littlefox_database.json`
- API root: `api/littlefox/`
- Series: `137`
- Episode: `8718`
- Watchlist series rong duoc theo doi rieng: `FS0133` (expected empty)

### 3.6 Littlefox CN
- JSON DB: `littlefoxcn_database.json`
- API root: `api/littlefoxcn/`
- Series: `48`
- Episode: `1983`

## 4) Output du lieu cho backend

### 4.1 Segment JSON (de nap nhanh)
- `playtt_database.json`
- `playgg_database.json`
- `phim_database.json`
- `abeka_database.json`
- `littlefox_database.json`
- `littlefoxcn_database.json`

### 4.2 API-ready split JSON
- `api/playtt/**`
- `api/playgg/**`
- `api/phim/**`
- `api/abeka/**`
- `api/littlefox/**`
- `api/littlefoxcn/**`

### 4.3 SQL-ready
- SQLite schema: `sql/unified_content_schema_sqlite.sql`
- Postgres schema: `sql/unified_content_schema_postgres.sql`
- Postgres seed: `sql/unified_content_seed_postgres.sql`
- Unified DB file: `unified_content.db`
- Unified summary: `unified_content_summary.json`

## 5) Mock endpoint de test query ngay

### FastAPI
- Code: `mock_api_fastapi/app.py`
- Endpoint chinh:
  - `GET /health` (tra `degraded` neu co source `unavailable`)
  - `GET /sources`
  - `GET /collections`
  - `GET /videos`
  - `GET /videos/{video_key}`

### ASP.NET
- Code: `mock_api_aspnet/UnifiedContent.MockApi/Program.cs`
- Endpoint mirror tuong tu FastAPI.
- Luu y moi truong hien tai chi co .NET runtime, chua co .NET SDK nen chua build/run tai may nay.

## 6) Ket qua QA doc lap (strict)
- Report JSON: `qa_integrity_report.json`
- Report Markdown: `qa_integrity_report.md`
- Ket qua lan chay 2026-03-10:
  - Khong co `critical/high/medium`
  - Chi con `1 low` (duplicate `video_url` cross-collection, tinh huong co the chap nhan)
  - URL normalization: `playtt/playgg/phim/abeka` deu `path_has_space = 0`
  - Reachability phim: that bai mau `12/12` voi HTTP `502`, duoc danh dau `EXPECTED_UNAVAILABLE`
  - `FS0133` duoc QA ghi nhan `EXPECTED_EMPTY_SERIES_TRACKED`

## 7) Khuyen nghi van hanh
1. Dat cron job rebuild + QA (1-2 lan/ngay) de cap nhat health theo thuc te upstream.
2. Tai backend, neu `content_source.health_status = unavailable` thi hien thi thong bao upstream outage thay vi loi he thong.
3. Dung `unified_content.db` cho truy van metadata, va goi stream URL truc tiep tu `content_video.video_url`.
