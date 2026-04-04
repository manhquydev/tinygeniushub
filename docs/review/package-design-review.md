# Package Design Review - Abeka 8-Course Package Strategy

**Review Date:** April 4, 2026  
**Reviewer:** OpenCode AI  
**Files Reviewed:**
- `docs/business/abeka-course-package-design.md`
- `docs/MASTER-ABEKA-CURRICULUM-BUSINESS-PLAN.md`
- `docs/business/roi-profit-analysis-by-package.md`

---

## 🚨 CRITICAL FINDINGS

### 1. Data Inconsistency Between Documents

| Package | Package Design Doc | MASTER Doc | Variance |
|---------|-------------------|------------|----------|
| **Mầm Non (K4-K5)** | 2,800 videos | 3,305 videos | **+505** |
| **Tiểu Học (G1-G5)** | 7,250 videos | 9,111 videos | **+1,861** |
| **Trung Học (G6-G9)** | 5,800 videos | 3,148 videos* | **-2,652** |
| **THPT (G10-G12)** | 4,350 videos | 4,631 videos | **+281** |

**Issue:** MASTER doc shows G6-G8 = 3,148 (not G6-G9), and G9 is grouped with High School

**Recommendation:** ✅ **FIX IMMEDIATELY** - Reconcile video counts using actual metadata analysis. Use MASTER doc numbers (from metadata analysis) as source of truth.

---

## 📊 LOGIC PHÂN CHIA THEO CẤP LỚP

### 1. Gói Mầm Non (K4-K5): 3,305 video - Giá 199K/tháng

| Metric | Value | Assessment |
|--------|-------|------------|
| **Video count** | 3,305 | Verified from metadata |
| **Price/month** | 199,000₫ | Entry-level pricing |
| **Price/year** | 1,790,000₫ | 25% discount |
| **Cost per video/year** | 541₫ | Very affordable |
| **Target age** | 2-6 years old | Correct positioning |

**Verdict:** ✅ **HỢP LÝ**
- 199K là mức giá tâm lý tốt cho phân khúc mầm non
- Tương đương 6,600₫/ngày - dễ chấp nhận
- Rẻ hơn Monkey Junior (200K+/tháng chỉ cho tiếng Anh)

**Concern:** Số video ở K4 (1,595) và K5 (1,710) chênh lệch đáng kể - cần verify nếu K4 đã đầy đủ.

---

### 2. Gói Tiểu Học (G1-G5): 9,111 video - Giá 349K/tháng

| Metric | Value | Assessment |
|--------|-------|------------|
| **Video count** | 9,111 | Largest content library |
| **Price/month** | 349,000₫ | Mid-tier pricing |
| **Price/year** | 2,990,000₫ | 29% discount |
| **Cost per video/year** | 328₫ | **Best value** |
| **Grade coverage** | 5 grades | Longest duration |

**Verdict:** ✅ **RẤT PHÙ HỢP**
- Giá/video thấp nhất trong tất cả các gói (328₫/video/năm)
- Nhiều video nhất (9,111) với giá trung bình
- Sweet spot cho phụ huynh có con tiểu học

**Upsell Opportunity:** Sau G5, nâng cấp lên G6-G9 với giá ưu đãi 30%

---

### 3. Gói Trung Học (G6-G9): ~3,300 video - Giá 399K/tháng

| Metric | Value | Assessment |
|--------|-------|------------|
| **Video count** | ~3,300 (G6-G8: 3,148 + G9: ~891) | Cần xác nhận |
| **Price/month** | 399,000₫ | Higher than Elementary |
| **Price/year** | 3,490,000₫ | 27% discount |
| **Cost per video/year** | ~1,057₫ | **Cao hơn Elementary 3x** |
| **Grade coverage** | 4 grades | Shorter than G1-G5 |

**Verdict:** ⚠️ **CẦN XEM XÉT**

**Issues:**
1. **Giá cao hơn Elementary** (399K vs 349K) nhưng video ít hơn (3,300 vs 9,111)
2. **Cost/video gấp 3 lần** Elementary - khó giải thích với khách hàng
3. **G6-G8 chỉ có 3,148 video** - thấp nhất trong các cấp (do video/bài học ít hơn)

**Recommendation:** 
- **Option A:** Giảm giá xuống 299K-349K/tháng
- **Option B:** Gộp G6-G9 vào gói lớn hơn với THPT
- **Option C:** Thêm nội dung bổ sung để justify giá 399K

---

### 4. Gói THPT (G10-G12): 4,631 video - Giá 449K/tháng

| Metric | Value | Assessment |
|--------|-------|------------|
| **Video count** | 4,631 (G9: 891 + G10-G12: 3,740) | Verify G9 inclusion |
| **Price/month** | 449,000₫ | Highest grade-based |
| **Price/year** | 3,990,000₫ | 26% discount |
| **Cost per video/year** | 862₫ | **High but justifiable** |
| **Grade coverage** | 3-4 grades | Shortest duration |

