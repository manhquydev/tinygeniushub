import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

const parentEn = {
  dashboard: {
    hero: {
      badge: "Parent Dashboard",
      heading: "Home control panel",
      greeting: "Hello, {name}",
      recentCompletionMessage: "Congratulations! The child has just completed a new lesson.",
      defaultMessage: "Hello Mom and Dad! The children are learning great every day.",
    },
    metrics: {
      children: { label: "Child profiles", hint: "{count}/{limit} profiles" },
      lessons: { label: "Lessons completed", hint: "Target: {goal} lessons" },
      reports: { label: "Weekly reports", hint: "Target: {goal} reports" },
      progressLabel: "{percent}% of goal",
    },
    children: {
      heading: "Child profiles",
      description: "Overview of study progress this week and quick access to lessons.",
      activeProfiles: "{count} active profiles",
      noProfiles: "No child profiles yet. Add a profile to start the learning journey.",
    },
    shortcuts: {
      heading: "Quick shortcuts",
      manageChildren: "Manage child records",
      enterKidApp: "Enter child's learning area",
      premiumCourses: "Premium Courses",
      weeklyReports: "View weekly reports",
      enterGiftCode: "Enter gift code",
    },
    referral: {
      heading: "Refer friends — get rewarded together",
      description:
        "Each family you refer receives a {welcomeOffer}. You receive {rewardVouchers} after they complete payment.",
      welcomeOffer: "welcome offer",
      rewardVouchers: "reward vouchers",
      shareNow: "Share now",
      sectionHeading: "Referral program",
      code: "Referral code",
      notCreated: "Not created yet",
      totalReferrals: "Total referrals",
      paidReferrals: "Paid",
      receivedReward: "Rewards earned",
    },
    reports: {
      heading: "Latest reports",
      noReports: "No weekly reports yet.",
      lessonsSummary: "{lessons} lessons • {minutes} minutes • {streak}-day streak",
    },
    childCard: {
      minutesStreak: "{minutes} minutes learned • {streak}-day streak",
      lessonsProgress: "{lessons}/{goal} lessons this week",
      viewSkillMap: "View skill map",
      continueStudying: "Continue studying",
      recentLessons: "Recent lessons",
    },
    skills: {
      overview: "Overview",
      skillMap: "Skill map",
      practicePrompt: "Ready for more practice?",
      goToSchool: "Go to learning area",
    },
  },
  children: {
    badge: "Manage Children",
    heading: "Manage child records",
    description:
      "Each account supports one main learning profile. Update your child's information and quickly access daily lessons here.",
  },
  reports: {
    badge: "Learning Reports",
    heading: "Learning analytics center",
    description:
      "Track each child's weekly learning performance: study time, skill outcomes, and concrete suggestions to help parents support more effectively.",
  },
  billing: {
    metadataTitle: "Payments & Invoices - TinyGenius Hub",
    heading: "Payments and invoices",
    description: "This page covers course purchases. Payments are processed via PayOS bank transfer.",
    totalPaid: "Total paid",
    successfulTransaction: "Successful",
    processing: "Processing",
    failure: "Failed",
    paymentStatus: {
      SUCCEEDED: "Success",
      PENDING: "Processing",
      FAILED: "Failed",
      REFUNDED: "Refunded",
    },
    providerSimulation: "Simulation",
    servicePayment: "Service payment",
    buyBundle: "Buy course bundle",
    buyCourse: "Buy course",
    recentHistory: {
      heading: "Recent transaction history",
      description: "Track details and status of each transaction.",
      empty: "No transactions yet. Head to the courses page to get started.",
    },
    accountInfo: {
      heading: "Account information",
      paymentModel: { label: "Payment model", value: "Per-course purchase" },
      currentMethod: { label: "Current method", value: "PayOS - bank transfer" },
      autoRenewal: {
        label: "Auto-renewal",
        value: "Not applicable for per-course purchase model",
      },
    },
    paymentNote: {
      heading: "Notes for bank transfer payments",
      autoRecord: "After a successful transfer, the system automatically records and unlocks the course.",
      pendingWait: 'If status shows "Processing", please wait a few minutes for webhook sync.',
      contactSupport:
        "Need payment support? Send your order code via the contact page for quick assistance.",
      buyCourses: "Buy more courses",
      contactSupportBtn: "Contact support",
      purchasedKey: "Go to purchased courses",
    },
    invoice: {
      heading: "Need an invoice or transaction reconciliation?",
      description:
        "Please send the transaction time, amount, and payment provider so we can assist quickly.",
      sendRequest: "Submit reconciliation request",
    },
  },
};

