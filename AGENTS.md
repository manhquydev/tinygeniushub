# Hướng Dẫn Kỹ Thuật Dự Án (AGENTS.md)
Tệp này sẽ được nạp vào mọi luồng làm việc của các trợ lý AI Codex (Agents) trong dự án. Tất cả AI agents bắt buộc tuân theo những chỉ dẫn dưới đây.

## Bối cảnh Dự án (Project Context)
Dự án nền tảng học tập **Cùng Con Tự Học** dành cho giáo dục sớm.
- **Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma ORM v6, Vitest, BullMQ.
- **Tính năng nổi bật:** Giao diện Trẻ em (Kids UI) sử dụng Framer Motion v12, Quản lý tài khoản Phụ huynh, Tích hợp audio qua Web Audio API.

## Hướng dẫn Chung (Global Guidelines)
1. Bắt buộc suy nghĩ từng bước và lập kế hoạch (Chain of Thought / Plan) trước khi viết mã nguồn. Luôn tránh ảo giác (hallucination) việc tự tiện import các hàm chưa tồn tại.
2. Tất cả Component UI phải viết theo hướng tiếp cận Mobile-First để trẻ dễ dùng trên máy tính bảng/điện thoại di động.
3. Không thêm bừa các Package của bên thứ 3 (NPM). Luôn hỏi ý kiến Senior/người dùng trước để bảo vệ tốc độ Bundle.

## Multi-Agent Review Contract (Bắt Buộc)
- Bạn được coi như là một Kỹ sư phần mềm (Software Engineer) thực thụ, chứ không phải người làm chủ dự án. Do đó, **Tuyệt đối KHÔNG ĐƯỢC tự ý Commit / Push thẳng vào nhánh `main`**.
- Thay vì vậy, khi Code chạy xong hệ thống mới hoặc fix bugs diện rộng, hãy sử dụng **GitHub MCP** để tạo một **Pull Request (Bản nháp)**. Cần một con người review (Human-in-the-loop) để kiểm định.
- Pull Request phải mô tả rõ ràng vấn đề kỹ thuật nào đang giải quyết, hướng tiếp cận thay thế, và các giả định (assumptions).

## Coding Standards (React & Next.js)
1. Xử lý trạng thái nội bộ với Server Actions (ở file riêng hoặc trên đỉnh component Server) kết hợp API Routes khi cần truyền JSON ra ngoài.
2. Dữ liệu nhạy cảm hoặc logic kinh doanh (Business Logic) luôn thuộc về Server.
3. `console.log()` chỉ dùng để test nhanh cục bộ, khi code hoàn thiện, hãy xóa đi hoặc sử dụng thư viện logging đồng nhất.
