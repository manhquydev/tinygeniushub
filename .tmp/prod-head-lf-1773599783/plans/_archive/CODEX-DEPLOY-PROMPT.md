# CODEX PROMPT — Hướng Dẫn Tương Tác Server (DigitalOcean)

**Date:** 2026-02-24
**Role:** Devops / Release Engineer
**Scope:** Tương tác và deploy code lên server DigitalOcean thông qua SSH.

---

## 🎯 Thông Tin Môi Trường Server

Dự án Cùng Con Tự Học đã thiết lập kết nối SSH tự động (không cần mật khẩu) từ máy local lên server chạy trên DigitalOcean. 

**Để kết nối hoặc chạy lệnh trên server, Codex hãy sử dụng alias chuẩn:**
`ssh do-server`

- Alias này đã tương đương với việc gọi `ssh root@152.42.246.218`.
- Lệnh được thực thi qua máy tính vật lý của USER (nởi Codex đang chạy). 

## 🛠️ Hướng dẫn cách Agent thực thi các chức năng

Dưới đây là các kỹ thuật Codex có thể áp dụng khi cần kiểm tra hoặc deploy code lên server:

### 1. Truy cập Server và kiểm tra thông tin
Nếu Codex cần vào server để xem trạng thái (Systemctl, PM2, Docker, thư mục logs):
```bash
# Kiểm tra RAM, ổ cứng trực tiếp
ssh do-server "free -m && df -h"

# Liệt kê các thư mục ở Root
ssh do-server "ls -la /var/www/ || ls -la /root/"
```

### 2. Copy file từ Local lên Server (SCP / RSYNC)
Nếu Codex cần đồng bộ code, hoặc đẩy file `docker-compose.yml`, `.env` lên server:
```bash
# Dùng thư mục chung do-server đã lưu trong config
scp -r d:/project/cungcontuhoc/.env.production do-server:/root/cungcontuhoc/.env
```
*(Ghi chú: Đường dẫn trên server tùy thuộc vào vị trí thực tế của thư mục dự án. Codex hãy dùng lệnh `ssh do-server ls` trước để xác định cấu trúc trên server).*

### 3. Quy trình Deploy cơ bản (Ví dụ)
Nếu đang cần setup một pipeline deploy thủ công cho NextJS bằng PM2 hoặc Docker trên server, bạn thể dùng chuỗi lệnh:
```bash
# Vào server -> pull code -> cài npm -> build -> restart
ssh do-server "cd /ĐƯỜNG_DẪN_DỰ_ÁN && git pull && pnpm install && pnpm build && pm2 restart cungcontuhoc"
```

## 📋 Ghi Chú cho Codex
- Khi thiết lập script hoặc pull code, tuyệt đối **không được hardcode** IP `152.42.246.218` mà hãy dùng `do-server`.
- Mọi action yêu cầu tương tác với DigitalOcean droplet, chỉ cần bọc lệnh lại bằng `ssh do-server "câu_lệnh_bên_trong"`.