const parentVi = {
  dashboard: {
    hero: {
      badge: "Bảng Điều Khiển",
      heading: "Trung tâm quản lý",
      greeting: "Xin chào, {name}",
      recentCompletionMessage: "Chúc mừng! Bé vừa hoàn thành một bài học mới.",
      defaultMessage: "Xin chào ba mẹ! Các bé đang học rất tốt mỗi ngày.",
    },
    metrics: {
      children: { label: "Hồ sơ bé", hint: "{count}/{limit} hồ sơ" },
      lessons: { label: "Bài học hoàn thành", hint: "Mục tiêu: {goal} bài" },
      reports: { label: "Báo cáo tuần", hint: "Mục tiêu: {goal} báo cáo" },
      progressLabel: "{percent}% mục tiêu",
    },
    children: {
      heading: "Hồ sơ bé",
      description: "Tổng quan tiến độ học tập trong tuần và truy cập nhanh vào bài học.",
      activeProfiles: "{count} hồ sơ đang hoạt động",
      noProfiles: "Chưa có hồ sơ bé nào. Thêm hồ sơ để bắt đầu hành trình học tập.",
    },
    shortcuts: {
      heading: "Lối tắt nhanh",
      manageChildren: "Quản lý hồ sơ bé",
      enterKidApp: "Vào khu vực học của bé",
      premiumCourses: "Khóa học cao cấp",
      weeklyReports: "Xem báo cáo tuần",
      enterGiftCode: "Nhập mã quà tặng",
    },
    referral: {
      heading: "Giới thiệu bạn bè — cùng nhận thưởng",
      description:
        "Mỗi gia đình bạn giới thiệu nhận được {welcomeOffer}. Bạn nhận {rewardVouchers} sau khi họ thanh toán.",
      welcomeOffer: "ưu đãi chào mừng",
      rewardVouchers: "phiếu thưởng",
      shareNow: "Chia sẻ ngay",
      sectionHeading: "Chương trình giới thiệu",
      code: "Mã giới thiệu",
      notCreated: "Chưa tạo",
      totalReferrals: "Tổng giới thiệu",
      paidReferrals: "Đã thanh toán",
      receivedReward: "Đã nhận thưởng",
    },
    reports: {
      heading: "Báo cáo mới nhất",
      noReports: "Chưa có báo cáo tuần nào.",
      lessonsSummary: "{lessons} bài • {minutes} phút • {streak} ngày liên tiếp",
    },
    childCard: {
      minutesStreak: "{minutes} phút học • {streak} ngày liên tiếp",
      lessonsProgress: "{lessons}/{goal} bài trong tuần",
      viewSkillMap: "Xem bản đồ kỹ năng",
      continueStudying: "Tiếp tục học",
      recentLessons: "Bài học gần đây",
    },
    skills: {
      overview: "Tổng quan",
      skillMap: "Bản đồ kỹ năng",
      practicePrompt: "Sẵn sàng luyện tập thêm?",
      goToSchool: "Vào khu vực học",
    },
  },
  children: {
    badge: "Quản Lý Bé",
    heading: "Quản lý hồ sơ bé",
    description:
      "Mỗi tài khoản hỗ trợ một hồ sơ học tập chính. Cập nhật thông tin bé và truy cập nhanh vào bài học hàng ngày.",
  },
  reports: {
    badge: "Báo Cáo Học Tập",
    heading: "Trung tâm phân tích học tập",
    description:
      "Theo dõi hiệu suất học tập hàng tuần của mỗi bé: thời gian học, kết quả kỹ năng và gợi ý hành động cụ thể để ba mẹ hỗ trợ hiệu quả hơn.",
  },
  billing: {
    metadataTitle: "Thanh Toán & Hóa Đơn - TinyGenius Hub",
    heading: "Thanh toán và hóa đơn",
    description: "Trang này quản lý việc mua khóa học. Thanh toán qua chuyển khoản PayOS.",
    totalPaid: "Tổng đã trả",
    successfulTransaction: "Thành công",
    processing: "Đang xử lý",
    failure: "Thất bại",
    paymentStatus: {
      SUCCEEDED: "Thành công",
      PENDING: "Đang xử lý",
      FAILED: "Thất bại",
      REFUNDED: "Đã hoàn tiền",
    },
    providerSimulation: "Mô phỏng",
    servicePayment: "Thanh toán dịch vụ",
    buyBundle: "Mua gói khóa học",
    buyCourse: "Mua khóa học",
    recentHistory: {
      heading: "Lịch sử giao dịch gần đây",
      description: "Theo dõi chi tiết và trạng thái từng giao dịch.",
      empty: "Chưa có giao dịch nào. Truy cập trang khóa học để bắt đầu.",
    },
    accountInfo: {
      heading: "Thông tin tài khoản",
      paymentModel: { label: "Hình thức thanh toán", value: "Mua theo khóa học" },
      currentMethod: { label: "Phương thức hiện tại", value: "PayOS - chuyển khoản ngân hàng" },
      autoRenewal: {
        label: "Tự động gia hạn",
        value: "Không áp dụng cho hình thức mua theo khóa",
      },
    },
    paymentNote: {
      heading: "Lưu ý khi thanh toán qua chuyển khoản",
      autoRecord: "Sau khi chuyển khoản thành công, hệ thống tự động ghi nhận và mở khóa học.",
      pendingWait:
        'Nếu trạng thái vẫn là "Đang xử lý", vui lòng chờ thêm vài phút để webhook đồng bộ.',
      contactSupport:
        "Cần hỗ trợ thanh toán? Gửi mã đơn hàng qua trang liên hệ để được xử lý nhanh.",
      buyCourses: "Mua thêm khóa học",
      contactSupportBtn: "Liên hệ hỗ trợ",
      purchasedKey: "Đến khóa học đã mua",
    },
    invoice: {
      heading: "Cần xuất hóa đơn hoặc đối soát giao dịch?",
      description:
        "Vui lòng gửi thời gian giao dịch, số tiền và nhà cung cấp để chúng tôi hỗ trợ nhanh chóng.",
      sendRequest: "Gửi yêu cầu đối soát",
    },
  },
};

const enPath = join(root, "locales/en/translation.json");
const viPath = join(root, "locales/vi/translation.json");

const en = JSON.parse(readFileSync(enPath, "utf-8"));
const vi = JSON.parse(readFileSync(viPath, "utf-8"));

en.parent = parentEn;
vi.parent = parentVi;

writeFileSync(enPath, JSON.stringify(en, null, 2), "utf-8");
writeFileSync(viPath, JSON.stringify(vi, null, 2), "utf-8");

console.log("EN keys:", Object.keys(en).join(", "));
console.log("VI keys:", Object.keys(vi).join(", "));
console.log("Done.");
