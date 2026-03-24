# Brainstorm - Customer Decision Research for /courses and /courses/[slug]

Date: 2026-03-24
Work context: D:\project\cungcontuhoc
Scope: Parent buying decision for course catalog + detail pages

## 1) Top 5 insights (ranked by conversion impact)

1. Parent mua theo do tin + do hop, khong mua theo tong so bai.
- Proof in docs: trust stack uu tien weekly report, milestone, review tu parent giong minh.
- Implication: card/list phai tra loi "co hop con toi khong" truoc khi show so lieu lon.

2. Decision moment cua parent la map dung diem bat dau, khong phai doc het mo ta.
- Parent can 3 thu: muc tieu, level hien tai, nhịp hoc/tuần.
- Implication: /courses should be pre-qualification surface, not mini detail page.

3. Risk reducer (hoc thu, support, policy ro) la don bay mua manh hon them tinh nang.
- Existing strategy docs nhan manh trial + report + support la trust trigger.
- Implication: detail page phai show risk-control block sat CTA.

4. Neu UI noi mot dang, data/backend chay mot neo, conversion va trust se rot.
- Hien co dau hieu mismatch claim trial + preview behavior.
- Implication: thong diep marketing chi duoc claim nhung gi product dam bao 100%.

5. Team hien chua co data A/B tin cay de toi uu theo variant.
- `courses-ab-cvr-report.md`: variant = `unknown` (8 checkout start, 6 success, 75%)
- Implication: stop tranh luan A/B copy based on gut feel; fix attribution first.

## 2) Top 5 purchase barriers

1. Trial claim khong nhat quan (critical)
- UI detail load 12 lesson dau (`take: 12`) nhung preview thuc te phu thuoc `isPreview/trialEnabled`.
- Seed/import dang cho thay trial co the 3-5 lesson tuy track/level.
- User gap: parent nghe "hoc thu 7 bai" nhung vao trang thay logic khac -> mat tin ngay.

2. Preview technical friction
- Preview modal goi `/api/lessons/[lessonId]/video-token` route dang require auth parent.
- Parent chua dang nhap de hoc thu se thay trang thai unavailable, de hieu nham la khong co bai thu.

3. Card hien tai nhieu thong tin nhung chua dung thong tin
- Dang show title/desc/price/lesson/age/rating/enrollment/outcome block cung luc.
- Thieu thong tin quyet dinh cot loi: entry readiness, "khong phu hop neu", trigger nen mua.

4. Detail page nghieng checkout, yeu lane tu van
- Co CTA mua ro, nhung lane "khong chac level" chua du manh o vung hero decision.
- Dễ dan den hoan mua hoac mua sai muc.

5. KPI uu tien cua sprint chua khoa
- Tai lieu nhieu lan dat cau hoi: uu tien checkout start, purchase CVR, hay giam mua sai level.
- Khong khoa KPI -> design/noi dung thay doi lien tuc, khong hoc duoc tu data.

## 3) Card vs Detail - dat thong tin nao o dau

| Thong tin | Card (/courses) | Detail (/courses/[slug]) |
|---|---|---|
| Muc tieu khoa | 1 dong | Mo rong 2-3 dong + vi du dau ra |
| Doi tuong phu hop | Bat buoc (age/level signal) | Checklist "phu hop neu" |
| Khong phu hop neu | Khong can day du, 1 cue nhe | Bat buoc 2-3 bullet |
| Entry point (bat dau tu dau) | Bat buoc 1 dong | Bat buoc + ly do + goi y muc lien ke |
| Nhịp hoc/tuần | Bat buoc (rất ngắn) | Bat buoc + timeline tuan 1-2-4 |
| Trial | Badge ngan + claim nhat quan | Section rieng: so bai thu, dieu kien, bai nao free |
| Trust signal | 1-2 signal (rating OR enrollment) | Day du trust stack (review + visible outcomes + support) |
| Gia + CTA | Gia + "Xem co hop con khong" | Gia + dual CTA: Mua / Can tu van chon level |

## 4) Trial 7 bai - recommendation thuc chien

### Hard truth
Hien tai KHONG nen claim "hoc thu 7 bai dau tien" tren toan he thong.
Ly do:
- Detail dang load 12 lesson dau de hien thi curriculum.
- So lesson preview phu thuoc cờ `isPreview/trialEnabled`, khong co contract 7 bai.
- Import scripts/seed hien co pattern 3-5 bai trial theo tung nguon.
- Preview API currently require auth -> trai voi ky vong hoc thu friction-low.

### 2 huong thong diep

Option A (an toan, deploy nhanh):
- Copy: "Hoc thu cac bai mo khoa mien phi" + show so bai preview THUC TE theo khoa.
- Khong nhac so 7 neu backend chua enforce.

Option B (ban muon chot 7 bai de marketing):
- Can product contract truoc: moi khoa storefront phai co dung 7 lesson preview dau.
- Enforce backend + admin validation + UI consistency + analytics event trial_7_started/trial_7_completed.
- Khi do moi cho phep copy: "Hoc thu 7 bai dau tien".

### Suggested copy (neu chua enforce 7)
- Card: "Co bai hoc thu mien phi"
- Detail: "Ban duoc hoc thu {previewCount} bai dau. Bai con lai mo sau khi mua."

### Suggested copy (neu enforce 7 thanh cong)
- Card: "Hoc thu 7 bai dau"
- Detail: "Hoc thu 7 bai dau tien mien phi. Tu bai 8 mo ngay sau khi mua."

## 5) Action plan (clear, survival-focused)

1. Week 0-1: Khoa su that san pham
- Chon 1 policy trial duy nhat (dynamic or 7 fixed)
- Sua mismatch copy ngay lap tuc tren /courses + /courses/[slug]

2. Week 1: Giam cognitive load list page
- Card chi giu thong tin quyet dinh cot loi, bo bot metric tong catalog o hero
- CTA card doi thanh "Xem co hop con khong"

3. Week 1-2: Tang confidence o detail page
- Them block "Phu hop neu / Chua phu hop neu"
- Them lane "Can tu van chon level" canh CTA mua

4. Week 1-2: Fix measurement first
- Fix `ab_courses_v` capture end-to-end
- Chot 1 KPI sprint (de xuat: `detail -> checkout start` truoc)

5. Week 2+: moi bat dau A/B copy/layout
- Chi test khi variant tracking het `unknown`

## Unresolved questions

1. Ban muon uu tien KPI 2 tuan toi la `checkout start`, `purchase success`, hay `giam mua sai level`?
2. Ban co quyet dinh chot policy trial la dynamic theo khoa hay fixed 7 bai?
3. Neu fixed 7 bai: team co chap nhan bo viec release copy trial 7 bai cho toi khi backend enforce xong khong?
4. Chinh sach support khi parent mua sai level la gi (doi level/chuyen khoa/hoan phi) de dua vao reassurance block?
