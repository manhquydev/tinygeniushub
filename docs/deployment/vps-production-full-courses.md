# Deploy Full Course Catalog to Production VPS

Tài liệu này hướng dẫn deploy production cho toàn bộ khóa học (`abeka`, `littlefox`, `littlefoxcn`) và đảm bảo video phát được ổn định.

## 1) Mục tiêu

- Deploy bản build mới lên VPS production.
- Đồng bộ đầy đủ dữ liệu khóa học từ nguồn `abeka_tools/api`.
- Import video source vào DB theo cơ chế bảo mật (`Lesson.videoSource` mã hóa).
- Xác nhận giao diện học mở được video và metadata bài học đúng.

## 2) Điều kiện bắt buộc

- VPS đã có:
  - Node.js + pnpm
  - PostgreSQL + Redis
  - Repo `cungcontuhoc`
- File `.env` production trên VPS có tối thiểu:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `SESSION_SECRET`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL` (URL public HTTPS)
  - `VIDEO_SOURCE_ALLOWED_HOSTS=fileta.hoctienganh.xyz,cdn.littlefox.com`
  - `CRON_SECRET`

Quan trọng:
- `SESSION_SECRET` dùng lúc import dữ liệu phải giống `SESSION_SECRET` runtime production.
- Nếu đổi `SESSION_SECRET` sau khi import, API video-token sẽ không giải mã được link video đã mã hóa.

## 3) Chuẩn bị nguồn dữ liệu khóa học

Nguồn chuẩn:
- `C:\Users\manhquy\.gemini\antigravity\scratch\abeka_tools\api`

Trên VPS, đảm bảo có thư mục tương đương chứa:
- `abeka/`
- `littlefox/`
- `littlefoxcn/`
- mỗi source có `index.json` và các file course/lesson tương ứng.

Ví dụ copy dữ liệu lên VPS:
```bash
rsync -avz ./api/ deploy@<vps>:/srv/abeka_tools/api/
```

## 4) Deploy code production

Nếu dùng workflow SSH có sẵn:
- `.github/workflows/deploy-digitalocean-ssh.yml`
- `scripts/deploy/remote-deploy.sh`

Manual trên VPS:
```bash
cd /var/www/tinygeniushub
git fetch --prune origin
git checkout --force <ref>
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm db:generate
pnpm prisma migrate deploy
pnpm build
```

## 5) Import full course catalog vào production DB

Chạy trên VPS sau khi deploy code:
```bash
cd /var/www/tinygeniushub
pnpm tsx prisma/scripts/import-three-courses-bootstrap.ts \
  --api-root /srv/abeka_tools/api \
  --bootstrap /var/www/tinygeniushub/docs/api/program-bootstrap/three-courses-program.json \
  --publish
```

Kết quả mong đợi:
- `rowsBuilt` lớn (khoảng 13081 theo snapshot hiện tại).
- `missingSourceCount = 0`
- `blockedVideoHostCount = 0`

## 6) Khởi động service production

Ví dụ PM2:
```bash
cd /var/www/tinygeniushub
pm2 start "pnpm start --hostname 0.0.0.0 --port 3000" --name tinygeniushub-web
pm2 start "pnpm tsx src/worker/index.ts" --name tinygeniushub-worker
pm2 save
```

## 7) Checklist xác nhận sau deploy

1. Health:
```bash
curl -f https://<domain>/api/health
```
2. API lessons trả về `videoStatus=ready` và `videoSource` có dữ liệu với course đã import.
3. Vào UI kid course:
   - mở bài học đầu tiên
   - video load được (không lỗi media, không treo scene)
   - nút tiếp tục hoạt động đúng theo watch gate.

## 8) Lỗi thường gặp và cách xử lý nhanh

- `video-token` trả 404 với lesson có video:
  - kiểm tra `SESSION_SECRET` runtime có khớp lúc import không.
- Video không phát dù token 200:
  - kiểm tra `embedUrl` phải là path nội bộ `/api/lessons/.../secure-playback?...` cùng origin.
- Import bị chặn host:
  - bổ sung host vào `VIDEO_SOURCE_ALLOWED_HOSTS`.

## 9) Script reset progress để test lại từ bài 1

Script đã có trong repo:
- `scripts/reset-child-course-progress.ts`

Dry run:
```bash
pnpm tsx scripts/reset-child-course-progress.ts \
  --childId=<childId> \
  --courseSlug=little-fox-en-level-1 \
  --dry-run
```

Thực thi reset:
```bash
pnpm tsx scripts/reset-child-course-progress.ts \
  --childId=<childId> \
  --courseSlug=little-fox-en-level-1
```