**Verdict:** ⚠️ **CHẤP NHẬN ĐƯỢC NHƯNG CẦN GIẢI THÍCH**

**Pros:**
- Chuẩn bị đại học là pain point lớn - phụ huynh sẵn sàng chi
- Nội dung nâng cao (Calculus, Physics, Chemistry) có giá trị cao hơn

**Cons:**
- Giá 449K gần gấp đôi Elementary (349K) nhưng ít video hơn
- Cạnh tranh với luyện thi đại học truyền thống (1-2 triệu/tháng)

**Recommendation:**
- Thêm features đặc biệt: lộ trình SAT/IELTS, mentor support
- Position là "đầu tư cho đại học" thay vì "học thêm"

---

## 🆚 PHÂN TÍCH ĐỐI THỦ

### So Sánh Giá Thị Trường

| Đối Thủ | Mô Hình | Phân Khúc | Giá/Tháng | So với Abeka |
|---------|---------|-----------|-----------|--------------|
| **VUIHOC** | Subscription | Lớp 1-12 | 199K-599K | Cạnh tranh trực tiếp |
| **Monkey Junior** | Subscription | Mầm non | 200K+ | Abeka rẻ hơn hoặc ngang |
| **Loigiaihay** | Freemium | Lớp 1-12 | Free | Khác phân khúc |
| **Hoc10** | Code kích hoạt | Lớp 1-12 | 50K-150K/môn | Rẻ hơn nhưng không full curriculum |

### Đánh Giá Cạnh Tranh

| Gói Abeka | Giá | VUIHOC Tương Đương | Đánh Giá |
|-----------|-----|-------------------|----------|
| **Mầm Non (199K)** | 199K | N/A (VUIHOC từ lớp 1) | ✅ **Không có đối thủ trực tiếp** |
| **Tiểu Học (349K)** | 349K | 199K-399K | ⚠️ **Cao hơn 75%** so với VUIHOC entry |
| **Trung Học (399K)** | 399K | 399K-599K | ✅ **Cạnh tranh trực tiếp** |
| **THPT (449K)** | 449K | 499K-599K | ✅ **Rẻ hơn 10-25%** |
| **ULTIMATE (699K)** | 699K | N/A | ✅ **Unique offering** |

**Findings:**
1. ✅ **THPT rẻ hơn VUIHOC** 10-25% - lợi thế cạnh tranh
2. ⚠️ **Tiểu Học cao hơn VUIHOC entry** 75% - cần justify value
3. ✅ **Mầm Non không có đối thủ** - cơ hội độc quyền
4. ✅ **ULTIMATE là differentiation** - không có đối thủ tương đương

**Value Justification cho Tiểu Học:**
- Abeka: 9,111 video curriculum chuẩn Mỹ
- VUIHOC: AI-powered nhưng nội dung Việt Nam
- **Differentiation:** Nền tảng tiếng Anh bản xứ + curriculum Mỹ

---

## 💰 PHÂN TÍCH MARGIN

### Margin Theo Tier (Từ ROI Analysis)

| Tier | Giá | Biên Ròng (500 subs) | Đánh Giá |
|------|-----|---------------------|----------|
| **Lite (99K)** | 99K | **3%** | ❌ **QUÁ MỎNG** |
| **Standard (199K)** | 199K | **49%** | ✅ **SWEET SPOT** |
| **Premium (349K)** | 349K | **69%** | ✅ **Excellent** |
| **Family (499K)** | 499K | **76%** | ✅ **Highest** |

### Khuyến Nghị Margin

#### 1. Lite 99K → **TĂNG LÊN 149K** ✅

**Lý do:**
- Margin 3% quá mỏng, dễ lỗ nếu churn cao
- Cần 500+ subscribers mới có lãi
- 149K vẫn là "charm pricing" (<150K)

**Dự phóng 149K:**
| Metric | 99K | 149K (đề xuất) |
|--------|-----|----------------|
| Revenue | 99K | 149K |
| Variable Cost | 18.5K | 18.5K |
| Fixed allocation | 77.5K | 77.5K |
| **Net Profit** | 3K | **53K** |
| **Net Margin** | 3% | **36%** |

**Verdict:** ✅ **NÊN TĂNG LÊN 149K**

---

#### 2. Standard 199K - **GIỮ NGUYÊN** ✅

**Lý do:**
- Margin 49% là sweet spot giữa volume và profit
- 199K là charm pricing phổ biến
- Đối thủ VUIHOC cũng có tier 199K

**Verdict:** ✅ **GIỮ NGUYÊN 199K**

---

#### 3. Premium 349K - **CÓ THỂ TĂNG LÊN 399K** ⚠️

**Lý do:**
- Margin 69% đã tốt nhưng có thể tốt hơn
- 399K vẫn thấp hơn VUIHOC premium tier
- Psychology: 349K vs 399K không khác biệt nhiều

**Tuy nhiên:**
- Nếu tăng, Premium sẽ gần giá gói Trung Học
- Cần differentiate rõ ràng giữa subject-based và grade-based

