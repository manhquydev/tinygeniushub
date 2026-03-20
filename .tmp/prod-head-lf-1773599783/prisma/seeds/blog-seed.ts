import { AgeGroup, BlogPostStatus, BlogPostType, PrismaClient } from "@prisma/client";

type BlogSeedSummary = {
  categories: { created: number; updated: number };
  tags: { created: number; updated: number };
  authors: { created: number; updated: number };
  posts: { created: number; updated: number; total: number };
};

type BlogPostSeed = {
  slug: string;
  titleVi: string;
  excerptVi: string;
  contentMarkdown: string;
  type: BlogPostType;
  categorySlug: string;
  ageGroup: AgeGroup;
  tagSlugs: string[];
  publishedAt: Date;
};

function readingTimeFromMarkdown(markdown: string): number {
  const words = markdown
    .replace(/[#_*`\-\[\]\(\)]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

const BLOG_CATEGORIES = [
  { slug: "phat-trien-tre", nameVi: "Phát Triển Trẻ Em", emoji: "🌱", color: "#10b981", orderNo: 1 },
  { slug: "phuong-phap-hoc", nameVi: "Phương Pháp Học Tập", emoji: "📚", color: "#3b82f6", orderNo: 2 },
  { slug: "tieng-anh-som", nameVi: "Tiếng Anh Cho Trẻ", emoji: "🌏", color: "#8b5cf6", orderNo: 3 },
  { slug: "toan-tu-duy", nameVi: "Toán Tư Duy", emoji: "🔢", color: "#f59e0b", orderNo: 4 },
  { slug: "dinh-huong-phu-huynh", nameVi: "Hướng Dẫn Phụ Huynh", emoji: "👪", color: "#ef4444", orderNo: 5 },
] as const;

const BLOG_TAGS = [
  { slug: "hoc-tieng-anh-lop-1", nameVi: "Học tiếng Anh lớp 1" },
  { slug: "phonics-cho-be", nameVi: "Phonics cho bé" },
  { slug: "toan-lop-1", nameVi: "Toán lớp 1" },
  { slug: "toan-lop-2", nameVi: "Toán lớp 2" },
  { slug: "hoc-15-phut-moi-ngay", nameVi: "Học 15 phút mỗi ngày" },
  { slug: "bao-cao-tien-do", nameVi: "Báo cáo tiến độ" },
  { slug: "seo-edtech", nameVi: "SEO EdTech" },
  { slug: "phu-huynh-dong-hanh", nameVi: "Phụ huynh đồng hành" },
] as const;

const NOW = new Date();

const BLOG_POSTS: BlogPostSeed[] = [
  {
    slug: "5-dau-hieu-be-san-sang-hoc-tieng-anh-3-5-tuoi",
    titleVi: "5 dấu hiệu bé sẵn sàng học tiếng Anh (3-5 tuổi)",
    excerptVi:
      "Nhận biết sớm 5 dấu hiệu quan trọng giúp phụ huynh chọn đúng thời điểm bắt đầu tiếng Anh cho bé 3-5 tuổi.",
    contentMarkdown: `# 5 dấu hiệu bé sẵn sàng học tiếng Anh (3-5 tuổi)

Từ khóa chính: **bé sẵn sàng học tiếng Anh 3-5 tuổi**

Nhiều phụ huynh hỏi: “Khi nào nên cho con bắt đầu tiếng Anh?” Câu trả lời không nằm ở một mốc tuổi cố định, mà nằm ở **mức sẵn sàng** của từng bé. Nếu bắt đầu quá sớm khi bé chưa có hứng thú, việc học dễ trở thành áp lực. Nếu bắt đầu đúng thời điểm, bé tiếp thu tự nhiên và tự tin hơn rất nhiều.

## Dấu hiệu 1: Bé hứng thú với âm thanh và bài hát
Bé hay lặp lại giai điệu, thích bắt chước âm thanh nhân vật hoặc câu nói trong video thiếu nhi. Đây là nền tảng rất tốt để làm quen phát âm tiếng Anh.

## Dấu hiệu 2: Bé có thể tập trung 7-10 phút
Ở độ tuổi 3-5, khả năng tập trung ngắn là bình thường. Chỉ cần bé có thể theo một hoạt động trong 7-10 phút là đã đủ để bắt đầu các bài học mini.

## Dấu hiệu 3: Bé thích gọi tên đồ vật xung quanh
Khi bé chủ động gọi tên đồ vật trong nhà hoặc đặt câu hỏi “cái này là gì?”, đây là tín hiệu ngôn ngữ đang phát triển mạnh.

## Dấu hiệu 4: Bé phản hồi tốt với trò chơi tương tác
Các hoạt động dạng chọn đáp án, điền từ đơn giản hoặc nghe và chỉ đúng hình phù hợp giúp bé học mà vẫn thấy vui.

## Dấu hiệu 5: Phụ huynh có thể đồng hành ngắn mỗi ngày
Chỉ cần 15 phút/ngày, đều đặn 5-6 ngày/tuần, hiệu quả sẽ cao hơn nhiều so với học dồn cuối tuần.

## Kết luận
Hãy ưu tiên “đúng nhịp của bé” thay vì chạy theo so sánh. Khi có đủ 3-4 dấu hiệu ở trên, phụ huynh có thể bắt đầu lộ trình tiếng Anh nền tảng một cách nhẹ nhàng và bền vững.`,
    type: BlogPostType.GUIDE,
    categorySlug: "tieng-anh-som",
    ageGroup: AgeGroup.AGE_3_5,
    tagSlugs: ["hoc-tieng-anh-lop-1", "phonics-cho-be", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "so-sanh-app-hoc-tieng-anh-cho-be-2026",
    titleVi: "So sánh app học tiếng Anh cho bé 2026: phụ huynh cần nhìn vào gì?",
    excerptVi:
      "Tiêu chí quan trọng khi so sánh app học tiếng Anh cho bé năm 2026: lộ trình, mức độ tương tác, báo cáo tiến độ và tính an toàn.",
    contentMarkdown: `# So sánh app học tiếng Anh cho bé 2026: phụ huynh cần nhìn vào gì?

Từ khóa chính: **so sánh app học tiếng Anh cho bé 2026**

Khi tìm app học tiếng Anh cho con, phụ huynh thường bị thu hút bởi giao diện bắt mắt hoặc quảng cáo “học nhanh”. Nhưng để chọn đúng nền tảng cho bé 3-8 tuổi, cần đánh giá theo tiêu chí rõ ràng.

## 1) Có lộ trình theo độ tuổi không?
Một app tốt phải chia rõ cấp độ, mục tiêu và tiến trình học. Nếu nội dung rời rạc, bé dễ học chắp vá và quên nhanh.

## 2) Bài học có tương tác thật hay chỉ xem video?
Xem video đơn thuần không tạo đủ phản xạ ngôn ngữ. Hãy ưu tiên app có hoạt động chọn đáp án, điền từ, nghe nhận diện âm.

## 3) Có báo cáo tiến độ cho phụ huynh?
Phụ huynh cần biết con học gì, mạnh gì, yếu gì để điều chỉnh. Nếu không có báo cáo tuần, rất khó đồng hành dài hạn.

## 4) Nội dung có an toàn cho trẻ nhỏ?
App dành cho trẻ nên hạn chế quảng cáo ngoài, tránh liên kết gây xao nhãng và cho phụ huynh quyền kiểm soát.

## 5) Nhịp học có phù hợp lịch gia đình?
Mô hình 15 phút/ngày giúp duy trì thói quen, nhất là với gia đình bận rộn. Điều quan trọng là đều đặn.

## Kết luận
Đừng chọn app chỉ vì “nhiều tính năng”. Hãy chọn app giúp bé học đều, phụ huynh theo dõi được tiến độ, và có lộ trình tăng dần phù hợp từng giai đoạn.`,
    type: BlogPostType.ARTICLE,
    categorySlug: "tieng-anh-som",
    ageGroup: AgeGroup.AGE_3_5,
    tagSlugs: ["seo-edtech", "phonics-cho-be", "bao-cao-tien-do"],
    publishedAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "be-hoc-15-phut-moi-ngay-khong-chan",
    titleVi: "Làm sao để bé học 15 phút mỗi ngày mà không chán?",
    excerptVi:
      "Chiến lược 15 phút/ngày giúp trẻ duy trì thói quen học bền vững mà không mệt mỏi: mục tiêu nhỏ, nhịp cố định và khen đúng lúc.",
    contentMarkdown: `# Làm sao để bé học 15 phút mỗi ngày mà không chán?

Từ khóa chính: **bé học 15 phút mỗi ngày**

15 phút nghe có vẻ ít, nhưng nếu làm đúng, đây là “điểm vàng” cho trẻ 3-8 tuổi: đủ ngắn để không quá tải, đủ dài để có kết quả.

## Chia 15 phút thành 3 chặng
- 5 phút khởi động: bài hát hoặc câu hỏi nhanh.
- 7 phút làm bài chính: tập trung một kỹ năng.
- 3 phút tổng kết: nhắc lại điều bé vừa làm được.

## Dùng lịch học cố định
Học cùng một khung giờ giúp bé hình thành thói quen. Ví dụ: sau ăn tối 20 phút là “giờ học cùng con”.

## Luân phiên hình thức hoạt động
Một buổi chọn đáp án, buổi sau nghe nhận diện, buổi tiếp theo kéo sắp xếp. Sự thay đổi làm giảm chán.

## Khen nỗ lực, không chỉ kết quả
Thay vì “con đúng rồi”, hãy nói “con đã tập trung rất tốt”. Cách khen này giúp bé bền bỉ hơn.

## Theo dõi tiến độ hàng tuần
Khi phụ huynh thấy được số bài đã học và điểm mạnh, việc động viên con sẽ cụ thể hơn.

## Kết luận
Muốn bé học đều, hãy thiết kế nhịp học nhẹ nhàng và nhất quán. 15 phút/ngày trong 8 tuần mang lại hiệu quả tốt hơn học dồn 2-3 buổi dài.`,
    type: BlogPostType.TIP,
    categorySlug: "phuong-phap-hoc",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["hoc-15-phut-moi-ngay", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "bao-cao-tien-do-con-theo-tuan",
    titleVi: "Báo cáo tiến độ con theo tuần: vì sao phụ huynh cần theo dõi?",
    excerptVi:
      "Báo cáo tiến độ theo tuần giúp phụ huynh nắm rõ kỹ năng con đã đạt, lỗ hổng cần bù và kế hoạch học tuần tiếp theo.",
    contentMarkdown: `# Báo cáo tiến độ con theo tuần: vì sao phụ huynh cần theo dõi?

Từ khóa chính: **báo cáo tiến độ con theo tuần**

Nhiều gia đình cho con học đều nhưng vẫn lo lắng: “Con thật sự tiến bộ chưa?” Báo cáo tuần giúp trả lời câu hỏi này bằng dữ liệu cụ thể.

## Báo cáo tuần nên có gì?
- Số bài đã hoàn thành.
- Điểm bài tập và mức độ ổn định.
- Chuỗi ngày học liên tiếp.
- Kỹ năng nổi bật và kỹ năng cần luyện thêm.

## Lợi ích 1: Tránh học cảm tính
Không còn đánh giá theo cảm giác. Phụ huynh biết rõ con đang mạnh ở đâu.

## Lợi ích 2: Ra quyết định học tuần tới
Nếu con yếu phần nghe, tuần tới tăng hoạt động nghe. Nếu con tốt phần đọc, có thể nâng độ khó.

## Lợi ích 3: Tăng động lực cho bé
Khi bé thấy thành quả theo tuần, bé dễ duy trì thói quen hơn.

## Lợi ích 4: Giảm áp lực kèm con
Phụ huynh không cần ngồi cạnh quá lâu, nhưng vẫn đồng hành đúng trọng tâm.

## Kết luận
Báo cáo tuần không chỉ để “xem cho biết”, mà là công cụ giúp phụ huynh đưa ra quyết định học tập hiệu quả và tiết kiệm thời gian.`,
    type: BlogPostType.GUIDE,
    categorySlug: "dinh-huong-phu-huynh",
    ageGroup: AgeGroup.ALL_AGES,
    tagSlugs: ["bao-cao-tien-do", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "toan-lop-1-tai-nha-7-hoat-dong",
    titleVi: "Toán lớp 1 tại nhà: 7 hoạt động giúp bé hiểu số nhanh hơn",
    excerptVi:
      "7 hoạt động toán lớp 1 tại nhà dùng đồ vật quen thuộc để giúp bé hiểu số, cộng trừ cơ bản và tư duy logic.",
    contentMarkdown: `# Toán lớp 1 tại nhà: 7 hoạt động giúp bé hiểu số nhanh hơn

Từ khóa chính: **toán lớp 1 tại nhà**

Không cần bộ học cụ đắt tiền, phụ huynh vẫn có thể giúp con học toán lớp 1 hiệu quả ngay tại nhà.

## 1) Đếm đồ vật thật
Dùng nắp chai, bút chì, trái cây để bé đếm và ghép nhóm.

## 2) Trò chơi “số nào mất tích”
Viết dãy số 1-20, bỏ trống một số để bé điền.

## 3) Cộng trừ bằng que tính
Cho bé thao tác tay trước khi làm trên giấy.

## 4) So sánh lớn hơn - nhỏ hơn
Dùng ký hiệu >, < với các số quen thuộc.

## 5) Ghép phép tính với kết quả
Tạo thẻ phép tính và thẻ kết quả để bé nối.

## 6) Bài toán tình huống
Ví dụ: “Có 8 cái bánh, ăn 3 cái còn mấy cái?”

## 7) Sổ thành tích cuối tuần
Mỗi tuần ghi 3 điều bé làm tốt để tăng tự tin.

## Kết luận
Toán lớp 1 cần sự trực quan và lặp lại vừa đủ. Mỗi ngày 15 phút với hoạt động ngắn giúp bé tiến bộ rõ ràng.`,
    type: BlogPostType.GUIDE,
    categorySlug: "toan-tu-duy",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-1", "hoc-15-phut-moi-ngay"],
    publishedAt: new Date(NOW.getTime() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "bang-nhan-lop-2-qua-tro-choi",
    titleVi: "Bảng nhân lớp 2 qua trò chơi: cách học nhớ lâu không áp lực",
    excerptVi:
      "Biến bảng nhân lớp 2 thành trò chơi để bé nhớ lâu, học vui và tự tin hơn khi làm bài toán có lời văn.",
    contentMarkdown: `# Bảng nhân lớp 2 qua trò chơi: cách học nhớ lâu không áp lực

Từ khóa chính: **bảng nhân lớp 2**

Nhiều bé lớp 2 sợ bảng nhân vì học thuộc máy móc. Cách hiệu quả hơn là học qua trò chơi và tình huống thực tế.

## Trò chơi 1: Bingo bảng nhân
Mỗi ô là một kết quả. Phụ huynh đọc phép nhân, bé đánh dấu ô đúng.

## Trò chơi 2: Thẻ ghép cặp
Một thẻ là phép tính, thẻ còn lại là kết quả. Bé ghép đúng càng nhanh càng tốt.

## Trò chơi 3: “Ai nhanh hơn”
Chia 2 đội nhỏ trong nhà, mỗi đội trả lời 5 phép nhân.

## Trò chơi 4: Mua hàng giả lập
Ví dụ 3 gói bánh, mỗi gói 4 cái, tổng là bao nhiêu?

## Mẹo nhớ bền
- Học theo cụm (2-5 trước, rồi 6-9).
- Mỗi ngày ôn 10 phép, không học dồn.
- Kết hợp đọc to và viết ngắn.

## Kết luận
Khi học bảng nhân bằng trò chơi, bé vừa hiểu bản chất “nhân là cộng lặp”, vừa giảm áp lực ghi nhớ.`,
    type: BlogPostType.TIP,
    categorySlug: "toan-tu-duy",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-2", "hoc-15-phut-moi-ngay"],
    publishedAt: new Date(NOW.getTime() - 11 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "phonics-lop-1-lo-trinh-8-tuan",
    titleVi: "Phonics lớp 1: lộ trình 8 tuần cho phụ huynh mới bắt đầu",
    excerptVi:
      "Lộ trình phonics lớp 1 trong 8 tuần: từ âm chữ cái, từ CVC đến đọc câu ngắn, phù hợp phụ huynh mới đồng hành cùng con.",
    contentMarkdown: `# Phonics lớp 1: lộ trình 8 tuần cho phụ huynh mới bắt đầu

Từ khóa chính: **phonics lớp 1**

Phonics giúp trẻ đọc đúng âm và ghép từ nhanh hơn. Với bé lớp 1, phụ huynh có thể đi theo lộ trình 8 tuần sau.

## Tuần 1-2: Âm chữ cái cơ bản
Tập trung nhóm âm phổ biến, luyện nghe và nhắc lại.

## Tuần 3-4: Từ CVC âm ngắn
Ví dụ: cat, bed, sit. Kết hợp điền từ và chọn đáp án.

## Tuần 5-6: Digraph cơ bản
Làm quen sh, ch, th thông qua từ đơn giản.

## Tuần 7: Sight words đầu tiên
Học các từ xuất hiện thường xuyên trong câu ngắn.

## Tuần 8: Ghép từ thành câu
Bắt đầu với câu 3-4 từ, ưu tiên câu quen thuộc hằng ngày.

## Lưu ý cho phụ huynh
- Mỗi buổi 15 phút là đủ.
- Không sửa lỗi quá nhanh, hãy cho con thời gian tự nhận ra.
- Ghi lại 1-2 từ bé đọc tốt mỗi ngày.

## Kết luận
Với lộ trình rõ ràng, phonics lớp 1 trở nên nhẹ nhàng hơn và bé sẽ tự tin khi bước vào đọc hiểu cơ bản.`,
    type: BlogPostType.GUIDE,
    categorySlug: "tieng-anh-som",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["phonics-cho-be", "hoc-tieng-anh-lop-1"],
    publishedAt: new Date(NOW.getTime() - 13 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "checklist-ky-nang-lop-1-toan-tieng-anh",
    titleVi: "Checklist kỹ năng lớp 1: Toán và Tiếng Anh phụ huynh nên theo dõi",
    excerptVi:
      "Danh sách kỹ năng lớp 1 môn Toán và Tiếng Anh giúp phụ huynh kiểm tra tiến độ học của con theo tháng.",
    contentMarkdown: `# Checklist kỹ năng lớp 1: Toán và Tiếng Anh phụ huynh nên theo dõi

Từ khóa chính: **checklist kỹ năng lớp 1**

Checklist giúp phụ huynh theo dõi tiến độ học tập thay vì chỉ nhìn điểm số.

## Nhóm kỹ năng Toán lớp 1
- Đếm số và điền số còn thiếu.
- Cộng trừ trong phạm vi 20.
- So sánh số lớn hơn, nhỏ hơn.
- Nhận diện hình 2D cơ bản.

## Nhóm kỹ năng Tiếng Anh lớp 1
- Nhận diện âm chữ cái.
- Đọc từ CVC âm ngắn.
- Nghe và chọn từ đúng.
- Ghép từ thành câu ngắn đơn giản.

## Cách dùng checklist theo tháng
1. Mỗi tuần đánh dấu kỹ năng đã học.
2. Tô màu kỹ năng còn yếu.
3. Chọn 2 kỹ năng ưu tiên cho tuần tiếp theo.

## Sai lầm thường gặp
- Đặt quá nhiều mục tiêu trong 1 tuần.
- Chỉ luyện phần bé giỏi.
- Thiếu tổng kết cuối tuần.

## Kết luận
Checklist tốt phải rõ ràng, đo được và có kế hoạch hành động cho tuần sau.`,
    type: BlogPostType.ARTICLE,
    categorySlug: "dinh-huong-phu-huynh",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-1", "hoc-tieng-anh-lop-1", "bao-cao-tien-do"],
    publishedAt: new Date(NOW.getTime() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "cach-doc-bao-cao-hoc-tap-hang-tuan-cho-con",
    titleVi: "Cách đọc báo cáo học tập hằng tuần để kèm con không áp lực",
    excerptVi:
      "Hướng dẫn phụ huynh đọc báo cáo học tập tuần theo 3 bước: nhìn xu hướng, chọn trọng tâm và thiết kế buổi học ngắn.",
    contentMarkdown: `# Cách đọc báo cáo học tập hằng tuần để kèm con không áp lực

Từ khóa chính: **cách đọc báo cáo học tập tuần**

Báo cáo tuần chỉ thật sự hữu ích khi phụ huynh biết cách đọc và chuyển dữ liệu thành hành động.

## Bước 1: Nhìn xu hướng thay vì một con số
Đừng chỉ nhìn điểm tuần này cao hay thấp. Hãy so với 2-3 tuần gần nhất để thấy xu hướng.

## Bước 2: Chọn 1 trọng tâm cho tuần mới
Ví dụ: nếu con sai nhiều phần nghe, tuần mới ưu tiên 3 buổi luyện nghe ngắn.

## Bước 3: Thiết kế lịch học nhẹ
Tạo lịch cố định 15 phút/ngày, 5 ngày/tuần. Giữ nhịp quan trọng hơn học dồn.

## Mẫu đặt mục tiêu thực tế
- Mục tiêu kỹ năng: “Đúng 8/10 câu phần âm /sh/”.
- Mục tiêu thói quen: “Học đủ 5 buổi”.

## Cách phản hồi với con
Hãy bắt đầu bằng điểm mạnh, sau đó mới nói điểm cần cải thiện.

## Kết luận
Báo cáo tuần là bản đồ hành động cho phụ huynh. Đọc đúng sẽ giúp con tiến bộ mà gia đình vẫn giữ được sự thoải mái.`,
    type: BlogPostType.GUIDE,
    categorySlug: "dinh-huong-phu-huynh",
    ageGroup: AgeGroup.ALL_AGES,
    tagSlugs: ["bao-cao-tien-do", "phu-huynh-dong-hanh"],
    publishedAt: new Date(NOW.getTime() - 17 * 24 * 60 * 60 * 1000),
  },
  {
    slug: "12-tro-choi-hoc-tap-cuoi-tuan-cho-be-6-8-tuoi",
    titleVi: "12 trò chơi học tập cuối tuần cho bé 6-8 tuổi",
    excerptVi:
      "Gợi ý 12 trò chơi cuối tuần giúp bé 6-8 tuổi ôn Toán và Tiếng Anh tự nhiên, giảm thời gian màn hình thụ động.",
    contentMarkdown: `# 12 trò chơi học tập cuối tuần cho bé 6-8 tuổi

Từ khóa chính: **trò chơi học tập cho bé 6-8 tuổi**

Cuối tuần là thời điểm tốt để ôn kiến thức theo cách vui vẻ và gắn kết gia đình.

## Nhóm trò chơi Toán
1. Săn số trong nhà.
2. Ghép phép tính với kết quả.
3. Mini chợ mua bán giả lập.
4. Đo chiều dài đồ vật bằng thước.
5. Đố vui bảng nhân.
6. Sắp xếp thứ tự thời gian trong ngày.

## Nhóm trò chơi Tiếng Anh
7. Bingo từ vựng.
8. Nghe âm đoán từ.
9. Ghép tranh với từ.
10. Sắp xếp từ thành câu.
11. Truy tìm đồ vật theo từ khóa tiếng Anh.
12. Kể chuyện 3 câu với từ mới.

## Cách tổ chức để bé hợp tác
- Chơi theo lượt ngắn 5-7 phút.
- Xen kẽ hoạt động vận động và bàn học.
- Kết thúc bằng phần thưởng tinh thần.

## Kết luận
Trò chơi học tập giúp cuối tuần vừa vui vừa có ích. Quan trọng là chọn trò phù hợp năng lực hiện tại của bé.`,
    type: BlogPostType.TIP,
    categorySlug: "phat-trien-tre",
    ageGroup: AgeGroup.AGE_6_8,
    tagSlugs: ["toan-lop-2", "hoc-tieng-anh-lop-1", "hoc-15-phut-moi-ngay"],
    publishedAt: new Date(NOW.getTime() - 19 * 24 * 60 * 60 * 1000),
  },
];

const OBSOLETE_SEED_POST_SLUGS = ["ke-hoach-4-tuan-cung-con-hoc-toan-va-phonics"];

export async function seedBlogContent(prisma: PrismaClient): Promise<BlogSeedSummary> {
  const summary: BlogSeedSummary = {
    categories: { created: 0, updated: 0 },
    tags: { created: 0, updated: 0 },
    authors: { created: 0, updated: 0 },
    posts: { created: 0, updated: 0, total: BLOG_POSTS.length },
  };

  for (const categorySeed of BLOG_CATEGORIES) {
    const existing = await prisma.blogCategory.findUnique({ where: { slug: categorySeed.slug }, select: { id: true } });
    await prisma.blogCategory.upsert({
      where: { slug: categorySeed.slug },
      update: categorySeed,
      create: { ...categorySeed, active: true },
    });
    if (existing) summary.categories.updated += 1;
    else summary.categories.created += 1;
  }

  for (const tagSeed of BLOG_TAGS) {
    const existing = await prisma.blogTag.findUnique({ where: { slug: tagSeed.slug }, select: { id: true } });
    await prisma.blogTag.upsert({
      where: { slug: tagSeed.slug },
      update: { nameVi: tagSeed.nameVi },
      create: { slug: tagSeed.slug, nameVi: tagSeed.nameVi },
    });
    if (existing) summary.tags.updated += 1;
    else summary.tags.created += 1;
  }

  const authorSlug = "ban-bien-tap-seo";
  const existingAuthor = await prisma.blogAuthor.findUnique({ where: { slug: authorSlug }, select: { id: true } });
  const author = await prisma.blogAuthor.upsert({
    where: { slug: authorSlug },
    update: {
      displayName: "Ban Biên Tập SEO",
      role: "Biên tập nội dung giáo dục sớm",
      active: true,
    },
    create: {
      slug: authorSlug,
      displayName: "Ban Biên Tập SEO",
      role: "Biên tập nội dung giáo dục sớm",
      active: true,
    },
  });
  if (existingAuthor) summary.authors.updated += 1;
  else summary.authors.created += 1;

  const categories = await prisma.blogCategory.findMany({
    where: { slug: { in: BLOG_CATEGORIES.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item.id]));

  const tags = await prisma.blogTag.findMany({
    where: { slug: { in: BLOG_TAGS.map((item) => item.slug) } },
    select: { id: true, slug: true },
  });
  const tagBySlug = new Map(tags.map((item) => [item.slug, item.id]));

  if (OBSOLETE_SEED_POST_SLUGS.length > 0) {
    await prisma.blogPost.deleteMany({
      where: { slug: { in: OBSOLETE_SEED_POST_SLUGS } },
    });
  }

  for (const postSeed of BLOG_POSTS) {
    const categoryId = categoryBySlug.get(postSeed.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category slug: ${postSeed.categorySlug}`);
    }

    const existingPost = await prisma.blogPost.findUnique({ where: { slug: postSeed.slug }, select: { id: true } });
    const post = await prisma.blogPost.upsert({
      where: { slug: postSeed.slug },
      update: {
        type: postSeed.type,
        status: BlogPostStatus.PUBLISHED,
        titleVi: postSeed.titleVi,
        excerptVi: postSeed.excerptVi,
        contentMarkdown: postSeed.contentMarkdown,
        contentHtml: null,
        categoryId,
        ageGroup: postSeed.ageGroup,
        authorId: author.id,
        readingTimeMin: readingTimeFromMarkdown(postSeed.contentMarkdown),
        publishedAt: postSeed.publishedAt,
        isIndexed: true,
        isFeatured: false,
        metaTitleVi: postSeed.titleVi,
        metaDescVi: postSeed.excerptVi,
      },
      create: {
        slug: postSeed.slug,
        type: postSeed.type,
        status: BlogPostStatus.PUBLISHED,
        titleVi: postSeed.titleVi,
        excerptVi: postSeed.excerptVi,
        contentMarkdown: postSeed.contentMarkdown,
        contentHtml: null,
        categoryId,
        ageGroup: postSeed.ageGroup,
        authorId: author.id,
        coAuthorIds: [],
        readingTimeMin: readingTimeFromMarkdown(postSeed.contentMarkdown),
        publishedAt: postSeed.publishedAt,
        isIndexed: true,
        isFeatured: false,
        isPinned: false,
        metaTitleVi: postSeed.titleVi,
        metaDescVi: postSeed.excerptVi,
      },
    });
    if (existingPost) summary.posts.updated += 1;
    else summary.posts.created += 1;

    await prisma.blogPostTag.deleteMany({ where: { postId: post.id } });
    const tagRows = postSeed.tagSlugs
      .map((slug) => tagBySlug.get(slug))
      .filter((tagId): tagId is string => Boolean(tagId))
      .map((tagId) => ({ postId: post.id, tagId }));
    if (tagRows.length > 0) {
      await prisma.blogPostTag.createMany({
        data: tagRows,
        skipDuplicates: true,
      });
    }
  }

  return summary;
}
