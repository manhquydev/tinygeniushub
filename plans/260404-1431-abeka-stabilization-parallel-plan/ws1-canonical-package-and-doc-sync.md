# WS1: Canonical Package + Docs Sync

## Owner
- Planner + Backend dev

## Scope
- Khóa cứng 1 chuẩn package duy nhất từ seeder.
- Đồng bộ docs deploy/migration/business theo chuẩn đó.

## Tasks
1. Trích xuất package spec từ `prisma/seeders/curriculum-packages.ts`.
2. Tạo bảng canonical (code, name, grades, subjects, videoCount, monthly/yearly, description).
3. Cập nhật docs:
   - `docs/deployment/PRODUCTION-MIGRATION-COMMANDS.md`
   - `docs/DATABASE-MIGRATION-PLAN.md`
   - `docs/business/abeka-course-package-design.md`
4. Thêm checklist parity check sau seed.

## Deliverables
- Canonical package matrix trong docs.
- No-conflict policy: docs reference code, không định nghĩa lại khác.

## Success Criteria
- Không còn chênh package giữa docs và seeder.