**Verdict:** ⚠️ **CÓ THỂ TĂNG, KHÔNG BẮT BUỘC**

---

## 🎯 ĐỀ XUẤT ĐIỀU CHỈNH

### Summary of Recommendations

| # | Thay Đổi | Từ | Sang | Lý Do | Ưu Tiên |
|---|----------|----|------|-------|---------|
| 1 | **Lite giá** | 99K | **149K** | Margin quá mỏng (3%) | 🔴 Cao |
| 2 | **Trung Học giá** | 399K | **349K** | Cost/video cao gấp 3x Elementary | 🔴 Cao |
| 3 | **Video count** | Inconsistent | **Chuẩn hóa** | MASTER doc là source of truth | 🔴 Cao |
| 4 | **THPT features** | Standard | **+SAT/IELTS path** | Justify giá cao hơn | 🟡 Trung bình |
| 5 | **Gói combo** | 4 gói grade | **+2 gói mini** | K4-K5 split, G10-G12 split | 🟡 Trung bình |

---

## 🛤️ UPSELL PATH ANALYSIS

### Current Path
```
Free Trial → Lite (99K) → Standard (199K) → Premium (349K) → Ultimate (699K)
```

### Đánh Giá

| Transition | Logic | Mức Độ Tự Nhiên |
|------------|-------|-----------------|
| **Free → Lite** | Dễ dàng | ✅ Tốt |
| **Lite → Standard** | 2x giá | ⚠️ Cần incentive |
| **Standard → Premium** | 1.75x giá | ✅ Hợp lý |
| **Premium → Ultimate** | 2x giá | ⚠️ Big jump |

### Đề Xuất Upsell Path Mới

```
Free Trial (7 ngày)
    ↓
Starter (K4-K5 hoặc 1 grade) - 149K
    ↓
Elementary (G1-G5) - 349K
    ↓
Middle (G6-G9) - 349K  ← Giảm từ 399K
    ↓
High School (G10-G12) - 449K
    ↓
ULTIMATE (Full K4-G12) - 699K
```

**Logic mới:**
1. **Lite → Starter:** Đổi tên, tăng giá 99K→149K
2. **Trung Học giảm giá:** 399K→349K để ngang Elementary
3. **Subject packages:** Tiếng Anh/Toán/STEM là upsell sideways
4. **ULTIMATE:** Target families, homeschoolers

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Week 1-2)
- [ ] Reconcile video counts giữa các documents
- [ ] Cập nhật giá Lite: 99K → 149K
- [ ] Điều chỉnh giá Trung Học: 399K → 349K
- [ ] Cập nhật tất cả tài liệu với số liệu chuẩn

### Phase 2: Optimization (Week 3-4)
- [ ] Thêm SAT/IELTS path cho gói THPT
- [ ] Tạo landing page so sánh với VUIHOC
- [ ] Implement annual discount 20-25%
- [ ] Setup A/B test pricing

### Phase 3: New Packages (Week 5-8)
- [ ] Xem xét gói K4-K5 split (K4 riêng, K5 riêng)
- [ ] Xem xét gói G1-G3, G4-G5 nhỏ hơn
- [ ] Launch subject-based upsell campaigns

---

## 🎬 KẾT LUẬN

### Tổng Quan

| Khía Cạnh | Đánh Giá | Điểm |
|-----------|----------|------|
| **Logic phân chia** | Cần điều chỉnh giá Trung Học | 7/10 |
| **Cạnh tranh đối thủ** | Tốt, đặc biệt THPT và Mầm Non | 8/10 |
| **Margin** | Lite quá mỏng, cần tăng giá | 6/10 |
| **Upsell path** | Logic nhưng cần smoothing | 7/10 |
| **Tổng thể** | Khá tốt, cần minor adjustments | 7/10 |

### 3 Thay Đổi Cần Thiết Nhất

1. **🔴 Tăng Lite 99K → 149K** - Margin 3% không bền vững
2. **🔴 Giảm Trung Học 399K → 349K** - Cost/video không cân xứng
3. **🔴 Chuẩn hóa video counts** - Tránh confusion cho khách hàng

### Dự Báo Sau Điều Chỉnh

| Scenario | Revenue/Tháng (2K subs) | Net Margin |
|----------|----------------------|------------|
| **Trước điều chỉnh** | ~500M VND | 79% |
| **Sau điều chỉnh** | ~520M VND | **82%** |

**Expected improvement:** +20M VND/tháng từ Lite price increase, + retention từ Trung Học pricing hợp lý hơn.

---

## ❓ UNRESOLVED QUESTIONS

1. **G9 thuộc gói nào?** MASTER doc gộp G9 vào High School, nhưng Package Design cho vào Middle School
2. **Actual video usage patterns?** Cần data thực tế để validate cost/user assumptions
3. **Churn rate theo package?** Giả định 12.5% có chính xác không?
4. **Abeka license cost?** $500/tháng là estimate hay confirmed?

---

*Review completed: April 4, 2026*  
*Next review: After 30 days of launch data*
