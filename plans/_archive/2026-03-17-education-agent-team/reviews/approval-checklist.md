# Approval Checklist (Sign-off)

Use this checklist trong buổi duyệt chốt.

## A. Bằng chứng và phương pháp
- [ ] Có tài liệu khoa học cho phương pháp dạy chính
- [ ] Có nêu rõ giới hạn bằng chứng
- [ ] Có guardrails chống claim quá mức

## A0. Toàn vẹn dữ liệu (BẮT BUỘC)
- [ ] Full split integrity PASS
- [ ] Pilot split integrity PASS
- [ ] Không có overlap/out-of-range/invalid range
- [ ] Pilot DB integrity PASS (đúng lesson payload theo SKU)

## B. Thiết kế sản phẩm
- [ ] Danh sách SKU pilot đã khóa
- [ ] Mỗi SKU có objective + duration + mastery check
- [ ] Mapping học liệu nguồn không thiếu/không trùng sai

## C. Kinh doanh
- [ ] Funnel và KPI đã chốt ngưỡng
- [ ] Đã xác định chiến lược tripwire/core/premium
- [ ] Có kế hoạch thử nghiệm thông điệp
- [ ] Tracking funnel pilot đang ghi nhận được dữ liệu theo SKU

## D. Vận hành
- [ ] Có timeline sprint rõ ràng
- [ ] Có QA checklist
- [ ] Có stop/go rule theo dữ liệu
- [ ] Có báo cáo funnel tuần từ dữ liệu hệ thống
- [ ] Có kết quả chấm gate tuần từ `pilot-funnel-gate-evaluation.json`
- [ ] Có dashboard board tuần với decision/actions (`weekly-board-dashboard.md`)

## E. Quyết định
- [ ] APPROVE
- [ ] CONDITIONAL APPROVE
- [ ] REJECT

Decision note:

Signed by:
- Product owner:
- Curriculum lead:
- Growth lead:
- Ops lead:
