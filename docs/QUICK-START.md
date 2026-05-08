# ⚡ Quick Start Guide - TinyGenius Hub

> **Mục tiêu:** Developer mới chạy project trong **5 phút**.

---

## 📋 Prerequisites (1 phút)

### Kiểm tra và cài đặt nếu thiếu:

| Yêu cầu | Version | Kiểm tra |
|---------|---------|----------|
| Node.js | 22+ | `node --version` |
| PostgreSQL | 15+ | `psql --version` |
| pnpm | 10+ | `pnpm --version` |
| Git | 2.x | `git --version` |

### Cài đặt nhanh:

```bash
# Node.js 22 (nếu chưa có)
# macOS/Linux (nvm)
nvm install 22
nvm use 22

# Windows - download tại https://nodejs.org/

# pnpm (nếu chưa có)
npm install -g pnpm@10.24.0

# PostgreSQL (nếu chưa có)
# macOS: brew install postgresql@15
# Ubuntu: sudo apt install postgresql-15
# Windows: https://www.postgresql.org/download/windows/
```

**⏱️ Timestamp: 00:00 - 01:00**

---

## 📥 Clone & Install (1 phút)

```bash
# Clone repository
git clone https://github.com/manhquydev/tinygeniushub.git
cd tinygeniushub

# Install dependencies
pnpm install
```

**Expected output:**
```
Packages: +XXXX
Progress: resolved XXXX, reused XXXX, downloaded XX, added XXXX, done
```

**⏱️ Timestamp: 01:00 - 02:00**

---

## ⚙️ Environment Setup (1 phút)

```bash
# Copy environment file
cp .env.example .env
```

### Edit `.env` - chỉ cần thay đổi các dòng sau:

```bash
# Database (nếu PostgreSQL đã có sẵn, dùng URL của bạn)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tinygeniushub?schema=public

# Secrets - generate ngẫu nhiên 32+ ký tự
SESSION_SECRET=your-32-char-secret-key-here-abc123
BETTER_AUTH_SECRET=your-32-char-auth-secret-here-xyz789

# Admin (optional)
ADMIN_EMAILS=your-email@example.com
```

### Quick generate secrets:
```bash
# macOS/Linux
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET=$SESSION_SECRET"

# Windows PowerShell
# [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**⏱️ Timestamp: 02:00 - 03:00**

---

## 🗄️ Database Setup (1 phút)

### Option A: Sử dụng Docker (khuyến nghị cho development):

```bash
# Start PostgreSQL và Redis
docker compose up -d postgres redis

# Đợi database ready (5-10s)
sleep 5

# Chạy migration
pnpm db:migrate

# Seed dữ liệu demo
pnpm db:seed
```

### Option B: PostgreSQL local:

```bash
# Tạo database
psql -U postgres -c "CREATE DATABASE tinygeniushub;"

# Chạy migration
pnpm db:migrate

# Seed dữ liệu
pnpm db:seed
```

**Expected output:**
```
✓ Migration applied
✓ Database seeded
```

**⏱️ Timestamp: 03:00 - 04:00**

---

## 🚀 Run (1 phút)

### Option A: Docker (Full stack):

```bash
# Start tất cả services
docker compose up -d --build

# Check logs
docker compose logs -f web worker
```

### Option B: Development mode (Manual):

```bash
# Terminal 1 - Web server
pnpm dev

# Terminal 2 - Background worker
pnpm worker:dev
```

**Access:**
- 🌐 App: http://localhost:3000
- 📊 Health: http://localhost:3000/api/health
- 🔧 Admin: http://localhost:3000/admin

**Test credentials:**
- Parent: `demo.parent@tinygeniushubvn.tech` / `DemoPass123!`

**⏱️ Timestamp: 04:00 - 05:00** ✅

---

## 🎁 Bonus: Abeka Data Import

### Import dữ liệu Abeka curriculum:

```bash
# 1. Validate data trước khi import
pnpm abeka:validate

# 2. Import toàn bộ (có checkpoint để resume)
pnpm abeka:import:prod

# 3. Hoặc import một grade cụ thể
pnpm abeka:import --grade=1

# 4. Verify sau khi import
pnpm abeka:validate:db
```

**Chi tiết:** [docs/ABEKA-IMPORT-SETUP-GUIDE.md](./ABEKA-IMPORT-SETUP-GUIDE.md)

---

## 🧪 Bonus: Chạy Tests

```bash
# Unit tests
pnpm test

# E2E tests (yêu cầu server đang chạy)
pnpm test:e2e

# P0 Journey tests
pnpm test:e2e:p0

# Full test suite
pnpm test:local:full

# Security tests
pnpm test:e2e:security
```

**Quality commands:**
```bash
pnpm lint          # ESLint
pnpm type-check    # TypeScript
pnpm release:check # Full release gate
```

---

## 🐛 Bonus: Debug

### Debug Next.js:

```bash
# Dev mode with debugging
NODE_OPTIONS='--inspect' pnpm dev

# Sau đó mở Chrome DevTools → chrome://inspect
```

### Debug Worker:

```bash
# Worker với inspect
NODE_OPTIONS='--inspect=9230' pnpm worker:dev
```

### Common issues:

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `pnpm dev -- --port 3001` |
| Database connection failed | Kiểm tra `DATABASE_URL` và PostgreSQL đã chạy |
| Redis connection failed | Kiểm tra `REDIS_URL` và Redis đã chạy |
| Migration lỗi | `pnpm db:migrate -- --reset` (cẩn thận!) |
| Module not found | `pnpm install` lại |

### Docker debug:

```bash
# Reset all
docker compose down -v
docker compose up -d --build

# Clean và rebuild
docker compose down -v
docker volume prune -f
docker compose up -d --build
```

---

## 📚 Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm worker:dev` | Start background worker |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript check |
| `pnpm release:check` | Full release validation |

---

## 🔗 References

- [Project README](../README.md)
- [Architecture Overview](./learning-system-architecture-design.md)
- [Abeka Import Guide](./ABEKA-IMPORT-SETUP-GUIDE.md)
- [Deployment Guide](./deployment/VPS-DEPLOYMENT-GUIDE.md)

---

**🎉 Happy coding! Nếu gặp vấn đề, check logs và [troubleshooting](#-bonus-debug) section.**
