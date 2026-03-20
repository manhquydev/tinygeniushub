# 04 — Templates chuẩn hoá (Lesson/Activity/Report)

Mục tiêu: để bạn (và dev) tạo lesson theo cùng format, giảm “mỗi bài một kiểu”.

---

## 1) Template Lesson (Markdown)
> Mỗi lesson nên có phiên bản .md để team vận hành + QA.

```md
# [LESSON_TITLE]
- Track: English | Math | Habit
- Level: [1..n]
- Unit: [UNIT_ID]
- Estimated time: 15–25 min
- Age band: 3–4 | 4–5 | 5–6
- Outcome (1 câu): ...
- Prerequisites: ...
- Keywords: ...

## A) Watch
- Video asset: [VIDEO_ID]
- Duration: mm:ss
- Checkpoints (optional):
  - t=01:20 hỏi: ...
  - t=03:10 pause: ...

## B) Active practice (in-app)
- Activity type: quiz | matching | drag-drop | listen-choose | puzzle
- Questions: ...
- Pass criteria: ...
- Remediate rule: nếu sai 2 lần → gợi ý xem lại đoạn t=...

## C) Offline activity
- Materials: (đồ trong nhà)
- Steps (3–5 bước):
  1) ...
  2) ...
- Parent tip: 1 câu
- Safety note (nếu có): ...

## D) Evidence
- Required: tick checklist (yes/no)
- Optional: photo / audio / short note
- Evidence prompt: “Chụp ảnh con xếp ...” hoặc “Ghi âm con đọc ...”

## E) Review plan
- D+1 review: [ACTIVITY_ID]
- D+3 review: [ACTIVITY_ID]
- D+7 review: [ACTIVITY_ID]
```

---

## 2) Template Activity (mini-game/quiz)
```yaml
id: ACT_001
type: listen_choose # tap_choose | drag_drop | match_pairs | trace
prompt: "Nghe và chọn hình đúng"
items:
  - audio: a1.mp3
    options: [img1, img2, img3]
    correct: img2
scoring:
  attempts: 2
  pass: 80
feedback:
  correct: "Đúng rồi!"
  wrong: "Thử lại nhé!"
accessibility:
  text_minimum: true
  voiceover: true
```

---

## 3) Template Weekly Report (Parent-facing)
```md
# Báo cáo tuần [WEEK_NUMBER] — [CHILD_NAME]

## 1) Tóm tắt (1 phút đọc)
- Con học: X buổi | tổng Y phút
- Streak cao nhất: Z ngày
- Milestone đạt: ...
- Điểm nổi bật: ...

## 2) Tiến bộ theo kỹ năng
### English
- Level: ...
- Stories completed: ...
- Quiz accuracy: ...
- Vocab: +...

### Math
- Level: ...
- Skills unlocked: counting / number bonds / ...

## 3) Evidence & Portfolio
- Ảnh hoạt động: ...
- Audio: ...

## 4) Gợi ý tuần tới (kế hoạch 5 ngày)
- Day 1: ...
- Day 2: ...
...
## 5) Parent script (3 câu hỏi)
- “Hôm nay con thích nhất đoạn nào?”
- “Con chỉ cho mẹ số ... ở đâu?”
- “Nếu làm lại, con sẽ làm thế nào?”
```

---

## 4) Badge & Certificate spec
### Badge (nhanh – tạo dopamine)
- Trigger: hoàn thành lesson / streak / quiz “Good”…
- Hiển thị: icon + tên ngắn + 1 câu khen

### Certificate (mốc – tạo trust & share)
- Trigger: hoàn thành Unit/Level hoặc 7-day trial
- PDF auto-generated có:
  - Tên con (nickname)
  - Level/Unit
  - Ngày đạt
  - QR/link về roadmap để share

---

## 5) Quy tắc thiết kế cho trẻ <6 (UI checklist)
- Nút >= 44px
- 1 màn hình 1 nhiệm vụ
- Ít chữ, ưu tiên icon/voice
- Không hiển thị nội dung “đề xuất vô hạn” kiểu YouTube
- Có parent gate khi vào khu thanh toán / dashboard

---

## 6) References
- Little Fox user features: Learning Log, Attendance, Badges (gợi ý cơ chế badge/attendance)
- WHO/AAP: định hướng giảm passive screen time → tăng hoạt động tương tác/offline
