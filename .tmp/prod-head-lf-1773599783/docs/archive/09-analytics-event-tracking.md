# 09 — Analytics & Measurement

## 1) Vì sao analytics là “xương sống”
Bạn bán theo năm => sống còn ở:
- Activation trong trial
- Retention tuần 1–4
- Evidence creation (phụ huynh có “proof” thì mới renew)

## 2) North Star Metric (đề xuất)
**Weekly Engaged Learners (WEL)**  
= số child profile hoàn thành >= 3 lesson/tuần *và* có >= 1 evidence.

## 3) Core metrics
### Acquisition
- Landing → signup rate
- Affiliate contribution

### Activation (Trial)
- % tạo child profile
- % hoàn thành Day 1
- % tạo evidence Day 1

### Retention
- D1/D3/D7 retention
- Weekly streak distribution
- Completion rate per lesson

### Learning
- Quiz accuracy trend
- Level progression time

### Monetization
- Trial → paid yearly conversion
- Renewal yearly
- ARPU

## 4) Event taxonomy (đặt tên chuẩn)
- `signup_started`, `signup_completed`
- `child_profile_created`, `child_profile_switched`
- `profile_limit_reached` (limit=3|5), `add_child_blocked`
- `placement_started`, `placement_completed`
- `lesson_started`, `lesson_completed`
- `video_play`, `video_completed`
- `activity_started`, `activity_completed`, `activity_scored`
- `offline_card_opened`
- `evidence_submitted` (type=checklist|photo|audio)
- `portfolio_media_uploaded` (type=photo|audio), `portfolio_media_deleted` (reason=user|auto_retention)
- `weekly_report_generated`
- `weekly_report_viewed` (channel=in_app|email_link)
- `weekly_report_email_sent`, `weekly_report_email_bounced`, `weekly_report_email_opened` (optional), `weekly_report_email_clicked`
- `weekly_email_opt_in_toggled` (value=true|false)
- `paywall_viewed`, `checkout_started`, `checkout_completed`
- `plan_upgrade_clicked`, `plan_upgraded` (from=... to=...)
- `referral_link_copied`, `referral_signup`, `referral_paid`


## 5) Dashboard tối thiểu
- Trial funnel
- Week 1 retention cohort
- Report view rate
- Evidence rate
- Affiliate conversion

## 6) Experiment ideas (A/B)
- Trial 3 vs 7 ngày
- Report format: “1 phút đọc” vs chi tiết
- Reward: badge vs certificate

## 7) References
- (Cognitive science) retrieval + spacing: thiết kế review & quiz có cơ sở
